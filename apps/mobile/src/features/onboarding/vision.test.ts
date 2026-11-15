import { VISION_AXES, VISION_TEST } from '@blowy/domain';
import { describe, expect, it } from 'vitest';

import { axisOfQuestion, choiceDirection, surenessOf, VISION_EMOJI, visionNow } from './vision';

describe('test de vision (inscription)', () => {
  it('chaque situation du domaine a ses deux pictogrammes et un axe visé', () => {
    for (const q of VISION_TEST) {
      expect(VISION_EMOJI[q.id]).toHaveLength(2);
      expect(VISION_AXES).toContain(axisOfQuestion(q.id));
    }
  });

  it('le sens d’une réponse suit l’effet sur l’axe visé', () => {
    expect(axisOfQuestion('enfants')).toBe('foyer');
    expect(choiceDirection('enfants', 0)).toBe(1);
    expect(choiceDirection('enfants', 1)).toBe(-1);
    expect(axisOfQuestion('mutation')).toBe('ancrage');
  });

  it('ta vision bouge avec les réponses, sans réponse elle reste au centre', () => {
    expect(visionNow([]).foyer).toEqual({ value: 0, confidence: 0 });
    const v = visionNow([
      { questionId: 'enfants', choice: 0 },
      { questionId: 'appartement', choice: 0 },
    ]);
    expect(v.foyer.value).toBeGreaterThan(50);
    expect(v.foyer.confidence).toBeGreaterThan(0);
  });

  it('la confiance se dit en trois mots', () => {
    expect(surenessOf(70)).toBe('sure');
    expect(surenessOf(40)).toBe('fairly');
    expect(surenessOf(10)).toBe('refine');
  });
});
