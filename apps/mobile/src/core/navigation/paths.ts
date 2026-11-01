/**
 * Chemins Expo Router centralisés + résolution des liens entrants (universels, notifications,
 * widget). Logique pure, testée : un lien inconnu retombe sur le Nid.
 */
import type { OnboardingStep } from '../../features/onboarding/model/flow';

export const paths = {
  root: '/',
  onboarding: (step: OnboardingStep) => (step === 'paywall' ? '/paywall-step' : `/${step}`) as `/${string}`,
  vision: (step: 'school' | 'sunday' | 'passions' | 'limit') => `/vision/${step}` as const,
  invite: (code: string) => `/invite/${encodeURIComponent(code)}` as const,
  nest: '/nest',
  fiche: '/nest/fiche',
  shop: '/nest/shop',
  streak: '/nest/streak',
  mission: '/nest/mission',
  league: '/nest/league',
  chats: '/chats',
  conversation: (id: string) => `/chats/${encodeURIComponent(id)}` as const,
  linkTree: (relationshipId: string) => `/chats/link/${encodeURIComponent(relationshipId)}` as const,
  relation: (relationshipId: string, screen: RelationScreen) => `/chats/relation/${encodeURIComponent(relationshipId)}/${screen}` as const,
  noDates: '/chats/no-dates',
  map: '/map',
  neighborhood: '/neighborhood',
  friend: (id: string) => `/neighborhood/friend/${encodeURIComponent(id)}` as const,
  share: '/neighborhood/share',
  profile: '/profile',
  profileScreen: (s: ProfileScreen) => `/profile/${s}` as const,
  paywall: '/paywall',
  devLogin: '/dev-login',
} as const;

export type RelationScreen = 'move-in' | 'vote' | 'reveal' | 'irl' | 'egg' | 'birth' | 'custody' | 'leave' | 'pause';
export type ProfileScreen = 'account' | 'settings' | 'subscription' | 'privacy' | 'notifications' | 'report' | 'delete' | 'preferences';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Traduit une URL entrante (https://blowy.app/..., blowy://...) en route interne.
 * Formats : /invite/<code> · /r/<code> · /c/<conversationId> · /nest · /widget/pet · /widget/date/<relationshipId>.
 */
export function resolveIncomingUrl(url: string): string {
  let pathname: string;
  try {
    const u = new URL(url);
    pathname = u.protocol.startsWith('http') ? u.pathname : `/${u.host}${u.pathname}`;
  } catch {
    return paths.nest;
  }
  const parts = pathname.split('/').filter(Boolean);
  const [head, a, b] = parts;
  switch (head) {
    case 'invite':
    case 'r':
      return a && /^[A-Za-z0-9_-]{4,64}$/.test(a) ? paths.invite(a) : paths.root;
    case 'c':
      return a && UUID.test(a) ? paths.conversation(a) : paths.chats;
    case 'widget':
      if (a === 'date' && b && UUID.test(b)) return `${paths.nest}?relationship=${b}`;
      return paths.nest;
    case 'nest':
      return paths.nest;
    case 'streak':
      return paths.streak;
    default:
      return paths.nest;
  }
}
