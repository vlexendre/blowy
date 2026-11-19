/**
 * Forme des textes de départ de Ton chemin, par langue (`texts.fr.ts` … `texts.nl.ts`). Clés : identifiants de
 * `catalogue.ts` ; `seed.test.ts` vérifie que chaque langue a chaque question, avec autant d'options.
 */
export interface SeedQuestionText {
  /** La question. */
  t: string;
  /** Amorce de conversation (« Demande-lui… ») : ne dit jamais ce que l'autre a répondu. */
  o: string;
  /** Par option : [libellé, réaction du minimoa]. Curseur : bout gauche, bout droit. */
  a: [string, string][];
  /** Curseur : réaction quand il s'arrête au milieu. */
  m?: string;
}
/** Situations du test de vision (unité 1) : textes repris de `visionText` ; ici l'amorce et les réactions. */
export interface SeedLegacyText {
  o: string;
  r: [string, string];
}
export interface SeedTexts {
  units: Record<string, [title: string, subtitle: string]>;
  steps: Record<string, string>;
  q: Record<string, SeedQuestionText>;
  legacy: Record<string, SeedLegacyText>;
}
