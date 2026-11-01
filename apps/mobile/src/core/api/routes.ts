/**
 * Routes REST v1 NON couvertes par BlowyClient (agent C) : appelées via `api.raw` avec
 * validation par le repository. Les routes pets/matching/relationships/conversations/me
 * passent exclusivement par `api.client`.
 */
const enc = encodeURIComponent;

export const rawRoutes = {
  me: { devices: '/v1/devices', exports: '/v1/exports', deletionRequests: '/v1/deletion-requests' },
  conversations: { suggestions: (id: string) => `/v1/conversations/${enc(id)}/suggestions` },
  trust: { reports: '/v1/reports', blocks: '/v1/blocks', safetyDates: '/v1/safety-dates' },
  social: { friends: '/v1/friends', groups: '/v1/groups', league: '/v1/league', referral: (code: string) => `/v1/referrals/${enc(code)}` },
  missions: { today: '/v1/missions/today' },
  eggs: { current: '/v1/eggs/current', children: '/v1/children', custody: '/v1/custody' },
} as const;
