import type { Href } from 'expo-router';

/**
 * Un seul lecteur de liens pour les notifications (`PushData.url`), les liens universels (iOS), les liens d'app
 * (Android) et les schémas `minimoa://` / `blowy://` (docs/DEEPLINKS.md).
 *
 * Adresses publiques courtes (celles qu'on partage, servies aussi par le site quand l'app n'est pas installée) :
 * /i/<code> invitation · /m/<code> 3 mots · /g/<id> groupe (membres) · /g/<code> lien d'invitation d'un groupe ·
 * /c/<code> code d'un créateur · /r/<id> rencontre · /l/<id> lien · /plus Minimoa+ · /defi défi du jour · /habitudes ·
 * /carte · /chemin (séance du jour) · /mots (ton lien « 3 mots » et ton résultat) · /quiz/<code> résultat du quiz du site · /quartier/<code> inscription
 * « Ouvre ton quartier ». `?ref=<code>` sur n'importe quel lien : code d'un créateur. Les chemins internes de l'app (`link/<id>`, `pet/…`, `groupe/<id>`…), ceux
 * des notifications, passent tels quels.
 */

/**
 * Schémas de l'app : `minimoa` (actuel), `blowy` (liens déjà envoyés, widgets, anciennes notifications), `minimoa-dev`
 * (app « Minimoa Dev », docs/ENVIRONNEMENTS.md). Seuls ceux d'app.config.ts parviennent à l'app ; lire les autres ne coûte rien.
 */
export const APP_SCHEMES = ['minimoa', 'blowy', 'minimoa-dev'] as const;
/** Domaines du site dont l'app ouvre les liens (`blowy.app` : anciennes notifications ; `dev.minimoa.app` : le dev). */
export const WEB_HOSTS = ['minimoa.app', 'www.minimoa.app', 'blowy.app', 'www.blowy.app', 'dev.minimoa.app'] as const;

const ID = '[\\w-]{1,64}';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Adresse courte → chemin de l'app. */
const SHORT: readonly [RegExp, (id: string) => string][] = [
  [new RegExp(`^i/(${ID})/?$`), (c) => `/i/${c.toUpperCase()}`],
  [new RegExp(`^m/(${ID})/?$`), (c) => `/m/${c}`],
  // Un identifiant : le groupe (membres) ; un code court : la page « rejoindre » du lien d'invitation.
  [new RegExp(`^g/(${ID})/?$`), (id) => (UUID.test(id) ? `/groupe/${id}` : `/g/${id.toUpperCase()}`)],
  // Code d'un créateur : gardé comme source d'arrivée (`attributionFromUrl`), puis l'accueil.
  [new RegExp(`^c/(${ID})/?$`), () => '/'],
  [/^mots\/?$/, () => '/mots'],
  // Résultat du quiz du site et inscription « Ouvre ton quartier » : repris par l'inscription (docs/VIRALITE.md).
  [new RegExp(`^quiz/(${ID})/?$`), (c) => `/quiz/${c.toUpperCase()}`],
  [new RegExp(`^quartier/(${ID})/?$`), (c) => `/quartier/${c.toUpperCase()}`],
  [new RegExp(`^r/(${ID})/?$`), (id) => `/rencontre/${id}`],
  [new RegExp(`^l/(${ID})/?$`), (id) => `/link/${id}`],
  [/^plus\/?$/, () => '/moi/blowy-plus'],
  [/^defi\/?$/, () => '/pet/defi'],
  [/^habitudes\/?$/, () => '/pet/habitudes'],
  [/^carte\/?$/, () => '/carte'],
  // Rappel du matin de Ton chemin (docs/CHEMIN.md) : l'accueil, ouvert sur la séance du jour.
  [/^chemin\/?$/, () => '/pet?chemin=1'],
];

