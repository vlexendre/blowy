/**
 * Machine d'états de modération (§9.1) et règles de visibilité destinataire.
 * Aucune dépendance Nest/Prisma.
 */
export type MessageStatus = 'PENDING_MODERATION' | 'PUBLISHED' | 'WARNED' | 'QUARANTINED' | 'REJECTED' | 'HUMAN_REVIEW' | 'PROCESSING_FAILED' | 'WITHDRAWN';
export type ModerationAction = 'ALLOW' | 'WARN' | 'QUARANTINE' | 'REJECT' | 'HUMAN_REVIEW';

const TRANSITIONS: Record<MessageStatus, readonly MessageStatus[]> = {
  PENDING_MODERATION: ['PUBLISHED', 'WARNED', 'QUARANTINED', 'REJECTED', 'HUMAN_REVIEW', 'PROCESSING_FAILED'],
  PROCESSING_FAILED: ['PENDING_MODERATION', 'HUMAN_REVIEW'],
  HUMAN_REVIEW: ['PUBLISHED', 'WARNED', 'REJECTED', 'QUARANTINED'],
  PUBLISHED: ['WITHDRAWN'],
  WARNED: ['WITHDRAWN', 'PUBLISHED'],
  QUARANTINED: ['REJECTED', 'PUBLISHED'],
  REJECTED: [],
  WITHDRAWN: [],
};

export function canTransition(from: MessageStatus, to: MessageStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/**
 * Décision HUMAINE (correction, recours) : depuis tout statut décidé vers une issue décidée ;
 * retrait seulement d'un contenu visible. Jamais vers PENDING/DRAFT ; WITHDRAWN est final.
 */
export function canHumanTransition(from: MessageStatus, to: MessageStatus): boolean {
  if (from === 'WITHDRAWN' || from === to) return false;
  if (to === 'WITHDRAWN') return from === 'PUBLISHED' || from === 'WARNED';
  return ['PUBLISHED', 'WARNED', 'QUARANTINED', 'REJECTED'].includes(to);
}

export function statusForAction(a: ModerationAction): MessageStatus {
  switch (a) {
    case 'ALLOW':
      return 'PUBLISHED';
    case 'WARN':
      return 'WARNED';
    case 'QUARANTINE':
      return 'QUARANTINED';
    case 'REJECT':
      return 'REJECTED';
    case 'HUMAN_REVIEW':
      return 'HUMAN_REVIEW';
  }
}

/** Visible par le destinataire (sinon : jamais ni corps ni existence). */
export function visibleToRecipient(s: MessageStatus): boolean {
  return s === 'PUBLISHED' || s === 'WARNED';
}

/** Compte pour l'aller-retour XP : seulement PUBLISHED (WARNED n'attribue rien seul). */
export function countsForExchange(s: MessageStatus): boolean {
  return s === 'PUBLISHED';
}
