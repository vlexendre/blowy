/**
 * Fusion des messages serveur et des envois locaux (pure). Un message local reste un
 * brouillon/envoi en attente : il n'est jamais montré comme « publié » avant le serveur.
 */
import type { MessageView } from '@blowy/api-contract';

export interface LocalOutgoing {
  clientMessageId: string;
  body: string;
  createdAt: number;
  state: 'queued' | 'sending' | 'failed';
}

export type BubbleKind =
  'published' | 'pending' | 'failed' | 'warned-hidden' | 'warned-revealed' | 'system' | 'held';

export interface DisplayMessage {
  key: string;
  mine: boolean;
  body: string | null;
  kind: BubbleKind;
  /** Clé i18n du statut. */
  statusKey: string | null;
  systemTemplate: string | null;
  createdAt: string;
  messageId: string | null;
  /** V5.7 : auteur d'un message du chat de sortie (pet, puis prénom après la veille ; badge calme). */
  author?: MessageView['author'];
}

export function bubbleFor(m: MessageView, revealed: ReadonlySet<string>): DisplayMessage {
  const base = {
    key: m.id,
    mine: m.mine,
    createdAt: m.createdAt,
    messageId: m.id,
    systemTemplate: m.systemTemplate,
    author: m.author,
  };
  // V5.7 (E30) : `system.venue_welcome` est le seul message système avec un texte (celui du lieu).
  if (m.kind === 'SYSTEM')
    return {
      ...base,
      body: m.systemTemplate === 'system.venue_welcome' ? m.body : null,
      kind: 'system',
      statusKey: null,
    };
  if (m.status === 'WARNED' || m.warned) {
    if (m.mine)
      return { ...base, body: m.body, kind: 'published', statusKey: 'chat.status.WARNED' };
    return revealed.has(m.id) && m.body !== null
      ? { ...base, body: m.body, kind: 'warned-revealed', statusKey: null }
      : { ...base, body: null, kind: 'warned-hidden', statusKey: 'chat.status.WARNED' };
  }
  if (m.status === 'PUBLISHED')
    return {
      ...base,
      body: m.body,
      kind: 'published',
      statusKey: m.mine ? 'chat.status.PUBLISHED' : null,
    };
  // Statuts visibles par l'auteur uniquement.
  const failed = m.status === 'REJECTED' || m.status === 'PROCESSING_FAILED';
  return {
    ...base,
    body: m.body,
    kind: failed ? 'failed' : 'held',
    statusKey: `chat.status.${m.status}`,
  };
}

/**
 * Liste affichée (plus récent d'abord pour FlatList inversée) : serveur + envois locaux non
 * encore reconnus (dédupliqués par clientMessageId).
 */
export function mergeMessages(
  server: readonly MessageView[],
  local: readonly LocalOutgoing[],
  revealed: ReadonlySet<string>,
): DisplayMessage[] {
  const known = new Set(server.map((m) => m.clientMessageId).filter((x): x is string => !!x));
  const out: DisplayMessage[] = server.map((m) => bubbleFor(m, revealed));
  for (const l of local) {
    if (known.has(l.clientMessageId)) continue;
    out.push({
      key: `local:${l.clientMessageId}`,
      mine: true,
      body: l.body,
      kind: l.state === 'failed' ? 'failed' : 'pending',
      statusKey:
        l.state === 'queued'
          ? 'chat.status.queued'
          : l.state === 'sending'
            ? 'chat.status.sending'
            : 'chat.status.PROCESSING_FAILED',
      systemTemplate: null,
      createdAt: new Date(l.createdAt).toISOString(),
      messageId: null,
    });
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
