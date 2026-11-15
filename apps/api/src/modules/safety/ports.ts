export interface BlockRecord {
  blocker: string;
  blocked: string;
  createdAt: string;
}

export interface BlocksRepository {
  add(block: BlockRecord): Promise<void>;
  remove(blocker: string, blocked: string): Promise<void>;
  listBy(blocker: string): Promise<BlockRecord[]>;
  /** Personnes bloquées par `userId` ou qui l'ont bloqué. */
  blockedEitherWay(userId: string): Promise<Set<string>>;
}

export interface ReportRecord {
  /** Null une fois le compte supprimé (`on delete set null`). */
  reporter: string | null;
  targetUser: string | null;
  linkId: string | null;
  /** Message signalé, dans `linkId` (null : signalement de la personne, sans message précis). */
  messageId?: string | null;
  reason: string;
  details: string | null;
  createdAt: string;
}

export interface ReportsRepository {
  add(report: ReportRecord): Promise<void>;
  /** Personnes signalées par `reporter`. */
  reportedBy(reporter: string): Promise<Set<string>>;
}
