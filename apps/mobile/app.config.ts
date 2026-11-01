/**
 * Configuration Expo de Blowy (SDK 58, development builds — pas d'Expo Go pour le natif).
 * Variantes : APP_VARIANT=development | preview | production (profils eas.json).
 * Aucun secret ici : seules des variables EXPO_PUBLIC_* publiques sont lues par l'app.
 */
import type { ConfigContext, ExpoConfig } from 'expo/config';

type Variant = 'development' | 'preview' | 'production';
const variant = ((process.env.APP_VARIANT as Variant | undefined) ?? 'development') satisfies Variant;

/** Valeurs de @blowy/design-tokens (cream / coral) recopiées : le fichier de config est évalué en CommonJS. */
const CREAM = '#FFF7EC';
const CORAL = '#FF5A3C';

/**
 * Identifiants natifs : `app.blowy` par défaut (nom de projet natif « Blowy », validé sur Mac).
 * BLOWY_SIDE_BY_SIDE=1 (profils EAS development/preview) suffixe l'identifiant pour installer
 * plusieurs variantes côte à côte ; le nom natif reste « Blowy ».
 */
const BASE_ID = 'app.blowy';
const sideBySide = process.env.BLOWY_SIDE_BY_SIDE === '1' && variant !== 'production';
const BUNDLE_ID = sideBySide ? `${BASE_ID}.${variant}` : BASE_ID;
const SCHEME = 'blowy';
const APP_GROUP = `group.${BUNDLE_ID}`;
const ASSOCIATED_DOMAIN = 'blowy.app';

/** Raisons de permissions (FR), demandées au moment utile dans l'app. */
const PERMISSIONS = {
  camera: 'Blowy utilise l’appareil photo pour ton selfie de vérification et les preuves de mission. Rien n’est publié sans ton accord.',
  photos: 'Blowy accède aux photos que tu choisis pour une preuve de mission. Elles restent privées par défaut.',
  microphone: 'Blowy utilise le micro pour les messages vocaux, une fois débloqués avec l’autre personne.',
  locationWhenInUse: 'Blowy utilise ta position approximative (à 500 m près) pour te proposer des pets proches et la carte. Ta position exacte n’est jamais montrée.',
  locationAlways: 'Pendant un premier rendez-vous en vrai, si tu l’actives, ton ange gardien peut voir ta position pendant 3 heures maximum, même app fermée.',
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Blowy',
  slug: 'blowy',
  owner: process.env.EXPO_OWNER,
  version: '0.1.0',
  orientation: 'portrait',
  scheme: SCHEME,
  userInterfaceStyle: 'light',
  icon: './assets/images/icon.png',
  runtimeVersion: { policy: 'appVersion' },
  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: false,
    usesAppleSignIn: true,
    associatedDomains: [`applinks:${ASSOCIATED_DOMAIN}`],
    infoPlist: {
      NSCameraUsageDescription: PERMISSIONS.camera,
      NSPhotoLibraryUsageDescription: PERMISSIONS.photos,
      NSMicrophoneUsageDescription: PERMISSIONS.microphone,
      NSLocationWhenInUseUsageDescription: PERMISSIONS.locationWhenInUse,
      NSLocationAlwaysAndWhenInUseUsageDescription: PERMISSIONS.locationAlways,
      ITSAppUsesNonExemptEncryption: false,
      CFBundleDevelopmentRegion: 'fr',
    },
    entitlements: { 'com.apple.security.application-groups': [APP_GROUP] },
  },
  android: {
    package: BUNDLE_ID,
    adaptiveIcon: { foregroundImage: './assets/images/adaptive-foreground.png', backgroundColor: CORAL },
    permissions: [
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.VIBRATE',
    ],
    // Localisation précise et arrière-plan : uniquement via le plugin expo-location (ange gardien, opt-in).
    blockedPermissions: ['android.permission.ACCESS_FINE_LOCATION'],
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          { scheme: 'https', host: ASSOCIATED_DOMAIN, pathPrefix: '/invite' },
          { scheme: 'https', host: ASSOCIATED_DOMAIN, pathPrefix: '/r' },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  web: { bundler: 'metro', output: 'single' },
  plugins: [
    'expo-router',
    [
      'expo-font',
      {
        fonts: [
          'node_modules/@expo-google-fonts/bricolage-grotesque/800ExtraBold/BricolageGrotesque_800ExtraBold.ttf',
          'node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf',
          'node_modules/@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf',
          'node_modules/@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf',
          'node_modules/@expo-google-fonts/inter/800ExtraBold/Inter_800ExtraBold.ttf',
        ],
      },
    ],
    ['expo-splash-screen', { image: './assets/images/splash-pet.png', imageWidth: 200, backgroundColor: CREAM, resizeMode: 'contain' }],
    'expo-secure-store',
    'expo-apple-authentication',
    ['expo-notifications', { icon: './assets/images/notification-icon.png', color: CORAL, defaultChannel: 'default' }],
    [
      'expo-location',
      {
        locationWhenInUsePermission: PERMISSIONS.locationWhenInUse,
        locationAlwaysAndWhenInUsePermission: PERMISSIONS.locationAlways,
        locationAlwaysPermission: PERMISSIONS.locationAlways,
        isIosReducedAccuracyByDefault: true,
        // Arrière-plan : nécessaire au seul partage ange gardien (opt-in, 3 h max, catégorie distincte).
        isIosBackgroundLocationEnabled: true,
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
    ['expo-camera', { cameraPermission: PERMISSIONS.camera, microphonePermission: PERMISSIONS.microphone, recordAudioAndroid: true }],
    ['expo-image-picker', { photosPermission: PERMISSIONS.photos, cameraPermission: PERMISSIONS.camera, microphonePermission: PERMISSIONS.microphone }],
    ['expo-audio', { microphonePermission: PERMISSIONS.microphone }],
    [
      'expo-build-properties',
      {
        ios: { deploymentTarget: '16.4' },
        android: { minSdkVersion: 26, enableMinifyInReleaseBuilds: variant === 'production', enableShrinkResourcesInReleaseBuilds: variant === 'production' },
      },
    ],
    [
      'expo-widgets',
      {
        groupIdentifier: APP_GROUP,
        enableAndroid: true,
        widgets: [
          {
            name: 'BlowyPetWidget',
            displayName: 'Ton pet',
            description: 'Ton pet, ta série et le rendez-vous qui t’attend.',
            ios: { supportedFamilies: ['systemSmall', 'systemMedium', 'accessoryRectangular'], initialLayout: './src/widgets/BlowyPetWidget.tsx' },
            android: { minWidth: 110, minHeight: 110, targetCellWidth: 2, targetCellHeight: 2, resizeMode: 'both', initialLayout: './src/widgets/BlowyPetWidget.android.tsx' },
          },
        ],
      },
    ],
  ],
  experiments: { typedRoutes: true, reactCompiler: false },
  extra: {
    variant,
    appGroup: APP_GROUP,
    router: { origin: `https://${ASSOCIATED_DOMAIN}` },
    eas: process.env.EAS_PROJECT_ID ? { projectId: process.env.EAS_PROJECT_ID } : undefined,
  },
});
