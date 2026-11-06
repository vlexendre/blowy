/** Entrée de référentiel traduisible : clé i18n stable + texte français de référence. */
export interface I18nEntry<Id extends string = string> {
  id: Id;
  key: string;
  fr: string;
}

export const CONTENT_VERSION = 'content-2026.12.0';

/** Variables de template autorisées (aucun code arbitraire). */
/** V5 : + prenom (prénom d'une personne déjà visible), jour, heure, quartier. */
export const TEMPLATE_VARIABLES = ['autrePet', 'lieu', 'souvenir', 'pet', 'nombre', 'prenom', 'jour', 'heure', 'quartier', 'moment', 'repere', 'responsable'] as const;
/** Seule variable autorisée dans une variante discrète (§9.3). */
export const DISCREET_TEMPLATE_VARIABLES = ['heure'] as const;
export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];
