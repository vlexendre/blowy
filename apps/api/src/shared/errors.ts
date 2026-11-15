import { type ApiErrorText, type Locale, apiErrorText } from '@blowy/content';
import type { ErrorCode } from '@blowy/contract';

/**
 * Message d'erreur dans la langue de la personne : une fonction de la langue (`errorText('linkNotFound')`,
 * ou `(l) => visionText.in(l).errors.locationConsent`). Une chaîne simple reste acceptée mais n'est pas traduite.
 */
export type ErrorText = (locale: Locale) => string;

type ErrorKey = { [K in keyof ApiErrorText]: ApiErrorText[K] extends string | ((...args: never[]) => string) ? K : never }[keyof ApiErrorText];
type ArgsOf<K extends ErrorKey> = ApiErrorText[K] extends (...args: infer A) => string ? A : [];

/** Message du dictionnaire des erreurs de l'API (`@blowy/content`, api-errors.ts), résolu au moment de répondre. */
export function errorText<K extends ErrorKey>(key: K, ...args: ArgsOf<K>): ErrorText {
  return (locale) => {
    const value = apiErrorText.in(locale)[key] as string | ((...a: ArgsOf<K>) => string);
    return typeof value === 'function' ? value(...args) : value;
  };
}

/** Erreur métier : un code du contrat et un message (dans la langue de la requête, au moment de répondre). */
export class DomainError extends Error {
  readonly text: ErrorText;

  constructor(
    readonly code: ErrorCode,
    message?: string | ErrorText,
  ) {
    const text: ErrorText = typeof message === 'function' ? message : typeof message === 'string' ? () => message : (l) => defaultMessage(code, l);
    super(text('fr'));
    this.name = 'DomainError';
    this.text = text;
  }

  /** Le message dans une langue. */
  messageIn(locale: Locale): string {
    return this.text(locale);
  }
}

export const HTTP_STATUS: Record<ErrorCode, number> = {
  unauthorized: 401,
  not_onboarded: 404,
  already_onboarded: 409,
  too_young: 403,
  not_found: 404,
  forbidden: 403,
  invalid: 400,
  conflict: 409,
  link_not_active: 409,
  cannot_revive: 409,
  already_done: 409,
  rename_locked: 409,
  rate_limited: 429,
  suspended: 403,
  content_refused: 422,
  internal: 500,
};

/** Message par défaut d'un code, dans une langue. */
export const defaultMessage = (code: ErrorCode, locale: Locale = 'fr'): string => apiErrorText.in(locale).defaults[code];

/** Messages par défaut en français (compatibilité ; préférer `defaultMessage(code, locale)`). */
export const DEFAULT_MESSAGES: Record<ErrorCode, string> = apiErrorText.in('fr').defaults;
