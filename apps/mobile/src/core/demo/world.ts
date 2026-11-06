/**
 * Monde de démonstration (mode démo local) : les chiffres, prénoms et dates de
 * `design/v5/facts.json` (source unique des maquettes V5.3) traduits en vues du CONTRAT
 * `@blowy/api-contract`. Chaque fixture est validée par le schéma de sa route (world.test.ts).
 * Aucune donnée personnelle réelle : personnages fictifs des maquettes.
 */
import type {
  AllowancesView,
  BandMemberView,
  ConsentState,
  ConversationView,
  DuoLaneProposalView,
  DuoView,
  IntentionsV5Dto,
  MessageView,
  NotificationSettingsView,
  OutingPreferencesV5Dto,
  NeighborhoodStatusView,
  OutingMemberView,
  OutingView,
  OutingVotesView,
  OutingWeekView,
  PetCard,
  PetMemoryView,
  ProductsResponseV5,
  PlusCheckoutResponse,
  SafetyStatusView,
  SeatAcceptResponse,
  SelfProfile,
  StreetView,
  TeamView,
} from '@blowy/api-contract';
import type { Species } from '@blowy/domain';

export const id = (n: number): string => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

export const IDS = {
  alex: id(1),
  lea: id(2),
  malo: id(3),
  sarah: id(4),
  tom: id(5),
  jade: id(6),
  nils: id(7),
  outing1: id(101),
  outingLyon: id(102),
  outingLille: id(103),
  outing2: id(104),
  convOuting: id(201),
  convTom: id(202),
  convJade: id(203),
  convSarah: id(204),
  convLea: id(205),
  linkTom: id(301),
  linkSarah: id(302),
  duoJade: id(401),
  proposalNils: id(402),
  duoLea: id(403),
  team: id(601),
  hoodParis11: id(701),
  hoodSaintDenis: id(708),
  hoodMarseille: id(709),
  outingBanlieue: id(106),
  duoKarim: id(404),
  convKarim: id(206),
  hoodParis10: id(702),
  hoodParis20: id(703),
  hoodBordeaux: id(704),
  hoodLyon7: id(705),
  hoodLyon4: id(706),
  hoodLille: id(707),
  hoodNantes: id(710),
  hoodNantesBouffay: id(711),
  outingNantes: id(107),
  outingWeekend: id(108),
  hoodLyon3: id(712),
  propKarim: id(450),
  alert: id(801),
} as const;

/** Paris (UTC+1 en novembre). */
export const paris = (local: string): string => new Date(`${local}:00+01:00`).toISOString();

const pet = (name: string, species: Species, traits: string[] = []): PetCard => ({
  name,
  species,
  stage: 'YOUNG',
  equipped: [],
  traits,
});

export const PETS = {
  nino: pet('Nino', 'NINO'),
  suzie: pet('Suzie', 'SUZIE'),
  gaston: pet('Gaston', 'GASTON'),
  pia: pet('Pia', 'PIA'),
  /** Pépite (Tom) : 5ᵉ espèce « Lutin » des maquettes, absente du domaine → GASTON (écart documenté). */
  pepite: pet('Pépite', 'GASTON'),
  caramel: pet('Caramel', 'SUZIE'),
  biscuit: pet('Biscuit', 'GASTON'),
  /** Pigeon de Karim (tour 7 : « son pigeon »). */
  plume: pet('Plume', 'PIA'),
};

export const SORTIE1 = {
  startsAt: paris('2026-11-12T19:30'),
  endsAt: paris('2026-11-12T21:30'),
  timeline: {
    acceptDeadline: paris('2026-11-11T12:00'),
    lockAt: paris('2026-11-11T18:00'),
    photoRevealAt: paris('2026-11-12T16:30'),
    checkinOpensAt: paris('2026-11-12T19:00'),
    checkinClosesAt: paris('2026-11-12T21:00'),
    votesCloseAt: paris('2026-11-15T21:30'),
  },
};

export type Phase1 =
  | 'invited'
  | 'invitedTeam'
  | 'going'
  | 'confirmed'
  | 'faces'
  | 'checkin'
  | 'checkedIn'
  | 'done'
  | 'closed'
  | 'cancelled';

const others: { key: 'lea' | 'malo' | 'sarah'; first: string; pet: PetCard; age: '26_29' }[] = [
  { key: 'lea', first: 'Léa', pet: PETS.suzie, age: '26_29' },
  { key: 'malo', first: 'Malo', pet: PETS.gaston, age: '26_29' },
  { key: 'sarah', first: 'Sarah', pet: PETS.pia, age: '26_29' },
];

function member(phase: Phase1, o: (typeof others)[number] | 'tom'): OutingMemberView {
  const isTom = o === 'tom';
  const userId = isTom ? IDS.tom : IDS[o.key];
  const base: OutingMemberView = { userId, pet: isTom ? PETS.pepite : o.pet, threeWords: [] };
  const named = isTom || !['invited', 'invitedTeam', 'going'].includes(phase);
  if (named) {
    base.firstName = isTom ? 'Tom' : o.first;
    base.ageRange = isTom ? '30_34' : o.age;
  }
  if (isTom) base.inMyTeam = true;
  if (['faces', 'checkin', 'checkedIn', 'done'].includes(phase))
    base.photo = {
      mediaId: id(900 + Number(userId.slice(-3))),
      url: `demo-portrait:${isTom ? 'tom' : o.key}`,
    };
  // Check-in fait à 19 h 32 : 4 sur 5 arrivés (Sarah pas encore).
  if (phase === 'checkedIn' && (isTom || o.key !== 'sarah')) base.arrived = true;
  return base;
}

