/**
 * L'app qui appelle a-t-elle « Ton chemin » (docs/CHEMIN.md) ? Oui si son build (`x-app-build`) atteint
 * `APP_<PLATEFORME>_CHEMIN_BUILD`. Sert à ne plus lui proposer le défi du jour. Hors app (site, outils) : non.
 */
import type { AppVersionsEnv } from '../config/app-versions.env';
import { type ClientAppInfo, clientApp } from './client-app';

export function hasChemin(versions: AppVersionsEnv, client: ClientAppInfo = clientApp()): boolean {
  if (!client.platform || client.build === null) return false;
  return client.build >= versions[client.platform].cheminBuild;
}

/** Même règle pour un build retenu (dernière app vue sur Ton chemin) : le rappel du matin. */
export function buildHasChemin(versions: AppVersionsEnv, platform: string | null, build: number | null): boolean {
  if ((platform !== 'ios' && platform !== 'android') || build === null) return false;
  return build >= versions[platform].cheminBuild;
}
