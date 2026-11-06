/**
 * Port staff du module `safety` (agent E, T4) : file prioritaire des alertes « besoin d'aide »
 * (réponse humaine < 1 h pendant les créneaux), examen « je connais quelqu'un ». Consommé par
 * l'implémentation des ports ADMIN_MODERATION / ADMIN_TRUST (module trust), qui vérifie les rôles
 * (trust_lead / admin pour la position) et audite. Aucun DTO ne contient d'autre participant,
 * de vote, de préférence, ni l'identité d'un signaleur.
 */
export interface StaffSafetyAlertView {
  id: string;
  userId: string;
  subjectKind: 'OUTING' | 'DUO_DATE';
  subjectId: string;
  status: 'OPEN' | 'SAFE' | 'HANDLED';
  createdAt: string;
  resolvedAt: string | null;
  acknowledged: boolean;
  caseId: string | null;
  /** Échéance affichée (création + engagement de réponse humaine) et dépassement. */
  slaDueAt: string;
  overdue: boolean;
  positionAttached: boolean;
  positionPurgeAfter: string | null;
}

export interface StaffSafetyAlertDetail extends StaffSafetyAlertView {
  /** Position jointe par choix explicite (null si absente ou déjà purgée). Rôle trust_lead / admin. */
  position: { lat: number; lng: number; accuracyM: number } | null;
}

export interface SafetyStaffPort {
  listAlerts(q: { status?: 'OPEN' | 'SAFE' | 'HANDLED'; cursor?: string; limit: number }): Promise<{ items: StaffSafetyAlertView[]; nextCursor: string | null }>;
  getAlert(id: string): Promise<StaffSafetyAlertDetail | null>;
  /** Prise en charge humaine : alerte HANDLED, dossier résolu ; la position suit alors la purge 72 h. */
  handle(alertId: string, staffUserId: string, commandId: string): Promise<StaffSafetyAlertView>;
  /** Résumé SANS position ni tiers pour l'écran dossier existant (`getCase`). */
  caseSummary(subjectType: string, subjectId: string): Promise<string | null>;
  /** Décision d'un dossier existant (`decide`) sur un sujet SAFETY_ALERT : alerte HANDLED. */
  onCaseDecided(subjectType: string, subjectId: string, staffUserId: string): Promise<void>;
  /** « Je connais quelqu'un » en examen : accepté → retrait sans pénalité ; refusé → place gardée. */
  resolveKnowsSomeone(seatId: string, accept: boolean, staffUserId: string, commandId: string): Promise<{ status: 'MOVED' | 'ACCEPTED_TOO_LATE' | 'REJECTED' | 'REVIEWED' }>;
}
export const SAFETY_STAFF_PORT = Symbol.for('blowy.safety.staff');
