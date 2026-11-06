/**
 * Comptes de démonstration du seed local (packages/database/src/seed, agent C). Connexion via
 * LocalAuthProvider de l'API — affichés seulement si `localAuthEnabled(env)` (jamais en production).
 * Les noms sont des personnages fictifs du casting de la démo (pas des données réelles).
 */
export interface DemoAccount {
  key: string;
  /** Clé i18n de la description courte. */
  descKey: string;
}

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { key: 'alex', descKey: 'devLogin.desc.alex' },
  { key: 'l', descKey: 'devLogin.desc.l' },
  { key: 'm', descKey: 'devLogin.desc.m' },
  { key: 's', descKey: 'devLogin.desc.s' },
  { key: 'ines', descKey: 'devLogin.desc.friends' },
  { key: 'tom', descKey: 'devLogin.desc.friends' },
  { key: 'maya', descKey: 'devLogin.desc.friends' },
  { key: 'test.a', descKey: 'devLogin.desc.test' },
  { key: 'test.b', descKey: 'devLogin.desc.unverified' },
  { key: 'test.c', descKey: 'devLogin.desc.test' },
  { key: 'test.d', descKey: 'devLogin.desc.test' },
  { key: 'solo', descKey: 'devLogin.desc.solo' },
];

/** Clé locale saisie à la main : même règle que l'API (`[a-z0-9._-]{3,64}`). */
export const isValidLocalKey = (k: string): boolean =>
  /^[a-z0-9._-]{1,64}$/.test(k.trim().toLowerCase());
