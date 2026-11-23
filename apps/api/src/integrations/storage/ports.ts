/** Ticket d'envoi direct vers le stockage (l'app envoie le fichier sans passer par l'API). */
export interface UploadTicket {
  path: string;
  uploadUrl: string;
  token: string;
}

/** Un fichier lu ou écrit par l'API elle-même (vignettes floues des photos de profil). */
export interface StoredBytes {
  bytes: Buffer;
  contentType: string;
}

/** Stockage privé des médias (compartiment `media`). */
export interface Storage {
  createUploadTicket(path: string): Promise<UploadTicket>;
  signedUrl(path: string, seconds: number): Promise<string>;
  /**
   * URL de lecture signées, en un seul appel, dans l'ordre de `paths` ; null pour un fichier absent (jamais d'erreur
   * pour un fichier manquant : c'est ainsi que l'API sait qu'une vignette n'existe pas encore).
   */
  signedUrls(paths: readonly string[], seconds: number): Promise<(string | null)[]>;
  remove(paths: readonly string[]): Promise<void>;
  exists(path: string): Promise<boolean>;
  /** Contenu d'un fichier (usage interne de l'API) ; null s'il n'existe pas. */
  read(path: string): Promise<StoredBytes | null>;
  /** Écrit (ou remplace) un fichier produit par l'API. */
  write(path: string, file: StoredBytes): Promise<void>;
  /**
   * Chemins complets des fichiers rangés directement dans le dossier `folder` (sans « / » final, sans sous-dossiers) :
   * `list('avatars/<personne>')` → `['avatars/<personne>/<id>.jpg', …]`. Sert à effacer tout ce qu'une personne a laissé
   * (suppression du compte, anciennes photos de profil). Dossier absent : liste vide.
   */
  list(folder: string): Promise<string[]>;
}

/** Durée de validité des URL de lecture. */
export const MEDIA_URL_SECONDS = 3600;

export const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
};

/** URL publique de l'API, connue seulement après l'écoute quand le port est choisi par le système. */
export interface PublicUrl {
  current: string;
}