export function outing1(phase: Phase1): OutingView {
  const invited = phase === 'invited' || phase === 'invitedTeam';
  const status = invited
    ? 'PROPOSED'
    : phase === 'going'
      ? 'FORMING'
      : phase === 'confirmed' || phase === 'faces'
        ? 'CONFIRMED'
        : phase === 'checkin' || phase === 'checkedIn'
          ? 'CHECKIN_OPEN'
          : phase === 'cancelled'
            ? 'CANCELLED'
            : 'DONE';
  const seat = invited
    ? 'INVITED'
    : phase === 'checkedIn'
      ? 'CHECKED_IN'
      : phase === 'done' || phase === 'closed'
        ? 'ATTENDED'
        : phase === 'cancelled'
          ? 'CANCELLED'
          : 'CONFIRMED';
  const v: OutingView = {
    id: IDS.outing1,
    status,
    weekKey: '2026-W46',
    neighborhood: { name: 'Paris 11e' },
    startsAt: SORTIE1.startsAt,
    endsAt: SORTIE1.endsAt,
    capacity: 5,
    activity: 'GAMES',
    preview: { size: 5, ageMin: 26, ageMax: 34, genders: { WOMAN: 2, MAN: 3 }, teams: 1 },
    confirmedCount: invited ? 3 : 5,
    mySeat: {
      status: seat,
      ...(invited
        ? { acceptDeadline: SORTIE1.timeline.acceptDeadline }
        : { funding: 'FREE_FIRST' }),
    },
    timeline: SORTIE1.timeline,
    members:
      phase === 'invited'
        ? []
        : phase === 'invitedTeam'
          ? [member(phase, 'tom')]
          : [...others.map((o) => member(phase, o)), member(phase, 'tom')],
  };
  if (!invited && phase !== 'cancelled') v.conversationId = IDS.convOuting;
  if (['confirmed', 'faces', 'checkin', 'checkedIn', 'done', 'closed'].includes(phase)) {
    v.venue = {
      name: 'Café des Oiseaux',
      address: '12 rue Oberkampf, Paris 11e · métro Parmentier (ligne 3)',
      offerLabel: 'Chacun paie ce qu’il boit.',
      photoUrl: 'demo-asset:scenes/cafe.webp',
      bookingName: 'Blowy',
      travelMinutes: 8,
      travelEstimated: true,
      welcomeMessage:
        'Table au fond à gauche, sous la lampe verte. Demandez Sami au comptoir. Bonne soirée !',
    };
  }
  if (phase === 'confirmed' || phase === 'faces') v.knowsSomeoneAvailable = true;
  if (phase === 'done' || phase === 'closed') {
    v.votes = { open: phase === 'done', closesAt: SORTIE1.timeline.votesCloseAt };
    delete v.confirmedCount;
    delete v.preview;
  }
  if (phase === 'cancelled') v.cancelled = { reason: 'UNDERSIZED', refund: 'STAYS_FREE' };
  return v;
}

export function week(phase: Phase1 | 'none' | 'waitlist'): OutingWeekView {
  const base: OutingWeekView = {
    weekKey: '2026-W46',
    phase:
      phase === 'none' || phase === 'waitlist'
        ? 'REQUEST_OPEN'
        : phase.startsWith('invited')
          ? 'INVITED'
          : 'IN_OUTING',
    requestWindow: { opensAt: paris('2026-11-09T09:00'), closesAt: paris('2026-11-10T12:00') },
    slots: [{ startsAt: SORTIE1.startsAt, label: 'slot.thursday_evening' }],
    priorityNextWeek: false,
  };
  if (phase !== 'none' && phase !== 'waitlist') base.myOutingId = IDS.outing1;
  return base;
}

export function votes1(closed: boolean, outcome: 'both' | 'none' = 'both'): OutingVotesView {
  return {
    closesAt: SORTIE1.timeline.votesCloseAt,
    closed,
    targets: others.map((o) => ({
      userId: IDS[o.key],
      firstName: o.first,
      pet: o.pet,
      photo: { mediaId: id(900 + Number(IDS[o.key].slice(-3))), url: `demo-portrait:${o.key}` },
      myChoice: closed && o.key === 'sarah' ? 'FRIEND' : closed && o.key === 'lea' ? 'PLUS' : 'NO',
      ...(closed && outcome === 'both' && o.key === 'sarah' ? { mutual: 'FRIEND' as const } : null),
      ...(closed && outcome === 'both' && o.key === 'lea' ? { mutual: 'PLUS' as const } : null),
    })),
  };
}

