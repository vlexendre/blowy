/**
 * Données de démonstration de l'administration (BLOWY_ADAPTERS=memory, BLOWY_DEMO=1) : 60 jours de chiffres
 * plausibles, des signalements (dont un en retard sur les 24 h, un sur un message précis), un journal et une
 * suspension. Les personnes signalées sont de vrais comptes de la base mémoire, pour que les actions marchent.
 * Rien de tout cela n'existe hors du mode démo.
 */
import { Inject, Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { type Day, addDays, dayOf, newLink } from '@blowy/domain';
import type { Clock } from '../../../shared/clock';
import { CLOCK, LINKS, MESSAGES, PROFILES, REPORTS } from '../../../shared/tokens';
import type { LinksRepository, MessagesRepository } from '../../links/ports';
import type { Profile, ProfilesRepository } from '../../me/ports';
import type { ReportsRepository } from '../../safety/ports';
import type { AuditLogRepository, DailyMetrics, DailyStatsRepository, SuspensionsRepository } from '../ports';
import { AUDIT_LOG, DAILY_STATS, SUSPENSIONS } from '../tokens';
import { Moderation } from './moderation.usecases';

const H = 3_600_000;

/** Générateur pseudo-aléatoire déterministe (mêmes chiffres à chaque démarrage). */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4_294_967_296;
  };
}

export const DEMO_REPORTED = {
  margaux: '00000000-0000-4000-8000-0000000000d1',
  hugo: '00000000-0000-4000-8000-0000000000d2',
  zoe: '00000000-0000-4000-8000-0000000000d3',
  karim: '00000000-0000-4000-8000-0000000000d4',
  nour: '00000000-0000-4000-8000-0000000000d5',
  theo: '00000000-0000-4000-8000-0000000000d6',
} as const;

const PEOPLE: ReadonlyArray<[keyof typeof DEMO_REPORTED, string]> = [
  ['margaux', 'Margaux'],
  ['hugo', 'Hugo'],
  ['zoe', 'Zoé'],
  ['karim', 'Karim'],
  ['nour', 'Nour'],
  ['theo', 'Théo'],
];

const TOP_NAMES: ReadonlyArray<[string, string, string]> = [
  ['Pistache', 'nino', 'Anaïs'],
  ['Moka', 'suzie', 'Yanis'],
  ['Biscotte', 'gaston', 'Clara'],
  ['Lune', 'pia', 'Mehdi'],
  ['Praline', 'suzie', 'Jade'],
  ['Caramel', 'gaston', 'Lucas'],
  ['Figue', 'nino', 'Emma'],
  ['Nuage', 'pia', 'Rayan'],
  ['Cookie', 'nino', 'Léna'],
  ['Mochi', 'suzie', 'Sacha'],
  ['Galette', 'gaston', 'Louise'],
  ['Opale', 'pia', 'Adam'],
];

