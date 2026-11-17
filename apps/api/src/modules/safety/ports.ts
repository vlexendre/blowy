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
  /** Signalement dans un groupe (spéc §26) : le groupe, et le message signalé s'il y en a un. */
  groupId?: string | null;
  groupMessageId?: string | null;
  reason: string;
  details: string | null;
  createdAt: string;
  /** Qui signale : une personne (défaut) ou le filtre automatique (`reporter` est alors null). */
  source?: 'person' | 'filter';
  /** 0 normal · 1 haut · 2 urgent (`reportPriority` du domaine). */
  priority?: number;
  /** Catégorie trouvée par le filtre (message, note, photo), ou null. */
  category?: string | null;
  /** Fait dans le monde d'exemple du compte de revue : ni alerte, ni escalade, ni statistique. */
  review?: boolean;
  /** Équipe prévenue (récapitulatif envoyé) ; null : pas encore. */
  alertedAt?: string | null;
  /** Remonté après 24 h sans traitement ; null : pas encore. */
  escalatedAt?: string | null;
}

/** Un signalement tel que l'équipe le voit dans une alerte (jamais de contenu ni de prénom). */
export interface ReportAlertRow {
  id: string;
  reason: string;
  source: 'person' | 'filter';
  category: string | null;
  priority: number;
  createdAt: string;
}

export interface ReportsRepository {
  add(report: ReportRecord): Promise<void>;
  /** Personnes signalées par `reporter`. */
  reportedBy(reporter: string): Promise<Set<string>>;
  /** Signalements ouverts d'autres personnes sur ce compte : combien de personnes différentes, dont « mineur ». */
  openReportersOf(targetUser: string): Promise<{ distinct: number; minor: number }>;
  /** Monte la priorité des signalements ouverts sur ce compte (jamais ne la baisse). */
  raisePriority(targetUser: string, priority: number): Promise<void>;
  /** Réserve (une seule fois) les signalements pas encore annoncés à l'équipe, hors monde de revue, `limit` au plus. */
  claimUnalerted(at: string, limit: number): Promise<ReportAlertRow[]>;
  /** Signalements pas encore annoncés (hors revue) : y en a-t-il, et un urgent parmi eux ? */
  pendingAlerts(): Promise<{ count: number; urgent: boolean }>;
  /** Dernier récapitulatif envoyé (hors revue), ou null. */
  lastAlertAt(): Promise<string | null>;
  /** Réserve les signalements ouverts créés avant `before`, pas encore remontés (hors revue), et les passe au moins en priorité haute. */
  claimOverdue(before: string, at: string, limit: number): Promise<ReportAlertRow[]>;
  /** Supprime les signalements faits par ce compte (remise à neuf du monde de revue). */
  removeBy(reporter: string): Promise<void>;
}
