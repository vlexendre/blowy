/**
 * Scénarios du mode démo local : un par état de maquette V5 (voir tooling/qa/visual/routes.v5.json).
 * `now` = instant de la maquette (`facts.json › ecrans`), `routes` = réponses des routes du contrat.
 */
import type { OnboardingDraft } from '../../features/onboarding';
import type { DevicePrefs } from '../../features/settings';
import { routes as R } from '../api/routes';
import { DEMO_OFFLINE, DEMO_PENDING, type DemoRoute } from './demo-fetch';
import * as W from './world';

export interface DemoScenario {
  name: string;
  now: string;
  session: { token: string; userId: string; expiresAt: string } | null;
  draft?: Partial<OnboardingDraft>;
  devicePrefs?: Partial<DevicePrefs>;
  routes: DemoRoute[];
}

const get = (path: string, respond: unknown): DemoRoute => ({ method: 'GET', path, respond });
const any = (
  method: DemoRoute['method'],
  path: string,
  respond: unknown = undefined,
): DemoRoute => ({ method, path, respond });
const alexSession = {
  token: 'demo-session-token-alex',
  userId: W.IDS.alex,
  expiresAt: '2027-01-01T00:00:00.000Z',
};

interface WorldOpts {
  phase?: W.Phase1;
  hood?: W.DemoHood;
  convs?: 'monday' | 'sunday';
  band?: 'before' | 'after';
  firstFree?: boolean;
  duo?: 'exchange' | 'unlocked' | 'date';
  weekPhase?: W.Phase1 | 'none' | 'waitlist';
}

/** Routes communes d'Alex (Paris 11e) ; les surcharges du scénario passent en premier. */
function world(o: WorldOpts = {}): DemoRoute[] {
  const phase = o.phase ?? 'going';
  return [
    get(R.me, W.me()),
    get(R.petMine, W.myPet),
    get(R.meNeighborhood, W.neighborhood(o.hood ?? 'paris')),
    get(
      '/v1/neighborhoods',
      o.hood === 'bordeaux' ? W.neighborhoodList.bordeaux : W.neighborhoodList.paris,
    ),
    get(R.week, W.week(o.weekPhase ?? phase)),
    get(R.outing(W.IDS.outing1), W.outing1(phase)),
    get(R.votes(W.IDS.outing1), W.votes1(phase === 'closed')),
    get(R.conversations, W.conversations(o.convs ?? 'monday')),
    get(R.messages(W.IDS.convOuting), {
      items: [...W.MESSAGES.outing].reverse(),
      nextCursor: null,
    }),
    get(R.messages(W.IDS.convTom), { items: W.MESSAGES.tom, nextCursor: null }),
    get(R.messages(W.IDS.convJade), { items: [...W.MESSAGES.jade].reverse(), nextCursor: null }),
    get(R.allowances, W.allowances(o.firstFree ?? true)),
    get(R.products, W.products),
    get(R.teamsMine, W.team),
    get(R.band, W.band(o.band ?? 'before')),
    get(R.street, W.street),
    get(R.duos, { items: [W.duoJade(o.duo ?? 'exchange')] }),
    get(R.duo(W.IDS.duoJade), W.duoJade(o.duo ?? 'exchange')),
    get(R.duoLane, W.lane),
    get(R.reliability, { attended: 1, total: 1, newcomer: false }),
    get('/v1/safety/status', W.safetyStatus(phase === 'checkin' || phase === 'checkedIn')),
    get(R.guardianLinks, { items: [] }),
    get(R.intentions, W.intentions),
    get(R.outingPrefs, W.outingPrefs),
    get(R.petMemories, W.memories),
    get(R.consents, W.consents),
    get(R.notificationSettings, W.notificationSettings),
    any('POST', '/v1/conversations/:id/read', { ok: true }),
    any('POST', R.shareLinks, W.shareLink),
  ];
}

type Def = Omit<DemoScenario, 'name' | 'session' | 'routes'> & {
  session?: DemoScenario['session'];
  routes?: DemoRoute[];
  world?: WorldOpts | null;
};

