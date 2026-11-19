/**
 * Qui appelle l'API (docs/VERSIONING.md) : version, numéro de build et plateforme de l'app, lus dans les en-têtes
 * `x-app-version`, `x-app-build`, `x-app-platform` (`APP_HEADERS` du contrat). Les builds publiés avant ces en-têtes
 * sont reconnus, au mieux, à l'agent utilisateur d'iOS (« Minimoa/42 CFNetwork/… »).
 *
 * L'intergiciel `withClientApp` :
 * - range l'identité pour toute la requête (`clientApp()`, ou `@ClientApp()` dans un contrôleur) ;
 * - la journalise (une ligne par version vue, par processus) ;
 * - répond `426 app_update_required` à un build sous `minSupportedBuild`, sauf sur quelques routes qui doivent rester
 *   ouvertes (santé, réglages des versions, suppression du compte, minuteur, notifications d'Apple).
 * Un appel sans plateforme d'app (site, administration, outils) n'est jamais bloqué.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import { type ExecutionContext, Logger, createParamDecorator } from '@nestjs/common';
import { APP_HEADERS, type ApiErrorBody } from '@blowy/contract';
import { type AppPlatform, type AppUpdateStatus, appUpdateStatus, isAppPlatform, parseBuildNumber } from '@blowy/domain';
import type { NextFunction, Request, Response } from 'express';
import type { AppVersionsEnv } from '../config/app-versions.env';
import { HTTP_STATUS, defaultMessage } from './errors';
import { localeOfRequest } from './locale';

export interface ClientAppInfo {
  /** `ios`, `android` ; null : web, outil, ou inconnu. */
  platform: AppPlatform | null;
  /** Version marketing (« 1.0.0 »), telle qu'envoyée. */
  version: string | null;
  /** Numéro de build natif ; null si inconnu. */
  build: number | null;
  /** D'où vient l'identité : en-têtes de l'app, agent utilisateur d'iOS (anciens builds), ou rien. */
  source: 'headers' | 'user-agent' | 'none';
}

export const UNKNOWN_CLIENT: ClientAppInfo = { platform: null, version: null, build: null, source: 'none' };

const header = (req: Pick<Request, 'headers'>, name: string): string | null => {
  const v = req.headers[name];
  return (Array.isArray(v) ? v[0] : v) ?? null;
};

/** Agent utilisateur par défaut d'iOS (NSURLSession) : « <CFBundleName>/<CFBundleVersion> CFNetwork/… Darwin/… ». */
const IOS_APP_UA = /^Minimoa[^/\s]*\/(\d{1,9}) CFNetwork\//i;

export function readClientApp(req: Pick<Request, 'headers'>): ClientAppInfo {
  const platform = header(req, APP_HEADERS.platform)?.trim().toLowerCase() ?? null;
  if (platform !== null) {
    const version = header(req, APP_HEADERS.version)?.trim().slice(0, 32) || null;
    return { platform: isAppPlatform(platform) ? platform : null, version, build: parseBuildNumber(header(req, APP_HEADERS.build)), source: 'headers' };
  }
  const ua = IOS_APP_UA.exec(header(req, 'user-agent') ?? '');
  if (ua) return { platform: 'ios', version: null, build: parseBuildNumber(ua[1]), source: 'user-agent' };
  return UNKNOWN_CLIENT;
}

/** Statut de mise à jour de cet appelant (`none` hors app). */
export function updateStatusOf(client: ClientAppInfo, versions: AppVersionsEnv): AppUpdateStatus {
  return client.platform ? appUpdateStatus(client.build, versions[client.platform]) : 'none';
}

/** Routes servies à tout build, même trop ancien. */
const ALWAYS_OPEN: readonly { method?: string; path: RegExp }[] = [
  { path: /^\/health\/?$/ },
  { path: /^\/v1\/app\/config\/?$/ },
  // Supprimer son compte reste possible depuis n'importe quelle version.
  { method: 'DELETE', path: /^\/v1\/me\/?$/ },
  { method: 'POST', path: /^\/v1\/devices\/remove\/?$/ },
  { path: /^\/internal\// },
  { path: /^\/v1\/plus\/apple\/notifications\/?$/ },
];

const store = new AsyncLocalStorage<ClientAppInfo>();

/** Identité de l'app qui a fait la requête en cours (hors requête : inconnue). */
export const clientApp = (): ClientAppInfo => store.getStore() ?? UNKNOWN_CLIENT;

/** Paramètre de contrôleur : `@ClientApp() client: ClientAppInfo`. */
export const ClientApp = createParamDecorator((_: unknown, ctx: ExecutionContext): ClientAppInfo => readClientApp(ctx.switchToHttp().getRequest<Request>()));

const MAX_SEEN = 500;

export function withClientApp(versions: AppVersionsEnv, logger = new Logger('Versions')) {
  const seen = new Set<string>();
  return (req: Request, res: Response, next: NextFunction): void => {
    const client = readClientApp(req);
    if (client.source !== 'none') {
      const key = `${client.platform ?? '?'} ${client.version ?? '?'} (${client.build ?? '?'}) ${client.source}`;
      if (!seen.has(key) && seen.size < MAX_SEEN) {
        seen.add(key);
        logger.log(`app vue : ${key}`);
      }
    }
    const path = req.path;
    const open = ALWAYS_OPEN.some((r) => (!r.method || r.method === req.method) && r.path.test(path));
    if (!open && updateStatusOf(client, versions) === 'required') {
      logger.warn(`426 : ${client.platform} build ${client.build} < ${client.platform ? versions[client.platform].minSupportedBuild : '?'} (${req.method} ${path})`);
      const body: ApiErrorBody = { error: { code: 'app_update_required', message: defaultMessage('app_update_required', localeOfRequest(req)) } };
      res.status(HTTP_STATUS.app_update_required).json(body);
      return;
    }
    store.run(client, next);
  };
}
