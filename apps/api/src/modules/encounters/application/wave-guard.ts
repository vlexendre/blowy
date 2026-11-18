import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Locale } from '@blowy/content';
import {
  WAVE_ABUSE_WINDOW_DAYS,
  WAVE_PENDING_DAYS,
  ZONE_RADIUS_KM,
  type WaveAllowance,
  countOnDay,
  dayOf,
  encounterQuota,
  entitlements,
  waveAbuse,
  waveAllowance,
  waveEmailAllowed,
} from '@blowy/domain';
import type { Clock } from '../../../shared/clock';
import { DomainError, type ErrorText, errorText } from '../../../shared/errors';
import { BLOCKS, CLOCK, ENCOUNTERS, LINKS, REPORTS } from '../../../shared/tokens';
import type { LinksRepository } from '../../links/ports';
import { hasPlus } from '../../me/application/plus';
import type { Profile } from '../../me/ports';
import { ReportDesk } from '../../moderation/report-desk';
import type { BlocksRepository, ReportsRepository } from '../../safety/ports';
import { Matchmaker } from '../../vision/application/matchmaker';
import type { EncountersRepository } from '../ports';

/** Catégorie des signalements automatiques « coucous en masse » (vue par l'équipe dans l'administration). */
export const WAVE_SPAM_CATEGORY = 'wave_spam';

const DAY_MS = 86_400_000;

/**
 * Garde-fous des coucous (« on ne doit pas pouvoir faire signe à tout le monde ») ; règles dans
 * `packages/domain/src/anti-spam.ts` :
 * - `shown` : on ne salue que quelqu'un que l'app t'a vraiment montré (mêmes règles que les rencontres et la carte) ;
 * - `allowance` / `assertCanWave` : plafond du jour (jour de l'app) et signes en attente ;
 * - `emailAllowed` : quelques e-mails de signe par jour et par destinataire, le reste dans l'app ;
 * - `watch` : un compte qui envoie en masse ou se fait beaucoup refuser est signalé à la modération (filtre
 *   automatique), une fois tant que le signalement est ouvert ; jamais de suspension automatique.
 */
@Injectable()
export class WaveGuard {
  private readonly logger = new Logger('Coucous');

