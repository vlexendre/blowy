/**
 * Forme du contenu des pages légales. Un module par page et par langue (src/content/legal/<langue>/<page>.ts).
 *
 * Mise en forme dans les chaînes (rendue par src/lib/legal-render.ts) :
 * - **gras**
 * - [texte](@confidentialite#droits) : lien vers une page légale dans la même langue (ancre facultative) ;
 *   [texte](@index) : sommaire des pages légales ; [texte](https://…), [texte](tel:…) : liens directs.
 * - {{publisher.registration}} : champ de src/config/legal.ts ; {{email.support}} s'affiche en lien mailto.
 *   Tant qu'un champ vaut TODO, le paragraphe, l'élément de liste ou la ligne de tableau qui le cite n'est pas affiché.
 * - `requires: ['mediator.name']` sur un bloc : le bloc n'est affiché que si ces champs sont connus (pour une phrase
 *   d'annonce qui n'a de sens qu'avec la liste qui suit).
 */
import type { SubprocessorKey } from '../../config/legal';
import type { LegalSlug, Locale } from '../../i18n/legal';

type BlockBody =
  /** Titre de section ; `id` stable pour les ancres (même id dans toutes les langues). */
  | { h2: string; id?: string }
  | { h3: string; id?: string }
  | { p: string }
  | { ul: string[] }
  | { ol: string[] }
  /** Encadré. */
  | { note: string }
  /** Tableau ; la première colonne sert de titre de ligne sur mobile. */
  | { table: { head: string[]; rows: string[][] } }
  /** Tableau des sous-traitants : rôle décrit ici, prestataire et lieu lus dans la configuration. */
  | { subprocessors: { head: [string, string, string, string]; roles: Record<SubprocessorKey, string> } }
  /** Questions dépliables. */
  | { faq: { q: string; a: string[] }[] };

export type Block = BlockBody & {
  /** Champs (clés de src/config/legal.ts) sans lesquels ce bloc n'est pas affiché. */
  requires?: string[];
};

export interface LegalPage {
  /** Balise <title>. */
  title: string;
  /** Gros titre (h1). */
  heading: string;
  /** Méta description. */
  description: string;
  /** Chapeau sous le titre. */
  intro?: string;
  /** Encadré « En bref » en haut de page. */
  summary?: { title: string; items: string[] };
  /** Affiche un sommaire des sections (pages longues). */
  toc?: boolean;
  body: Block[];
}

/** Textes de l'interface commune aux pages légales, dans une langue. */
export interface LegalUi {
  /** Lien d'évitement. */
  skip: string;
  /** Bouton « télécharger » de la barre du haut. */
  download: string;
  updated: string;
  /** Bandeau en tête des traductions (absent en français). */
  translationNotice?: string;
  /** Libellé du lien vers la version française dans ce bandeau. */
  frenchVersion?: string;
  languageLabel: string;
  tocLabel: string;
  /** Titre de la liste des autres documents en bas de page. */
  otherDocs: string;
  /** aria-label de la navigation du pied de page. */
  footerLabel: string;
  footerLinks: { slug: LegalSlug | 'index'; label: string }[];
  index: { title: string; heading: string; description: string; intro: string; publisherTitle: string; publisherText: string };
  /** Libellé court de chaque page (listes, pied de page). */
  short: Record<LegalSlug, string>;
}

export type LegalPages = Record<LegalSlug, LegalPage>;
export type LegalBundle = { locale: Locale; ui: LegalUi; pages: LegalPages };
