import { AppError } from '../../../shared/domain/errors.js';

/**
 * Fabriques d'erreurs propres à l'économie, construites sur l'unique `AppError` partagé
 * (mappé par le filtre d'erreurs du socle). `detailsSafe` ne contient jamais de secret.
 */
export const insufficientFunds = (balance: number, required: number) =>
  new AppError('INSUFFICIENT_FUNDS', 'Solde de pièces insuffisant.', { detailsSafe: { balance, required } });

export const notFound = (what: string) => new AppError('NOT_FOUND', `${what} introuvable.`);

export const precondition = (message: string, details: Record<string, unknown> = {}) =>
  new AppError('PRECONDITION_FAILED', message, { detailsSafe: details });

export const invalid = (message: string, details: Record<string, unknown> = {}) =>
  new AppError('VALIDATION_FAILED', message, { detailsSafe: details });

export const forbidden = (message: string) => new AppError('FORBIDDEN', message);

export const internal = (message: string, details: Record<string, unknown> = {}) =>
  new AppError('INTERNAL', message, { detailsSafe: details });

export const entitlementRequired = (entitlement: string) =>
  new AppError('ENTITLEMENT_REQUIRED', 'Droit Blowy+ requis.', { detailsSafe: { entitlement } });

export const notConfigured = (what: string) =>
  new AppError('NOT_CONFIGURED', `${what} non configuré dans cet environnement.`, { detailsSafe: { what } });

export const providerUnavailable = (provider: string) =>
  new AppError('PROVIDER_UNAVAILABLE', `Fournisseur ${provider} indisponible.`, { detailsSafe: { provider }, retryable: true });

export const unauthenticatedWebhook = () => new AppError('UNAUTHENTICATED', 'Webhook non authentifié.');
