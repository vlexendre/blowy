/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** URL de base de l'API Minimoa (sans /v1). Défaut : http://localhost:3000 */
  readonly PUBLIC_API_URL?: string;
  /** Fiche App Store (https://apps.apple.com/…). Absente : « Bientôt sur App Store », sans lien. */
  readonly PUBLIC_APP_STORE_URL?: string;
  /** Fiche Google Play (https://play.google.com/…). Absente : « Bientôt sur Google Play », sans lien. */
  readonly PUBLIC_PLAY_STORE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
