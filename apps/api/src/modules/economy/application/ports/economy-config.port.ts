import type { EconomyParams } from '../../domain/index.js';

/** Paramètres économiques actifs (tuning publié). */
export interface EconomyParamsProvider {
  current(): EconomyParams;
}
export const ECONOMY_PARAMS = Symbol('EconomyParamsProvider');

/** Lien utilisateur Blowy ↔ appUserID fournisseur : appUserID = id utilisateur stable (UUID), jamais l'email. */
export interface UserDirectory {
  /** Vrai si l'id correspond à un utilisateur Blowy existant non supprimé. */
  exists(userId: string): Promise<boolean>;
}
export const USER_DIRECTORY = Symbol('UserDirectory');
