/**
 * Configuration Expo de Minimoa. Aucun secret ici : seules des variables EXPO_PUBLIC_* publiques sont lues par l'app.
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
/**
 * `BLOWY_WIDGETS=off` : build sans l'extension des widgets ni le groupe d'apps (cible `app.blowy.widget` absente).
 * Provisoire, tant qu'Apple refuse d'enregistrer de nouveaux identifiants pour l'équipe (contrats en attente).
 */
const WIDGETS = process.env.BLOWY_WIDGETS !== 'off';
/**
 * Textes des autorisations iOS : une seule source, `./locales/fr.json` (français, langue source), repris tels quels dans
 * `Info.plist` ; chaque langue a son `InfoPlist.strings` par `locales` (hors français : la phrase française en attendant
 * la passe de traduction, docs/I18N.md). Seules ces trois autorisations existent : `ios-release.test.ts` le vérifie.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const IOS_TEXT = (require('./locales/fr.json') as { ios: Record<IosPurpose, string> }).ios;
type IosPurpose = 'NSCameraUsageDescription' | 'NSLocationWhenInUseUsageDescription' | 'NSPhotoLibraryUsageDescription';
const CAMERA_TEXT = IOS_TEXT.NSCameraUsageDescription;
const LOCATION_TEXT = IOS_TEXT.NSLocationWhenInUseUsageDescription;
const PHOTOS_TEXT = IOS_TEXT.NSPhotoLibraryUsageDescription;
/**
 * Jetons APNs (activités en direct) : `development` pour le client de développement, `production` pour les builds
 * signés pour TestFlight, l'App Store ou la distribution interne (profils EAS `preview` et `production`, eas.json).
 */
const apsEnvironment = (): 'development' | 'production' =>
  process.env.BLOWY_APS_ENVIRONMENT === 'production' || process.env.BLOWY_APS_ENVIRONMENT === 'development'
    ? process.env.BLOWY_APS_ENVIRONMENT
    : process.env.EAS_BUILD_PROFILE && process.env.EAS_BUILD_PROFILE !== 'development'
      ? 'production'
      : 'development';

/**
 * Manifeste de confidentialité de l'app (PrivacyInfo.xcprivacy de la cible Minimoa ; audit B4). Raisons des « required
 * reason API » : celles du code de l'app (module local `blowy-widgets` : UserDefaults de l'app et du groupe d'apps) et
 * celles des bibliothèques liées statiquement dans l'exécutable (React Native, expo-constants, expo-notifications,
 * expo-system-ui, expo-file-system, expo-application, async-storage, react-native-maps), recopiées de leurs propres
 * manifestes comme le conseille Expo (Apple lit mal ceux des pods statiques). Données collectées : celles du tableau
 * « App Privacy » (docs/APP-STORE-CONNECT.md), toutes liées à la personne, aucune pour du pistage.
 * Le manifeste de l'extension des widgets est `targets/widget/PrivacyInfo.xcprivacy` ; celui du module, dans son pod.
 */
