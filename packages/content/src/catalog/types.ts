/** Entrée de référentiel traduisible : clé i18n stable + texte français de référence. */
export interface I18nEntry<Id extends string = string> {
  id: Id;
  key: string;
  fr: string;
}

export const CONTENT_VERSION = 'content-2026.11.0';

/** Variables de template autorisées (aucun code arbitraire). */
export const TEMPLATE_VARIABLES = ['autrePet', 'lieu', 'souvenir', 'pet', 'nombre'] as const;
export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];
