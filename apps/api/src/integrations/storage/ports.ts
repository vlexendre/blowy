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
   * Fichiers rangés directement dans le dossier `folder` (sans « / » final, sans sous-dossiers), chemin complet et date
   * de création : `list('avatars/<personne>')` → `[{ path: 'avatars/<personne>/<id>.jpg', createdAt }, …]`. Sert à
   * effacer tout ce qu'une personne a laissé (suppression du compte, anciennes photos de profil, ménage des orphelins).
   * Dossier absent : liste vide.
   */
  list(folder: string): Promise<ListedFile[]>;
  /**
   * Sous-dossiers rangés directement dans `folder`, chemins complets : `listFolders('avatars')` →
   * `['avatars/<personne>', …]`, triés. Sert au ménage des dossiers orphelins (`OrphanMediaJobs`). Dossier absent : liste
   * vide.
   */
  listFolders(folder: string): Promise<string[]>;
}

/** Un fichier listé par `Storage.list`. */
export interface ListedFile {
  path: string;
  /** Date de création (ISO) ; null si le stockage ne la donne pas : le fichier est alors tenu pour récent. */
  createdAt: string | null;
}

/**
 * Âge sous lequel un fichier des dossiers de photos de profil n'est jamais effacé par un ménage : la durée du ticket
 * d'envoi (Supabase : deux heures). Un envoi en cours, pas encore confirmé, survit ainsi à un ménage concurrent.
 */
export const UPLOAD_GRACE_MS = 2 * 3_600_000;

/** Vrai si le fichier a moins de `UPLOAD_GRACE_MS` à `now` (ou une date inconnue) : un ménage n'y touche pas. */
export const isFresh = (file: ListedFile, now: Date): boolean =>
  file.createdAt === null || now.getTime() - new Date(file.createdAt).getTime() < UPLOAD_GRACE_MS;

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
