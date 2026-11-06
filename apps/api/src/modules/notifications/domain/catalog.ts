/**
 * Catalogue push V5 (spec-v5 §9.1) : ce que le serveur a le droit d'envoyer. Les textes viennent de
 * `@blowy/content` (`notif.v5.<clé>` et `<clé>.discreet`) ; ici seulement la classe de livraison.
 *
 * Classes :
 *  - SAFETY : jamais supprimée (ni pause, ni heures calmes, ni plafond, ni préférence) ;
 *  - TRANSACTIONAL : places déjà prises (check-in, annulation, remboursement…) — passe la pause et les
 *    préférences, compte dans le plafond du jour de sortie ;
 *  - PROPOSAL : l'invitation de la semaine, ≤ `maxOutingProposalsPerWeek` (D-052) ;
 *  - MESSAGE : `message.human`, regroupé par conversation — seule pastille entre deux sorties ;
 *  - ACCOUNT : état du compte (pause de fiabilité), ton non culpabilisant ;
 *  - CYCLE : tout le reste, toujours ANCRÉ à une sortie / un duo / une team vivants (revérifié à
 *    l'envoi) : c'est ce qui garantit « aucune notification entre deux sorties ».
 * Clés absentes (retirées ou in-app seulement) : `outing.request_open`, `outing.request_last_call`,
 * `neighborhood.launched`, `duo.proposal` (propositions duo sans push), `pet.memory`,
 * `outing.venue_revealed`, `outing.today` (remplacées par `outing.confirmed` / `outing.faces`).
 */
import { NOTIFICATION_TEMPLATES_V5 } from '@blowy/content';
import type { NotificationCategoryV5 } from '@blowy/domain';
import type { NotificationPriorityClassV5 } from '@blowy/tuning';

export type DeliveryClass = 'SAFETY' | 'TRANSACTIONAL' | 'PROPOSAL' | 'MESSAGE' | 'ACCOUNT' | 'CYCLE';

export interface PushKindSpec {
  klass: DeliveryClass;
  priority: NotificationPriorityClassV5;
  /** Rappel planifié : tombant la nuit, il peut être avancé à 22 h 30 (§9.2). */
  advanceable: boolean;
}

const S = (klass: DeliveryClass, priority: NotificationPriorityClassV5, advanceable = false): PushKindSpec => ({ klass, priority, advanceable });

export const PUSH_KINDS = {
  'safety.alert_sent': S('SAFETY', 'SAFETY'),
  'outing.checkin_open': S('TRANSACTIONAL', 'OUTING_TRANSACTIONAL'),
  'outing.cancelled': S('TRANSACTIONAL', 'OUTING_TRANSACTIONAL'),
  'outing.composition_changed': S('TRANSACTIONAL', 'OUTING_TRANSACTIONAL'),
  'outing.refund_done': S('TRANSACTIONAL', 'OUTING_TRANSACTIONAL'),
  'duo.checkin_open': S('TRANSACTIONAL', 'OUTING_TRANSACTIONAL'),
  'outing.invited': S('PROPOSAL', 'OUTING_MARKETING'),
  'outing.seeding_invited': S('PROPOSAL', 'OUTING_MARKETING'),
  'message.human': S('MESSAGE', 'HUMAN_MESSAGE'),
  'reliability.paused': S('ACCOUNT', 'SYSTEM'),
  'outing.invite_reminder': S('CYCLE', 'OUTING_MARKETING', true),
  'outing.unplaced': S('CYCLE', 'OUTING_MARKETING'),
  'outing.formed': S('CYCLE', 'OUTING_MARKETING'),
  'outing.confirmed': S('CYCLE', 'OUTING_TRANSACTIONAL'),
  'outing.faces': S('CYCLE', 'OUTING_TRANSACTIONAL'),
  'votes.opened': S('CYCLE', 'VOTE'),
  'votes.reminder': S('CYCLE', 'VOTE', true),
  'votes.closed': S('CYCLE', 'VOTE'),
  'connection.friend': S('CYCLE', 'CONNECTION'),
  'connection.plus': S('CYCLE', 'CONNECTION'),
  'duo.matched': S('CYCLE', 'DUO'),
  'duo.unlocked': S('CYCLE', 'DUO'),
  'duo.exchange_ending': S('CYCLE', 'DUO', true),
  'duo.date_proposed': S('CYCLE', 'DUO'),
  'duo.date_confirmed': S('CYCLE', 'DUO'),
  'duo.date_reminder': S('CYCLE', 'DUO', true),
  'duo.deadline_soon': S('CYCLE', 'DUO', true),
  'duo.after_vote': S('CYCLE', 'DUO'),
  'duo.closed': S('CYCLE', 'DUO'),
  'team.member_joined': S('CYCLE', 'SYSTEM'),
} as const satisfies Record<string, PushKindSpec>;

export type PushKey = keyof typeof PUSH_KINDS;

export const isPushKey = (k: string): k is PushKey => Object.prototype.hasOwnProperty.call(PUSH_KINDS, k);

interface TemplateTexts {
  category: NotificationCategoryV5;
  fr: string;
  discreetFr: string;
  transactional: boolean;
}

const TEMPLATES = new Map<string, TemplateTexts>(NOTIFICATION_TEMPLATES_V5.filter((t) => t.category !== 'IN_APP' && !t.inAppOnly).map((t) => [t.templateKey, { category: t.category as NotificationCategoryV5, fr: t.fr, discreetFr: t.discreetFr, transactional: t.transactional }]));

/** Textes et catégorie d'une clé push (lève si le catalogue de contenu ne la connaît pas : vérifié par test). */
export function templateOf(key: PushKey): TemplateTexts {
  const t = TEMPLATES.get(key);
  if (!t) throw new Error(`template de notification absent du contenu : ${key}`);
  return t;
}

/** Catégorie (préférences) d'une clé push. */
export const categoryOf = (key: PushKey): NotificationCategoryV5 => templateOf(key).category;

/** Rang de priorité (0 = plus prioritaire) selon `[T] notifications.v5.priority`. */
export function priorityRank(key: PushKey, order: readonly NotificationPriorityClassV5[]): number {
  const i = order.indexOf(PUSH_KINDS[key].priority);
  return i < 0 ? order.length : i;
}
