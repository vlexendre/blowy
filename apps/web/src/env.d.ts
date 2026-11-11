/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** URL de base de l'API Blowy (sans /v1). Défaut : http://localhost:3000 */
  readonly PUBLIC_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
