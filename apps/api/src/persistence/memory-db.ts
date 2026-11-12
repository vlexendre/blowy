/**
 * Base en mémoire partagée par les dépôts « memory » : mêmes tables que la migration Supabase,
 * y compris les suppressions en cascade (suppression de compte).
 */
import type { EncounterRecord } from '../modules/encounters/ports';
import type { DailyPhotoRecord, LinkRecord, MessageRecord } from '../modules/links/ports';
import type { Profile } from '../modules/me/ports';
import type { ItemSource, PetEventRecord, PetRecord } from '../modules/pets/ports';
import type { BlockRecord, ReportRecord } from '../modules/safety/ports';

export interface WordVoteRow {
  targetUser: string;
  words: readonly string[];
  voterHash: string;
  createdAt: string;
}

export interface PetItemRow {
  petId: string;
  itemId: string;
  source: ItemSource;
  acquiredAt: string;
}

export class MemoryDb {
  /** auth.users : e-mails connus et comptes supprimés. */
  readonly authEmails = new Map<string, string>();
  readonly deletedUsers = new Set<string>();

  readonly profiles = new Map<string, Profile>();
  readonly pets = new Map<string, PetRecord>();
  readonly petEvents: PetEventRecord[] = [];
  readonly petItems: PetItemRow[] = [];
  readonly wordVotes: WordVoteRow[] = [];
  readonly links = new Map<string, LinkRecord>();
  readonly messages: MessageRecord[] = [];
  /** clé `${linkId}:${userId}` → last_read_at */
  readonly linkReads = new Map<string, string>();
  readonly dailyPhotos: DailyPhotoRecord[] = [];
  readonly encounters = new Map<string, EncounterRecord>();
  /** clé `${blocker}:${blocked}` */
  readonly blocks = new Map<string, BlockRecord>();
  readonly reports: ReportRecord[] = [];

  private sequence = 0;
  nextId(): string {
    this.sequence += 1;
    return String(this.sequence);
  }

  /** Équivalent de `delete from auth.users` et des `on delete cascade / set null` de la migration. */
  deleteUser(userId: string): void {
    this.deletedUsers.add(userId);
    this.authEmails.delete(userId);
    this.profiles.delete(userId);

    const petIds = new Set([...this.pets.values()].filter((p) => p.ownerId === userId).map((p) => p.id));
    for (const id of petIds) this.pets.delete(id);
    removeWhere(this.petEvents, (e) => petIds.has(e.petId));
    removeWhere(this.petItems, (i) => petIds.has(i.petId));
    removeWhere(this.wordVotes, (v) => v.targetUser === userId);

    const linkIds = new Set([...this.links.values()].filter((l) => l.userA === userId || l.userB === userId).map((l) => l.id));
    for (const id of linkIds) this.links.delete(id);
    removeWhere(this.messages, (m) => linkIds.has(m.linkId));
    for (const m of this.messages) if (m.authorId === userId) m.authorId = null;
    for (const key of [...this.linkReads.keys()]) {
      const [linkId, uid] = key.split(':');
      if (uid === userId || (linkId !== undefined && linkIds.has(linkId))) this.linkReads.delete(key);
    }
    removeWhere(this.dailyPhotos, (p) => p.userId === userId || linkIds.has(p.linkId));

    for (const [id, e] of this.encounters) if (e.fromUser === userId || e.toUser === userId) this.encounters.delete(id);
    for (const [key, b] of this.blocks) if (b.blocker === userId || b.blocked === userId) this.blocks.delete(key);
    for (const r of this.reports) {
      if (r.reporter === userId) r.reporter = null;
      if (r.targetUser === userId) r.targetUser = null;
      if (r.linkId !== null && linkIds.has(r.linkId)) r.linkId = null;
    }
  }
}

function removeWhere<T>(rows: T[], predicate: (row: T) => boolean): void {
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    if (row !== undefined && predicate(row)) rows.splice(i, 1);
  }
}
