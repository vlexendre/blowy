/**
 * Démo (mode mémoire) de la série des liens (spéc §24), à la demande (`POST /dev/demo/links`, local
 * seulement) : la personne a, en plus du lien avec Malo (qui lui écrit à l'inscription : « à toi d'écrire »), trois
 * liens d'avant qui montrent chaque état de l'écran
 * « Aujourd'hui » : Sasha (série de 6 jours en jeu, personne n'a encore écrit aujourd'hui), Inès (lien en danger : le
 * rattrapage lui laisse 2 vies) et Yanis (lien fantôme). Les liens sont posés tels qu'au dernier jour où quelqu'un a
 * écrit ; le rattrapage normal (`tickLink`) fait le reste à la première lecture.
 */
import { Body, Controller, Inject, Injectable, Post } from '@nestjs/common';
import { chatSystemText } from '@blowy/content';
import { type Day, LEVEL_XP, type LinkDay, type LinkMilestone, addDays, levelForXp, newLink } from '@blowy/domain';
import { type Clock, todayOf } from '../shared/clock';
import type { Ids } from '../shared/ids';
import { Public } from '../shared/auth.guard';
import { DomainError } from '../shared/errors';
import { CLOCK, IDS, LINKS, MESSAGES, PROFILES } from '../shared/tokens';
import type { ProfilesRepository } from '../modules/me/ports';
import type { LinkRecord, LinksRepository, MessagesRepository } from '../modules/links/ports';
import { DEMO_INES, DEMO_PEOPLE, DEMO_SASHA, DEMO_YANIS } from './demo';

interface Past {
  with: string;
  /** Âge du lien, en jours. */
  ageDays: number;
  /** Jours passés écrits par les deux (0 = hier), du plus récent au plus ancien. */
  duoDaysAgo: number[];
  /** Dernier jour où quelqu'un a écrit, en jours avant aujourd'hui. */
  lastActiveDaysAgo: number;
  xp: number;
  bestStreak: number;
  /** Le dernier échange, il y a `lastActiveDaysAgo` jours : l'autre, puis la personne. */
  lines: readonly [string, string];
}

const PAST: readonly Past[] = [
  { with: DEMO_SASHA, ageDays: 24, duoDaysAgo: [1, 2, 3, 4, 5, 6, 9, 10, 11], lastActiveDaysAgo: 1, xp: LEVEL_XP[3] + 120, bestStreak: 9, lines: ['Bonne nuit ! Pia ronfle déjà.', 'Bonne nuit, à demain.'] },
  { with: DEMO_INES, ageDays: 16, duoDaysAgo: [6, 7, 8], lastActiveDaysAgo: 6, xp: LEVEL_XP[1] + 30, bestStreak: 3, lines: ['On se refait un café la semaine pro ?', 'Carrément, je te dis.'] },
  { with: DEMO_YANIS, ageDays: 30, duoDaysAgo: [11, 12], lastActiveDaysAgo: 11, xp: LEVEL_XP[1] - 5, bestStreak: 2, lines: ['Tu es dispo samedi ?', 'Je regarde et je te dis.'] },
];

@Injectable()
export class LinksDemo {
  constructor(
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(MESSAGES) private readonly messages: MessagesRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(IDS) private readonly ids: Ids,
  ) {}

  async welcome(userId: string): Promise<void> {
    for (const p of PAST) await this.past(userId, p);
  }

  private async past(userId: string, p: Past): Promise<void> {
    const [userA, userB] = userId < p.with ? [userId, p.with] : [p.with, userId];
    if (await this.links.findBetween(userA, userB)) return;
    const today = todayOf(this.clock);
    const ago = (n: number): Day => addDays(today, -n);
    const at = (n: number, time: string): string => new Date(`${ago(n)}T${time}Z`).toISOString();
    const recentDays: LinkDay[] = p.duoDaysAgo
      .filter((n) => n < 14)
      .map((n) => ({ day: ago(n), a: true, b: true }))
      .sort((x, y) => x.day.localeCompare(y.day));
    // Série en cours : jours à deux consécutifs jusqu'à hier.
    let streak = 0;
    while (p.duoDaysAgo.includes(streak + 1)) streak += 1;
    const level = levelForXp(p.xp);
    const milestones: LinkMilestone[] = [
      ...Array.from({ length: level - 1 }, (_, i): LinkMilestone => ({ kind: 'level', value: i + 2, on: ago(p.ageDays - 3 * (i + 1)) })),
      ...(p.bestStreak >= 3 ? [{ kind: 'streak' as const, value: 3, on: ago(p.ageDays - 4) }] : []),
      ...(p.bestStreak >= 7 ? [{ kind: 'streak' as const, value: 7, on: ago(p.ageDays - 8) }] : []),
    ];
    const created = at(p.ageDays, '18:00:00');
    const [first, reply] = [at(p.lastActiveDaysAgo, '19:30:00'), at(p.lastActiveDaysAgo, '19:31:00')];
    const link: LinkRecord = {
      ...newLink(ago(p.lastActiveDaysAgo)),
      id: this.ids.uuid(),
      userA,
      userB,
      xp: p.xp,
      level,
      streak,
      bestStreak: Math.max(p.bestStreak, streak),
      // Les jours à deux plus anciens que les deux dernières semaines ne sont plus détaillés.
      duoDays: p.duoDaysAgo.length + Math.floor(Math.max(0, p.ageDays - 14) / 2),
      lastDuoDayOn: ago(Math.min(...p.duoDaysAgo)),
      recentDays,
      milestones,
      messageXpOn: null,
      messageXp: 0,
      createdAt: created,
      lastMessageAt: reply,
    };
    if (!(await this.links.create(link))) return;
    const [theirs, mine] = p.lines;
    const message = (authorId: string | null, body: string, createdAt: string) => ({
      id: this.ids.uuid(),
      linkId: link.id,
      authorKind: authorId ? ('user' as const) : ('system' as const),
      authorId,
      kind: authorId ? ('text' as const) : ('event' as const),
      body,
      mediaPath: null,
      createdAt,
    });
    await this.messages.add([message(null, chatSystemText('fr').linkCreated, created), message(p.with, theirs, first), message(userId, mine, reply)]);
  }
}

/**
 * `POST /dev/demo/links` (mode mémoire et démo seulement) : `{ userId }`, ou sans corps la dernière personne inscrite
 * hors démo. Pour voir et capturer les états d'un lien sans attendre des jours.
 */
@Public()
@Controller('dev/demo/links')
export class DevDemoLinksController {
  constructor(
    @Inject(LinksDemo) private readonly demo: LinksDemo,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
  ) {}

  @Post()
  async seed(@Body() body: unknown): Promise<{ userId: string }> {
    const asked = body && typeof body === 'object' && 'userId' in body && typeof body.userId === 'string' ? body.userId : null;
    const userId = asked ?? (await this.latestNewcomer());
    if (!userId || !(await this.profiles.findById(userId))) throw new DomainError('not_found');
    await this.demo.welcome(userId);
    return { userId };
  }

  private async latestNewcomer(): Promise<string | null> {
    const demo = new Set(DEMO_PEOPLE.map((p) => p.id));
    const recent = await this.profiles.listRecent(50, '');
    return recent.filter((p) => !demo.has(p.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.id ?? null;
  }
}