const DEFS: Record<string, Def> = {
  // ---- Onboarding (déconnecté : brouillon local)
  welcome: { now: W.paris('2026-11-09T20:30'), session: null, world: null },
  ville: {
    now: W.paris('2026-11-09T20:31'),
    session: null,
    world: null,
    draft: {
      step: 'city',
      city: {
        query: 'Paris 11e',
        neighborhoodId: W.IDS.hoodParis11,
        name: 'Paris 11e',
        live: true,
      },
    },
    routes: [get('/v1/neighborhoods', W.neighborhoodList.paris)],
  },
  'ville-nantes': {
    now: W.paris('2026-11-09T20:31'),
    session: null,
    world: null,
    draft: {
      step: 'city',
      city: { query: 'Nantes', neighborhoodId: W.IDS.hoodNantes, name: 'Nantes', live: false },
    },
    routes: [get('/v1/neighborhoods', W.neighborhoodList.nantes)],
  },
  'ville-bordeaux': {
    now: W.paris('2026-11-09T20:31'),
    session: null,
    world: null,
    draft: {
      step: 'city',
      city: {
        query: 'Bordeaux',
        neighborhoodId: W.IDS.hoodBordeaux,
        name: 'Bordeaux',
        live: false,
      },
    },
    routes: [get('/v1/neighborhoods', W.neighborhoodList.bordeaux)],
  },
  naissance: {
    now: W.paris('2026-11-09T20:32'),
    session: null,
    world: null,
    draft: { step: 'birthdate' },
  },
  genre: {
    now: W.paris('2026-11-09T20:33'),
    session: null,
    world: null,
    draft: { step: 'gender' },
  },
  pet: { now: W.paris('2026-11-09T20:34'), session: null, world: null, draft: { step: 'pet' } },
  rencontrer: {
    now: W.paris('2026-11-09T20:35'),
    session: null,
    world: null,
    draft: { step: 'meet' },
  },
  intention: {
    now: W.paris('2026-11-09T20:36'),
    session: null,
    world: null,
    draft: { step: 'looking', meetingMode: 'BOTH' },
  },
  consentement: {
    now: W.paris('2026-11-09T20:37'),
    session: null,
    world: null,
    draft: { step: 'consent', lookingFor: 'BOTH' },
  },
  histoire: {
    now: W.paris('2026-11-09T20:38'),
    session: null,
    world: null,
    draft: { step: 'story', lookingFor: 'BOTH', sensitiveConsent: true },
  },
  creneaux: {
    now: W.paris('2026-11-09T20:40'),
    session: null,
    world: null,
    draft: { step: 'slots', lookingFor: 'BOTH', sensitiveConsent: true },
  },
  age: { now: W.paris('2026-11-09T20:41'), session: null, world: null },
  semaines: {
    now: W.paris('2026-11-09T20:40'),
    session: null,
    world: null,
    draft: { step: 'slots', weeksOff: true },
  },
  // ---- Sortie de la semaine
  trouvee: { now: W.paris('2026-11-09T21:05'), world: { phase: 'invited' } },
  sortie: { now: W.paris('2026-11-09T21:10'), world: { phase: 'invitedTeam' } },
  team: { now: W.paris('2026-11-09T21:08'), world: { phase: 'invitedTeam' } },
  inscrit: { now: W.paris('2026-11-09T21:15'), world: { phase: 'going' } },
  accueil: { now: W.paris('2026-11-09T22:00'), world: { phase: 'going' } },
  'accueil-discret': {
    now: W.paris('2026-11-09T22:00'),
    world: { phase: 'going' },
    devicePrefs: { discreet: true },
  },
  'accueil-duo': {
    now: W.paris('2026-11-09T22:00'),
    world: { phase: 'going' },
    routes: [
      get(R.intentions, {
        lookingFor: 'BOTH',
        storySeriousness: null,
        kidsSomeday: null,
        meetingMode: 'DUO',
        meetGenders: [],
        romanceGenders: ['WOMAN'],
      }),
    ],
  },
  pause: { now: W.paris('2026-11-09T22:00'), world: { phase: 'going' } },
  confirmation: { now: W.paris('2026-11-11T18:05'), world: { phase: 'confirmed' } },
  visages: { now: W.paris('2026-11-12T16:35'), world: { phase: 'faces' } },
  checkin: { now: W.paris('2026-11-12T19:28'), world: { phase: 'checkin' } },
  'checkin-ok': {
    now: W.paris('2026-11-12T19:40'),
    world: { phase: 'checkedIn' },
    devicePrefs: { lastGuardian: 'Sam' },
    routes: [get('/v1/safety/status', W.safetyStatus(true, 1))],
  },
  ange: {
    now: W.paris('2026-11-09T21:20'),
    world: { phase: 'going' },
    devicePrefs: {
      recentGuardians: [
        { name: 'Sam', note: 'par SMS · ton coloc' },
        { name: 'Maman', note: 'par WhatsApp' },
      ],
    },
  },
  souvenir: { now: W.paris('2026-11-12T21:40'), world: { phase: 'done' } },
  vote: { now: W.paris('2026-11-13T09:00'), world: { phase: 'done' } },
  resultats: {
    now: W.paris('2026-11-15T21:30'),
    world: { phase: 'closed', convs: 'sunday', band: 'after' },
  },
  'resultats-aucun': {
    now: W.paris('2026-11-15T21:30'),
    world: { phase: 'closed' },
    routes: [
      get(R.votes(W.IDS.outing1), W.votes1(true, 'none')),
      get(R.week, { ...W.week('invited'), myOutingId: W.IDS.outing2 }),
      get(R.outing(W.IDS.outing2), W.outing2()),
    ],
  },
  duo: {
    now: W.paris('2026-11-09T22:00'),
    world: { phase: 'going' },
    routes: [
      get(R.cityInsights, {
        asOf: '2026-11-09',
        storyCompatible: { approx: 'ABOUT_THIRTY', label: 'une trentaine de personnes' },
        ageBrackets: [],
      }),
    ],
  },
  'duo-choix': { now: W.paris('2026-11-09T22:00'), world: { phase: 'going' } },
  lien: { now: W.paris('2026-11-09T22:00'), world: { phase: 'going', duo: 'exchange' } },
  'lien-debloque': { now: W.paris('2026-11-11T21:35'), world: { phase: 'going', duo: 'unlocked' } },
  rdvduo: {
    now: W.paris('2026-11-11T21:40'),
    world: { phase: 'going' },
    devicePrefs: {
      recentGuardians: [
        { name: 'Sam', note: 'par SMS · ton coloc' },
        { name: 'Maman', note: 'par WhatsApp' },
      ],
    },
    routes: [get(R.duo(W.IDS.duoJade), W.duoJadeDate())],
  },
  chat: {
    now: W.paris('2026-11-15T22:00'),
    world: { phase: 'closed', convs: 'sunday', band: 'after' },
    routes: [
      get(R.duos, { items: [W.duoLea()] }),
      get(R.messages(W.IDS.convLea), { items: [...W.leaMessages].reverse(), nextCursor: null }),
    ],
  },
  'rdvduo-lea': {
    now: W.paris('2026-11-15T22:10'),
    world: { phase: 'closed', convs: 'sunday', band: 'after' },
    devicePrefs: {
      recentGuardians: [
        { name: 'Sam', note: 'par SMS · ton coloc' },
        { name: 'Maman', note: 'par WhatsApp' },
      ],
    },
    routes: [get(R.duo(W.IDS.duoLea), W.duoLea(true))],
  },
  oeuf: {
    now: W.paris('2026-11-15T22:15'),
    world: { phase: 'closed' },
    routes: [get(R.duo(W.IDS.duoLea), W.duoLea())],
  },
  rupture: {
    now: W.paris('2026-11-15T22:20'),
    world: { phase: 'closed' },
    routes: [get(R.duos, { items: [W.duoLea()] })],
  },
  // ---- Profil, réglages, paiement, partage (T7)
  profil: {
    now: W.paris('2026-11-15T22:00'),
    world: { phase: 'closed', convs: 'sunday', band: 'after' },
  },
  fiche: {
    now: W.paris('2026-11-15T22:00'),
    world: { phase: 'closed', convs: 'sunday', band: 'after' },
  },
  reglages: {
    now: W.paris('2026-11-16T10:00'),
    world: { phase: 'closed', convs: 'sunday', band: 'after' },
    draft: { completed: true, slots: ['thu_evening', 'sat_afternoon'] },
  },
  confidentialite: { now: W.paris('2026-11-16T10:00'), world: { phase: 'closed', band: 'after' } },
  signaler: { now: W.paris('2026-11-10T19:00'), world: { phase: 'going' } },
  supprimer: {
    now: W.paris('2026-11-16T10:00'),
    world: { phase: 'closed', band: 'after' },
    routes: [
      get(R.week, { ...W.week('going'), myOutingId: W.IDS.outing2 }),
      get(R.outing(W.IDS.outing2), W.outing2Seat('CONFIRMED')),
    ],
  },
  affiner: { now: W.paris('2026-11-16T10:00'), world: { phase: 'closed', band: 'after' } },
  'affiner-age': {
    now: W.paris('2026-11-16T10:00'),
    world: { phase: 'closed', band: 'after' },
    routes: [get(R.intentions, { ...W.intentions, storyAgeBrackets: ['30_34'] })],
  },
  'affiner-histoire': {
    now: W.paris('2026-11-16T10:00'),
    world: { phase: 'closed', band: 'after' },
  },
  eviter: { now: W.paris('2026-11-16T10:00'), world: { phase: 'closed', band: 'after' } },
  tarifs: {
    now: W.paris('2026-11-16T10:00'),
    world: { phase: 'closed', band: 'after', firstFree: false },
  },
  abonnement: {
    now: W.paris('2026-11-16T10:00'),
    world: { phase: 'closed', band: 'after', firstFree: false },
    routes: [any('POST', R.plusCheckout, W.plusCheckout)],
  },
  paiement: {
    now: W.paris('2026-11-16T10:00'),
    world: { phase: 'closed', band: 'after', firstFree: false },
    routes: [
      get(R.week, { ...W.week('invited'), myOutingId: W.IDS.outing2 }),
      get(R.outing(W.IDS.outing2), W.outing2()),
      any('POST', R.seatAccept(W.IDS.outing2), W.seatAcceptPay),
    ],
  },
  'paiement-ok': {
    now: W.paris('2026-11-16T10:01'),
    world: { phase: 'closed', band: 'after', firstFree: false },
    routes: [
      get(R.week, { ...W.week('going'), myOutingId: W.IDS.outing2 }),
      get(R.outing(W.IDS.outing2), W.outing2Seat('CONFIRMED')),
    ],
  },
  'paiement-echec': {
    now: W.paris('2026-11-16T10:01'),
    world: { phase: 'closed', band: 'after', firstFree: false },
    routes: [
      get(R.week, { ...W.week('invited'), myOutingId: W.IDS.outing2 }),
      get(R.outing(W.IDS.outing2), W.outing2Seat('HELD')),
    ],
  },
  story: { now: W.paris('2026-11-15T22:00'), world: { phase: 'closed', band: 'after' } },
  invite: {
    now: W.paris('2026-11-10T12:00'),
    session: null,
    world: null,
    routes: [
      get(R.invitePreview('r8Tz4w'), {
        valid: true,
        reason: null,
        inviter: { displayName: 'Alex', petName: 'Nino', species: 'NINO' },
        code: 'r8Tz4w',
        rewardCoins: { referrer: 0, referee: 0 },
        expiresAt: null,
      }),
    ],
  },
  'partage-invitation': {
    now: W.paris('2026-11-09T21:08'),
    world: { phase: 'invitedTeam' },
    routes: [any('POST', R.teams, W.team)],
  },
  'partage-confirmation': { now: W.paris('2026-11-11T18:10'), world: { phase: 'confirmed' } },
  'partage-checkin': { now: W.paris('2026-11-12T16:40'), world: { phase: 'faces' } },
  'partage-soiree': { now: W.paris('2026-11-13T10:00'), world: { phase: 'done' } },
  'partage-dimanche': {
    now: W.paris('2026-11-15T21:35'),
    world: { phase: 'closed', convs: 'sunday', band: 'after' },
  },
  'partage-ville': {
    now: W.paris('2026-11-09T21:06'),
    world: { hood: 'bordeaux', weekPhase: 'waitlist' },
  },
  // ---- V5.5 : Lyon et Saint-Denis (même gabarit), état honnête, Affiner, duo homme-homme
  'trouvee-lyon': {
    now: W.paris('2026-11-09T21:05'),
    world: { phase: 'invited', hood: 'lyon' },
    routes: [
      get(R.week, W.weekAway('lyon', 'invited')),
      get(R.outing(W.IDS.outingLyon), W.outingAway('lyon', 'invited')),
      get(R.outingPrefs, { ...W.outingPrefs, ambiance: 'ANY', maxTravelMinutes: 20 }),
    ],
  },
  'sortie-lyon': {
    now: W.paris('2026-11-09T21:10'),
    world: { phase: 'invitedTeam', hood: 'lyon' },
    routes: [
      get(R.week, W.weekAway('lyon', 'invitedTeam')),
      get(R.outing(W.IDS.outingLyon), W.outingAway('lyon', 'invitedTeam')),
    ],
  },
  'confirmation-lyon': {
    now: W.paris('2026-11-16T18:05'),
    world: { phase: 'confirmed', hood: 'lyon' },
    routes: [
      get(R.week, W.weekAway('lyon', 'confirmed')),
      get(R.outing(W.IDS.outingLyon), W.outingAway('lyon', 'confirmed')),
    ],
  },
  'trouvee-banlieue': {
    now: W.paris('2026-11-16T21:05'),
    world: { phase: 'invited', hood: 'saintdenis' },
    routes: [
      get(R.week, W.weekAway('banlieue', 'invited')),
      get(R.outing(W.IDS.outingBanlieue), W.outingAway('banlieue', 'invited')),
      get(R.outingPrefs, { ...W.outingPrefs, ambiance: 'ANY', maxTravelMinutes: 20 }),
    ],
  },
  'sortie-banlieue': {
    now: W.paris('2026-11-16T21:10'),
    world: { phase: 'invitedTeam', hood: 'saintdenis' },
    routes: [
      get(R.week, W.weekAway('banlieue', 'invitedTeam')),
      get(R.outing(W.IDS.outingBanlieue), W.outingAway('banlieue', 'invitedTeam')),
    ],
  },
  'confirmation-banlieue': {
    now: W.paris('2026-11-18T18:05'),
    world: { phase: 'confirmed', hood: 'saintdenis' },
    routes: [
      get(R.week, W.weekAway('banlieue', 'confirmed')),
      get(R.outing(W.IDS.outingBanlieue), W.outingAway('banlieue', 'confirmed')),
    ],
  },
  'pas-encore': {
    now: W.paris('2026-11-09T21:05'),
    world: { hood: 'marseille', weekPhase: 'none' },
    routes: [
      get(R.week, W.weekNotYet()),
      get(R.cityInsights, {
        asOf: '2026-11-09',
        storyCompatible: { notEnough: true },
        ageBrackets: [],
      }),
    ],
  },
  'trouvee-nantes': {
    now: W.paris('2026-11-16T21:05'),
    world: { phase: 'invited', hood: 'nantes' },
    routes: [
      get(R.week, W.weekAway('nantes', 'invited')),
      get(R.outing(W.IDS.outingNantes), W.outingAway('nantes', 'invited')),
      get(R.outingPrefs, { ...W.outingPrefs, ambiance: 'ANY', maxTravelMinutes: 20 }),
    ],
  },
  'sortie-nantes': {
    now: W.paris('2026-11-16T21:10'),
    world: { phase: 'invitedTeam', hood: 'nantes' },
    routes: [
      get(R.week, W.weekAway('nantes', 'invitedTeam')),
      get(R.outing(W.IDS.outingNantes), W.outingAway('nantes', 'invitedTeam')),
    ],
  },
  'pas-encore-nantes': {
    now: W.paris('2026-11-16T21:05'),
    world: { hood: 'nantes', weekPhase: 'none' },
    routes: [
      get(R.week, W.weekNotYet()),
      get(R.cityInsights, {
        asOf: '2026-11-16',
        storyCompatible: { approx: 'ABOUT_TWENTY', label: 'une vingtaine' },
        ageBrackets: [],
      }),
    ],
  },
  'duo-hh-proposition': {
    now: W.paris('2026-11-09T21:00'),
    world: { phase: 'going', hood: 'marseille' },
    routes: [
      get(R.me, W.me({ displayName: 'Yanis' })),
      get(R.petMine, { ...W.myPet, name: 'Gaston', species: 'GASTON' }),
      get(R.duos, { items: [] }),
      get(R.duoLane, W.laneKarim),
    ],
  },
  'duo-hh-visages': {
    now: W.paris('2026-11-11T22:00'),
    world: { phase: 'going', hood: 'marseille' },
    routes: [
      get(R.me, W.me({ displayName: 'Yanis' })),
      get(R.petMine, { ...W.myPet, name: 'Gaston', species: 'GASTON' }),
      get(R.duo(W.IDS.duoKarim), W.duoKarimUnlocked()),
    ],
  },
  'duo-hh-rdv': {
    now: W.paris('2026-11-11T22:20'),
    world: { phase: 'going', hood: 'marseille' },
    routes: [
      get(R.me, W.me({ displayName: 'Yanis' })),
      get(R.petMine, { ...W.myPet, name: 'Gaston', species: 'GASTON' }),
      get(R.duo(W.IDS.duoKarim), W.duoKarimUnlocked(true)),
    ],
  },
  'duo-hh': {
    now: W.paris('2026-11-09T22:00'),
    world: { phase: 'going', hood: 'marseille' },
    routes: [
      get(R.me, W.me({ displayName: 'Yanis' })),
      get(R.petMine, { ...W.myPet, name: 'Gaston', species: 'GASTON' }),
      get(R.duo(W.IDS.duoKarim), W.duoKarim()),
      get(R.messages(W.IDS.convKarim), { items: [...W.karimMessages].reverse(), nextCursor: null }),
    ],
  },
  bande: {
    now: W.paris('2026-11-15T22:00'),
    world: { phase: 'closed', convs: 'sunday', band: 'after' },
  },
  compte: {
    now: W.paris('2026-11-09T21:12'),
    session: null,
    world: null,
    draft: { step: 'slots', completed: true, species: 'NINO' },
  },
  verif: {
    now: W.paris('2026-11-09T21:13'),
    world: { phase: 'going' },
    routes: [
      get(
        R.me,
        W.me({
          verification: {
            status: 'NOT_STARTED',
            kind: null,
            provenance: null,
            mode: 'LOCAL_DEMO',
            expiresAt: null,
            sessionUrl: null,
          },
        }),
      ),
    ],
  },
  notifs: { now: W.paris('2026-11-09T21:14'), world: { phase: 'going' } },
  groupe: { now: W.paris('2026-11-10T19:00'), world: { phase: 'going' } },
  chargement: {
    now: W.paris('2026-11-09T22:00'),
    world: { phase: 'going' },
    routes: [
      { method: 'GET', path: R.week, respond: DEMO_PENDING },
      { method: 'GET', path: R.petMine, respond: DEMO_PENDING },
    ],
  },
  'hors-ligne': {
    now: W.paris('2026-11-09T22:00'),
    world: null,
    routes: [
      { method: 'GET', path: '/v1/:a', respond: DEMO_OFFLINE },
      { method: 'GET', path: '/v1/:a/:b', respond: DEMO_OFFLINE },
      { method: 'GET', path: '/v1/:a/:b/:c', respond: DEMO_OFFLINE },
    ],
  },
  'chats-vide': {
    now: W.paris('2026-11-09T22:00'),
    world: { phase: 'invited' },
    routes: [get(R.conversations, { items: [] })],
  },
  attente: {
    now: W.paris('2026-11-09T21:05'),
    world: { hood: 'bordeaux', weekPhase: 'waitlist' },
    routes: [
      get(R.cityInsights, {
        asOf: '2026-11-09',
        ageBrackets: [{ bracket: '18_25', approx: 'ABOUT', value: 40, label: 'environ 40' }],
      }),
      get(R.week, { ...W.week('waitlist'), composeAt: W.paris('2026-11-19T21:00') }),
      get(R.conversations, { items: [] }),
    ],
  },
  amorcage: {
    now: W.paris('2026-11-23T20:00'),
    world: { hood: 'lille' },
    routes: [
      get(R.week, { ...W.week('invited'), myOutingId: W.IDS.outingLille }),
      get(R.outing(W.IDS.outingLille), W.outingLille(false)),
    ],
  },
  'amorcage-solo': {
    now: W.paris('2026-11-23T20:00'),
    world: { hood: 'lille' },
    routes: [
      get(R.week, { ...W.week('invited'), myOutingId: W.IDS.outingLille }),
      get(R.outing(W.IDS.outingLille), W.outingLille(true)),
    ],
  },
  complete: {
    now: W.paris('2026-11-10T09:00'),
    world: { phase: 'invited' },
    routes: [
      get(R.outing(W.IDS.outing1), { ...W.outing1('invited'), mySeat: { status: 'EXPIRED' } }),
      get(R.week, { ...W.week('invited'), myOutingId: W.IDS.outing2 }),
      get(R.outing(W.IDS.outing2), W.outing2()),
    ],
  },
  annulee: {
    now: W.paris('2026-11-11T18:05'),
    world: { phase: 'cancelled' },
    routes: [
      get(R.week, { ...W.week('invited'), myOutingId: W.IDS.outing2 }),
      get(R.outing(W.IDS.outing2), W.outing2()),
    ],
  },
};

export function demoScenario(name: string): DemoScenario | null {
  const d = DEFS[name];
  if (!d) return null;
  const session = d.session === undefined ? alexSession : d.session;
  return {
    name,
    now: d.now,
    session,
    draft: d.draft,
    devicePrefs: d.devicePrefs,
    routes: [...(d.routes ?? []), ...(d.world === null ? [] : world(d.world ?? {}))],
  };
}

export const DEMO_SCENARIOS = Object.keys(DEFS);
