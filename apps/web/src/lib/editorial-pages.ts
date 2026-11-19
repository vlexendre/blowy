/** Pages éditoriales : chemins (plan du site), comptes de mots et textes bruts (contrôles, temps de lecture). */
import type { BlogPost, BuurtPage, CityPage, GuidePage } from '../content/editorial/types';
import { CITY_LIST, cityPath } from '../content/editorial/villes';
import { GUIDE_LIST, guidePath } from '../content/editorial/guides';
import { BLOG_LIST, blogPath } from '../content/editorial/blog';
import { editorialUi } from '../content/editorial/ui';
import { vriendenMaken } from '../content/editorial/nl/vrienden-maken';
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

/** Textes lus d'un article du blog (chapeau, essentiel, sections, FAQ). */
export function blogTexts(p: BlogPost): string[] {
  return [p.lead, ...p.essentiel, ...p.sections.flatMap((s) => [s.title, ...blockTexts(s.blocks)]), ...p.faq.flatMap((f) => [f.q, f.a])];
}

/** Textes lus de la page néerlandaise (chapeau, sections, Minimoa, FAQ). */
export function buurtTexts(p: BuurtPage): string[] {
  return [p.lead, ...p.sections.flatMap((s) => [s.title, ...blockTexts(s.blocks)]), p.minimoa.title, ...blockTexts(p.minimoa.blocks), ...p.faq.flatMap((f) => [f.q, f.a])];
}

export const buurtWords = (p: BuurtPage): number => wordCount(buurtTexts(p));
export const cityWords = (c: CityPage): number => wordCount(cityTexts(c));
export const guideWords = (g: GuidePage): number => wordCount(guideTexts(g));
export const blogWords = (p: BlogPost): number => wordCount(blogTexts(p));

/** Plan du site : pages éditoriales (une seule langue chacune, sans alternates), avec leur date de mise à jour. */
export function editorialSitemap(): { path: string; lastmod: string }[] {
  const latest = (dates: string[]) => dates.reduce((a, b) => (a > b ? a : b));
  return [
    { path: editorialUi.cities.path, lastmod: latest(CITY_LIST.map((c) => c.updated)) },
    ...CITY_LIST.map((c) => ({ path: cityPath(c.slug), lastmod: c.updated })),
    { path: editorialUi.guides.path, lastmod: latest(GUIDE_LIST.map((g) => g.updated)) },
    ...GUIDE_LIST.map((g) => ({ path: guidePath(g.slug), lastmod: g.updated })),
    ...(BLOG_LIST.length ? [{ path: editorialUi.blog.path, lastmod: latest(BLOG_LIST.map((p) => p.updated)) }] : []),
    ...BLOG_LIST.map((p) => ({ path: blogPath(p.slug), lastmod: p.updated })),
    { path: vriendenMaken.path, lastmod: vriendenMaken.updated },
  ];
}