const PRIVACY_MANIFEST = {
  NSPrivacyTracking: false,
  NSPrivacyTrackingDomains: [] as string[],
  NSPrivacyAccessedAPITypes: [
    // CA92.1 : réglages de l'app (RN, Expo) ; 1C8F.1 : état des widgets dans le groupe d'apps (module local).
    { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults', NSPrivacyAccessedAPITypeReasons: ['CA92.1', '1C8F.1'] },
    // C617.1 : fichiers du conteneur de l'app (RN, async-storage, expo-application, maps) ; 3B52.1 et 0A2A.1 : expo-file-system.
    { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp', NSPrivacyAccessedAPITypeReasons: ['C617.1', '3B52.1', '0A2A.1'] },
    // E174.1, 85F4.1 : expo-file-system.
    { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace', NSPrivacyAccessedAPITypeReasons: ['E174.1', '85F4.1'] },
    // 35F9.1 : mesure du temps écoulé (React Native, boost).
    { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime', NSPrivacyAccessedAPITypeReasons: ['35F9.1'] },
  ],
  NSPrivacyCollectedDataTypes: (
    [
      ['EmailAddress', ['AppFunctionality']],
      ['Name', ['AppFunctionality']],
      // Approximative (audit M6) : l'API n'enregistre jamais le point exact, seulement le centre de sa maille de ~300 m
      // (`storedPoint`) et la zone du domicile (même maille) ; le point exact ne sert qu'en mémoire, pendant la requête.
      ['CoarseLocation', ['AppFunctionality']],
      ['SensitiveInfo', ['AppFunctionality']],
      ['EmailsOrTextMessages', ['AppFunctionality']],
      ['PhotosorVideos', ['AppFunctionality']],
      ['CustomerSupport', ['AppFunctionality']],
      ['OtherUserContent', ['AppFunctionality', 'ProductPersonalization']],
      ['UserID', ['AppFunctionality']],
      ['PurchaseHistory', ['AppFunctionality']],
      ['ProductInteraction', ['AppFunctionality', 'Analytics']],
      ['OtherDataTypes', ['AppFunctionality']],
    ] as const
  ).map(([type, purposes]) => ({
    NSPrivacyCollectedDataType: `NSPrivacyCollectedDataType${type}`,
    NSPrivacyCollectedDataTypeLinked: true,
    NSPrivacyCollectedDataTypeTracking: false,
    NSPrivacyCollectedDataTypePurposes: purposes.map((p) => `NSPrivacyCollectedDataTypePurpose${p}`),
  })),
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Minimoa',
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
      ...(WIDGETS ? { 'com.apple.security.application-groups': [APP_GROUP] } : {}),
      // Jetons APNs des activités en direct (ActivityKit). EAS active la capacité Push sur l'identifiant d'app.
      'aps-environment': apsEnvironment(),
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      CFBundleDevelopmentRegion: 'fr',
      CFBundleLocalizations: ['fr', 'en', 'es', 'pt', 'nl'],
      NSCameraUsageDescription: CAMERA_TEXT,
      NSLocationWhenInUseUsageDescription: LOCATION_TEXT,
      // Textes d'autorisation traduits (`locales`) même si l'app n'a pas de traduction native de son nom.
      CFBundleAllowMixedLocalizations: true,
      NSPhotoLibraryUsageDescription: PHOTOS_TEXT,
      // Activités en direct (défi accepté, série d'un lien, sortie) : docs/WIDGETS.md.
      NSSupportsLiveActivities: true,
    },
    privacyManifests: PRIVACY_MANIFEST,
  },
  android: {
    package: BUNDLE_ID,
    adaptiveIcon: { foregroundImage: './assets/images/adaptive-foreground.png', backgroundColor: '#FFB800' },
  },
  web: { bundler: 'metro', output: 'single', favicon: './assets/images/icon.png' },
  plugins: [
    'expo-router',
    'expo-font',
    // Pas de Face ID : rien n'est protégé par la biométrie (sinon un texte d'autorisation anglais générique est ajouté).
    ['expo-secure-store', { faceIDPermission: false }],
    ['expo-splash-screen', { image: './assets/images/splash-pet.png', imageWidth: 220, resizeMode: 'contain', backgroundColor: NIGHT }],
    [
      'expo-image-picker',
      {
        photosPermission: PHOTOS_TEXT,
        cameraPermission: CAMERA_TEXT,
        microphonePermission: false,
      },
    ],
    // Preuves d'habitude et photo du défi : viseur dans l'app (jamais la galerie). Ni micro ni lecteur de codes.
    ['expo-camera', { cameraPermission: CAMERA_TEXT, microphonePermission: false, recordAudioAndroid: false, barcodeScannerEnabled: false }],
    // Position, app ouverte seulement (rencontres proches, sortie confirmée) : jamais en arrière-plan.
    // Ni position permanente, ni mouvement, ni précision temporaire : seules les clés « pendant l'utilisation » restent.
    [
      'expo-location',
      {
        locationWhenInUsePermission: LOCATION_TEXT,
        locationAlwaysAndWhenInUsePermission: false,
        locationAlwaysPermission: false,
        motionUsagePermission: false,
        locationFullAccuracyPermission: false,
        isIosBackgroundLocationEnabled: false,
        isAndroidBackgroundLocationEnabled: false,
      },
    ],
    // Notifications push (jeton Expo, APNs) : défi du jour, rencontres, messages… Pas de notifications en arrière-plan silencieuses.
    ['expo-notifications', { enableBackgroundRemoteNotifications: false }],
    // Connexion : Apple (iPhone), Google par le navigateur du système (Android, web) ; docs/CONNEXION.md.
    'expo-apple-authentication',
    'expo-web-browser',
    // Minimoa+ : achats intégrés StoreKit 2 (vérifiés par l'API) ; docs/BLOWY-PLUS.md.
    'expo-iap',
    // Widgets iOS et activités en direct : fichiers générés de l'extension, puis la cible elle-même (targets/widget).
    ...(WIDGETS ? ['./plugins/with-blowy-widgets', '@bacons/apple-targets'] : []),
    // Après tout le reste : l'extension suit les appareils de l'app (iPhone seulement), audit « iPad ».
    ['./plugins/with-ios-release', { widget: WIDGETS }],
  ],
  // Textes système iOS (autorisations) par langue : français écrit, les autres à traduire (docs/I18N.md).
  locales: { fr: './locales/fr.json', en: './locales/en.json', es: './locales/es.json', pt: './locales/pt.json', nl: './locales/nl.json' },
  experiments: { typedRoutes: true },
  extra: { router: {}, eas: EAS_PROJECT_ID ? { projectId: EAS_PROJECT_ID } : {} },
});
