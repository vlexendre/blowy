/** Les cinq guides (docs/SEO.md §3), dans l'ordre de la liste. */
import { GUIDE_SLUGS, type GuidePage, type GuideSlug } from './types';
import { adulte } from './guides/adulte';
import { timide } from './guides/timide';
import { nouvelleVille } from './guides/nouvelle-ville';
import { seul } from './guides/seul';
import { associations } from './guides/associations';

export const GUIDES: Record<GuideSlug, GuidePage> = {
  'se-faire-des-amis-adulte': adulte,
  'se-faire-des-amis-timide': timide,
  'se-faire-des-amis-nouvelle-ville': nouvelleVille,
  'rencontrer-des-gens-seul': seul,
  'associations-activites-rencontrer-du-monde': associations,
};
export const GUIDE_LIST: readonly GuidePage[] = GUIDE_SLUGS.map((s) => GUIDES[s]);
export const guidePath = (slug: GuideSlug): string => `/guides/${slug}/`;