/** Chemin (sans « / » de tête, requête comprise) d'un lien de l'app ou du site ; null pour tout autre lien. */
function rawPath(url: string): string | null {
  const u = url.trim();
  const scheme = /^([a-z][a-z0-9+.-]*):\/\/(.*)$/i.exec(u);
  if (!scheme) return null;
  const [, name = '', rest = ''] = scheme;
  const lower = name.toLowerCase();
  if ((APP_SCHEMES as readonly string[]).includes(lower)) return rest.replace(/^\/+/, '');
  if (lower !== 'https' && lower !== 'http') return null;
  const m = /^([^/?#]+)(.*)$/.exec(rest);
  const host = (m?.[1] ?? '').toLowerCase();
  if (!(WEB_HOSTS as readonly string[]).includes(host)) return null;
  return (m?.[2] ?? '').replace(/^\/+/, '');
}

/**
 * Chemin de l'app pour un lien (notification, lien universel, schéma de l'app). Null si le lien est illisible ou
 * vient d'ailleurs.
 */
export function appPathFromUrl(url: string): Href | null {
  const raw = rawPath(url);
  if (raw === null) return null;
  const path = raw.replace(/#.*$/, '');
  if (!/^[\w\-/.?=&%]*$/.test(path)) return null;
  const [pathname = '', query] = path.split('?', 2);
  for (const [re, to] of SHORT) {
    const m = re.exec(pathname);
    if (m) return `${to(m[1] ?? '')}${query ? `?${query}` : ''}` as Href;
  }
  return `/${path}` as Href;
}

/** Lien profond d'une notification (même lecteur que les liens universels). */
export const pathFromPushUrl = appPathFromUrl;

/**
 * Le chemin mène à un écran qui demande un compte prêt (inscription finie) : il attend la fin de l'inscription
 * (docs/DEEPLINKS.md). L'invitation, les 3 mots, le retour de connexion et l'inscription gèrent la session eux-mêmes.
 */
export function needsAccount(path: string): boolean {
  const p = path.split('?')[0] ?? '';
  return /^\/(groupe|g|mots|rencontre|link|moi|pet|carte|chats|rencontres|chemin)(\/|$)/.test(p);
}

/**
 * Lien reçu par le système (`+native-intent`) : `open` est ce qu'expo-router ouvre tout de suite (« » : rien),
 * `park` le chemin gardé pour après l'inscription ou le démarrage. Démarrage à froid (`initial`) : la session n'est
 * pas encore lue, on passe par l'aiguillage (« / ») et les onglets ouvrent ensuite le chemin gardé.
 */
export function routeIncomingUrl(url: string, opts: { initial: boolean; ready: boolean }): { open: string; park: string | null } {
  const target = appPathFromUrl(url);
  if (!target) return { open: url, park: null };
  const path = String(target);
  // Invitation, 3 mots, code d'un créateur (l'accueil) : l'écran gère la session lui-même.
  if (!needsAccount(path)) return { open: /^\/(i|m|quiz|quartier)\//.test(path) || path === '/' ? path : url, park: null };
  if (opts.ready && !opts.initial) return { open: path, park: null };
  return { open: opts.initial ? '/' : '', park: path };
}

export type LinkAttribution = { source: 'creator' | 'words' | 'group' | 'invite' | 'quiz' | 'quartier'; ref: string };
const CODE = /^[A-Za-z0-9_-]{3,32}$/;

/**
 * D'où vient la personne, d'après un lien ouvert (docs/VIRALITE.md) : `?ref=<code>` ou `/c/<code>` (créateur), `/m/<code>`
 * (« 3 mots »), `/g/<code>` (lien d'un groupe), `/i/<code>` (invitation). Null pour tout autre lien. Rien d'autre n'est lu
 * sur l'appareil (aucune empreinte).
 */
export function attributionFromUrl(url: string): LinkAttribution | null {
  const raw = rawPath(url);
  if (raw === null) return null;
  const [pathname = '', query = ''] = raw.replace(/#.*$/, '').split('?', 2);
  // Résultat du quiz, inscription au quartier : la page elle-même dit d'où vient la personne.
  const web = /^(quiz|quartier)\/([A-Za-z0-9]{6,12})\/?$/.exec(pathname);
  if (web?.[2]) return { source: web[1] as 'quiz' | 'quartier', ref: web[2].toUpperCase() };
  const ref = new URLSearchParams(query).get('ref');
  if (ref && CODE.test(ref)) return { source: 'creator', ref: ref.toUpperCase() };
  const m = /^(c|m|g|i)\/([\w-]{3,64})\/?$/.exec(pathname);
  if (!m || !m[2] || !CODE.test(m[2])) return null;
  const code = m[2];
  if (m[1] === 'g' && UUID.test(code)) return null;
  const source = ({ c: 'creator', m: 'words', g: 'group', i: 'invite' } as const)[m[1] as 'c' | 'm' | 'g' | 'i'];
  return { source, ref: m[1] === 'm' ? code : code.toUpperCase() };
}
