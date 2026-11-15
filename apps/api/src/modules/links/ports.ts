import type { Day, LinkState, PetRole } from '@blowy/domain';

export interface LinkRecord extends LinkState {
  id: string;
  /** user_a < user_b (contrainte d'unicité de la paire). */
  userA: string;
  userB: string;
  /** Plafond quotidien d'expérience par messages. */
  messageXpOn: Day | null;
  messageXp: number;
  lastMessageAt: string;
  createdAt: string;
}

export type AuthorKind = 'user' | 'pet' | 'system';
export type MessageKind = 'text' | 'photo' | 'event';

export interface MessageRecord {
  id: string;
  linkId: string;
  authorKind: AuthorKind;
  /** Personne qui écrit, ou propriétaire du pet qui parle ; null pour le système. */
  authorId: string | null;
  kind: MessageKind;
  body: string | null;
  mediaPath: string | null;
  createdAt: string;
  /** Rôle d'une réplique de minimoa ; null (ou absent) pour les personnes et le système. */
  petRole?: PetRole | null;
  /** Seule personne qui voit ce message (garde-fou) ; null (ou absent) = les deux. */
  visibleTo?: string | null;
}

export interface DailyPhotoRecord {
  id: string;
  linkId: string;
  userId: string;
  day: Day;
  mediaPath: string;
  createdAt: string;
}

export interface LinksRepository {
  findById(id: string): Promise<LinkRecord | null>;
  findBetween(userA: string, userB: string): Promise<LinkRecord | null>;
  /** Tous les liens (tous statuts) des personnes données. */
  listForUsers(userIds: readonly string[]): Promise<LinkRecord[]>;
  /** Null si la paire existe déjà (course entre deux créations). */
  create(link: LinkRecord): Promise<LinkRecord | null>;
  save(link: LinkRecord): Promise<void>;
  /** Minuteur : liens actifs pas encore rattrapés aujourd'hui (`last_tick_on < today`), par lots. */
  listDueForTick(today: Day, limit: number): Promise<LinkRecord[]>;
  /** Liens d'une personne par pages (ordre d'identifiant), tous statuts sauf archivés. */
  pageForUser(userId: string, after: string | null, limit: number): Promise<LinkRecord[]>;
}

export interface MessagesRepository {
  add(messages: readonly MessageRecord[]): Promise<void>;
  /**
   * Messages strictement avant `before`, du plus récent au plus ancien, vus par `viewerId`
   * (les messages réservés à l'autre personne sont exclus ; sans `viewerId` : tous, usage interne).
   */
  page(linkId: string, before: string | null, limit: number, viewerId?: string): Promise<MessageRecord[]>;
  latest(linkId: string, viewerId: string): Promise<MessageRecord | null>;
  /** Messages non écrits par `userId` (ni par son pet) après `after`, visibles par lui. */
  countUnread(linkId: string, userId: string, after: string | null): Promise<number>;
  /** Derniers messages texte des personnes (fenêtre courte des minimoas), du plus récent au plus ancien. */
  recentUserTexts(linkId: string, limit: number): Promise<MessageRecord[]>;
  /** Messages texte des personnes depuis `since`, comptés par auteur (santé du lien). */
  countUserTextsSince(linkId: string, since: string): Promise<Map<string, number>>;
  /** Messages texte écrits par les personnes (hors pets, système et photos). */
  countUserMessages(linkId: string): Promise<number>;
}

export interface LinkReadsRepository {
  lastReadAt(linkId: string, userId: string): Promise<string | null>;
  markRead(linkId: string, userId: string, at: string): Promise<void>;
}

export interface DailyPhotosRepository {
  /** Faux si la personne a déjà envoyé sa photo ce jour-là dans ce lien. */
  add(photo: DailyPhotoRecord): Promise<boolean>;
  forDay(linkId: string, day: Day): Promise<DailyPhotoRecord[]>;
  listForLink(linkId: string): Promise<DailyPhotoRecord[]>;
  listForUser(userId: string): Promise<DailyPhotoRecord[]>;
}