export function me(over: Partial<SelfProfile> = {}): SelfProfile {
  return {
    userId: IDS.alex,
    displayName: 'Alex',
    gender: 'MAN',
    birthDate: '1998-04-12',
    age: 28,
    timezone: 'Europe/Paris',
    zoneCode: 'paris-11',
    reliability: 100,
    onboarded: true,
    primaryPetId: id(11),
    preferences: null,
    privacy: {
      photoPreference: 'FROM_LEVEL_4_WITH_CONSENT',
      ageDisplay: 'RANGE',
      mapVisible: false,
    },
    verification: {
      status: 'VERIFIED',
      kind: 'SELFIE_QUALITY',
      provenance: 'LOCAL_DEMO',
      mode: 'LOCAL_DEMO',
      expiresAt: null,
      sessionUrl: null,
    },
    activePause: null,
    isFictional: true,
    ...over,
  };
}

export const myPet = { id: id(11), name: 'Nino', species: 'NINO', stage: 'YOUNG' } as const;

export type DemoHood =
  | 'paris'
  | 'bordeaux'
  | 'lyon'
  | 'lyon3'
  | 'lille'
  | 'lillelive'
  | 'saintdenis'
  | 'marseille'
  | 'nantes';

export function neighborhood(kind: DemoHood): NeighborhoodStatusView {
  if (kind === 'lyon3')
    return {
      neighborhood: { id: IDS.hoodLyon3, name: 'Lyon 3e', status: 'LIVE' },
      isVerified: true,
      hasPhoto: true,
    };
  if (kind === 'lillelive')
    return {
      neighborhood: { id: IDS.hoodLille, name: 'Lille-Wazemmes', status: 'LIVE' },
      isVerified: true,
      hasPhoto: true,
    };
  if (kind === 'nantes')
    return {
      neighborhood: { id: IDS.hoodNantes, name: 'Nantes centre', status: 'LIVE' },
      isVerified: true,
      hasPhoto: true,
    };
  if (kind === 'saintdenis')
    return {
      neighborhood: { id: IDS.hoodSaintDenis, name: 'Saint-Denis', status: 'LIVE' },
      isVerified: true,
      hasPhoto: true,
    };
  if (kind === 'marseille')
    return {
      neighborhood: { id: IDS.hoodMarseille, name: 'Marseille', status: 'LIVE' },
      isVerified: true,
      hasPhoto: true,
    };
  if (kind === 'paris')
    return {
      neighborhood: { id: IDS.hoodParis11, name: 'Paris 11e', status: 'LIVE' },
      isVerified: true,
      hasPhoto: true,
    };
  if (kind === 'lyon')
    return {
      neighborhood: { id: IDS.hoodLyon7, name: 'Lyon 7e', status: 'LIVE' },
      isVerified: true,
      hasPhoto: true,
    };
  if (kind === 'lille')
    return {
      neighborhood: { id: IDS.hoodLille, name: 'Lille', status: 'WAITLIST' },
      waitlist: { verifiedCount: 41, seedingAvailable: true },
      isVerified: true,
      hasPhoto: true,
    };
  return {
    neighborhood: { id: IDS.hoodBordeaux, name: 'Bordeaux', status: 'WAITLIST' },
    waitlist: {
      verifiedCount: 64,
      seedingAvailable: false,
      nextOutingGap: { missing: 2, startsAt: paris('2026-11-21T15:00') },
    },
    isVerified: true,
    hasPhoto: true,
  };
}

export const neighborhoodList = {
  paris: {
    items: [
      {
        id: IDS.hoodParis11,
        slug: 'paris-11',
        name: 'Paris 11e',
        status: 'LIVE' as const,
        city: 'Paris',
      },
      {
        id: IDS.hoodParis10,
        slug: 'paris-10',
        name: 'Paris 10e',
        status: 'WAITLIST' as const,
        city: 'Paris',
      },
    ],
  },
  bordeaux: {
    items: [
      {
        id: IDS.hoodBordeaux,
        slug: 'bordeaux',
        name: 'Bordeaux',
        status: 'WAITLIST' as const,
        city: 'Bordeaux',
      },
    ],
  },
  /** Nantes avant ouverture (tour 7 : « À Nantes aussi, on sort. »). */
  nantes: {
    items: [
      {
        id: IDS.hoodNantes,
        slug: 'nantes',
        name: 'Nantes',
        status: 'WAITLIST' as const,
        city: 'Nantes',
      },
    ],
  },
};

export function allowances(firstFree = true): AllowancesView {
  return {
    firstOutingFree: firstFree,
    plus: { active: false, includesAllOutings: true, duoUnlimited: false },
    duos: { maxActive: 3 },
    credits: 0,
    provider: 'LOCAL_DEMO',
  };
}

export const products: ProductsResponseV5 = {
  mode: 'LOCAL_DEMO',
  products: [],
  seat: { amountCents: 499, currency: 'EUR', consumptionIncluded: false, firstOutingFree: true },
  plus: {
    priceLabel: '9,99 €',
    includesAllOutings: true,
    includedOutingsPerMonth: 4,
    duoUnlimited: false,
    monthlyPriceCents: 999,
    currency: 'EUR',
  },
  provider: 'LOCAL_DEMO',
  duo: { freeMaxActive: 3 },
};

export const team: { team: TeamView; inviteUrl: string } = {
  team: {
    id: IDS.team,
    status: 'ACTIVE',
    members: [
      { userId: IDS.alex, firstName: 'Alex', pet: PETS.nino, verified: true, me: true },
      { userId: IDS.tom, firstName: 'Tom', pet: PETS.pepite, verified: true, me: false },
    ],
    seedingEligible: false,
    createdAt: paris('2026-11-09T21:07'),
  },
  inviteUrl: 'https://blowy.app/i/r8Tz4w',
};

