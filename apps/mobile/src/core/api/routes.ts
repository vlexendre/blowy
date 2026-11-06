/**
 * Chemins REST v1 utilisés par le mobile V5 (spec-v5 §7). Source unique : les repositories et
 * les fixtures du mode démo les importent (aucun chemin écrit deux fois).
 * « non servi » = route décrite par la spec mais absente de l'API au 2026-11-06 : l'écran
 * affiche alors un état « indisponible » honnête (core/api/errors.ts → isUnavailable).
 */
const e = encodeURIComponent;

export const routes = {
  me: '/v1/me',
  meNeighborhood: '/v1/me/neighborhood',
  /** V5.5 (D-059) : indicateurs de ville arrondis (≥ 10). */
  cityInsights: '/v1/me/city-insights',
  neighborhoods: (q?: string) => `/v1/neighborhoods${q ? `?q=${e(q)}` : ''}`,
  intentions: '/v1/preferences/intentions',
  outingPrefs: '/v1/preferences/outings',
  privacy: '/v1/preferences/privacy',
  consents: '/v1/consents',
  onboardingComplete: '/v1/me/onboarding/complete',
  pauses: '/v1/pauses',
  pause: (id: string) => `/v1/pauses/${e(id)}`,
  verifications: '/v1/verifications',
  deletionRequests: '/v1/deletion-requests',
  reliability: '/v1/me/reliability',
  notificationSettings: '/v1/me/notifications/settings',
  exports: '/v1/exports',
  allowances: '/v1/me/allowances',
  products: '/v1/purchases/products',
  credits: '/v1/outing-credits',
  /** V5.4 §C10 : Blowy+ par Stripe (PaymentSheet) ; 501 tant que l'API applique V5.3 (achat intégré). */
  plusCheckout: '/v1/subscriptions/plus/checkout',
  plusCancel: '/v1/subscriptions/plus/cancel',
  subscriptionsMe: '/v1/subscriptions/me',
  /** V5.4 §A6 : évitement des contacts (protocole oprf-p256-v1 ; servi depuis 2026-11-06 06 h). */
  contactAvoidance: '/v1/me/contact-avoidance',
  pets: '/v1/pets',
  petMine: '/v1/pets/mine',
  /** Non servi (spec §7.4 « livré », absent du contrôleur pets au 2026-11-06). */
  petMemories: '/v1/pets/mine/memories',
  week: '/v1/outings/week',
  outingRequest: (weekKey: string) => `/v1/outings/requests/${e(weekKey)}`,
  outing: (id: string) => `/v1/outings/${e(id)}`,
  seatAccept: (id: string) => `/v1/outings/${e(id)}/seat/accept`,
  seatDecline: (id: string) => `/v1/outings/${e(id)}/seat/decline`,
  seatCancel: (id: string) => `/v1/outings/${e(id)}/seat/cancel`,
  seatCancelPreview: (id: string) => `/v1/outings/${e(id)}/seat/cancel-preview`,
  knowsSomeone: (id: string) => `/v1/outings/${e(id)}/seat/knows-someone`,
  checkIn: (id: string) => `/v1/outings/${e(id)}/check-in`,
  votes: (id: string) => `/v1/outings/${e(id)}/votes`,
  history: '/v1/outings/history',
  teamsMine: '/v1/teams/mine',
  teams: '/v1/teams',
  teamJoin: '/v1/teams/join',
  teamLeave: (id: string) => `/v1/teams/${e(id)}/leave`,
  band: '/v1/band',
  bandLeave: (linkId: string) => `/v1/band/${e(linkId)}/leave`,
  street: '/v1/band/street',
  streetArrangement: '/v1/band/street/arrangement',
  streetGifts: '/v1/band/street/gifts',
  duoLane: '/v1/duo-lane',
  duoAccept: (id: string) => `/v1/duo-lane/proposals/${e(id)}/accept`,
  duoPass: (id: string) => `/v1/duo-lane/proposals/${e(id)}/pass`,
  duos: '/v1/duos',
  duo: (id: string) => `/v1/duos/${e(id)}`,
  duoVenues: (id: string) => `/v1/duos/${e(id)}/venues`,
  duoDates: (id: string) => `/v1/duos/${e(id)}/dates`,
  duoDateAction: (id: string, dateId: string, action: 'respond' | 'cancel' | 'check-in') =>
    `/v1/duos/${e(id)}/dates/${e(dateId)}/${action}`,
  duoDateVote: (id: string, dateId: string) => `/v1/duos/${e(id)}/dates/${e(dateId)}/vote`,
  duoLeave: (id: string) => `/v1/duos/${e(id)}/leave`,
  duoEgg: (id: string) => `/v1/duos/${e(id)}/egg`,
  conversations: '/v1/conversations',
  messages: (id: string) => `/v1/conversations/${e(id)}/messages`,
  read: (id: string) => `/v1/conversations/${e(id)}/read`,
  guardianLinks: '/v1/safety/guardian-links',
  guardianLink: (id: string) => `/v1/safety/guardian-links/${e(id)}`,
  safetyStatus: (kind: string, id: string) =>
    `/v1/safety/status?subjectKind=${e(kind)}&subjectId=${e(id)}`,
  safetyOk: '/v1/safety/ok',
  safetyAlerts: '/v1/safety/alerts',
  safetyResolve: (id: string) => `/v1/safety/alerts/${e(id)}/resolve`,
  safetyLeave: '/v1/safety/leave',
  reports: '/v1/reports',
  blocks: '/v1/blocks',
  /** V5.6 : un nouveau lien par partage. */
  shareLinks: '/v1/share-links',
  myShareLinks: '/v1/me/share-links',
  /** Aperçu public d'une invitation (prénom de la personne qui invite, validité). */
  invitePreview: (ref: string) => `/v1/public/invites/${e(ref)}`,
} as const;
