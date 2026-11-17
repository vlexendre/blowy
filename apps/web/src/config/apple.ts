/**
 * Liens universels iOS (`/.well-known/apple-app-site-association`, aussi servi à `/apple-app-site-association`) et liens
 * d'app Android (`/.well-known/assetlinks.json`). Identifiants lus dans les variables du build (Cloudflare Pages),
 * jamais écrits en dur ni remplacés par un faux « TEAMID » :
 * - `APPLE_TEAM_ID` : 10 caractères, developer.apple.com › Membership (obligatoire en production) ;
 * - `BLOWY_BUNDLE_ID` : défaut `app.blowy` (le même que `apps/mobile/app.config.ts` ; l'app s'appelle Minimoa mais
 *   son identifiant ne change pas) ;
 * - `ANDROID_SHA256` : empreintes SHA-256 du certificat de signature Android, séparées par des virgules.
 * Sans identifiant d'équipe valide, le fichier est servi sans aucune app (les liens s'ouvrent dans le navigateur) et le
 * build l'écrit en avertissement : à corriger avant la soumission (docs/DEEPLINKS.md).
 */
const env = (name: string): string | undefined => {
  const v = (import.meta.env as Record<string, string | undefined>)[name] ?? process.env[name];
  return v && v.trim() !== '' ? v.trim() : undefined;
};

export const APPLE_TEAM_ID = env('APPLE_TEAM_ID');
export const BUNDLE_ID = env('BLOWY_BUNDLE_ID') ?? 'app.blowy';
export const ANDROID_PACKAGE = env('BLOWY_BUNDLE_ID') ?? 'app.blowy';
export const ANDROID_SHA256 = env('ANDROID_SHA256');
/** Identifiant d'équipe au bon format (10 caractères majuscules ou chiffres). */
export const teamIdValid = (id: string | undefined): id is string => !!id && /^[A-Z0-9]{10}$/.test(id);

interface Component {
  '/': string;
  '?'?: Record<string, string>;
  exclude?: boolean;
  comment: string;
}

/**
 * Chemins ouverts dans l'app (même liste que `apps/mobile/app.config.ts` et `src/features/notifications/url.ts`).
 * Les exclusions passent d'abord : Apple prend la première règle qui correspond.
 */
export const APP_LINK_PATHS: readonly Component[] = [
  { '/': '/legal/*', exclude: true, comment: 'pages légales' },
  { '/': '/_astro/*', exclude: true, comment: 'fichiers du site' },
  { '/': '/img/*', exclude: true, comment: 'images du site' },
  { '/': '/m/*', '?': { web: '1' }, exclude: true, comment: '3 mots ouvert depuis l’app : vote sur le site' },
  { '/': '/i/*', comment: 'invitation' },
  { '/': '/m/*', comment: '3 mots' },
  { '/': '/g/*', comment: 'groupe (membres)' },
  { '/': '/r/*', comment: 'rencontre' },
  { '/': '/l/*', comment: 'lien (conversation)' },
  { '/': '/plus', comment: 'Minimoa+' },
  { '/': '/plus/', comment: 'Minimoa+' },
  { '/': '/defi', comment: 'défi du jour' },
  { '/': '/defi/', comment: 'défi du jour' },
  { '/': '/habitudes', comment: 'habitudes' },
  { '/': '/habitudes/', comment: 'habitudes' },
  { '/': '/carte', comment: 'carte' },
  { '/': '/carte/', comment: 'carte' },
];

export function appSiteAssociation(teamId: string | undefined = APPLE_TEAM_ID, bundleId: string = BUNDLE_ID) {
  const appIDs = teamIdValid(teamId) ? [`${teamId}.${bundleId}`] : [];
  return { applinks: { details: [{ appIDs, components: APP_LINK_PATHS }] } };
}

/** Empreinte SHA-256 au format attendu par Android (32 octets en hexadécimal, séparés par « : »). */
const fingerprintValid = (f: string): boolean => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(f);

export function androidAssetLinks(sha256: string | undefined = ANDROID_SHA256, pkg: string = ANDROID_PACKAGE) {
  const fingerprints = (sha256 ?? '')
    .split(',')
    .map((f) => f.trim().toUpperCase())
    .filter(fingerprintValid);
  if (fingerprints.length === 0) return [];
  return [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: { namespace: 'android_app', package_name: pkg, sha256_cert_fingerprints: fingerprints },
    },
  ];
}