export function conversations(at: 'monday' | 'sunday'): { items: ConversationView[] } {
  const items: ConversationView[] = [
    {
      id: IDS.convOuting,
      kind: 'OUTING',
      relationshipId: null,
      outingId: IDS.outing1,
      lastSeq: 7,
      lastReadSeq: 4,
      closed: false,
      canSend: true,
    },
    {
      id: IDS.convTom,
      kind: 'BAND',
      relationshipId: null,
      bandLinkId: IDS.linkTom,
      lastSeq: 12,
      lastReadSeq: 12,
      closed: false,
      canSend: true,
    },
    {
      id: IDS.convJade,
      kind: 'DUO',
      relationshipId: null,
      duoId: IDS.duoJade,
      lastSeq: 5,
      lastReadSeq: 4,
      closed: false,
      canSend: true,
    },
  ];
  if (at === 'sunday') {
    items.push({
      id: IDS.convSarah,
      kind: 'BAND',
      relationshipId: null,
      bandLinkId: IDS.linkSarah,
      lastSeq: 1,
      lastReadSeq: 0,
      closed: false,
      canSend: true,
    });
    items.push({
      id: IDS.convLea,
      kind: 'DUO',
      relationshipId: null,
      duoId: IDS.duoLea,
      lastSeq: 3,
      lastReadSeq: 3,
      closed: false,
      canSend: true,
    });
  }
  return { items };
}

const msg = (
  n: number,
  conv: string,
  mine: boolean,
  body: string | null,
  at: string,
  systemTemplate: string | null = null,
): MessageView => ({
  id: id(1000 + n),
  conversationId: conv,
  clientMessageId: mine ? `client-${n}` : null,
  kind: systemTemplate ? 'SYSTEM' : 'TEXT',
  mine,
  status: 'PUBLISHED',
  body,
  systemTemplate,
  warned: false,
  seq: n,
  createdAt: at,
  publishedAt: at,
  mediaId: null,
});

export const MESSAGES = {
  outing: [
    msg(1, IDS.convOuting, false, null, paris('2026-11-09T21:00'), 'icebreaker.open'),
    // Avant la confirmation, l'auteur n'est signé que par son pet (message-authors côté API).
    {
      ...msg(
        2,
        IDS.convOuting,
        false,
        'Team jeux, évidemment. Vous jouez à quoi ?',
        paris('2026-11-10T18:40'),
      ),
      author: { pet: { name: 'Suzie', species: 'SUZIE' } },
    },
    msg(3, IDS.convOuting, true, 'Un jeu de cartes ? On est pile 5 !', paris('2026-11-10T18:52')),
  ],
  tom: [msg(11, IDS.convTom, false, 'Je ramène les cartes ?', paris('2026-11-14T20:10'))],
  jade: [
    msg(21, IDS.convJade, false, 'Plutôt mer ou montagne ?', paris('2026-11-09T21:40')),
    msg(22, IDS.convJade, true, 'Montagne, mais avec un lac.', paris('2026-11-09T21:52')),
  ],
};

export function band(at: 'before' | 'after'): {
  items: BandMemberView[];
  nextCursor: string | null;
} {
  const items: BandMemberView[] = [
    {
      linkId: IDS.linkTom,
      user: { id: IDS.tom, firstName: 'Tom' },
      pet: PETS.pepite,
      conversationId: IDS.convTom,
      origin: 'PLUS_ONE',
      since: paris('2026-10-20T20:00'),
    },
  ];
  if (at === 'after')
    items.push({
      linkId: IDS.linkSarah,
      user: { id: IDS.sarah, firstName: 'Sarah' },
      pet: PETS.pia,
      conversationId: IDS.convSarah,
      origin: 'OUTING_VOTE',
      since: paris('2026-11-15T21:30'),
    });
  return { items, nextCursor: null };
}

export const street: StreetView = {
  myPet: PETS.nino,
  residents: [
    { linkId: IDS.linkTom, firstName: 'Tom', pet: PETS.pepite },
    { linkId: IDS.linkSarah, firstName: 'Sarah', pet: PETS.pia },
  ],
  decor: [
    {
      id: id(501),
      kind: 'HATCHED',
      labelKey: 'memory.HATCHED',
      data: { species: 'NINO' },
      createdAt: paris('2026-10-01T20:00'),
    },
    {
      id: id(502),
      kind: 'OUTING_LIVED',
      labelKey: 'memory.OUTING_LIVED',
      data: { venueName: 'Café des Oiseaux', petCount: 5 },
      createdAt: paris('2026-11-12T21:30'),
    },
    {
      id: id(503),
      kind: 'BAND_NEW_MEMBER',
      labelKey: 'memory.BAND_NEW_MEMBER',
      data: { otherPetName: 'Pia', otherPetSpecies: 'PIA' },
      createdAt: paris('2026-11-15T21:30'),
    },
  ],
};

