/**
 * Versions de l'app (docs/VERSIONING.md) : une version installée peut rester des semaines sans mise à jour. L'API dit
 * quel numéro de build elle sert encore (`minSupportedBuild`) et quel est le dernier publié (`latestBuild`) ; l'app et
 * l'API en tirent la même conclusion avec `appUpdateStatus`.
 */

/** Plateformes de l'app qui ont un numéro de build. */
export const APP_PLATFORMS = ['ios', 'android'] as const;
export type AppPlatform = (typeof APP_PLATFORMS)[number];

/** Réglage d'une plateforme. `0` : pas de minimum (tout build est servi) ; `latestBuild` 0 : pas de bandeau. */
export interface AppBuildPolicy {
  minSupportedBuild: number;
  latestBuild: number;
}

/**
 * - `required` : build sous le minimum, l'API ne le sert plus (écran « Mets à jour Minimoa ») ;
 * - `available` : un build plus récent est publié (bandeau discret) ;
 * - `none` : à jour, ou build inconnu (web, développement, anciennes versions sans en-tête).
 */
export type AppUpdateStatus = 'none' | 'available' | 'required';

export function appUpdateStatus(build: number | null, policy: AppBuildPolicy): AppUpdateStatus {
  if (build === null || !Number.isFinite(build) || build <= 0) return 'none';
  if (policy.minSupportedBuild > 0 && build < policy.minSupportedBuild) return 'required';
  if (policy.latestBuild > 0 && build < policy.latestBuild) return 'available';
  return 'none';
}

/** Numéro de build lu dans un en-tête (« 42 ») ; null s'il est absent ou illisible. */
export function parseBuildNumber(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  const s = raw.trim();
  if (!/^\d{1,9}$/.test(s)) return null;
  const n = Number(s);
  return n > 0 ? n : null;
}

export const isAppPlatform = (raw: string | null | undefined): raw is AppPlatform => raw === 'ios' || raw === 'android';
