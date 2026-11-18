/** Pages éditoriales : chemins (plan du site), comptes de mots et textes bruts (contrôles, temps de lecture). */
import type { CityPage, GuidePage } from '../content/editorial/types';
import { CITY_LIST, cityPath } from '../content/editorial/villes';
import { GUIDE_LIST, guidePath } from '../content/editorial/guides';
import { editorialUi } from '../content/editorial/ui';
import { blockTexts, wordCount } from './editorial-render';

/** Tous les textes lus d'une page ville (chapeau, sections, encadrés, FAQ). */
export function cityTexts(c: CityPage): string[] {
  return [
    c.lead,
    ...c.sections.flatMap((s) => [s.title, ...blockTexts(s.blocks)]),
    c.minimoa.title,
    ...blockTexts(c.minimoa.blocks),
    c.quartier.text,
    ...c.faq.flatMap((f) => [f.q, f.a]),
  ];
}

export function guideTexts(g: GuidePage): string[] {
  return [g.lead, ...g.sections.flatMap((s) => [s.title, ...blockTexts(s.blocks)]), ...g.faq.flatMap((f) => [f.q, f.a])];
}

export const cityWords = (c: CityPage): number => wordCount(cityTexts(c));
export const guideWords = (g: GuidePage): number => wordCount(guideTexts(g));

/** Plan du site : pages éditoriales (français seulement), avec leur date de mise à jour. */
export function editorialSitemap(): { path: string; lastmod: string }[] {
  const latest = (dates: string[]) => dates.reduce((a, b) => (a > b ? a : b));
  return [
    { path: editorialUi.cities.path, lastmod: latest(CITY_LIST.map((c) => c.updated)) },
    ...CITY_LIST.map((c) => ({ path: cityPath(c.slug), lastmod: c.updated })),
    { path: editorialUi.guides.path, lastmod: latest(GUIDE_LIST.map((g) => g.updated)) },
    ...GUIDE_LIST.map((g) => ({ path: guidePath(g.slug), lastmod: g.updated })),
  ];
}