export function duoJade(stage: 'exchange' | 'unlocked' | 'date'): DuoView {
  const v: DuoView = {
    id: IDS.duoJade,
    status: stage === 'exchange' ? 'EXCHANGE' : stage === 'unlocked' ? 'UNLOCKED' : 'DATE_PROPOSED',
    origin: 'LANE',
    other: { firstName: 'Jade', pet: PETS.caramel },
    conversationId: IDS.convJade,
    projectCompatible: true,
  };
  if (stage === 'exchange')
    v.exchange = { endsAt: paris('2026-11-11T21:30'), mineCount: 2, unlockProgress: 0.5 };
  else v.other.photo = { mediaId: id(906), url: 'demo-portrait:jade' };
  if (stage !== 'exchange') v.dateDeadline = paris('2026-11-18T21:30');
  return v;
}

export const lane: { items: DuoLaneProposalView[]; emptyReason: null; nextBatchAt: null } = {
  items: [
    {
      proposalId: IDS.proposalNils,
      species: PETS.biscuit.species,
      expiresAt: paris('2026-11-11T21:00'),
      acceptedByMe: false,
      otherInitial: 'N.',
    },
  ],
  emptyReason: null,
  nextBatchAt: null,
};

export function safetyStatus(active: boolean, links = 0): SafetyStatusView {
  return {
    subject: { kind: 'OUTING', id: IDS.outing1 },
    activeFrom: paris('2026-11-12T17:30'),
    expiresAt: paris('2026-11-13T00:30'),
    active,
    support: { humanResponseMinutes: 60, staffedNow: active },
    activeGuardianLinks: links,
    maxGuardianLinks: 3,
    emergencyNumbers: ['112', '17'],
  };
}

/** Sortie 2 (jeu. 19 nov., bloc d'escalade) : proposition de la semaine suivante. */
export function outing2(): OutingView {
  return {
    id: IDS.outing2,
    status: 'PROPOSED',
    weekKey: '2026-W47',
    neighborhood: { name: 'Paris 11e' },
    startsAt: paris('2026-11-19T19:30'),
    endsAt: paris('2026-11-19T21:30'),
    capacity: 5,
    activity: 'CLIMBING',
    preview: { size: 5, ageMin: 26, ageMax: 34, genders: { WOMAN: 2, MAN: 3 }, teams: 0 },
    confirmedCount: 2,
    mySeat: { status: 'INVITED', acceptDeadline: paris('2026-11-18T12:00') },
    timeline: {
      acceptDeadline: paris('2026-11-18T12:00'),
      lockAt: paris('2026-11-18T18:00'),
      photoRevealAt: paris('2026-11-19T16:30'),
      checkinOpensAt: paris('2026-11-19T19:00'),
      checkinClosesAt: paris('2026-11-19T21:00'),
      votesCloseAt: paris('2026-11-22T21:30'),
    },
    members: [],
  };
}

/**
 * Lille (facts.json › amorcage, tour 9) : sam. 14 nov. 15 h – 17 h, atelier à Wazemmes, lieu et prénoms ven. 13 nov. 18 h.
 * `mates` : proches qui viennent avec moi (Jules ; Jules et Lou ; personne).
 */
export function outingLille(mates: readonly string[]): OutingView {
  const team: OutingMemberView[] = mates.map((first, i) => ({
    userId: id(21 + i),
    pet: [PETS.suzie, PETS.pia][i % 2]!,
    threeWords: [],
    firstName: first,
    ageRange: '22_25',
    inMyTeam: true,
  }));
  return {
    id: IDS.outingLille,
    status: 'PROPOSED',
    weekKey: '2026-W46',
    neighborhood: { name: 'Lille · Wazemmes' },
    startsAt: paris('2026-11-14T15:00'),
    endsAt: paris('2026-11-14T17:00'),
    capacity: 5,
    activity: 'WORKSHOP',
    preview: {
      size: 5,
      ageMin: 22,
      ageMax: 29,
      genders: { WOMAN: 2, MAN: 3 },
      teams: team.length ? 1 : 0,
    },
    confirmedCount: 3,
    mySeat: { status: 'INVITED', acceptDeadline: paris('2026-11-12T12:00') },
    timeline: {
      acceptDeadline: paris('2026-11-12T12:00'),
      lockAt: paris('2026-11-13T18:00'),
      photoRevealAt: paris('2026-11-14T12:00'),
      checkinOpensAt: paris('2026-11-14T14:30'),
      checkinClosesAt: paris('2026-11-14T16:30'),
      votesCloseAt: paris('2026-11-17T17:00'),
    },
    members: team,
  };
}

/** Week-end libre (facts.json › weekendLibre) : Claire, Lyon 3e, sam. 21 nov. 15 h – 17 h, atelier à la Guillotière. */
export function outingWeekend(): OutingView {
  return {
    id: IDS.outingWeekend,
    status: 'PROPOSED',
    weekKey: '2026-W47',
    neighborhood: { name: 'Lyon · Guillotière' },
    startsAt: paris('2026-11-21T15:00'),
    endsAt: paris('2026-11-21T17:00'),
    capacity: 5,
    activity: 'WORKSHOP',
    preview: { size: 5, ageMin: 35, ageMax: 44, genders: { WOMAN: 3, MAN: 2 }, teams: 0 },
    confirmedCount: 2,
    mySeat: { status: 'INVITED', acceptDeadline: paris('2026-11-19T12:00') },
    timeline: {
      acceptDeadline: paris('2026-11-19T12:00'),
      lockAt: paris('2026-11-20T18:00'),
      photoRevealAt: paris('2026-11-21T12:00'),
      checkinOpensAt: paris('2026-11-21T14:30'),
      checkinClosesAt: paris('2026-11-21T16:30'),
      votesCloseAt: paris('2026-11-24T17:00'),
    },
    members: [],
  };
}

