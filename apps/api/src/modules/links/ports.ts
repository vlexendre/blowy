import type { Day, LinkState } from '@blowy/domain';

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
}

export interface MessagesRepository {
  add(messages: readonly MessageRecord[]): Promise<void>;
  /** Messages strictement avant `before`, du plus récent au plus ancien. */
  page(linkId: string, before: string | null, limit: number): Promise<MessageRecord[]>;
  latest(linkId: string): Promise<MessageRecord | null>;
  /** Messages non écrits par `userId` (ni par son pet) après `after`. */
  countUnread(linkId: string, userId: string, after: string | null): Promise<number>;
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
