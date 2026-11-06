/**
 * Chemins Expo Router V5 centralisés + résolution des liens entrants (universels, notifications).
 * Logique pure, testée : un lien inconnu retombe sur l'Accueil. Correspondance écran de maquette
 * → route : tooling/qa/visual/routes.v5.json.
 */
import type { OnboardingStep } from '../../features/onboarding';

const e = encodeURIComponent;

export const paths = {
  root: '/',
  onboarding: (step: OnboardingStep) =>
    (step === 'welcome' ? '/welcome' : `/start/${step}`) as `/${string}`,
  welcome: '/welcome',
  ageBlocked: '/start/age',
  account: '/account',
  verify: '/verify',
  verifyFailed: '/verify/failed',
  notifications: '/notifications',
  notificationsRefused: '/notifications/refused',
  found: '/found',
  waitlist: '/waitlist',
  notYet: '/not-yet',
  seeding: '/seeding',
  outing: (id: string) => `/outing/${e(id)}` as const,
  outingStep: (id: string, step: OutingStep) => `/outing/${e(id)}/${step}` as const,
  pay: (id: string) => `/outing/${e(id)}/pay` as const,
  home: '/home',
  chats: '/chats',
  chat: (conversationId: string) => `/chat/${e(conversationId)}` as const,
  chatMenu: (conversationId: string) => `/chat/${e(conversationId)}/menu` as const,
  band: '/band',
  street: '/band/street',
  leave: '/band/leave',
  duoLane: '/duo',
  duoChoice: '/duo/choice',
  duoProposal: (id: string) => `/duo/proposal?id=${e(id)}` as const,
  duo: (id: string) => `/duo/${e(id)}` as const,
  duoDate: (id: string) => `/duo/${e(id)}/date` as const,
  duoEgg: (id: string) => `/duo/${e(id)}/egg` as const,
  profile: '/profile',
  pet: '/profile/pet',
  story: '/profile/story',
  cards: '/profile/cards',
  settings: '/settings',
  pause: '/settings/pause',
  weeks: '/settings/weeks',
  refine: '/settings/refine',
  refineStory: '/settings/refine/story',
  refineAmbiance: '/settings/refine/ambiance',
  refineAge: '/settings/refine/age',
  avoid: '/settings/avoid',
  privacy: '/settings/privacy',
  report: '/settings/report',
  deleteAccount: '/settings/delete',
  pricing: '/settings/pricing',
  plus: '/settings/plus',
  plusOk: '/settings/plus/ok',
  share: (card: ShareCard) => `/share/${card}` as const,
  invite: (code: string) => `/invite/${e(code)}` as const,
  offline: '/offline',
  devLogin: '/dev-login',
} as const;

export type OutingStep =
  | 'team'
  | 'confirmation'
  | 'faces'
  | 'guardian'
  | 'checkin'
  | 'checked-in'
  | 'memory'
  | 'vote'
  | 'results'
  | 'pay'
  | 'pay-ok'
  | 'pay-failed'
  | 'cancelled'
  | 'full';
export type ShareCard =
  'invitation' | 'confirmation' | 'checkin' | 'jeudi' | 'soiree' | 'dimanche' | 'bande' | 'ville';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Traduit une URL entrante (https://blowy.app/..., blowy://...) en route interne.
 * Formats : /i/<code> (invitation personnelle) · /team/<code> · /c/<conversationId> · /o/<outingId>.
 */
export function resolveIncomingUrl(url: string): string {
  let pathname: string;
  try {
    const u = new URL(url);
    pathname = u.protocol.startsWith('http') ? u.pathname : `/${u.host}${u.pathname}`;
  } catch {
    return paths.home;
  }
  const [head, a] = pathname.split('/').filter(Boolean);
  switch (head) {
    case 'i':
    case 'team':
    case 'invite':
      return a && /^[A-Za-z0-9_-]{4,64}$/.test(a) ? paths.invite(a) : paths.root;
    case 'c':
      return a && UUID.test(a) ? paths.chat(a) : paths.chats;
    case 'o':
      return a && UUID.test(a) ? paths.outing(a) : paths.home;
    default:
      return paths.home;
  }
}
