/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** URL de base de l'API Minimoa (sans /v1). Défaut : http://localhost:3000 */
  readonly PUBLIC_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
