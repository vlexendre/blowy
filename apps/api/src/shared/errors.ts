import type { ErrorCode } from '@blowy/contract';

/** Erreur métier : un code du contrat et un message en français (tutoiement). */
export class DomainError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string = DEFAULT_MESSAGES[code],
  ) {
    super(message);
    this.name = 'DomainError';
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
  rate_limited: 429,
  internal: 500,
};

export const DEFAULT_MESSAGES: Record<ErrorCode, string> = {
  unauthorized: 'Connecte-toi pour continuer.',
  not_onboarded: 'Crée d’abord ton pet.',
  already_onboarded: 'Ton pet existe déjà.',
  too_young: 'Blowy est réservé aux personnes de 18 ans et plus.',
  not_found: 'Introuvable.',
  forbidden: 'Tu n’as pas accès à ça.',
  invalid: 'Ta demande n’est pas valide.',
  conflict: 'C’est déjà le cas.',
  link_not_active: 'Ce lien n’est plus actif.',
  cannot_revive: 'Ce lien ne peut pas être ranimé.',
  already_done: 'C’est déjà fait pour aujourd’hui.',
  rate_limited: 'Doucement ! Réessaie dans un moment.',
  internal: 'Une erreur est survenue.',
};