  constructor(
    @Inject(ENCOUNTERS) private readonly encounters: EncountersRepository,
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(BLOCKS) private readonly blocks: BlocksRepository,
    @Inject(Matchmaker) private readonly matchmaker: Matchmaker,
    @Inject(ReportDesk) private readonly desk: ReportDesk,
    @Inject(REPORTS) private readonly reports: ReportsRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /**
   * L'app a-t-elle pu te montrer cette personne ? (`Audience.reachable` est vérifié avant, par l'appelant.)
   * - en rencontre « autour » : parmi les compatibles de ta zone de recherche, dans le rang du quota du jour ;
   * - sur ta carte : compatible dans ta zone (~1,5 km), pas en mode discret ; avec Minimoa+, partout ;
   * - en rencontre « amis d'amis » : liée à l'un de tes liens et compatible.
   */
  async shown(me: Profile, target: Profile, sociability: number): Promise<boolean> {
    const seeker = await this.matchmaker.seeker(me);
    if (!seeker.testDone) return false;
    const can = entitlements(seeker.plus);
    const nearby = await this.matchmaker.nearby(seeker);
    const rank = nearby.findIndex((m) => m.userId === target.id);
    const match = nearby[rank];
    if (match) {
      if (rank < encounterQuota({ sociability }) + can.encounterBonus) return true;
      if (!target.discreet && (can.mapEverywhere || match.distanceKm <= ZONE_RADIUS_KM)) return true;
    }
    if (await this.friendOfFriend(me.id, target.id)) {
      if ((await this.matchmaker.matchAmong(seeker, [target])).has(target.id)) return true;
    }
    return can.mapEverywhere && !target.discreet && (await this.matchmaker.matchAnywhere(seeker, target));
  }

  private async friendOfFriend(userId: string, targetId: string): Promise<boolean> {
    const friendsOf = async (id: string): Promise<Set<string>> =>
      new Set((await this.links.listForUsers([id])).filter((l) => l.status !== 'archived').map((l) => (l.userA === id ? l.userB : l.userA)));
    const [mine, theirs] = await Promise.all([friendsOf(userId), friendsOf(targetId)]);
    for (const id of mine) if (theirs.has(id)) return true;
    return false;
  }

  /** Où en sont tes coucous maintenant. */
  async allowance(me: Profile): Promise<WaveAllowance> {
    const now = this.clock.now();
    const sent = await this.encounters.listSentSince(me.id, new Date(now.getTime() - WAVE_PENDING_DAYS * DAY_MS).toISOString());
    return waveAllowance({ sent, now, plus: hasPlus(me, now) });
  }

  /** Refuse le coucou (`wave_limit`) si un plafond est atteint ; le message dit lequel. */
  async assertCanWave(me: Profile): Promise<void> {
    const allowance = await this.allowance(me);
    if (allowance.blocked) throw new DomainError('wave_limit', blockedText(allowance.blocked));
  }

  /** L'e-mail « on t'a fait signe » peut-il partir ? (le coucou qui vient d'être créé est compté). */
  async emailAllowed(targetId: string): Promise<boolean> {
    const now = this.clock.now();
    const received = await this.encounters.listReceivedSince(targetId, new Date(now.getTime() - 2 * DAY_MS).toISOString());
    return waveEmailAllowed(
      countOnDay(
        received.map((e) => e.createdAt),
        dayOf(now),
      ),
    );
  }

  /** Repérage pour la modération ; ne fait jamais échouer la requête. */
  async watch(userId: string): Promise<void> {
    try {
      const now = this.clock.now();
      const [sent, blockedEitherWay, mineBlocked] = await Promise.all([
        this.encounters.listSentSince(userId, new Date(now.getTime() - WAVE_ABUSE_WINDOW_DAYS * DAY_MS).toISOString()),
        this.blocks.blockedEitherWay(userId),
        this.blocks.listBy(userId),
      ]);
      // Seulement celles et ceux qui ont bloqué l'expéditeur (pas l'inverse).
      const iBlocked = new Set(mineBlocked.map((b) => b.blocked));
      const blockedBy = new Set([...blockedEitherWay].filter((id) => !iBlocked.has(id)));
      const abuse = waveAbuse({ sent, blockedBy, now });
      if (!abuse) return;
      if (await this.reports.hasOpenFiltered(userId, WAVE_SPAM_CATEGORY)) return;
      const details =
        abuse.kind === 'mass'
          ? `Coucous en masse : ${abuse.days} jours de suite à 15 coucous ou plus (repérage automatique, aucune suspension).`
          : `Beaucoup de refus : ${abuse.refused} coucous refusés ou suivis d'un blocage sur ${abuse.answered} réponses en ${WAVE_ABUSE_WINDOW_DAYS} jours (repérage automatique, aucune suspension).`;
      await this.desk.file({ reporter: null, targetUser: userId, reason: 'autre', details, source: 'filter', category: null, label: WAVE_SPAM_CATEGORY });
      this.logger.warn(`compte signalé à la modération (${abuse.kind})`);
    } catch (err) {
      this.logger.warn(`repérage des coucous impossible : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    }
  }
}

/** Texte du blocage, dans une langue (erreur `wave_limit` et réponse des rencontres). */
export const blockedText = (blocked: 'daily' | 'pending'): ErrorText => errorText(blocked === 'daily' ? 'waveDaily' : 'wavePending');

export const blockedMessage = (blocked: 'daily' | 'pending' | null, locale: Locale): string | null => (blocked === null ? null : blockedText(blocked)(locale));
