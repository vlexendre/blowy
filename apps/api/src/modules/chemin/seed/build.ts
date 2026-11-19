/**
 * Contenu de départ assemblé (forme + textes des 5 langues) : pour l'adaptateur mémoire et pour `chemin:seed`.
 * Les situations reprises du test de vision prennent leurs textes dans `visionText` (déjà traduits).
 */
import { visionText } from '@blowy/content';
import { LOCALES, type Locale } from '@blowy/domain';
import type { ByLocale, CheminContent, ContentQuestion, ContentScene, ContentUnit } from '../ports';
import { SEED_UNITS } from './catalogue';
import type { SeedTexts } from './texts';
import { en } from './texts.en';
import { es } from './texts.es';
import { fr } from './texts.fr';
import { nl } from './texts.nl';
import { pt } from './texts.pt';

export const SEED_TEXTS: Record<Locale, SeedTexts> = { fr, en, es, pt, nl };
const OPTION_IDS = ['a', 'b', 'c', 'd', 'e', 'f'];

const byLocale = <T>(make: (locale: Locale) => T): ByLocale<T> => Object.fromEntries(LOCALES.map((l) => [l, make(l)])) as ByLocale<T>;

/** Habillages de départ : jouables par toute app qui a Ton chemin. */
export const SEED_SCENES: ContentScene[] = [
  { id: 'hop', kind: 'transition', animation: 'hop', minBuild: 0, status: 'live' },
  { id: 'confetti', kind: 'end', animation: 'confetti', minBuild: 0, status: 'live' },
];

export function buildSeedContent(at: string): CheminContent {
  const units: ContentUnit[] = [];
  const questions: ContentQuestion[] = [];
  SEED_UNITS.forEach((u, ui) => {
    units.push({
      id: u.id,
      position: ui,
      icon: u.icon,
      minBuild: 0,
      status: 'live',
      texts: byLocale((l) => {
        const [title, subtitle] = SEED_TEXTS[l].units[u.id] ?? SEED_TEXTS.fr.units[u.id] ?? [u.id, ''];
        return { title, subtitle };
      }),
      steps: u.steps.map((s, si) => ({ id: s.id, unitId: u.id, position: si, status: 'live', texts: byLocale((l) => ({ title: SEED_TEXTS[l].steps[s.id] ?? s.id })) })),
      updatedAt: at,
    });
    for (const s of u.steps) {
      s.questions.forEach((q, qi) => {
        const legacy = q.legacyTestId;
        const textOf = (l: Locale): { text: string; opener: string; mid?: string } => {
          if (legacy) {
            const v = visionText.in(l).questions[legacy];
            return { text: v?.situation ?? legacy, opener: SEED_TEXTS[l].legacy[legacy]?.o ?? '' };
          }
          const t = SEED_TEXTS[l].q[q.id];
          return { text: t?.t ?? q.id, opener: t?.o ?? '', ...(t?.m ? { mid: t.m } : {}) };
        };
        const optionText = (l: Locale, i: number): { label: string; reaction: string } => {
          if (legacy) {
            const v = visionText.in(l).questions[legacy];
            return { label: v?.choices[i] ?? '', reaction: SEED_TEXTS[l].legacy[legacy]?.r[i] ?? '' };
          }
          const [label, reaction] = SEED_TEXTS[l].q[q.id]?.a[i] ?? ['', ''];
          return { label, reaction };
        };
        questions.push({
          id: q.id,
          stepId: s.id,
          position: qi,
          format: q.format,
          axis: q.axis,
          direction: 1,
          minBuild: 0,
          legacyTestId: legacy,
          status: 'live',
          texts: byLocale(textOf),
          options: q.options.map((o, oi) => ({
            id: OPTION_IDS[oi] ?? `o${oi}`,
            position: oi,
            icon: o.icon,
            weight: o.weight,
            tag: o.tag,
            animation: null,
            reactionMinBuild: 0,
            texts: byLocale((l) => optionText(l, oi)),
          })),
          updatedAt: at,
        });
      });
    }
  });
  return { units, questions, scenes: SEED_SCENES.map((s) => ({ ...s })) };
}
