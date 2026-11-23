/**
 * L'app qui appelle a-t-elle « Ton chemin » (docs/CHEMIN.md) ? Oui si son build (`x-app-build`) atteint
 * `APP_<PLATEFORME>_CHEMIN_BUILD`, ou `APP_<PLATEFORME>_ADA_BUILD` (la version simplifiée a Ton chemin et plus de défi).
 * Sert à ne plus lui proposer le défi du jour. Hors app (site, outils) : non.
 */
import type { AppVersionsEnv } from '../config/app-versions.env';
import { type ClientAppInfo, clientApp } from './client-app';

const firstCheminBuild = (v: { cheminBuild: number; adaBuild: number }): number => Math.min(v.cheminBuild, v.adaBuild);

export function hasChemin(versions: AppVersionsEnv, client: ClientAppInfo = clientApp()): boolean {
  if (!client.platform || client.build === null) return false;
  return client.build >= firstCheminBuild(versions[client.platform]);
}

/** Même règle pour un build retenu (dernière app vue sur Ton chemin) : le rappel du matin. */
export function buildHasChemin(versions: AppVersionsEnv, platform: string | null, build: number | null): boolean {
  if ((platform !== 'ios' && platform !== 'android') || build === null) return false;
  return build >= firstCheminBuild(versions[platform]);
}
