import { type Locale, type PetPair, systemText, labels, levelUpLine } from '@blowy/content';
import { type Day, LEVEL_KEYS, type LinkState, type PetRole, tickLink } from '@blowy/domain';
import { seedOf } from '../../../shared/seed';
import type { AuthorKind, LinkRecord, MessageKind } from '../ports';

export type PendingMessage = {
  authorKind: AuthorKind;
  authorId: string | null;
  kind: MessageKind;
  body: string | null;
  mediaPath: string | null;
  petRole: PetRole | null;
  visibleTo: string | null;
};

const sameState = (a: LinkState, b: LinkState): boolean =>
  a.status === b.status &&
  a.lives === b.lives &&
  a.xp === b.xp &&
  a.level === b.level &&
  a.streak === b.streak &&
  a.bestStreak === b.bestStreak &&
  a.duoDays === b.duoDays &&
  a.lastActiveOn === b.lastActiveOn &&
  a.lastTickOn === b.lastTickOn &&
  a.lastDuoDayOn === b.lastDuoDayOn &&
  a.revived === b.revived &&
  JSON.stringify(a.recentDays) === JSON.stringify(b.recentDays) &&
  JSON.stringify(a.milestones) === JSON.stringify(b.milestones);

/**
 * Brouillon d'une action dans un lien : l'état à jour et les messages à ajouter (personnes, pets, système).
 * Rien n'est écrit tant que `LinkSession.commit` n'est pas appelé.
 */
export class LinkDraft {
  readonly pending: PendingMessage[] = [];
  private dirty = false;

  constructor(
    public link: LinkRecord,
    readonly today: Day,
    /** Nom du minimoa de chaque membre, par identifiant de personne. */
    private readonly petNames: ReadonlyMap<string, string>,
    /** Langue de chaque membre (`profiles.locale`). */
    private readonly locales: ReadonlyMap<string, Locale> = new Map(),
  ) {}

  /**
   * Langue d'un membre. Une réplique de minimoa est écrite dans la langue de son humain ; elle est rangée telle quelle
   * dans la conversation et lue par les deux personnes.
   */
  localeOf(userId: string): Locale {
    return this.locales.get(userId) ?? 'fr';
  }

  /**
   * Langue des bandeaux du système, vus par les deux : la langue commune, sinon celle de la personne A
   * (limite connue : un lien entre deux langues voit ces bandeaux dans une seule).
   */
  get systemLocale(): Locale {
    return this.localeOf(this.link.userA);
  }

  get changed(): boolean {
    return this.dirty || this.pending.length > 0;
  }

  otherOf(userId: string): string {
    return this.link.userA === userId ? this.link.userB : this.link.userA;
  }

  /** Les deux pets vus depuis celui de `ownerId`. */
  pair(ownerId: string): PetPair {
    return { self: this.petNames.get(ownerId) ?? '', other: this.petNames.get(this.otherOf(ownerId)) ?? '' };
  }

  /** Graine stable pour varier les répliques sans aléa. */
  seed(...parts: string[]): number {
    return seedOf(this.link.id, this.today, ...parts);
  }

  /** Membre dont le pet parle pour un événement commun (alterne de façon stable). */
  speaker(...parts: string[]): string {
    return this.seed('speaker', ...parts) % 2 === 0 ? this.link.userA : this.link.userB;
  }

  update(patch: Partial<LinkRecord>): void {
    const next = { ...this.link, ...patch };
    if (!sameState(next, this.link) || next.messageXp !== this.link.messageXp || next.messageXpOn !== this.link.messageXpOn) this.dirty = true;
    this.link = next;
  }

  user(userId: string, kind: 'text' | 'photo', body: string | null, mediaPath: string | null = null): void {
    this.pending.push({ authorKind: 'user', authorId: userId, kind, body, mediaPath, petRole: null, visibleTo: null });
  }

  /**
   * Réplique du minimoa de `ownerId`. `role` : annonce de jeu (`event`, par défaut) ou intervention
   * (les interventions passent par `ChatMinimoas`, qui applique accord, coupure et plafond).
   * `visibleTo` : une seule personne la voit (garde-fou).
   */
  pet(ownerId: string, body: string, role: PetRole = 'event', visibleTo: string | null = null): void {
    this.pending.push({ authorKind: 'pet', authorId: ownerId, kind: 'text', body, mediaPath: null, petRole: role, visibleTo });
  }

  system(body: string): void {
    this.pending.push({ authorKind: 'system', authorId: null, kind: 'event', body, mediaPath: null, petRole: null, visibleTo: null });
  }

  /** Personnes du lien vues par `ownerId` : A = user_a, B = user_b (fenêtre anonymisée de l'IA). */
  letterOf(userId: string): 'A' | 'B' {
    return userId === this.link.userA ? 'A' : 'B';
  }

  /** Bandeau de niveau + réplique d'un pet. */
  announceLevel(level: number, ownerId: string): void {
    const key = LEVEL_KEYS[level - 1];
    if (!key) return;
    const sys = labels.in(this.systemLocale).levelLabel[key];
    this.system(systemText(this.systemLocale).levelUp(sys.title, sys.text));
    const own = this.localeOf(ownerId);
    this.pet(ownerId, levelUpLine(own, this.pair(ownerId), labels.in(own).levelLabel[key].title, this.seed('level', String(level))));
  }

  /**
   * Rattrapage des jours passés (série du jour, réveil d'un ancien lien endormi). Silencieux : le silence ne coûte
   * rien et ne s'annonce pas (ADA-2027 item 27) ; le lien dit son état dans l'app (`warmth`).
   */
  tick(): void {
    const after = tickLink(this.link, this.today);
    if (after !== this.link) this.update(after);
  }
}
