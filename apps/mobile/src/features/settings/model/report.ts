/**
 * Motifs de signalement V5 (V5-Signaler) → catégories du contrat (`REPORT_CATEGORIES_V52`).
 * Le libellé reste côté i18n ; seule la catégorie et la cible partent au serveur (jamais le texte
 * d'un message, ni une position).
 */
import type { CreateReportRequest, ReportCategoryV52 } from '@blowy/api-contract';

export const REPORT_REASONS = [
  { key: 'unwantedTouch', group: 'during', category: 'IRL_BEHAVIOR' },
  { key: 'sexualPressure', group: 'during', category: 'SAFETY' },
  { key: 'followed', group: 'during', category: 'SAFETY' },
  { key: 'notSelfie', group: 'during', category: 'FAKE_PROFILE' },
  { key: 'minor', group: 'during', category: 'MINOR' },
  { key: 'onSite', group: 'during', category: 'ON_SITE_INCIDENT' },
  { key: 'outingThreat', group: 'messages', category: 'OUTING_THREAT' },
  { key: 'hate', group: 'messages', category: 'INAPPROPRIATE' },
  { key: 'unsolicitedPhotos', group: 'messages', category: 'INAPPROPRIATE' },
  { key: 'money', group: 'messages', category: 'MONEY_REQUEST' },
  { key: 'harassment', group: 'messages', category: 'HARASSMENT' },
  { key: 'noShows', group: 'messages', category: 'REPEATED_NO_SHOW' },
  { key: 'other', group: 'messages', category: 'OTHER' },
] as const satisfies readonly {
  key: string;
  group: 'during' | 'messages';
  category: ReportCategoryV52;
}[];

export type ReportReasonKey = (typeof REPORT_REASONS)[number]['key'];

export interface ReportContext {
  outingId?: string;
  userId?: string;
  messageId?: string;
}

/**
 * Requête de signalement, ou `null` si le contexte ne désigne aucune cible acceptée :
 * sortie + personne, message, ou sortie seule pour un incident sur place (contrat E).
 */
export function reportRequest(
  reason: ReportReasonKey,
  ctx: ReportContext,
  alsoBlock: boolean,
): CreateReportRequest | null {
  const r = REPORT_REASONS.find((x) => x.key === reason)!;
  const safetyExit =
    r.category === 'SAFETY' || r.category === 'MINOR' || r.category === 'IRL_BEHAVIOR';
  if (ctx.messageId)
    return { target: { messageId: ctx.messageId }, category: r.category, safetyExit, alsoBlock };
  if (ctx.outingId && ctx.userId)
    return {
      target: { outing: { id: ctx.outingId, userId: ctx.userId } },
      category: r.category,
      safetyExit,
      alsoBlock,
    };
  if (ctx.outingId && r.category === 'ON_SITE_INCIDENT')
    return {
      target: { outing: { id: ctx.outingId } },
      category: r.category,
      safetyExit: false,
      alsoBlock: false,
    };
  return null;
}
