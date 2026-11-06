import type { MatchFeed } from '@blowy/api-contract';
import { describe, expect, it } from 'vitest';
import { paywallHeadline, unlockedIndexes } from './proposals';

const pet = { id: '00000000-0000-4000-8000-000000000001', name: 'Suzie', species: 'SUZIE' as const, stage: 'YOUNG' as const, vision: null, pose: 'JOYFUL' as const };
const feed = (scores: number[]): MatchFeed => ({
  items: scores.map((s, i) => ({ id: `p${i}`, kind: 'STRONG', visionScore: s, otherPet: pet, expiresAt: '2026-11-03T00:00:00Z', acceptedByMe: false })),
  emptyReason: null,
  nextBatchAt: null,
});

describe('propositions', () => {
  it('« N rencontres à découvrir » avec N réel, jamais « veulent le rencontrer » inventé', () => {
    expect(paywallHeadline(feed([80, 70]))).toEqual({ kind: 'discover', count: 2 });
    expect(paywallHeadline(feed([]))).toEqual({ kind: 'generic' });
    expect(paywallHeadline(undefined)).toEqual({ kind: 'generic' });
  });
  it('gratuit : seule la meilleure proposition est déverrouillée', () => {
    expect([...unlockedIndexes(feed([70, 87, 78]), 1)]).toEqual(['p1']);
  });
});
