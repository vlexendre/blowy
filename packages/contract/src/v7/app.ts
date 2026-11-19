/**
 * Contrat « versions de l'app » (docs/VERSIONING.md). L'app dit qui elle est sur chaque requête (en-têtes
 * `APP_HEADERS`) ; l'API dit quels builds elle sert encore (`GET /v1/app/config`, public) et répond
 * `426 app_update_required` à un build sous le minimum. Ne dépend que de zod et du domaine.
 */
import { APP_PLATFORMS } from '@blowy/domain';
import { z } from 'zod';

const API = '/v1';

/** En-têtes envoyés par l'app sur chaque requête (en minuscules : Node les range ainsi). */
export const APP_HEADERS = {
  /** Version marketing (« 1.0.0 »). */
  version: 'x-app-version',
  /** Numéro de build natif (CFBundleVersion sur iPhone, « 42 ») : c'est lui que l'API compare. */
  build: 'x-app-build',
  /** `ios`, `android` ou `web` (le web n'a pas de build : jamais bloqué). */
  platform: 'x-app-platform',
} as const;

export const AppPlatformZ = z.enum(APP_PLATFORMS);

/** `GET /v1/app/config` : réglages des versions pour la plateforme de l'appelant (en-tête ou `?platform=`). */
export const AppConfigZ = z.object({
  /** Plateforme reconnue (null : web ou inconnue ; les nombres valent alors 0). */
  platform: AppPlatformZ.nullable(),
  /** Sous ce build, l'API répond `426 app_update_required` (0 : aucun minimum). */
  minSupportedBuild: z.number().int().min(0),
  /** Dernier build publié : au-dessous, un bandeau propose la mise à jour (0 : pas de bandeau). */
  latestBuild: z.number().int().min(0),
  /** Fiche de l'app dans le magasin (null : inconnue). */
  storeUrl: z.string().nullable(),
});
export type AppConfig = z.infer<typeof AppConfigZ>;

export const AppConfigQuery = z.object({ platform: z.string().max(20).optional() });

export const appRoutes = {
  config: () => `${API}/app/config`,
} as const;
