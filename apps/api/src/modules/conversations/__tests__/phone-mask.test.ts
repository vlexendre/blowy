/** V5.8 (§3) : numéros masqués avant les visages — détection robuste, jamais une date, jamais un horaire. */
import { describe, expect, it } from 'vitest';
import { containsPhone, maskPhones, PHONE_MASK } from '../domain/phone-mask.js';
import { toMessageView } from '../application/message.serializer.js';

describe('masquage des numéros de téléphone', () => {
  it.each([
    '06 12 34 56 78',
    '0612345678',
    '06.12.34.56.78',
    '06-12-34-56-78',
    '+33 6 12 34 56 78',
    '+33612345678',
    '0033 6 12 34 56 78',
    '+33 (0)6 12 34 56 78',
    '0 6 1 2 3 4 5 6 7 8',
    '+44 7700 900123',
    '+1 (415) 555-0123',
    '07/12/34/56/78',
  ])('masque %s', (n) => {
    expect(maskPhones(`appelle-moi au ${n} !`)).toBe(`appelle-moi au ${PHONE_MASK} !`);
    expect(containsPhone(n)).toBe(true);
  });
  it.each(['On se voit à 19 h 30', 'le 2026-11-19', 'le 19/11/2026', 'code 0421', 'j’ai 3 chats et 2 chiens', 'rue 12, 75011 Paris'])('laisse « %s »', (t) => {
    expect(maskPhones(t)).toBe(t);
  });
  it('sérialisation : masqué pour les destinataires avant les visages, jamais pour l’auteur, jamais après', () => {
    const m = { id: 'm1', conversationId: 'c1', authorUserId: 'a', clientMessageId: 'x', kind: 'TEXT', status: 'PUBLISHED', body: 'mon 06 12 34 56 78', systemTemplate: null, seq: 1, createdAt: new Date(), publishedAt: new Date(), mediaId: null, revealedByViewer: false } as never;
    expect(toMessageView(m, 'b', null, true)!.body).toBe(`mon ${PHONE_MASK}`);
    expect(toMessageView(m, 'a', null, true)!.body).toBe('mon 06 12 34 56 78');
    expect(toMessageView(m, 'b', null, false)!.body).toBe('mon 06 12 34 56 78');
  });
});
