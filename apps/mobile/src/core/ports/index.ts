/**
 * Ports (pattern Adapter/Port) : interfaces des intégrations natives et externes.
 * Chaque port a une implémentation réelle et une implémentation locale déterministe,
 * injectées par <ServicesProvider> (src/core/providers/services.tsx). Les features ne
 * dépendent que de ces interfaces.
 */
export type { AuthPort, AuthCredential, AuthProviderKind } from './auth';
export type { StoragePort, SecretStoragePort } from './storage';
export type { NotificationsPort, NotificationPermission } from './notifications';
export type { LocationPort, ApproxLocation, LocationPermission } from './location';
export type { HapticsPort } from './haptics';
export type { CameraPermissionPort } from './camera';
export type {
  PurchasesPort,
  Offerings,
  StoreOffering,
  StorePackage,
  IntroOffer,
  PurchaseOutcome,
  PackagePeriod,
} from './purchases';