/** Duo Jade débloqué (visages à 48 h) avec un rendez-vous proposé au Comptoir Gabriel. */
export function duoJadeDate(): DuoView {
  return {
    ...duoJade('unlocked'),
    status: 'DATE_PROPOSED',
    currentDate: {
      id: id(411),
      status: 'PROPOSED',
      venue: { id: id(421), name: 'Le Comptoir Gabriel', address: 'Paris 11e · chacun sa boisson' },
      startsAt: paris('2026-11-14T15:00'),
      proposedByMe: true,
    },
  };
}

/** Duo Léa né du vote (« plus » mutuel) : chat ouvert le dim. 15 nov. 21 h 30. */
export function duoLea(withDate = false): DuoView {
  const v: DuoView = {
    id: IDS.duoLea,
    status: withDate ? 'DATE_PROPOSED' : 'UNLOCKED',
    origin: 'OUTING_VOTE',
    other: {
      firstName: 'Léa',
      pet: PETS.suzie,
      photo: { mediaId: id(902), url: 'demo-portrait:lea' },
    },
    dateDeadline: paris('2026-12-15T21:30'),
    conversationId: IDS.convLea,
    egg: { myOptIn: false, active: false, eligible: true },
  };
  if (withDate)
    v.currentDate = {
      id: id(412),
      status: 'PROPOSED',
      venue: { id: id(422), name: 'Parc des Buttes-Chaumont', address: 'Paris 19e · entrée libre' },
      startsAt: paris('2026-11-21T15:00'),
      proposedByMe: true,
    };
  return v;
}

export const leaMessages = [
  msg(
    31,
    IDS.convLea,
    false,
    'Je repense à ta partie de cartes. Tu bluffes toujours comme ça ?',
    paris('2026-11-15T21:40'),
  ),
  msg(
    32,
    IDS.convLea,
    true,
    'Seulement quand je perds. Revanche autour d’un café ?',
    paris('2026-11-15T21:45'),
  ),
  msg(
    33,
    IDS.convLea,
    false,
    'Avec plaisir. Plutôt un samedi, la semaine je finis tard.',
    paris('2026-11-15T21:50'),
  ),
];

// ---------------------------------------------------------------- Profil, réglages, paiement (T7)
export const intentions: IntentionsV5Dto = {
  lookingFor: 'BOTH',
  storySeriousness: null,
  kidsSomeday: null,
  meetingMode: 'BOTH',
  meetGenders: [],
  romanceGenders: ['WOMAN'],
};

export const outingPrefs: OutingPreferencesV5Dto = {
  groupAge: { min: 26, max: 34 },
  availableSlotTemplateIds: [],
  weeksOff: [],
  activities: [],
  neighborhoodIds: [IDS.hoodParis11, IDS.hoodParis10, IDS.hoodParis20],
  maxTravelMinutes: 30,
  /** « Lieu calme, comme demandé dans Affiner » (Trouvée) ; « Plutôt calme » coché (Affiner › Ambiance). */
  ambiance: 'CALM',
};

/** Souvenirs de Nino au dim. 15 nov. (Fiche : 3 souvenirs). Le contrat ne porte que le nom du pet. */
export const memories: { items: PetMemoryView[]; nextCursor: string | null } = {
  items: [
    {
      id: id(511),
      kind: 'BAND_NEW_MEMBER',
      labelKey: 'memory.BAND_NEW_MEMBER',
      data: { otherPetName: 'Pépite', otherPetSpecies: 'GASTON' },
      createdAt: paris('2026-11-09T21:30'),
    },
    {
      id: id(512),
      kind: 'OUTING_LIVED',
      labelKey: 'memory.OUTING_LIVED',
      data: { venueName: 'Café des Oiseaux', petCount: 5 },
      createdAt: paris('2026-11-12T21:30'),
    },
    {
      id: id(513),
      kind: 'BAND_NEW_MEMBER',
      labelKey: 'memory.BAND_NEW_MEMBER',
      data: { otherPetName: 'Pia', otherPetSpecies: 'PIA' },
      createdAt: paris('2026-11-15T21:30'),
    },
  ],
  nextCursor: null,
};

const V = '2026-11';
export const consents: ConsentState = {
  items: (['TERMS', 'PRIVACY', 'AI_MODERATION', 'SENSITIVE_PREFERENCES'] as const).map(
    (purpose) => ({ purpose, version: V, granted: true, recordedAt: paris('2026-11-09T20:50') }),
  ),
  currentVersions: {
    TERMS: V,
    PRIVACY: V,
    AI_MODERATION: V,
    AI_SUGGESTIONS: V,
    AI_NARRATION: V,
    SENSITIVE_PREFERENCES: V,
  },
  socialAllowed: true,
};

export const notificationSettings: NotificationSettingsView = {
  discreetMode: false,
  categories: {
    SAFETY: true,
    OUTING: true,
    HUMAN_MESSAGE: true,
    CONNECTION: true,
    VOTE: true,
    DUO: true,
    RELIABILITY: true,
    SYSTEM: true,
  },
  alwaysOn: ['SAFETY'],
  quietHours: { startHour: 22, endHour: 8 },
  maxPerDay: 3,
  maxPerOutingDay: 6,
  maxOutingProposalsPerWeek: 1,
  paused: false,
  pushRegistered: true,
};

