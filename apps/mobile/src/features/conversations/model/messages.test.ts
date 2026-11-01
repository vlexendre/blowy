import type { MessageView } from '@blowy/api-contract';
import { describe, expect, it } from 'vitest';
import { bubbleFor, mergeMessages } from './messages';

const m = (o: Partial<MessageView>): MessageView => ({
  id: 'm1', conversationId: 'c', clientMessageId: null, kind: 'TEXT', mine: false, status: 'PUBLISHED', body: 'salut', systemTemplate: null, warned: false, seq: 1, createdAt: '2026-11-01T10:00:00Z', publishedAt: null, mediaId: null, ...o,
});

describe('messages', () => {
  it('avertissement : masqué pour le destinataire jusqu’à « Afficher quand même »', () => {
    const w = m({ status: 'WARNED', warned: true, body: null });
    expect(bubbleFor(w, new Set()).kind).toBe('warned-hidden');
    expect(bubbleFor({ ...w, body: 'x' }, new Set(['m1'])).kind).toBe('warned-revealed');
  });
  it('statuts de l’auteur : en vérification / refusé', () => {
    expect(bubbleFor(m({ mine: true, status: 'PENDING_MODERATION' }), new Set()).statusKey).toBe('chat.status.PENDING_MODERATION');
    expect(bubbleFor(m({ mine: true, status: 'REJECTED' }), new Set()).kind).toBe('failed');
  });
  it('envoi local jamais affiché « publié », dédupliqué par clientMessageId', () => {
    const local = [{ clientMessageId: 'k1', body: 'yo', createdAt: Date.parse('2026-11-01T11:00:00Z'), state: 'queued' as const }];
    const out = mergeMessages([m({})], local, new Set());
    expect(out[0]?.kind).toBe('pending');
    expect(out[0]?.statusKey).toBe('chat.status.queued');
    const out2 = mergeMessages([m({}), m({ id: 'm2', mine: true, clientMessageId: 'k1', createdAt: '2026-11-01T11:00:01Z' })], local, new Set());
    expect(out2.filter((x) => x.key.startsWith('local:'))).toHaveLength(0);
  });
});
