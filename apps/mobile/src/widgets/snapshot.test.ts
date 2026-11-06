import { describe, expect, it } from 'vitest';
import { buildWidgetSnapshot } from './snapshot';

const words = {
  mood: () => 'joyeux',
  streak: (d: number) => `${d} j`,
  waiting: (o: string, m: string) => `${o} attend ${m}`,
  empty: 'Crée ton pet',
};
const other = {
  id: 'b',
  name: 'Suzie',
  species: 'SUZIE' as const,
  stage: 'YOUNG' as const,
  vision: null,
  pose: 'JOYFUL' as const,
};
const rel = (
  o: Partial<{ otherPresence: 'HERE' | 'OUT'; myPetHere: boolean; paused: boolean }>,
) => ({
  id: 'r1',
  type: 'DATE' as const,
  status: 'ACTIVE' as const,
  otherPet: other,
  otherPresence: 'HERE' as const,
  myPetHere: false,
  paused: false,
  ...o,
});

describe('widget', () => {
  it('« X attend Y » seulement si l’autre est présent et le mien absent ; deep link vers ce rendez-vous', () => {
    const s = buildWidgetSnapshot({ name: 'Nino', pose: 'JOYFUL' }, 8, [rel({})], words);
    expect(s.waitingLabel).toBe('Suzie attend Nino');
    expect(s.url).toBe('blowy://widget/date/r1');
    expect(
      buildWidgetSnapshot({ name: 'Nino', pose: 'JOYFUL' }, 8, [rel({ myPetHere: true })], words)
        .waitingLabel,
    ).toBeNull();
    expect(
      buildWidgetSnapshot(
        { name: 'Nino', pose: 'JOYFUL' },
        8,
        [rel({ otherPresence: 'OUT' })],
        words,
      ).waitingLabel,
    ).toBeNull();
    expect(
      buildWidgetSnapshot({ name: 'Nino', pose: 'JOYFUL' }, 8, [rel({ paused: true })], words)
        .waitingLabel,
    ).toBeNull();
  });
  it('aucune donnée humaine : seulement des champs pet/série', () => {
    const s = buildWidgetSnapshot({ name: 'Nino', pose: 'JOYFUL' }, 0, [], words);
    expect(Object.keys(s).sort()).toEqual([
      'emptyLabel',
      'moodLabel',
      'petName',
      'streakLabel',
      'url',
      'waitingLabel',
    ]);
    expect(s.streakLabel).toBeNull();
    expect(buildWidgetSnapshot(null, null, [], words).petName).toBe('');
  });
});
