/**
 * Configuration Expo de Minimoa. Aucun secret ici : seules des variables EXPO_PUBLIC_* publiques sont lues par l'app.
 * Profils EAS : development (client de dev), preview (interne), production (TestFlight / App Store), et `dev` : l'app
 * « Minimoa Dev » de l'environnement de dev (docs/ENVIRONNEMENTS.md).
 */
import type { ConfigContext, ExpoConfig } from 'expo/config';

const NIGHT = '#0B0A14';
/**
 * Identité de l'app selon l'environnement, relue à chaque appel (les tests changent l'environnement).
 * `BLOWY_APP_ENV=dev` (profil EAS `dev`) : app « Minimoa Dev », branchée sur l'API et le Supabase de dev, installable à
 * côté de l'app publiée : son propre identifiant (`app.blowy.dev`), son icône marquée « DEV », son schéma `minimoa-dev`
 * et ses liens universels sur dev.minimoa.app seulement (docs/ENVIRONNEMENTS.md). Rien ne change pour les autres profils.
 */
function identity() {
  const APP_ENV: 'dev' | 'production' = process.env.BLOWY_APP_ENV === 'dev' ? 'dev' : 'production';
  const DEV = APP_ENV === 'dev';
  // Profil `dev` d'eas.json : la référence et la clé publiable du projet Supabase de dev sont à remplir avant un build.
  if (DEV && process.env.EAS_BUILD && /REMPLACER/.test(`${process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''} ${process.env.EXPO_PUBLIC_SUPABASE_KEY ?? ''}`)) {
    throw new Error('eas.json › build.dev : remplir EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_KEY du projet Supabase de dev (docs/ENVIRONNEMENTS.md).');
  }
  /**
   * L'app s'appelle Minimoa mais garde l'identifiant `app.blowy` (et les achats `app.blowy.plus.*`) : un identifiant
   * d'app ne se renomme pas sur l'App Store. Idem pour les clés `blowy.*` rangées sur l'appareil (session, brouillon).
   */
  const BUNDLE_ID = process.env.BLOWY_BUNDLE_ID ?? (DEV ? 'app.blowy.dev' : 'app.blowy');
  /** Liens universels (iOS) et liens d'app (Android) : docs/DEEPLINKS.md. `www` redirige vers le domaine nu. */
  const ASSOCIATED_DOMAINS = DEV ? ['dev.minimoa.app'] : ['minimoa.app', 'www.minimoa.app'];
  /**
   * Schémas : `minimoa` d'abord (celui que l'app fabrique, retour de connexion compris), `blowy` gardé pour les liens
   * déjà envoyés, les widgets et les anciens retours de connexion. App de dev : `minimoa-dev` seul (aucun lien de la
   * production ne l'ouvre, et elle n'ouvre jamais ceux de la production).
   */
  const SCHEMES = DEV ? ['minimoa-dev'] : ['minimoa', 'blowy'];
  /** Groupe d'apps partagé avec l'extension des widgets (état des widgets). À créer dans le portail Apple : docs/WIDGETS.md. */
  const APP_GROUP = `group.${BUNDLE_ID}`;
  /**
   * `BLOWY_WIDGETS=off` : build sans l'extension des widgets ni le groupe d'apps (cible `app.blowy.widget` absente).
   * Provisoire, tant qu'Apple refuse d'enregistrer de nouveaux identifiants pour l'équipe (contrats en attente). Le
   * profil `dev` le pose : un seul identifiant à créer (`app.blowy.dev`).
   */
  const WIDGETS = process.env.BLOWY_WIDGETS !== 'off';
  return { APP_ENV, DEV, BUNDLE_ID, ASSOCIATED_DOMAINS, SCHEMES, APP_GROUP, WIDGETS };
}
/** Chemins publics ouverts dans l'app (même liste que le site : apps/web/src/config/apple.ts). */
const APP_LINK_PREFIXES = ['/i/', '/m/', '/g/', '/c/', '/r/', '/l/'];
const APP_LINK_PAGES = ['/plus', '/defi', '/habitudes', '/carte'];
/** À coller après `eas init` (voir docs/TESTFLIGHT.md). */
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID ?? '01d6f37d-203a-4747-910b-6de4cfe50ed5';
const EXPO_OWNER = process.env.EXPO_OWNER ?? 'alexendre.o';
/** Identifiant d'équipe Apple (10 caractères) : utile à `@bacons/apple-targets` pour signer l'extension hors EAS. */
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID;
/**
 * Textes des autorisations iOS : une seule source, `./locales/fr.json` (français, langue source), repris tels quels dans
 * `Info.plist` ; chaque langue a son `InfoPlist.strings` par `locales` (hors français : la phrase française en attendant
 * la passe de traduction, docs/I18N.md). Seules ces quatre autorisations existent : `ios-release.test.ts` le vérifie.
 * `NSPhotoLibraryAddUsageDescription` : « Enregistrer l'image » de la feuille de partage (story d'invitation,
 * react-native-share) ; sans ce texte, iOS ferme l'app.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const IOS_TEXT = (require('./locales/fr.json') as { ios: Record<IosPurpose, string> }).ios;
type IosPurpose = 'NSCameraUsageDescription' | 'NSLocationWhenInUseUsageDescription' | 'NSPhotoLibraryUsageDescription' | 'NSPhotoLibraryAddUsageDescription';
const CAMERA_TEXT = IOS_TEXT.NSCameraUsageDescription;
const LOCATION_TEXT = IOS_TEXT.NSLocationWhenInUseUsageDescription;
const PHOTOS_TEXT = IOS_TEXT.NSPhotoLibraryUsageDescription;
const PHOTOS_ADD_TEXT = IOS_TEXT.NSPhotoLibraryAddUsageDescription;
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
 * « App Privacy » (docs/APP-STORE-CONNECT.md), toutes liées à la personne sauf l'identifiant d'appareil des statistiques
 * d'usage (Amplitude, seulement avec l'accord), aucune pour du pistage.
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
      // Statistiques d'usage (Amplitude), seulement avec l'accord : identifiant aléatoire de l'appareil, jamais relié au compte.
      ['DeviceID', ['Analytics'], false],
    ] as const
  ).map(([type, purposes, linked]: readonly [string, readonly string[], boolean?]) => ({
    NSPrivacyCollectedDataType: `NSPrivacyCollectedDataType${type}`,
    NSPrivacyCollectedDataTypeLinked: linked ?? true,
    NSPrivacyCollectedDataTypeTracking: false,
    NSPrivacyCollectedDataTypePurposes: purposes.map((p) => `NSPrivacyCollectedDataTypePurpose${p}`),
  })),
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const { APP_ENV, DEV, BUNDLE_ID, ASSOCIATED_DOMAINS, SCHEMES, APP_GROUP, WIDGETS } = identity();
  return {
  ...config,
  name: DEV ? 'Minimoa Dev' : 'Minimoa',
  slug: 'blowy',
  owner: EXPO_OWNER,
  version: '1.0.0',
  orientation: 'portrait',
  scheme: SCHEMES,
  userInterfaceStyle: 'dark',
  backgroundColor: NIGHT,
  icon: DEV ? './assets/images/icon-dev.png' : './assets/images/icon.png',
  runtimeVersion: { policy: 'appVersion' },
  ios: {
    // Icônes iOS 18 : claire, sombre (fond posé par le système), teintée.
    // App de dev : une seule icône, marquée « DEV » (assets/images/icon-dev.png).
    icon: DEV ? './assets/images/icon-dev.png' : { light: './assets/images/icon.png', dark: './assets/images/icon-dark.png', tinted: './assets/images/icon-tinted.png' },
    bundleIdentifier: BUNDLE_ID,
    ...(APPLE_TEAM_ID ? { appleTeamId: APPLE_TEAM_ID } : {}),
    supportsTablet: false,
    associatedDomains: ASSOCIATED_DOMAINS.map((d) => `applinks:${d}`),
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
      // Ajout seul (sans lecture) : l'image qu'on choisit d'enregistrer depuis la feuille de partage.
      NSPhotoLibraryAddUsageDescription: PHOTOS_ADD_TEXT,
      // Activités en direct (défi accepté, série d'un lien, sortie) : docs/WIDGETS.md.
      NSSupportsLiveActivities: true,
      // Partage de l'invitation en story : savoir si Instagram est là avant de lui passer l'image.
      LSApplicationQueriesSchemes: ['instagram-stories'],
    },
    privacyManifests: PRIVACY_MANIFEST,
  },
  android: {
    package: BUNDLE_ID,
    adaptiveIcon: { foregroundImage: './assets/images/adaptive-foreground.png', backgroundColor: '#7F32FC', monochromeImage: './assets/images/adaptive-monochrome.png' },
    // Liens d'app vérifiés : le site sert /.well-known/assetlinks.json (empreinte ANDROID_SHA256 du build du site).
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        category: ['BROWSABLE', 'DEFAULT'],
        data: ASSOCIATED_DOMAINS.flatMap((host) => [
          ...APP_LINK_PREFIXES.map((pathPrefix) => ({ scheme: 'https', host, pathPrefix })),
          ...APP_LINK_PAGES.map((path) => ({ scheme: 'https', host, path })),
        ]),
      },
    ],
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
  extra: { router: {}, appEnv: APP_ENV, eas: EAS_PROJECT_ID ? { projectId: EAS_PROJECT_ID } : {} },
  };
};
