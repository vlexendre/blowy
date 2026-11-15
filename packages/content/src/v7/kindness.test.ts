/**
 * Garde-fou « toujours positif » (domaine, `isKindText`) appliqué aux phrases écrites ici, langue par langue :
 * chaque modèle du bilan de la semaine et de la santé des liens passe le garde-fou de sa langue, et une phrase
 * clairement négative est refusée dans chaque langue.
 */
import { LINK_HEALTH_KEYS, LINK_NOTES, LOCALES, type Locale, REVIEW_HIGHLIGHTS, REVIEW_TIPS, VISION_AXES, isKindText } from '@blowy/domain';
import { describe, expect, it } from 'vitest';
import { chatLines } from './chat';
import { reviewDetailedAxisLine, reviewNoticedLine, rituelsText } from './rituels';

function templateLines(locale: Locale): string[] {
  const t = rituelsText.in(locale);
  const r = t.review;
  const counts = [0, 1, 2, 7, 21];
  const lines: string[] = [r.title, r.intro('Biscotte'), r.noticedSteady];
  for (const n of counts) {
    const vars = { petName: 'Biscotte', outings: n, habitsKept: n, challengesDone: n, streak: n };
    for (const h of REVIEW_HIGHLIGHTS) lines.push(r.highlight[h](vars));
    for (const note of LINK_NOTES) lines.push(r.link[note]('Léa', n));
    for (const level of [1, 4, 7]) lines.push(r.detailedLink('Léa', level, Math.min(n, 7)));
  }
  for (const tip of REVIEW_TIPS) lines.push(r.tip[tip]);
  for (const axis of VISION_AXES) {
    lines.push(reviewNoticedLine(locale, axis, 'up'), reviewNoticedLine(locale, axis, 'down'));
    for (const delta of [-30, -7, 0, 3, 12, 40]) lines.push(reviewDetailedAxisLine(locale, axis, delta));
  }
  for (const key of LINK_HEALTH_KEYS) lines.push(chatLines.health(locale, key, 'Léa'));
  // Phrases du minimoa sur les preuves et les sorties, lues avec le bilan.
  lines.push(...t.proofVerdictLines.yes, ...t.proofVerdictLines.unsure, ...t.selfCheckLines, ...Object.values(t.outing.reply));
  return lines;
}

/** Une phrase qui reproche, par langue (au moins trois façons différentes). */
const NEGATIVE: Readonly<Record<Locale, readonly string[]>> = {
  fr: ['Tu n’as pas assez bougé cette semaine.', 'Encore un échec, c’est dommage.', 'Il faut sortir plus.', 'Tu as négligé ton minimoa.'],
  en: [
    'You didn’t go out enough this week.',
    'Another failure. Too bad.',
    'You should have written to Léa.',
    'You neglected your minimoa, sadly.',
    'Only one outing? Disappointing.',
  ],
  es: ['No has salido lo suficiente esta semana.', 'Otro fracaso, qué pena.', 'Tienes que salir más.', 'Descuidaste a tu minimoa.', 'Solo una salida. Mal.'],
  pt: ['Você não saiu o suficiente esta semana.', 'Mais um fracasso, que pena.', 'Você precisa sair mais.', 'Esqueceu do seu minimoa.', 'Só uma saída. Ruim.'],
  nl: ['Je bent niet genoeg buiten geweest deze week.', 'Weer mislukt. Jammer.', 'Je moet vaker naar buiten.', 'Je hebt je minimoa verwaarloosd.', 'Maar één uitje, slechts één.'],
};

describe('garde-fou de positivité, dans chaque langue', () => {
  for (const locale of LOCALES) {
    it(`${locale} : tous les modèles du bilan et de la santé des liens passent`, () => {
      const lines = templateLines(locale);
      expect(lines.length).toBeGreaterThan(100);
      const refused = lines.filter((line) => !isKindText(line, locale));
      expect(refused).toEqual([]);
    });

    it(`${locale} : une phrase clairement négative est refusée`, () => {
      for (const line of NEGATIVE[locale]) expect(isKindText(line, locale), line).toBe(false);
    });
  }

  it('le garde-fou d’une langue vérifie bien cette langue (un reproche anglais n’est pas vu par la liste française)', () => {
    expect(isKindText('You didn’t go out enough.', 'fr')).toBe(true);
    expect(isKindText('You didn’t go out enough.', 'en')).toBe(false);
  });
});