/** 60 jours de chiffres d'une app qui démarre : croissance régulière, creux le dimanche, rétention réaliste. */
export function demoDailyStats(today: Day): { day: Day; metrics: DailyMetrics }[] {
  const rand = rng(42);
  const out: { day: Day; metrics: DailyMetrics }[] = [];
  let total = 1800;
  let subscribers = 40;
  let trials = 12;
  for (let i = 60; i >= 1; i--) {
    const day = addDays(today, -i);
    const t = 60 - i;
    const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
    const weekend = weekday === 0 || weekday === 6 ? 0.82 : 1;
    const accountsNew = Math.round((55 + t * 1.6) * weekend * (0.85 + rand() * 0.3));
    total += accountsNew;
    const dau = Math.round(total * (0.31 + rand() * 0.04) * weekend);
    const newTrials = Math.round(accountsNew * (0.09 + rand() * 0.04));
    trials = Math.max(0, Math.round(trials * 0.86 + newTrials));
    subscribers += Math.round(newTrials * 0.42 * (0.7 + rand() * 0.6)) - (rand() < 0.3 ? 1 : 0);
    const petMessages = Math.round(dau * (1.9 + rand() * 0.4));
    const waved = Math.round(dau * (0.42 + rand() * 0.08));
    const shapesBase = Math.round(total * 0.62);
    out.push({
      day,
      metrics: {
        accountsTotal: total,
        accountsNew,
        dau,
        wau: Math.round(dau * 2.35),
        mau: Math.round(dau * 3.9),
        d1Cohort: accountsNew,
        d1Retained: Math.round(accountsNew * (0.46 + rand() * 0.06)),
        d7Cohort: accountsNew,
        d7Retained: Math.round(accountsNew * (0.27 + rand() * 0.05)),
        d30Cohort: Math.round(accountsNew * 0.8),
        d30Retained: Math.round(accountsNew * 0.8 * (0.14 + rand() * 0.04)),
        subscribers,
        trials,
        newTrials,
        petMessages,
        petMessagesAnswered: Math.round(petMessages * (0.38 + rand() * 0.08)),
        encountersWaved: waved,
        encountersAccepted: Math.round(waved * (0.36 + rand() * 0.06)),
        linksActive: Math.round(total * 0.74),
        linksGhost: Math.round(total * 0.11),
        linksArchived: Math.round(total * 0.05),
        reportsOpened: Math.round(rand() * 4),
        reportsHandled: Math.round(rand() * 4),
        reportsOpen: 5,
        top: TOP_NAMES.map(([petName, species, ownerName], k) => ({ userId: `demo-top-${k}`, ownerName, petName, species, activeLinks: 14 - k })),
        averageStreak: Math.round((4.2 + t * 0.03 + rand() * 0.4) * 10) / 10,
        encountersProposed: Math.round(waved * (2.6 + rand() * 0.3)),
        averageCompatibility: Math.round(78 + rand() * 4),
        shapes: { en_forme: Math.round(shapesBase * 0.48), bof: Math.round(shapesBase * 0.37), boude: Math.round(shapesBase * 0.15) },
        visions: (['foyer', 'ancrage', 'elan', 'rythme', 'cap'] as const).map((axis, a) => ({
          axis,
          buckets: [0.12, 0.21, 0.3, 0.23, 0.14].map((p, b) => Math.round(total * 0.7 * (p + (((a + b) % 3) - 1) * 0.03))),
        })),
        topDetails: Object.fromEntries(
          TOP_NAMES.map((_, k) => [`demo-top-${k}`, { shape: k < 8 ? ('en_forme' as const) : ('bof' as const), streak: 41 - k * 3 }]),
        ),
      },
    });
  }
  return out;
}

@Injectable()
export class AdminDemo implements OnApplicationBootstrap {
  private readonly logger = new Logger('Démo');

  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(MESSAGES) private readonly messages: MessagesRepository,
    @Inject(REPORTS) private readonly reports: ReportsRepository,
    @Inject(AUDIT_LOG) private readonly audit: AuditLogRepository,
    @Inject(SUSPENSIONS) private readonly suspensions: SuspensionsRepository,
    @Inject(DAILY_STATS) private readonly stats: DailyStatsRepository,
    @Inject(Moderation) private readonly moderation: Moderation,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (await this.profiles.findById(DEMO_REPORTED.margaux)) return;
    const now = this.clock.now();
    const ago = (hours: number): string => new Date(now.getTime() - hours * H).toISOString();
    const today = dayOf(now);
    for (const row of demoDailyStats(today)) await this.stats.put({ ...row, computedAt: `${addDays(row.day, 1)}T03:10:00.000Z` });

    for (const [key, name] of PEOPLE) {
      const profile: Profile = {
        id: DEMO_REPORTED[key],
        displayName: name,
        birthdate: '1995-06-15',
        gender: 'non_dit',
        seeking: 'potes',
        whom: null,
        locale: 'fr',
        discreet: false,
        sensitiveConsentAt: null,
        locationConsentAt: null,
        avatarPath: null,
        inviteCode: `ADM${key.toUpperCase()}`.slice(0, 8).padEnd(8, 'X'),
        wordsCode: `MOT${key.toUpperCase()}`.slice(0, 8).padEnd(8, 'Y'),
        plusUntil: null,
        welcomeSentAt: ago(400),
        createdAt: ago(500),
      };
      await this.profiles.create(profile);
    }

