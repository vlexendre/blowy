/**
 * Durées de conservation promises par la politique de confidentialité (apps/web, « Combien de temps on garde tes
 * données ») et appliquées par l'API (`RetentionJobs`). Pur : le jour courant est un paramètre.
 */
import { type Day, addDays, daysBetween } from './days';

/** Compte sans connexion supprimé après 2 ans… */
export const INACTIVE_ACCOUNT_DAYS = 730;
/** …après un message de prévenance envoyé ce nombre de jours avant. */
export const INACTIVITY_NOTICE_DAYS = 30;
/** Exclusion définitive : l'empreinte de l'identifiant Apple ou Google est gardée 3 ans. */
export const BAN_KEEP_DAYS = 3 * 365;
/** Signalements et décisions de modération : 1 an après la clôture. */
export const MODERATION_KEEP_DAYS = 365;
/** Journaux techniques : 30 jours. */
export const TECHNICAL_LOG_DAYS = 30;

export type InactivityStep = 'none' | 'notice' | 'delete';

/**
 * Où en est un compte inactif : prévenu 30 jours avant les 2 ans, supprimé à 2 ans seulement si la prévenance est
 * partie depuis au moins 30 jours (une prévenance tardive repousse la suppression d'autant). Une connexion remet tout
 * à zéro (`lastActiveOn` = aujourd'hui, prévenance effacée).
 */
export function inactivityStep(lastActiveOn: Day, noticedOn: Day | null, today: Day): InactivityStep {
  const idle = daysBetween(lastActiveOn, today);
  if (noticedOn !== null && noticedOn >= lastActiveOn) {
    return idle >= INACTIVE_ACCOUNT_DAYS && daysBetween(noticedOn, today) >= INACTIVITY_NOTICE_DAYS ? 'delete' : 'none';
  }
  return idle >= INACTIVE_ACCOUNT_DAYS - INACTIVITY_NOTICE_DAYS ? 'notice' : 'none';
}

/** Jour de la suppression annoncé dans la prévenance. */
export const inactivityDeletionDay = (lastActiveOn: Day, noticedOn: Day): Day => {
  const byIdle = addDays(lastActiveOn, INACTIVE_ACCOUNT_DAYS);
  const byNotice = addDays(noticedOn, INACTIVITY_NOTICE_DAYS);
  return byIdle > byNotice ? byIdle : byNotice;
};

/** Dernier jour d'activité avant lequel un compte est à prévenir (requête de la tâche). */
export const noticeCutoff = (today: Day): Day => addDays(today, -(INACTIVE_ACCOUNT_DAYS - INACTIVITY_NOTICE_DAYS));
/** Dernier jour d'activité avant lequel un compte prévenu peut être supprimé. */
export const deletionCutoff = (today: Day): Day => addDays(today, -INACTIVE_ACCOUNT_DAYS);

/** Texte exact haché pour une exclusion : fournisseur et identifiant (jamais gardé en clair). */
export const banSubjectKey = (provider: string, subject: string): string => `blowy:ban:v1:${provider.trim().toLowerCase()}:${subject.trim().toLowerCase()}`;
