import { describe, expect, it } from 'vitest';
import { hashPayload } from '../../src/shared/application/command-bus.js';
import { decodeProjectionCursor, encodeProjectionCursor } from '../../src/shared/application/projection.js';
import { canTransition, visibleToRecipient } from '../../src/modules/conversations/domain/message-policy.js';
import { toMessageView } from '../../src/modules/conversations/application/message.serializer.js';
import { resolveBranch } from '../../src/modules/relationships/domain/branch-vote.js';
import { capabilitiesOf } from '../../src/modules/relationships/domain/capabilities.js';
import { ageOn, parseCivilDate } from '../../src/modules/users/domain/age.js';
import { remainingPauseDays } from '../../src/modules/users/domain/pause.js';
import { LocalModerationGateway } from '../../src/modules/conversations/infrastructure/local-moderation.gateway.js';

describe('règles de domaine backend', () => {
  it('hash canonique du payload (ordre des clés indifférent)', () => {
    expect(hashPayload({ a: 1, b: { c: 2, d: 3 } })).toBe(hashPayload({ b: { d: 3, c: 2 }, a: 1 }));
    expect(hashPayload({ a: 1 })).not.toBe(hashPayload({ a: 2 }));
  });
  it('curseur de projection opaque et réversible', () => {
    expect(decodeProjectionCursor(encodeProjectionCursor(42))).toBe(42);
    expect(decodeProjectionCursor('nimporte-quoi')).toBe(0);
  });
  it('machine d’états de modération', () => {
    expect(canTransition('PENDING_MODERATION', 'PUBLISHED')).toBe(true);
    expect(canTransition('REJECTED', 'PUBLISHED')).toBe(false);
    for (const s of ['PENDING_MODERATION', 'QUARANTINED', 'REJECTED', 'HUMAN_REVIEW', 'PROCESSING_FAILED'] as const) expect(visibleToRecipient(s)).toBe(false);
  });
  it('sérialiseur : destinataire ne reçoit jamais un message masqué ; warned sans corps', () => {
    const base = { id: 'm', conversationId: 'c', authorUserId: 'a', clientMessageId: 'x', kind: 'TEXT' as const, seq: 1, systemTemplate: null, body: 'secret', createdAt: new Date(), publishedAt: null, revealedByViewer: false, mediaId: null };
    expect(toMessageView({ ...base, status: 'PENDING_MODERATION' }, 'b')).toBeNull();
    expect(toMessageView({ ...base, status: 'REJECTED' }, 'b')).toBeNull();
    expect(toMessageView({ ...base, status: 'WARNED' }, 'b')!.body).toBeNull();
    expect(toMessageView({ ...base, status: 'WARNED', revealedByViewer: true }, 'b')!.body).toBe('secret');
    expect(toMessageView({ ...base, status: 'REJECTED' }, 'a')!.body).toBe('secret');
    expect(toMessageView({ ...base, status: 'PUBLISHED' }, 'b')!.clientMessageId).toBeNull();
  });
  it('vote : Plus seulement si les deux ; échéance → Ami', () => {
    expect(resolveBranch(['PLUS'], 2, false)).toBeNull();
    expect(resolveBranch(['PLUS', 'PLUS'], 2, false)).toBe('PLUS');
    expect(resolveBranch(['PLUS', 'FRIEND'], 2, false)).toBe('FRIEND');
    expect(resolveBranch(['PLUS'], 2, true)).toBe('FRIEND');
  });
  it('capacités : photo jamais avant N4 ni avec NEVER ; pause suspend XP', () => {
    const base = { status: 'ACTIVE' as const, branch: 'PLUS' as const, paused: false, photosAllowedByBoth: true, movedIn: true };
    expect(capabilitiesOf({ ...base, reachedLevel: 3 })).not.toContain('PHOTO_BLURRED');
    expect(capabilitiesOf({ ...base, reachedLevel: 4 })).toContain('PHOTO_BLURRED');
    expect(capabilitiesOf({ ...base, reachedLevel: 7, photosAllowedByBoth: false })).not.toContain('PHOTO_ORIGINAL');
    expect(capabilitiesOf({ ...base, reachedLevel: 2, paused: true })).not.toContain('XP_GAIN');
    expect(capabilitiesOf({ ...base, reachedLevel: 2, status: 'ENDED' })).toEqual([]);
  });
  it('âge civil et pauses', () => {
    expect(ageOn(parseCivilDate('2008-11-02')!, { y: 2026, m: 11, d: 1 })).toBe(17);
    expect(ageOn(parseCivilDate('2008-11-01')!, { y: 2026, m: 11, d: 1 })).toBe(18);
    expect(parseCivilDate('2026-02-30')).toBeNull();
    const d = (s: string) => new Date(s);
    expect(remainingPauseDays([{ startsAt: d('2026-11-01'), endsAt: d('2026-11-11'), endedAt: null }])).toBe(4);
  });
  it('modération locale déterministe : coordonnées → WARN (pas REJECT), panne → erreur', async () => {
    const g = new LocalModerationGateway(false);
    expect((await g.moderateText({ text: 'appelle-moi au 06 12 34 56 78', conversationId: 'c', authorId: 'a' })).action).toBe('WARN');
    await expect(g.moderateText({ text: '[fail]', conversationId: 'c', authorId: 'a' })).rejects.toThrow();
    expect(() => new LocalModerationGateway(true)).toThrow();
  });
});
