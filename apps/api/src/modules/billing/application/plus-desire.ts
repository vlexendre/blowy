import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { type PlusMoment, type PlusTrigger, dayOf, plusMomentDue, plusMomentKey, plusStrongKey } from '@blowy/domain';
import type { Clock } from '../../../shared/clock';
import { DomainError } from '../../../shared/errors';
import { CLOCK, LINKS, PROFILES } from '../../../shared/tokens';
import { LIFECYCLE_LOG, type LifecycleLog } from '../../fidelite/ports';
import { Growth } from '../../growth/application/growth';
import type { LinksRepository } from '../../links/ports';
import { hasPlus } from '../../me/application/plus';
import type { ProfilesRepository } from '../../me/ports';
import type { RitualStatesRepository } from '../../rituels/ports';
import { RITUAL_STATES } from '../../rituels/tokens';

/**
 * Moments clés (docs/DESIR.md) : juste après un vrai moment de valeur (premier lien, 7 jours de série, deuxième jour), l'app peut
 * ouvrir la feuille Minimoa+ d'elle-même, une fois par moment, jamais deux fois en moins de 3 jours, jamais le jour de
 * l'inscription, jamais avec Minimoa+ ni pour le monde de revue d'Apple. Le serveur décide et réserve (journal
 * `lifecycle_messages`) : l'app ne fait que demander.
 */
@Injectable()
export class PlusMoments {
  private readonly logger = new Logger('Minimoa+');

  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(RITUAL_STATES) private readonly rituals: RitualStatesRepository,
    @Inject(LIFECYCLE_LOG) private readonly log: LifecycleLog,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** `accepts` : les moments que l'app sait ouvrir (absent : ceux des apps d'avant, `LEGACY_PLUS_MOMENTS`). */
  async claim(userId: string, accepts?: readonly PlusMoment[]): Promise<PlusMoment | null> {
    const profile = await this.profiles.findById(userId);
    if (!profile) throw new DomainError('not_onboarded');
    if (profile.reviewWorld) return null;
    const now = this.clock.now();
    const today = dayOf(now);
    const [links, rituals, keys] = await Promise.all([this.links.listForUsers([userId]), this.rituals.find(userId), this.log.keys([userId])]);
    const alive = links.filter((l) => l.status !== 'archived');
    const first = links.map((l) => l.createdAt).sort()[0] ?? null;
    const moment = plusMomentDue({
      today,
      plus: hasPlus(profile, now),
      createdOn: dayOf(new Date(profile.createdAt)),
      keys: keys.get(userId) ?? new Set(),
      firstLinkOn: first ? dayOf(new Date(first)) : null,
      links: alive.length,
      streak: rituals?.streak.current ?? 0,
      streakDay: rituals?.streak.lastDoneOn ?? null,
      ...(accepts ? { accepts } : {}),
    });
    if (!moment) return null;
    // Le moment d'abord (une fois pour toujours), puis le jour (plafond) : deux appels qui se croisent n'ouvrent qu'une feuille.
    const at = now.toISOString();
    if (!(await this.log.claim(userId, plusMomentKey(moment), at))) return null;
    await this.log.claim(userId, plusStrongKey(today), at).catch(() => this.logger.warn('plafond des propositions non noté'));
    return moment;
  }
}

/** La feuille s'est ouverte : un compteur du jour par déclencheur (aucune personne derrière). */
@Injectable()
export class PlusOpens {
  constructor(@Optional() @Inject(Growth) private readonly growth: Growth | null = null) {}

  record(trigger: PlusTrigger): Promise<void> {
    return this.growth?.plus('plus_open', trigger) ?? Promise.resolve();
  }
}
