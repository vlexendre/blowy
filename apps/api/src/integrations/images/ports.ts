/**
 * Traitement d'image côté serveur. Une seule opération : la vignette très floue d'une photo de profil, seule image
 * envoyée aux personnes sans lien noué (docs/ADA-2027.md, décision 7). Elle doit être impossible à reconnaître :
 * la photo est d'abord réduite à quelques pixels (l'information perdue ne revient pas), puis floutée et agrandie.
 */
export interface ImageProcessor {
  /** Vignette floue (JPEG, carrée, `BLURRED_SIDE` px) ; null si l'image ne se lit pas (format inconnu, fichier abîmé). */
  blurredThumbnail(input: Buffer): Promise<Buffer | null>;
  /**
   * Essai au démarrage : une petite image fabriquée en mémoire passe par `blurredThumbnail`. Rend l'état, aussi lisible
   * ensuite par `status()` (`GET /health`).
   */
  selfCheck(): Promise<ImagesStatus>;
  /** `unchecked` tant que `selfCheck` n'a pas fini. */
  status(): ImagesStatus;
}

/** État du traitement d'image : `failed` = le module natif (sharp) ne marche pas, aucune vignette ne se fera. */
export type ImagesStatus = 'ok' | 'failed' | 'unchecked';

/** Côté de la vignette livrée (px). Petite : elle s'affiche dans des disques de 30 à 64 pt, déjà floue. */
export const BLURRED_SIDE = 64;
/** Côté de la copie réduite d'où naît la vignette : tout détail plus fin qu'un douzième du visage est perdu. */
export const BLURRED_SOURCE_SIDE = 12;
export const BLURRED_CONTENT_TYPE = 'image/jpeg';
