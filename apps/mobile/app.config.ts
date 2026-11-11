/**
 * Configuration Expo de Blowy. Aucun secret ici : seules des variables EXPO_PUBLIC_* publiques sont lues par l'app.
 * Profils EAS : development (client de dev), preview (interne), production (TestFlight / App Store).
 */
import type { ConfigContext, ExpoConfig } from 'expo/config';

const NIGHT = '#0B0A14';
const BUNDLE_ID = process.env.BLOWY_BUNDLE_ID ?? 'app.blowy';
const ASSOCIATED_DOMAIN = 'blowy.app';
/** À coller après `eas init` (voir docs/TESTFLIGHT.md). */
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID ?? '';
const EXPO_OWNER = process.env.EXPO_OWNER ?? undefined;

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
    supportsTablet: false,
    associatedDomains: [`applinks:${ASSOCIATED_DOMAIN}`],
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      CFBundleDevelopmentRegion: 'fr',
      CFBundleLocalizations: ['fr'],
      NSCameraUsageDescription: 'Blowy utilise l’appareil photo pour ta photo du jour. Elle n’est envoyée qu’à la personne du lien.',
      NSPhotoLibraryUsageDescription: 'Blowy accède aux photos que tu choisis pour ta photo du jour ou ta photo de profil.',
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
  ],
  experiments: { typedRoutes: true },
  extra: { router: {}, eas: EAS_PROJECT_ID ? { projectId: EAS_PROJECT_ID } : {} },
});
