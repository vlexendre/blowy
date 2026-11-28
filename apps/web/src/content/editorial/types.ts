/**
 * Pages éditoriales du site (docs/SEO.md §3) : pages villes (« Se faire des amis à Paris ») et guides. En français
 * seulement (le marché de lancement) : pas de version traduite, pas de hreflang, donc hors de `siteDictionaries`.
 *
 * Mise en forme des textes (rendue par `lib/editorial-render.ts`, tout le reste est échappé) :
 * `**gras**` et `[texte](/chemin/ ou https://…)`. Pas de HTML.
 *
 * Règles d'écriture : tutoiement, ton de la marque, rien d'inventé (pas d'adresse précise, pas de chiffre sans source,
 * les sources des guides sont listées dans `sources`). Chaque ville a son propre texte : pas de gabarit où seul le nom
 * change (contrôle de similarité : `scripts/editorial-similarity.mjs`).
 */

/** Un bloc de texte d'une section. */
export type Block =
  /** paragraphe */
  | string
  | { list: readonly string[]; ordered?: boolean }
  | { h3: string }
  /** encadré */
  | { note: string };

export interface Section {
  title: string;
  blocks: readonly Block[];
}

export interface Faq {
  q: string;
  a: string;
}

export interface ImageRef {
  src: string;
  width: number;
  height: number;
  alt: string;
}

export interface Meta {
  /** ≤ 60 caractères */
  title: string;
  /** ≤ 155 caractères */
  description: string;
}

/** Aperçu de lien généré (scripts/site-images : `--og-pages`) : lignes du titre en capitales. */
export interface OgSpec {
  lines: readonly string[];
  /** fond (palette des aperçus) */
  panel: 'accent' | 'violet' | 'coral' | 'rose' | 'orange' | 'night' | 'wine';
}

export const CITY_SLUGS = [
  'paris', 'lyon', 'bordeaux', 'toulouse', 'nantes', 'lille', 'marseille', 'rennes', 'montpellier', 'nice', 'strasbourg', 'toulon', 'reims', 'saint-etienne', 'le-havre', 'villeurbanne', 'dijon', 'angers', 'grenoble',
  'bruxelles', 'liege', 'geneve', 'lausanne', 'luxembourg',
] as const;
export type CitySlug = (typeof CITY_SLUGS)[number];

/** Pays d'une page ville : la France, puis les villes francophones voisines (section à part sur /se-faire-des-amis/). */
export type CityCountry = 'fr' | 'be' | 'ch' | 'lu';

export interface CityPage {
  slug: CitySlug;
  /** nom affiché (« Paris ») */
  name: string;
  country: CityCountry;
  meta: Meta;
  h1: string;
  /** chapeau sous le titre */
  lead: string;
  /** requêtes visées (données DataForSEO, docs/SEO.md §2) : pour le suivi, pas affichées */
  keywords: readonly string[];
  /** quartiers, lieux, occasions : propre à la ville */
  sections: readonly Section[];
  /** ce que Minimoa change, dit pour cette ville */
  minimoa: Section;
  /**
   * « Ouvre ton quartier » : texte et zones de `@blowy/domain` (une seule : compteur ; plusieurs : liste ; aucune, pour
   * une ville sans zone : simple lien vers /quartier/, jamais de zone inventée)
   */
  quartier: { text: string; zones: readonly string[] };
  faq: readonly Faq[];
  /** trois villes proches (maillage) */
  near: readonly [CitySlug, CitySlug, CitySlug];
  /** guides mis en avant */
  guides: readonly GuideSlug[];
  image: ImageRef;
  og: OgSpec;
  /** date de dernière mise à jour (AAAA-MM-JJ) */
  updated: string;
}

export const GUIDE_SLUGS = [
  'se-faire-des-amis-adulte',
  'se-faire-des-amis-timide',
  'se-faire-des-amis-nouvelle-ville',
  'rencontrer-des-gens-seul',
  'associations-activites-rencontrer-du-monde',
  'application-pour-se-faire-des-amis',
  'rencontrer-des-gens-pres-de-chez-soi',
] as const;
export type GuideSlug = (typeof GUIDE_SLUGS)[number];

export interface Source {
  /** auteurs, titre, revue ou éditeur, année */
  label: string;
  url: string;
}

export interface GuidePage {
  slug: GuideSlug;
  meta: Meta;
  h1: string;
  /** titre court (cartes, fil d'Ariane) */
  short: string;
  lead: string;
  keywords: readonly string[];
  sections: readonly Section[];
  faq: readonly Faq[];
  sources: readonly Source[];
  related: readonly GuideSlug[];
  image: ImageRef;
  og: OgSpec;
  published: string;
  updated: string;
}

/**
 * Page éditoriale en néerlandais pour la Flandre (/nl/vrienden-maken/) : une seule langue, canonique, sans hreflang
 * (pas d'équivalent dans les autres langues). Mêmes règles d'écriture que les pages villes ; textes de l'interface
 * compris, puisque le gabarit est en français.
 */
export interface BuurtPage {
  path: string;
  meta: Meta;
  h1: string;
  lead: string;
  keywords: readonly string[];
  sections: readonly Section[];
  minimoa: Section;
  faq: readonly Faq[];
  image: ImageRef;
  og: OgSpec;
  /** alternatieve tekst van de linkpreview */
  ogAlt: string;
  updated: string;
  ui: {
    home: string;
    breadcrumbLabel: string;
    crumb: string;
    faqTitle: string;
    /** encadré de fin : quiz, quartier, landing */
    cta: { title: string; text: string; quiz: string; quartier: string; home: string };
    updated: string;
    /** pied de page des pages en néerlandais */
    footer: { label: string; link: string };
  };
}

/**
 * Article du blog (/blog/<slug>/) : une actualité (étude, fête, saison, événement d'une ville) reliée à la façon de
 * rencontrer du monde, et toujours à Minimoa. Une publication par jour au plus ; mêmes règles d'écriture que les guides
 * (sources vérifiées, chiffre → source). `essentiel` : 3 à 5 phrases autonomes en tête d'article, que les moteurs et les
 * assistants peuvent citer telles quelles (GEO).
 */
export interface BlogPost {
  /** minuscules, chiffres et tirets */
  slug: string;
  meta: Meta;
  h1: string;
  /** titre court (cartes, fil d'Ariane) */
  short: string;
  lead: string;
  /** l'actualité de départ, en une ligne (« Fête des Lumières, Lyon, 5-8 décembre 2026 ») */
  news: string;
  /** « L'essentiel » : 3 à 5 phrases qui se comprennent seules */
  essentiel: readonly string[];
  keywords: readonly string[];
  sections: readonly Section[];
  faq: readonly Faq[];
  sources: readonly Source[];
  /** guides liés (au moins 1) */
  guides: readonly GuideSlug[];
  /** villes concernées (cartes en fin d'article) */
  cities: readonly CitySlug[];
  image: ImageRef;
  og: OgSpec;
  published: string;
  updated: string;
}
