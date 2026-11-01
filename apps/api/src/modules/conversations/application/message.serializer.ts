/** Sérialiseur explicite MessageView selon le lecteur (auteur vs destinataire). */
import type { MessageView } from '@blowy/api-contract';
import { visibleToRecipient } from '../domain/message-policy.js';
import type { MessageRow } from './ports/conversation.repository.js';

export function toMessageView(m: MessageRow, viewerId: string): MessageView | null {
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
    body: m.kind === 'SYSTEM' || warnedHidden ? null : m.body,
    systemTemplate: m.systemTemplate,
    warned: m.status === 'WARNED',
    seq: m.seq,
    createdAt: m.createdAt.toISOString(),
    publishedAt: m.publishedAt?.toISOString() ?? null,
    // Vocal : référence média seulement si le corps serait livré (ACL revérifiée au téléchargement).
    mediaId: m.kind === 'VOICE' && !warnedHidden ? m.mediaId : null,
  };
}
