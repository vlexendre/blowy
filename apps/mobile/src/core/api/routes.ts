/**
 * Table unique des routes REST v1 consommées par le mobile (famille §13). `live` = contrôleur
 * présent dans apps/api au 2026-11-01 ; les autres suivent les contrats publiés par C et
 * retombent en état « indisponible » tant que l'endpoint n'existe pas.
 */
const enc = encodeURIComponent;

export const routes = {
  auth: { sessions: '/v1/auth/sessions', current: '/v1/auth/sessions/current' },
  me: {
    self: '/v1/me',
    preferences: '/v1/preferences/matching',
    privacy: '/v1/preferences/privacy',
    consents: '/v1/consents',
    pauses: '/v1/pauses',
    pause: (id: string) => `/v1/pauses/${enc(id)}`,
    verifications: '/v1/verifications',
    completeOnboarding: '/v1/me/onboarding/complete',
    devices: '/v1/devices',
    exports: '/v1/exports',
    deletionRequests: '/v1/deletion-requests',
  },
  pets: {
    create: '/v1/pets',
    mine: '/v1/pets/me',
    action: (id: string) => `/v1/pets/${enc(id)}/actions`,
    move: (id: string) => `/v1/pets/${enc(id)}/move`,
  },
  matching: { feed: '/v1/matches', accept: (id: string) => `/v1/match-proposals/${enc(id)}/accept` },
  relationships: {
    list: '/v1/relationships',
    one: (id: string) => `/v1/relationships/${enc(id)}`,
    moveIn: (id: string) => `/v1/relationships/${enc(id)}/move-in`,
    respond: (id: string) => `/v1/relationships/${enc(id)}/consent`,
    ballot: (id: string) => `/v1/relationships/${enc(id)}/branch`,
    reveal: (id: string) => `/v1/relationships/${enc(id)}/reveal`,
    leave: (id: string) => `/v1/relationships/${enc(id)}/leave`,
    pause: (id: string) => `/v1/relationships/${enc(id)}/pause`,
  },
  conversations: {
    list: '/v1/conversations',
    messages: (id: string, cursor?: string | null) => `/v1/conversations/${enc(id)}/messages${cursor ? `?cursor=${enc(cursor)}` : ''}`,
    send: (id: string) => `/v1/conversations/${enc(id)}/messages`,
    read: (id: string) => `/v1/conversations/${enc(id)}/read`,
    reveal: (messageId: string) => `/v1/messages/${enc(messageId)}/reveal`,
    suggestions: (id: string) => `/v1/conversations/${enc(id)}/suggestions`,
  },
  trust: { reports: '/v1/reports', blocks: '/v1/blocks', safetyDates: '/v1/safety-dates', guardianInvitations: '/v1/guardian-invitations' },
  social: { friends: '/v1/friends', groups: '/v1/groups', referrals: '/v1/referrals', referral: (code: string) => `/v1/referrals/${enc(code)}`, league: '/v1/league' },
  missions: { today: '/v1/missions/today' },
  eggs: { current: '/v1/eggs/current', children: '/v1/children', custody: '/v1/custody' },
} as const;
