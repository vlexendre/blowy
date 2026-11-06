/** Sérialiseur explicite MessageView selon le lecteur (auteur vs destinataire). */
import type { MessageView } from '@blowy/api-contract';
import { visibleToRecipient } from '../domain/message-policy.js';
import { maskPhones } from '../domain/phone-mask.js';
import type { MessageAuthorView } from '../../../shared/application/ports/message-author.port.js';
import type { MessageRow } from './ports/conversation.repository.js';

/** `maskPhones` : visages pas encore révélés dans ce chat (V5.8 §3) — numéros masqués pour les destinataires. */
export function toMessageView(m: MessageRow, viewerId: string, authors: ReadonlyMap<string, MessageAuthorView> | null = null, maskPhonesForRecipient = false): MessageView | null {
  const mine = m.authorUserId === viewerId;
  if (!mine && m.kind !== 'SYSTEM' && !visibleToRecipient(m.status)) return null;
  const warnedHidden = !mine && m.status === 'WARNED' && !m.revealedByViewer;
  return {
    id: m.id,
    conversationId: m.conversationId,
    clientMessageId: mine ? m.clientMessageId : null,
    kind: m.kind,
    mine,
    status: m.status,
    // V5.7 (E30) : seul message système avec un texte — l'accueil écrit par le lieu (`system.venue_welcome`).
    body: (m.kind === 'SYSTEM' && m.systemTemplate !== 'system.venue_welcome') || warnedHidden ? null : !mine && maskPhonesForRecipient && m.kind === 'TEXT' && m.body ? maskPhones(m.body) : m.body,
    systemTemplate: m.systemTemplate,
    warned: m.status === 'WARNED',
    seq: m.seq,
    createdAt: m.createdAt.toISOString(),
    publishedAt: m.publishedAt?.toISOString() ?? null,
    // Vocal : référence média seulement si le corps serait livré (ACL revérifiée au téléchargement).
    mediaId: m.kind === 'VOICE' && !warnedHidden ? m.mediaId : null,
    // V5 chat de sortie : auteur par son pet (prénom à partir de la confirmation).
    ...(!mine && m.kind !== 'SYSTEM' && m.authorUserId && authors?.get(m.authorUserId) ? { author: authors.get(m.authorUserId)! } : {}),
  };
}
