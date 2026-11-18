/** Les onze pages villes, dans l'ordre de la liste (volume de recherche, docs/SEO.md §2). */
import { CITY_SLUGS, type CityPage, type CitySlug } from './types';
import { paris } from './villes/paris';
import { lyon } from './villes/lyon';
import { bordeaux } from './villes/bordeaux';
import { toulouse } from './villes/toulouse';
import { nantes } from './villes/nantes';
import { lille } from './villes/lille';
import { marseille } from './villes/marseille';
import { rennes } from './villes/rennes';
import { montpellier } from './villes/montpellier';
import { nice } from './villes/nice';
import { strasbourg } from './villes/strasbourg';

export const CITIES: Record<CitySlug, CityPage> = { paris, lyon, bordeaux, toulouse, nantes, lille, marseille, rennes, montpellier, nice, strasbourg };
export const CITY_LIST: readonly CityPage[] = CITY_SLUGS.map((s) => CITIES[s]);
export const cityPath = (slug: CitySlug): string => `/se-faire-des-amis/${slug}/`;
