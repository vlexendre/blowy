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
    entitlements: {
      'com.apple.security.application-groups': [APP_GROUP],
      // Jetons APNs des activités en direct (ActivityKit). EAS active la capacité Push sur l'identifiant d'app.
      'aps-environment': 'development',
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      CFBundleDevelopmentRegion: 'fr',
      CFBundleLocalizations: ['fr', 'en', 'es', 'pt', 'nl'],
      NSCameraUsageDescription: 'Blowy utilise l’appareil photo pour ta photo du jour. Elle n’est envoyée qu’à la personne du lien.',
      NSPhotoLibraryUsageDescription: 'Blowy accède aux photos que tu choisis pour ta photo du jour ou ta photo de profil.',
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
        photosPermission: 'Blowy accède aux photos que tu choisis pour ta photo du jour ou ta photo de profil.',
        cameraPermission: 'Blowy utilise l’appareil photo pour ta photo du jour. Elle n’est envoyée qu’à la personne du lien.',
        microphonePermission: false,
      },
    ],
    // Widgets iOS et activités en direct : fichiers générés de l'extension, puis la cible elle-même (targets/widget).
    './plugins/with-blowy-widgets',
    '@bacons/apple-targets',
  ],
  experiments: { typedRoutes: true },
  extra: { router: {}, eas: EAS_PROJECT_ID ? { projectId: EAS_PROJECT_ID } : {} },
});
