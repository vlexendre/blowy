/** Ticket d'envoi direct vers le stockage (l'app envoie le fichier sans passer par l'API). */
export interface UploadTicket {
  path: string;
  uploadUrl: string;
  token: string;
}

/** Stockage privé des médias (compartiment `media`). */
export interface Storage {
  createUploadTicket(path: string): Promise<UploadTicket>;
  signedUrl(path: string, seconds: number): Promise<string>;
  remove(paths: readonly string[]): Promise<void>;
  exists(path: string): Promise<boolean>;
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
