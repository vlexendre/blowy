import { AsyncLocalStorage } from 'node:async_hooks';
import { type ExecutionContext, createParamDecorator } from '@nestjs/common';
import { type Locale, localeFromAcceptLanguage } from '@blowy/content';
import type { NextFunction, Request, Response } from 'express';

/**
 * Langue des textes d'une réponse : l'en-tête `Accept-Language` envoyé par l'app (sa langue courante) ou par le
 * navigateur (pages publiques). Sans en-tête : français. Les textes envoyés ou rangés pour quelqu'un hors d'une
 * réponse (notifications, e-mails, répliques des minimoas, bilans) suivent `profiles.locale` de cette personne.
 */
export const localeOfRequest = (req: Pick<Request, 'headers'>): Locale => {
  const header = req.headers['accept-language'];
  return localeFromAcceptLanguage(Array.isArray(header) ? header.join(',') : header);
};

/** Paramètre de contrôleur : `@ReqLocale() locale: Locale`. */
export const ReqLocale = createParamDecorator((_: unknown, ctx: ExecutionContext): Locale => localeOfRequest(ctx.switchToHttp().getRequest<Request>()));

const store = new AsyncLocalStorage<Locale>();

/** Intergiciel : la langue de la requête reste lisible pendant tout son traitement. */
export function withRequestLocale(req: Request, _res: Response, next: NextFunction): void {
  store.run(localeOfRequest(req), next);
}

/**
 * Langue de la requête en cours, pour un présentateur appelé loin du contrôleur ; hors requête (tâches planifiées),
 * français. Pour un texte destiné à quelqu'un d'autre que l'appelant, utiliser son `profiles.locale`.
 */
export const requestLocale = (): Locale => store.getStore() ?? 'fr';