    // Un lien entre Margaux et Hugo, et la conversation autour du message signalé.
    const [a, b] = [DEMO_REPORTED.margaux, DEMO_REPORTED.hugo].sort() as [string, string];
    const linkId = '00000000-0000-4000-8000-0000000000e1';
    await this.links.create({ ...newLink(addDays(today, -6)), id: linkId, userA: a, userB: b, messageXpOn: null, messageXp: 0, lastMessageAt: ago(3), createdAt: ago(150) });
    const thread: ReadonlyArray<[string, 'user' | 'pet', string | null, string]> = [
      ['00000000-0000-4000-8000-0000000000f1', 'pet', DEMO_REPORTED.margaux, 'Vous êtes d’accord sur plus de choses que vous ne croyez.'],
      ['00000000-0000-4000-8000-0000000000f2', 'user', DEMO_REPORTED.margaux, 'Bon, on se le fait ce resto jeudi ?'],
      ['00000000-0000-4000-8000-0000000000f3', 'user', DEMO_REPORTED.hugo, 'Envoie d’abord une photo de toi, une vraie. Sinon laisse tomber.'],
      ['00000000-0000-4000-8000-0000000000f4', 'user', DEMO_REPORTED.margaux, 'Non. Et ce ton, sérieusement ?'],
      ['00000000-0000-4000-8000-0000000000f5', 'user', DEMO_REPORTED.hugo, 'T’es vraiment pas drôle, tu sais.'],
      ['00000000-0000-4000-8000-0000000000f6', 'user', DEMO_REPORTED.hugo, 'Bref.'],
    ];
    await this.messages.add(
      thread.map(([id, kind, author, body], i) => ({ id, linkId, authorKind: kind, authorId: author, kind: 'text' as const, body, mediaPath: null, createdAt: ago(9 - i * 0.5), petRole: kind === 'pet' ? ('remark' as const) : null, visibleTo: null })),
    );

    const report = async (reporter: string, target: string, reason: string, hours: number, extra: { details?: string; linkId?: string; messageId?: string } = {}) =>
      this.reports.add({ reporter, targetUser: target, linkId: extra.linkId ?? null, messageId: extra.messageId ?? null, reason, details: extra.details ?? null, createdAt: ago(hours) });
    await report(DEMO_REPORTED.zoe, DEMO_REPORTED.karim, 'faux_profil', 70, { details: 'Mêmes photos que sur un autre compte.' });
    await report(DEMO_REPORTED.nour, DEMO_REPORTED.theo, 'autre', 60, { details: 'Il insiste pour avoir mon numéro.' });
    await report(DEMO_REPORTED.zoe, DEMO_REPORTED.theo, 'harcelement', 31, { details: 'Messages en boucle après un refus.' });
    await report(DEMO_REPORTED.margaux, DEMO_REPORTED.hugo, 'harcelement', 6.5, { details: 'Il exige une photo de moi.', linkId, messageId: '00000000-0000-4000-8000-0000000000f3' });
    await report(DEMO_REPORTED.theo, DEMO_REPORTED.nour, 'contenu_inapproprie', 2);
    await report(DEMO_REPORTED.karim, DEMO_REPORTED.zoe, 'mineur', 0.6, { details: 'Elle a l’air très jeune sur sa photo.' });

    // Deux traités (le journal et la suspension viennent du vrai chemin de modération).
    await this.moderation.act('moderation@blowy.app', { action: 'suspend', targetUserId: DEMO_REPORTED.karim, reportId: '1', reason: 'Faux profil : photos reprises d’un autre compte.', days: 7 });
    await this.moderation.act('moderation@blowy.app', { action: 'warn', targetUserId: DEMO_REPORTED.theo, reportId: '2', reason: 'Insistance après un refus. Premier avertissement.' });
    this.logger.log('administration de démo prête : 60 jours de chiffres, 6 signalements');
  }
}
