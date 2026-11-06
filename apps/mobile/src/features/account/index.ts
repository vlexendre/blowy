/** API publique de la feature compte (auth, profil, préférences V5, consentements, vérification). */
export * from './api/hooks';
export type { AccountRepository } from './api/account.repository';
export { DevLoginScreen } from './ui/DevLoginScreen';
export { DEMO_ACCOUNTS, isValidLocalKey } from './model/demo-accounts';
export { createAccountRepository } from './api/account.repository';