/** Sortie 2 après « Je viens » : place gardée (paiement en cours) ou confirmée (payée). */
export function outing2Seat(status: 'HELD' | 'CONFIRMED', holdUntil?: string): OutingView {
  return {
    ...outing2(),
    mySeat:
      status === 'HELD'
        ? { status, holdExpiresAt: holdUntil ?? paris('2026-11-16T10:31') }
        : { status, funding: 'PAID' },
  };
}

/** Réponse de `seat/accept { funding: PAY }` en démo locale (le serveur LOCAL_DEMO confirme sans débit). */
export const seatAcceptPay: SeatAcceptResponse = {
  seat: { status: 'HELD', holdExpiresAt: paris('2026-11-16T10:30') },
  payment: {
    provider: 'LOCAL_DEMO',
    clientSecret: 'local_demo_seat',
    amountCents: 499,
    currency: 'EUR',
  },
};

export const plusCheckout: PlusCheckoutResponse = {
  provider: 'LOCAL_DEMO',
  clientSecret: 'local_demo_plus',
};

// ---------------------------------------------------------------- V5.5 : même gabarit pour Lyon et Saint-Denis
const shiftTimeline = (d: number): OutingView['timeline'] =>
  Object.fromEntries(
    Object.entries(SORTIE1.timeline).map(([k, v]) => [
      k,
      new Date(Date.parse(v) + d).toISOString(),
    ]),
  ) as OutingView['timeline'];

/**
 * Sortie d'une autre ville, générée comme la sortie 1 (mêmes phases) : Lyon 4e mar. 17 nov. (« Foot à 5 »
 * absent du contrat → Jeux de société) ou Paris 18e jeu. 19 nov. (bloc) depuis Saint-Denis, avec un proche.
 */
export type AwayCity = 'lyon' | 'banlieue' | 'nantes';
const AWAY_ID: Record<AwayCity, string> = {
  lyon: IDS.outingLyon,
  banlieue: IDS.outingBanlieue,
  nantes: IDS.outingNantes,
};

export function outingAway(city: AwayCity, phase: Phase1): OutingView {
  if (city === 'nantes') return outingNantes(phase);
  const base = outing1(phase);
  const lyon = city === 'lyon';
  const shift = (lyon ? 5 : 7) * 86_400_000;
  const mate = lyon
    ? { first: 'Bastien', age: '30_34' as const }
    : { first: 'Yacine', age: '22_25' as const };
  const names = lyon ? ['Inès', 'Hugo', 'Nour'] : ['Maïa', 'Karim', 'Lina'];
  const age = lyon ? ('26_29' as const) : ('22_25' as const);
  const v: OutingView = {
    ...base,
    id: AWAY_ID[city],
    weekKey: lyon ? '2026-W47' : '2026-W47',
    neighborhood: { name: lyon ? 'Lyon 4e' : 'Paris 18e' },
    startsAt: new Date(Date.parse(SORTIE1.startsAt) + shift).toISOString(),
    endsAt: new Date(Date.parse(SORTIE1.endsAt) + shift).toISOString(),
    activity: lyon ? 'GAMES' : 'CLIMBING',
    timeline: shiftTimeline(shift),
    members: base.members.map((m, i) => {
      if (m.inMyTeam) return { ...m, userId: id(30), firstName: mate.first, ageRange: mate.age };
      return {
        ...m,
        userId: id(31 + i),
        ...(m.firstName ? { firstName: names[i] ?? m.firstName, ageRange: age } : null),
      };
    }),
  };
  if (v.preview && !lyon) v.preview = { ...v.preview, ageMin: 22, ageMax: 29 };
  if (v.venue)
    v.venue = lyon
      ? {
          name: 'Le Five Croix-Rousse',
          address: '12 rue d’Austerlitz, Lyon 4e',
          offerLabel: 'Chacun paie ce qu’il boit.',
          photoUrl: 'demo-asset:scenes/cafe.webp',
          bookingName: 'Blowy',
          travelMinutes: 18,
          travelEstimated: true,
          welcomeMessage: 'Terrain 2, au fond. Chasubles au comptoir : demandez Nico. Bon match !',
        }
      : {
          name: 'Bloc Station',
          address: '8 rue Marcadet, Paris 18e',
          offerLabel: 'Chacun paie ce qu’il boit.',
          photoUrl: 'demo-asset:scenes/cafe.webp',
          bookingName: 'Blowy',
          travelMinutes: 17,
          travelEstimated: true,
          welcomeMessage: 'Chaussons prêtés à l’accueil : demandez Sofia. Bonne grimpe !',
        };
  if (v.conversationId) v.conversationId = IDS.convOuting;
  return v;
}

export function weekAway(city: AwayCity, phase: Phase1): OutingWeekView {
  return { ...week(phase), weekKey: '2026-W47', myOutingId: AWAY_ID[city] };
}

