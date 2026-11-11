import { type PetPair, systemText, ghostLine, levelLabel, levelUpLine, lifeLostLine } from '@blowy/content';
import { type Day, LEVEL_KEYS, type LinkState, tickLink } from '@blowy/domain';
import { seedOf } from '../../../shared/seed';
import type { AuthorKind, LinkRecord, MessageKind } from '../ports';

export type PendingMessage = {
  authorKind: AuthorKind;
  authorId: string | null;
  kind: MessageKind;
  body: string | null;
  mediaPath: string | null;
};

const sameState = (a: LinkState, b: LinkState): boolean =>
  a.status === b.status &&
  a.lives === b.lives &&
  a.xp === b.xp &&
  a.level === b.level &&
  a.streak === b.streak &&
  a.lastActiveOn === b.lastActiveOn &&
  a.lastTickOn === b.lastTickOn &&
  a.lastDuoPhotoOn === b.lastDuoPhotoOn &&
  a.revived === b.revived;

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
    /** Nom du pet de chaque membre, par identifiant de personne. */
    private readonly petNames: ReadonlyMap<string, string>,
  ) {}

  get changed(): boolean {
    return this.dirty || this.pending.length > 0;
  }

  otherOf(userId: string): string {
    return this.link.userA === userId ? this.link.userB : this.link.userA;
  }

  /** Les deux pets vus depuis celui de `ownerId`. */
  pair(ownerId: string): PetPair {
    return { self: this.petNames.get(ownerId) ?? 'ton pet', other: this.petNames.get(this.otherOf(ownerId)) ?? 'son pet' };
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
    this.pending.push({ authorKind: 'user', authorId: userId, kind, body, mediaPath });
  }

  pet(ownerId: string, body: string): void {
    this.pending.push({ authorKind: 'pet', authorId: ownerId, kind: 'text', body, mediaPath: null });
  }

  system(body: string): void {
    this.pending.push({ authorKind: 'system', authorId: null, kind: 'event', body, mediaPath: null });
  }

  /** Bandeau de niveau + réplique d'un pet. */
  announceLevel(level: number, ownerId: string): void {
    const key = LEVEL_KEYS[level - 1];
    if (!key) return;
    const label = levelLabel[key];
    this.system(systemText.levelUp(label.title, label.text));
    this.pet(ownerId, levelUpLine(this.pair(ownerId), label.title, this.seed('level', String(level))));
  }

  /**
   * Rattrapage des jours passés (vies perdues, passage en fantôme).
   * Un seul message par rattrapage, dit par l'un des deux pets.
   */
  tick(): void {
    const before = this.link;
    const after = tickLink(before, this.today);
    if (after === before) return;
    this.update(after);
    const speaker = this.speaker('tick');
    if (after.status === 'ghost' && before.status === 'active') {
      this.pet(speaker, ghostLine(this.pair(speaker), this.seed('ghost')));
    } else if (after.lives < before.lives) {
      this.pet(speaker, lifeLostLine(this.pair(speaker), after.lives, this.seed('life-lost')));
    }
  }
}
