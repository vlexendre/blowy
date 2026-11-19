/**
 * Versions de l'app servies par l'API (docs/VERSIONING.md). Par plateforme :
 * - `APP_<PLATEFORME>_MIN_SUPPORTED_BUILD` : sous ce numéro de build, réponse `426 app_update_required` (0 ou absent :
 *   aucun minimum) ;
 * - `APP_<PLATEFORME>_LATEST_BUILD` : dernier build publié, au-dessous un bandeau propose la mise à jour (0 : aucun) ;
 * - `APP_<PLATEFORME>_STORE_URL` : fiche du magasin (iPhone : la fiche de Minimoa par défaut) ;
 * - `APP_<PLATEFORME>_CHEMIN_BUILD` : premier build qui a « Ton chemin » (docs/CHEMIN.md). À partir de lui, le défi du
 *   jour n'est plus proposé et le rappel du matin parle de la séance du jour. Défaut très haut : inactif.
 */
import type { AppBuildPolicy, AppPlatform } from '@blowy/domain';
import { z } from 'zod';

export const DEFAULT_IOS_STORE_URL = 'https://apps.apple.com/fr/app/minimoa/id6833895780';

const emptyToUndefined = (v: unknown): unknown => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const build = z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).max(999_999_999).default(0));
const url = z.preprocess(emptyToUndefined, z.string().url().optional());
/** Désactivé par défaut : aucun build n'atteint ce numéro. */
export const CHEMIN_BUILD_OFF = 999_999_999;
const cheminBuild = z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(CHEMIN_BUILD_OFF).default(CHEMIN_BUILD_OFF));

const Schema = z.object({
  APP_IOS_MIN_SUPPORTED_BUILD: build,
  APP_IOS_LATEST_BUILD: build,
  APP_IOS_STORE_URL: url,
  APP_ANDROID_MIN_SUPPORTED_BUILD: build,
  APP_ANDROID_LATEST_BUILD: build,
  APP_ANDROID_STORE_URL: url,
  APP_IOS_CHEMIN_BUILD: cheminBuild,
  APP_ANDROID_CHEMIN_BUILD: cheminBuild,
});

export interface AppPlatformVersions extends AppBuildPolicy {
  storeUrl: string | null;
  /** Premier build avec Ton chemin (CHEMIN_BUILD_OFF : inactif). */
  cheminBuild: number;
}
export type AppVersionsEnv = Record<AppPlatform, AppPlatformVersions>;

export function loadAppVersionsEnv(source: Record<string, string | undefined>): AppVersionsEnv {
  const parsed = Schema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join('.') || 'env'} : ${i.message}`).join(' ; ');
    throw new Error(`configuration invalide — ${details}`);
  }
  const e = parsed.data;
  const out: AppVersionsEnv = {
    ios: { minSupportedBuild: e.APP_IOS_MIN_SUPPORTED_BUILD, latestBuild: e.APP_IOS_LATEST_BUILD, storeUrl: e.APP_IOS_STORE_URL ?? DEFAULT_IOS_STORE_URL, cheminBuild: e.APP_IOS_CHEMIN_BUILD },
    android: { minSupportedBuild: e.APP_ANDROID_MIN_SUPPORTED_BUILD, latestBuild: e.APP_ANDROID_LATEST_BUILD, storeUrl: e.APP_ANDROID_STORE_URL ?? null, cheminBuild: e.APP_ANDROID_CHEMIN_BUILD },
  };
  for (const [platform, v] of Object.entries(out)) {
    // Un minimum au-dessus du dernier build publié bloquerait tout le monde, même les personnes à jour.
    if (v.latestBuild > 0 && v.minSupportedBuild > v.latestBuild) {
      const P = platform.toUpperCase();
      throw new Error(`configuration invalide — APP_${P}_MIN_SUPPORTED_BUILD (${v.minSupportedBuild}) dépasse APP_${P}_LATEST_BUILD (${v.latestBuild})`);
    }
  }
  return out;
}
