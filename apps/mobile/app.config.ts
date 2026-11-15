/**
 * Configuration Expo de Blowy. Aucun secret ici : seules des variables EXPO_PUBLIC_* publiques sont lues par l'app.
 * Profils EAS : development (client de dev), preview (interne), production (TestFlight / App Store).
 */
import type { ConfigContext, ExpoConfig } from 'expo/config';

const NIGHT = '#0B0A14';
const BUNDLE_ID = process.env.BLOWY_BUNDLE_ID ?? 'app.blowy';
const ASSOCIATED_DOMAIN = 'blowy.app';
/** À coller après `eas init` (voir docs/TESTFLIGHT.md). */
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID ?? '01d6f37d-203a-4747-910b-6de4cfe50ed5';
const EXPO_OWNER = process.env.EXPO_OWNER ?? 'alexendre.o';
/** Groupe d'apps partagé avec l'extension des widgets (état des widgets). À créer dans le portail Apple : docs/WIDGETS.md. */
const APP_GROUP = `group.${BUNDLE_ID}`;
/** Identifiant d'équipe Apple (10 caractères) : utile à `@bacons/apple-targets` pour signer l'extension hors EAS. */
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID;
/** Textes des autorisations iOS (français, langue source) ; traduits par `locales` (fichiers `./locales/<langue>.json`). */
const CAMERA_TEXT = 'Blowy utilise l’appareil photo pour les preuves de tes habitudes et les défis photo. Une IA les vérifie ; personne d’autre que toi ne les voit.';
const LOCATION_TEXT = 'Blowy utilise ta position, app ouverte seulement, pour trouver des minimoas près de toi et confirmer tes sorties.';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Blowy',
  slug: 'blowy',
  owner: EXPO_OWNER,
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'blowy',
  userInterfaceStyle: 'dark',
  backgroundColor: NIGHT,
  icon: './assets/images/icon.png',
  runtimeVersion: { policy: 'appVersion' },
  ios: {
    bundleIdentifier: BUNDLE_ID,
    ...(APPLE_TEAM_ID ? { appleTeamId: APPLE_TEAM_ID } : {}),
    supportsTablet: false,
    associatedDomains: [`applinks:${ASSOCIATED_DOMAIN}`],
    // « Continuer avec Apple » (capacité Sign in with Apple de l'identifiant d'app) : docs/CONNEXION.md.
    usesAppleSignIn: true,
    entitlements: {
      'com.apple.security.application-groups': [APP_GROUP],
      // Jetons APNs des activités en direct (ActivityKit). EAS active la capacité Push sur l'identifiant d'app.
      'aps-environment': 'development',
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      CFBundleDevelopmentRegion: 'fr',
      CFBundleLocalizations: ['fr', 'en', 'es', 'pt', 'nl'],
      NSCameraUsageDescription: CAMERA_TEXT,
      NSLocationWhenInUseUsageDescription: LOCATION_TEXT,
      // Textes d'autorisation traduits (`locales`) même si l'app n'a pas de traduction native de son nom.
      CFBundleAllowMixedLocalizations: true,
      NSPhotoLibraryUsageDescription: 'Blowy accède aux photos que tu choisis pour ta photo de profil.',
      // Activités en direct (défi accepté, photo d'un lien, sortie) : docs/WIDGETS.md.
      NSSupportsLiveActivities: true,
    },
  },
  android: {
    package: BUNDLE_ID,
    adaptiveIcon: { foregroundImage: './assets/images/adaptive-foreground.png', backgroundColor: '#FFB800' },
  },
  web: { bundler: 'metro', output: 'single', favicon: './assets/images/icon.png' },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-secure-store',
    ['expo-splash-screen', { image: './assets/images/splash-pet.png', imageWidth: 220, resizeMode: 'contain', backgroundColor: NIGHT }],
    [
      'expo-image-picker',
      {
        photosPermission: 'Blowy accède aux photos que tu choisis pour ta photo de profil.',
        cameraPermission: CAMERA_TEXT,
        microphonePermission: false,
      },
    ],
    // Preuves d'habitude et photo du défi : viseur dans l'app (jamais la galerie). Ni micro ni lecteur de codes.
    ['expo-camera', { cameraPermission: CAMERA_TEXT, microphonePermission: false, recordAudioAndroid: false, barcodeScannerEnabled: false }],
    // Position, app ouverte seulement (rencontres proches, sortie confirmée) : jamais en arrière-plan.
    ['expo-location', { locationWhenInUsePermission: LOCATION_TEXT, isIosBackgroundLocationEnabled: false, isAndroidBackgroundLocationEnabled: false }],
    // Notifications push (jeton Expo, APNs) : défi du jour, rencontres, messages… Pas de notifications en arrière-plan silencieuses.
    ['expo-notifications', { enableBackgroundRemoteNotifications: false }],
    // Connexion : Apple (iPhone), Google par le navigateur du système (Android, web) ; docs/CONNEXION.md.
    'expo-apple-authentication',
    'expo-web-browser',
    // Blowy+ : achats intégrés StoreKit 2 (vérifiés par l'API) ; docs/BLOWY-PLUS.md.
    'expo-iap',
    // Widgets iOS et activités en direct : fichiers générés de l'extension, puis la cible elle-même (targets/widget).
    './plugins/with-blowy-widgets',
    '@bacons/apple-targets',
  ],
  // Textes système iOS (autorisations) par langue : français écrit, les autres à traduire (docs/I18N.md).
  locales: { fr: './locales/fr.json', en: './locales/en.json', es: './locales/es.json', pt: './locales/pt.json', nl: './locales/nl.json' },
  experiments: { typedRoutes: true },
  extra: { router: {}, eas: EAS_PROJECT_ID ? { projectId: EAS_PROJECT_ID } : {} },
});
