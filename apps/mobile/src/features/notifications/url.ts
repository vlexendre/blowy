import type { Href } from 'expo-router';

/**
 * Un seul lecteur de liens pour les notifications (`PushData.url`), les liens universels (iOS), les liens d'app
 * (Android) et les schémas `minimoa://` / `blowy://` (docs/DEEPLINKS.md).
 *
 * Adresses publiques courtes (celles qu'on partage, servies aussi par le site quand l'app n'est pas installée) :
 * /i/<code> invitation · /m/<code> 3 mots · /g/<id> groupe · /r/<id> rencontre · /l/<id> lien · /plus Minimoa+ ·
 * /defi défi du jour · /habitudes · /carte. Les chemins internes de l'app (`link/<id>`, `pet/…`, `groupe/<id>`…), ceux
 * des notifications, passent tels quels.
 */

/** Schémas de l'app : `minimoa` (actuel), `blowy` (liens déjà envoyés, widgets, anciennes notifications). */
export const APP_SCHEMES = ['minimoa', 'blowy'] as const;
/** Domaines du site dont l'app ouvre les liens (`blowy.app` : anciennes notifications). */
export const WEB_HOSTS = ['minimoa.app', 'www.minimoa.app', 'blowy.app', 'www.blowy.app'] as const;

const ID = '[\\w-]{1,64}';
/** Adresse courte → chemin de l'app. */
const SHORT: readonly [RegExp, (id: string) => string][] = [
  [new RegExp(`^i/(${ID})/?$`), (c) => `/i/${c.toUpperCase()}`],
  [new RegExp(`^m/(${ID})/?$`), (c) => `/m/${c}`],
  [new RegExp(`^g/(${ID})/?$`), (id) => `/groupe/${id}`],
  [new RegExp(`^r/(${ID})/?$`), (id) => `/rencontre/${id}`],
  [new RegExp(`^l/(${ID})/?$`), (id) => `/link/${id}`],
  [/^plus\/?$/, () => '/moi/blowy-plus'],
  [/^defi\/?$/, () => '/pet/defi'],
  [/^habitudes\/?$/, () => '/pet/habitudes'],
  [/^carte\/?$/, () => '/carte'],
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
  return /^\/(groupe|rencontre|link|moi|pet|carte|chats|rencontres)(\/|$)/.test(p);
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
  if (!needsAccount(path)) return { open: /^\/[im]\//.test(path) ? path : url, park: null };
  if (opts.ready && !opts.initial) return { open: path, park: null };
  return { open: opts.initial ? '/' : '', park: path };
}
