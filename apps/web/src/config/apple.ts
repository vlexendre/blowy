/**
 * Liens universels iOS (`/.well-known/apple-app-site-association`) : l'identifiant d'équipe Apple et l'identifiant de
 * l'app viennent des variables du build (Cloudflare Pages), jamais écrits en dur ni remplacés par un faux « TEAMID ».
 * - `APPLE_TEAM_ID` : 10 caractères, developer.apple.com › Membership (obligatoire en production) ;
 * - `BLOWY_BUNDLE_ID` : défaut `app.blowy` (le même que `apps/mobile/app.config.ts`).
 * Sans identifiant d'équipe valide, le fichier est servi sans aucune app (les liens s'ouvrent dans le navigateur) et le
 * build l'écrit en avertissement : à corriger avant la soumission (docs/APP-STORE-CONNECT.md).
 */
const env = (name: string): string | undefined => {
  const v = (import.meta.env as Record<string, string | undefined>)[name] ?? process.env[name];
  return v && v.trim() !== '' ? v.trim() : undefined;
};

export const APPLE_TEAM_ID = env('APPLE_TEAM_ID');
export const BUNDLE_ID = env('BLOWY_BUNDLE_ID') ?? 'app.blowy';
/** Identifiant d'équipe au bon format (10 caractères majuscules ou chiffres). */
export const teamIdValid = (id: string | undefined): id is string => !!id && /^[A-Z0-9]{10}$/.test(id);

/** Chemins ouverts dans l'app : invitation et « 3 mots ». */
export const APP_LINK_PATHS = [
  { '/': '/i/*', comment: 'invitation' },
  { '/': '/m/*', comment: '3 mots' },
] as const;

export function appSiteAssociation(teamId: string | undefined = APPLE_TEAM_ID, bundleId: string = BUNDLE_ID) {
  const appIDs = teamIdValid(teamId) ? [`${teamId}.${bundleId}`] : [];
  return { applinks: { details: [{ appIDs, components: APP_LINK_PATHS }] } };
}
