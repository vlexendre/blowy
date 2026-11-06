/**
 * Décision pure d'envoi (spec-v5 §9.2, D-028, D-052) pour UNE notification due, dans l'ordre :
 *  1. échue → supprimée ;  2. plus pertinente (sortie annulée, place rendue, duo fini…) → supprimée,
 *     ou différée si la pertinence n'est pas encore connue (message en modération) ;
 *  3. sécurité → envoyée, toujours ;
 *  4. pause → supprimée (sauf transactionnels de places confirmées) ;
 *  5. catégorie coupée → supprimée (sauf transactionnels) ;
 *  6. heures calmes → reportée à la fin (supprimée si elle serait échue) ;
 *  7. plafond du jour : 3, ou 4 le jour d'une sortie ; les transactionnels comptent dans 4 ;
 *  8. aucun appareil → supprimée (rien à envoyer, aucun compteur consommé).
 */
import type { NotificationCategoryV5 } from '@blowy/domain';
import { categoryOf, PUSH_KINDS, type PushKey } from './catalog.js';
import { inQuietHours, quietEndAfter, type QuietHours } from './time.js';

export type SuppressReason = 'EXPIRED' | 'NOT_RELEVANT' | 'PAUSED' | 'PREFERENCE' | 'QUIET_HOURS' | 'DAILY_CAP' | 'NO_DEVICE' | 'WEEKLY_PROPOSAL_CAP' | 'GROUPED' | 'ACCOUNT_DELETED';

export type Decision = { action: 'SEND' } | { action: 'DEFER'; until: Date } | { action: 'SUPPRESS'; reason: SuppressReason };

export interface RhythmTuning extends QuietHours {
  maxPerDay: number;
  outingDayMax: number;
}

export interface RecipientState {
  tz: string;
  paused: boolean;
  disabled: ReadonlySet<NotificationCategoryV5>;
  /** Notifications non-sécurité déjà envoyées aujourd'hui (jour local). */
  sentToday: number;
  /** A une place confirmée pour une sortie (ou un RDV duo confirmé) qui commence aujourd'hui (local). */
  outingToday: boolean;
  hasDevice: boolean;
}

export type Relevance = { relevant: true } | { relevant: false; retryAt?: Date };

export function decide(key: PushKey, i: { now: Date; expiresAt: Date | null; relevance: Relevance; state: RecipientState; tuning: RhythmTuning }): Decision {
  const { now, state, tuning } = i;
  const klass = PUSH_KINDS[key].klass;
  if (i.expiresAt && now.getTime() > i.expiresAt.getTime()) return { action: 'SUPPRESS', reason: 'EXPIRED' };
  if (!i.relevance.relevant) {
    const retry = i.relevance.retryAt;
    if (retry && (!i.expiresAt || retry.getTime() <= i.expiresAt.getTime())) return { action: 'DEFER', until: retry };
    return { action: 'SUPPRESS', reason: 'NOT_RELEVANT' };
  }
  if (klass === 'SAFETY') return state.hasDevice ? { action: 'SEND' } : { action: 'SUPPRESS', reason: 'NO_DEVICE' };
  const transactional = klass === 'TRANSACTIONAL';
  if (state.paused && !transactional) return { action: 'SUPPRESS', reason: 'PAUSED' };
  if (!transactional && state.disabled.has(categoryOf(key))) return { action: 'SUPPRESS', reason: 'PREFERENCE' };
  if (inQuietHours(now, state.tz, tuning)) {
    const until = quietEndAfter(now, state.tz, tuning);
    if (i.expiresAt && until.getTime() > i.expiresAt.getTime()) return { action: 'SUPPRESS', reason: 'QUIET_HOURS' };
    return { action: 'DEFER', until };
  }
  const cap = transactional || state.outingToday ? tuning.outingDayMax : tuning.maxPerDay;
  if (state.sentToday >= cap) return { action: 'SUPPRESS', reason: 'DAILY_CAP' };
  if (!state.hasDevice) return { action: 'SUPPRESS', reason: 'NO_DEVICE' };
  return { action: 'SEND' };
}

/** Une notification envoyée consomme-t-elle le plafond du jour ? (la sécurité, jamais). */
export const countsTowardCap = (key: PushKey) => PUSH_KINDS[key].klass !== 'SAFETY';
