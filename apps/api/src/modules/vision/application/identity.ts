import { textOf, visionText } from '@blowy/content';
import type { Gender, Seeking, Whom } from '@blowy/domain';
import { DomainError } from '../../../shared/errors';

export interface IdentityState {
  gender: Gender;
  seeking: Seeking;
  whom: Whom | null;
  sensitiveConsentAt: string | null;
}

export interface IdentityChange {
  gender?: Gender;
  seeking?: Seeking;
  whom?: Whom | null;
  /** true : accord donné (horodaté s'il ne l'était pas) · false : accord retiré. */
  sensitiveConsent?: boolean;
}

export const DEFAULT_IDENTITY: IdentityState = { gender: 'non_dit', seeking: 'potes', whom: null, sensitiveConsentAt: null };

/**
 * Applique un changement de « qui tu es / ce que tu cherches » et vérifie la cohérence :
 * « potes » n'a pas de `whom` ; « plus » et « les deux » en exigent un ; `whom` exige l'accord.
 * Retirer l'accord efface `whom` et repasse à « potes ».
 */
export function applyIdentity(current: IdentityState, change: IdentityChange, now: string): IdentityState {
  const gender = change.gender ?? current.gender;
  if (change.sensitiveConsent === false) {
    if ((change.seeking && change.seeking !== 'potes') || (change.whom !== undefined && change.whom !== null)) {
      throw new DomainError('invalid', textOf(visionText, (t) => t.errors.sensitiveConsent));
    }
    return { gender, seeking: 'potes', whom: null, sensitiveConsentAt: null };
  }
  const sensitiveConsentAt = change.sensitiveConsent === true ? (current.sensitiveConsentAt ?? now) : current.sensitiveConsentAt;
  const seeking = change.seeking ?? current.seeking;
  if (seeking === 'potes') {
    if (change.whom !== undefined && change.whom !== null) throw new DomainError('invalid', textOf(visionText, (t) => t.errors.whomOnlyForMore));
    return { gender, seeking, whom: null, sensitiveConsentAt };
  }
  const whom = change.whom !== undefined ? change.whom : current.whom;
  if (whom === null) throw new DomainError('invalid', textOf(visionText, (t) => t.errors.whomRequired));
  if (sensitiveConsentAt === null) throw new DomainError('invalid', textOf(visionText, (t) => t.errors.sensitiveConsent));
  return { gender, seeking, whom, sensitiveConsentAt };
}

export const identityChanged = (a: IdentityState, b: IdentityState): boolean => a.gender !== b.gender || a.seeking !== b.seeking || a.whom !== b.whom;