/** Nantes (tour 7) : jeu. 19 nov., verre ou café à Bouffay, 3 femmes et 2 hommes, Inès vient avec toi. */
function outingNantes(phase: Phase1): OutingView {
  const base = outing1(phase);
  const shift = 7 * 86_400_000;
  const names = ['Maël', 'Léna', 'Hugo'];
  const v: OutingView = {
    ...base,
    id: IDS.outingNantes,
    weekKey: '2026-W47',
    neighborhood: { name: 'Nantes · Bouffay' },
    startsAt: new Date(Date.parse(SORTIE1.startsAt) + shift).toISOString(),
    endsAt: new Date(Date.parse(SORTIE1.endsAt) + shift).toISOString(),
    activity: 'DRINK_COFFEE',
    timeline: shiftTimeline(shift),
    members: base.members.map((m, i) => {
      if (m.inMyTeam)
        return { ...m, userId: id(40), firstName: 'Inès', ageRange: '26_29' as const };
      return {
        ...m,
        userId: id(41 + i),
        ...(m.firstName
          ? { firstName: names[i] ?? m.firstName, ageRange: '26_29' as const }
          : null),
      };
    }),
  };
  if (v.preview) v.preview = { ...v.preview, genders: { WOMAN: 3, MAN: 2 } };
  if (v.venue)
    v.venue = {
      name: 'Le Bouffay',
      address: '4 place du Bouffay, Nantes',
      offerLabel: 'Chacun paie ce qu’il boit.',
      photoUrl: 'demo-asset:scenes/cafe.webp',
      bookingName: 'Blowy',
      travelMinutes: 12,
      travelEstimated: true,
      ambiance: 'CALM',
    };
  if (v.conversationId) v.conversationId = IDS.convOuting;
  return v;
}

/** Marseille, une histoire cherchée : état honnête avant toute composition (D-061). */
export function weekNotYet(): OutingWeekView {
  return { ...week('none'), storyFeasibility: 'NOT_ENOUGH_ON_SLOTS' };
}

/** Duo homme-homme (Yanis, Marseille) : Gaston et Biscuit, en écriture. */
export function duoKarim(): DuoView {
  return {
    id: IDS.duoKarim,
    status: 'EXCHANGE',
    origin: 'LANE',
    other: { firstName: 'Karim', pet: PETS.plume },
    conversationId: IDS.convKarim,
    exchange: { endsAt: paris('2026-11-11T22:00'), mineCount: 2, unlockProgress: 0.5 },
  };
}

/** Karim aux visages (mer. 11 nov. 22 h), puis avec un créneau au Café Longchamp. */
export function duoKarimUnlocked(withDate = false): DuoView {
  const d: DuoView = {
    id: IDS.duoKarim,
    status: 'UNLOCKED',
    origin: 'LANE',
    other: {
      firstName: 'Karim',
      pet: PETS.plume,
      photo: { mediaId: id(905), url: 'demo-portrait:malo' },
    },
    conversationId: IDS.convKarim,
    dateDeadline: paris('2026-11-18T22:00'),
  };
  if (withDate)
    d.currentDate = {
      id: id(413),
      status: 'PROPOSED',
      venue: { id: id(423), name: 'Café Longchamp', address: 'Marseille 1er · chacun sa boisson' },
      startsAt: paris('2026-11-14T19:00'),
      proposedByMe: true,
    };
  return d;
}

/** Proposition de la voie Duo (Marseille, pour une histoire) : espèce + initiale seulement. */
export const laneKarim = {
  items: [
    {
      proposalId: IDS.propKarim,
      species: 'PIA' as const,
      otherInitial: 'K',
      expiresAt: paris('2026-11-11T21:00'),
      acceptedByMe: false,
    },
  ],
  emptyReason: null,
  nextBatchAt: null,
};

export const karimMessages: MessageView[] = [
  msg(60, IDS.convKarim, false, 'Ton meilleur concert, et avec qui ?', paris('2026-11-09T21:40')),
  msg(
    61,
    IDS.convKarim,
    true,
    'Un petit festival à Marseille, avec mon frère. Et toi ?',
    paris('2026-11-09T21:52'),
  ),
];

/**
 * Lien de partage (V5.6) : un nouveau lien par partage. `slug` au format serveur (`s` + 15 base32) ;
 * l'URL affichée reprend les adresses courtes des maquettes (facts.json › slugs).
 */
const SHARE_URLS: Record<string, string> = {
  CONFIRMED: 'https://blowy.app/s/Hq3vT8aJ',
  HERE: 'https://blowy.app/s/pL7c2NxR',
  EVENING: 'https://blowy.app/s/Zx9mQ4tB',
  BAND: 'https://blowy.app/s/aR5kW1eP',
  HELP_CITY: 'https://blowy.app/v/bD8nY3sK',
  TEASER: 'https://blowy.app/s/Vt6pJ3dW',
  TEAM: 'https://blowy.app/s/Kc2nB8rQ',
  INVITE: 'https://blowy.app/i/r8Tz4wQm2LpV',
};
export function shareLinkFor(cardKind: keyof typeof SHARE_URLS) {
  return {
    slug: 'shq3vtrajk2mnpqr',
    url: SHARE_URLS[cardKind] ?? SHARE_URLS.CONFIRMED!,
    cardKind,
    expiresAt: paris('2026-12-09T21:00'),
    clickCount: 0,
    attributedSignups: 0,
    attributedFirstOutings: 0,
  };
}
export const shareLink = shareLinkFor('CONFIRMED');
