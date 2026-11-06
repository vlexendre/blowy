/**
 * Contrats /v1/outings, /v1/me/reliability (spec-v5 §7.2, §7.5, §7.6). Propriétaire : C (publiés par
 * A/B en T0). Projections par acteur (§3.1) : tout ce qui n'est pas visible est ABSENT du JSON
 * (pas de `null` révélateur, pas de compteur) — d'où les champs optionnels et les schémas `.strict()`.
 */
import { z } from 'zod';
import {
  ACTIVITY_KINDS,
  AGE_BRACKETS_V52,
  AGE_RANGES,
  CHECKIN_RESULTS,
  OUTING_PUBLIC_CANCEL_REASONS,
  OUTING_REQUEST_STATUSES,
  OUTING_STATUSES,
  OUTING_WEEK_PHASES,
  REFUND_MODES,
  REFUND_STATES,
  OUTING_CANCEL_REQUEST_KINDS,
  OUTING_REQUEST_MODES,
  SEAT_FUNDINGS,
  SEAT_STATUSES,
  VOTE_CHOICES,
} from '@blowy/domain';
import { AmountCentsSchema, CurrencySchema, IsoDateTimeSchema, UuidSchema, WeekKeySchema, pageOf } from './core/common.js';
import { PetCardSchema, ThreeWordSchema } from './pets.js';

export const OutingStatusSchema = z.enum(OUTING_STATUSES);
export const OutingRequestStatusSchema = z.enum(OUTING_REQUEST_STATUSES);
export const OutingWeekPhaseSchema = z.enum(OUTING_WEEK_PHASES);
export const SeatStatusSchema = z.enum(SEAT_STATUSES);
export const SeatFundingSchema = z.enum(SEAT_FUNDINGS);
export const RefundStateSchema = z.enum(REFUND_STATES);
export const RefundModeSchema = z.enum(REFUND_MODES);
export const VoteChoiceSchema = z.enum(VOTE_CHOICES);
export const MutualConnectionSchema = z.enum(['FRIEND', 'PLUS']);
/** V5.1 `AGE_RANGES` + V5.2 grille fixe `AGE_BRACKETS_V52` (le serveur émet la grille V5.2). */
export const AgeRangeSchema = z.enum([...new Set<string>([...AGE_RANGES, ...AGE_BRACKETS_V52])] as [string, ...string[]]);
export const PaymentProviderSchema = z.enum(['STRIPE', 'LOCAL_DEMO']);

/** Motifs métier (`detailsSafe.reason`) des échecs du module `outings`. */
export const OUTING_FAILURE_REASONS = [
  // 412
  /** V5.2 A.1 : seuls `PAUSED`/`CLOSED` refusent (remplace `NEIGHBORHOOD_NOT_LIVE`). */
  'NEIGHBORHOOD_UNAVAILABLE',
  /** §2.4 / §2.16 : 18+ vérifié (estimation d'âge au selfie, document si doute) avant la 1ʳᵉ sortie. */
  'AGE_VERIFICATION_REQUIRED',
  'VERIFICATION_REQUIRED',
  'PHOTO_REQUIRED',
  'RELIABILITY_PAUSED',
  'REQUEST_WINDOW_CLOSED',
  'ONBOARDING_INCOMPLETE',
  'ALREADY_PLACED',
  'INVITATION_EXPIRED',
  'SEAT_NOT_INVITED',
  'OUTING_NOT_OPEN',
  'SEAT_NOT_ACTIVE',
  'OUTING_STARTED',
  'CHECKIN_NOT_OPEN',
  'CHECKIN_TOO_FAR',
  'CHECKIN_LOW_ACCURACY',
  'CHECKIN_CODE_INVALID',
  'VOTE_WINDOW_CLOSED',
  'VOTE_TARGET_NOT_ATTENDEE',
  'DISPUTE_WINDOW_CLOSED',
  'NOT_NO_SHOW',
  'MEDIA_NOT_ALLOWED',
  'TEAM_INVALID',
  'WEEK_OFF',
  /** V5.5 (D-056) : « imprévu » déjà utilisé dans les 30 derniers jours. */
  'EMERGENCY_QUOTA',
  'KNOWS_SOMEONE_NOT_AVAILABLE',
  // 409
  'WEEKLY_QUOTA_USED',
  'DISPUTE_EXISTS',
] as const;
export type OutingFailureReason = (typeof OUTING_FAILURE_REASONS)[number];
export const OutingFailureReasonSchema = z.enum(OUTING_FAILURE_REASONS);

export const WeekKeyParamSchema = z.object({ weekKey: WeekKeySchema });

// ---------------------------------------------------------------- semaine et demande
export const OutingRequestViewSchema = z.object({
  weekKey: WeekKeySchema,
  status: OutingRequestStatusSchema,
  slotStartsAt: z.array(IsoDateTimeSchema).min(1).max(3),
  /** Demande faite avec ma team (V5.1 B.7). */
  teamId: UuidSchema.optional(),
  /** V5.5 (D-061) : `FRIENDS_THIS_WEEK` = « sortir quand même, en amitié » cette semaine. */
  mode: z.enum(OUTING_REQUEST_MODES).optional(),
  createdAt: IsoDateTimeSchema,
});
export type OutingRequestView = z.infer<typeof OutingRequestViewSchema>;

/** `GET /v1/outings/week`. */
export const OutingWeekViewSchema = z.object({
  weekKey: WeekKeySchema,
  phase: OutingWeekPhaseSchema,
  requestWindow: z.object({ opensAt: IsoDateTimeSchema, closesAt: IsoDateTimeSchema }),
  /** `label` = clé de contenu du créneau (ex. `slot.thursday_evening`). */
  slots: z.array(z.object({ startsAt: IsoDateTimeSchema, label: z.string() })),
  myRequest: OutingRequestViewSchema.optional(),
  myOutingId: UuidSchema.optional(),
  /** Non placé·e la semaine précédente : prioritaire (jamais une position). */
  priorityNextWeek: z.boolean(),
  pausedUntil: IsoDateTimeSchema.optional(),
  /**
   * V5.5 (D-061) : état honnête, pour moi seul·e qui cherche une histoire, calculé sur la VILLE et MES créneaux
   * AVANT toute composition : pas encore assez de personnes compatibles → je peux sortir en amitié
   * (`mode: FRIENDS_THIS_WEEK`) ou attendre. Ne désigne personne ; jamais après la composition.
   */
  storyFeasibility: z.literal('NOT_ENOUGH_ON_SLOTS').optional(),
  /** V5.5 (D-053) : prochaine composition qui me concerne (J − 3 21 h du plus proche de mes créneaux). */
  composeAt: IsoDateTimeSchema.optional(),
});
export type OutingWeekView = z.infer<typeof OutingWeekViewSchema>;

/**
 * `PUT /v1/outings/requests/:weekKey` (`outings.request`). V5.1 (D.13) : les créneaux viennent des
 * disponibilités cochées (`OutingPreferencesV5`) ; `slotStartsAt` les restreint pour cette semaine.
 * Une team (1–3 personnes) est composée comme une unité indivisible (B.7, remplace le « +1 »).
 */
export const PutOutingRequestSchema = z.object({
  slotStartsAt: z.array(IsoDateTimeSchema).min(1).max(7).refine((a) => new Set(a).size === a.length, { message: 'créneau en double' }).optional(),
  teamId: UuidSchema.optional(),
  /** V5.5 (D-061) : « sortir quand même, en amitié » cette semaine (après l'état honnête). */
  mode: z.enum(OUTING_REQUEST_MODES).optional(),
});
export type PutOutingRequest = z.infer<typeof PutOutingRequestSchema>;

// ---------------------------------------------------------------- vue de sortie (§7.5)
export const SeatCancelKindResultSchema = z.enum(['EARLY', 'LATE', 'SAFETY_EXIT', 'EMERGENCY']);
/**
 * V5.1 (E.16) : après le verrouillage, annuler = absence (sans remboursement, sauf motif sécurité).
 * V5.4 (B.8) : `EMERGENCY` (« imprévu », 1 par trimestre) après la confirmation = aucune absence, place non
 * remboursée (`refund: NONE`) ; `emergencyAvailable` dit au lecteur (lui seul) s'il lui reste son imprévu du trimestre.
 */
export const SeatCancelPreviewSchema = z.object({ cancelKind: SeatCancelKindResultSchema, refund: RefundModeSchema, countsAsAbsence: z.boolean(), emergencyAvailable: z.boolean().optional() });
export type SeatCancelPreview = z.infer<typeof SeatCancelPreviewSchema>;

export const MySeatViewSchema = z
  .object({
    status: SeatStatusSchema,
    /** Mon propre financement seulement (jamais celui des autres). */
    funding: SeatFundingSchema.optional(),
    holdExpiresAt: IsoDateTimeSchema.optional(),
    acceptDeadline: IsoDateTimeSchema.optional(),
    cancelPreview: SeatCancelPreviewSchema.optional(),
  })
  .strict();

export const OutingTimelineViewSchema = z
  .object({
    acceptDeadline: IsoDateTimeSchema,
    lockAt: IsoDateTimeSchema,
    photoRevealAt: IsoDateTimeSchema,
    checkinOpensAt: IsoDateTimeSchema,
    checkinClosesAt: IsoDateTimeSchema,
    votesCloseAt: IsoDateTimeSchema,
  })
  .strict();

/** Lieu : seulement à partir du verrouillage et si ma place est confirmée (I-O4). */
export const OutingVenueViewSchema = z
  .object({
    name: z.string(),
    address: z.string(),
    /** Description du lieu (V5.1 : consommation non incluse, chacun paie ce qu'il prend). */
    offerLabel: z.string(),
    /** Photo du lieu, montrée la veille (V5.1 H.24). */
    photoUrl: z.string().url().optional(),
    /** Nom de la réservation au lieu (« Blowy »), jamais le pet (G.22). */
    bookingName: z.string().optional(),
    // V5.5 (D-062) : `lat`/`lng` retirés (check-in par code uniquement, aucune position côté client).
    /** V5.6 (E11) : trajet typique depuis MON quartier (« ≈ 25 min »), seulement si la table de trajets le connaît. */
    travelMinutes: z.number().int().positive().optional(),
    /** Le trajet est une estimation (aucune valeur ops : centres de quartier, jamais une position). */
    travelEstimated: z.literal(true).optional(),
    /** V5.7 (E30, D-080) : message d'accueil écrit par le lieu — places confirmées, à partir de la confirmation. */
    welcomeMessage: z.string().max(280).optional(),
    /** V5.6 (B.14) : ambiance du lieu (« lieu calme » / « lieu animé ») ; absente = convient à tous. */
    ambiance: z.enum(['CALM', 'LIVELY']).optional(),
  })
  .strict();

/**
 * V5.6 (D-076, E24) : la fiabilité n'est visible que par soi (`GET /v1/me/reliability`) ; ce schéma ne
 * figure plus dans aucune vue d'autrui (membres de sortie, bande, duo). Gardé exporté pour compatibilité.
 * @deprecated
 */
export const MemberReliabilitySchema = z.union([z.object({ attended: z.number().int().nonnegative(), total: z.number().int().positive() }).strict(), z.literal('NEWCOMER')]);

export const ActivityKindSchemaV5 = z.enum(ACTIVITY_KINDS);

/**
 * Aperçu anonyme du groupe avant « Je viens » (V5.1 C.10) : « 5 personnes · 26–31 ans ·
 * 2 femmes, 3 hommes · 2 viennent en team ». Ni prénoms ni photos.
 */
export const OutingCompositionPreviewSchema = z
  .object({
    size: z.number().int().min(1).max(6),
    ageMin: z.number().int().min(18),
    ageMax: z.number().int().min(18),
    genders: z.object({ WOMAN: z.number().int().nonnegative(), MAN: z.number().int().nonnegative(), NON_BINARY: z.number().int().nonnegative(), UNDISCLOSED: z.number().int().nonnegative() }).partial().strict(),
    teams: z.number().int().nonnegative(),
  })
  .strict();
export type OutingCompositionPreviewDto = z.infer<typeof OutingCompositionPreviewSchema>;

/** Photo : jeton média à durée courte émis sur preuve d'ACL `OUTING_REVEAL`. */
export const RevealedPhotoSchema = z.object({ mediaId: UuidSchema, url: z.string().url() }).strict();

/**
 * Co-participant·e projeté·e pour le lecteur (§3.1). Jamais moi en double, jamais une personne
 * bloquée, jamais « absent·e », jamais motif d'annulation, financement, intentions ni votes.
 */
export const OutingMemberViewSchema = z
  .object({
    userId: UuidSchema,
    pet: PetCardSchema,
    threeWords: z.array(ThreeWordSchema).max(3),
    firstName: z.string().optional(),
    ageRange: AgeRangeSchema.optional(),
    photo: RevealedPhotoSchema.optional(),
    /** Membre de ma team (V5.1). */
    inMyTeam: z.literal(true).optional(),
    /** V5.7 (E32, D-084) : « je préfère le calme » choisi par la personne (opt-in), à partir de FORMING. */
    calm: z.literal(true).optional(),
    /** Seulement pendant CHECKIN_OPEN. */
    arrived: z.literal(true).optional(),
    /** « X ne pourra pas venir » (sans motif). */
    notComing: z.literal(true).optional(),
  })
  .strict();
export type OutingMemberView = z.infer<typeof OutingMemberViewSchema>;

/** `GET /v1/outings/:id` — `OutingView` projeté par acteur. */
export const OutingViewSchema = z
  .object({
    id: UuidSchema,
    status: OutingStatusSchema,
    weekKey: WeekKeySchema,
    neighborhood: z.object({ name: z.string() }).strict(),
    startsAt: IsoDateTimeSchema,
    endsAt: IsoDateTimeSchema,
    capacity: z.number().int().min(4).max(6),
    /** Activité de la sortie (V5.1 D.14). */
    activity: ActivityKindSchemaV5,
    /** Aperçu anonyme (PROPOSED, avant ma réponse). */
    preview: OutingCompositionPreviewSchema.optional(),
    /** Absent à partir de DONE (§3.1). */
    confirmedCount: z.number().int().nonnegative().optional(),
    mySeat: MySeatViewSchema,
    timeline: OutingTimelineViewSchema,
    venue: OutingVenueViewSchema.optional(),
    members: z.array(OutingMemberViewSchema),
    conversationId: UuidSchema.optional(),
    votes: z.object({ open: z.boolean(), closesAt: IsoDateTimeSchema }).strict().optional(),
    cancelled: z.object({ reason: z.enum(OUTING_PUBLIC_CANCEL_REASONS), refund: RefundModeSchema }).strict().optional(),
    // V5.4 A.1 : plus AUCUN signal de compatibilité (`storyMatch` / « sortie entre amis pour toi » retiré :
    // sa présence ou son absence, croisée avec la composition, désignerait quelqu'un). La garantie reste
    // appliquée en silence par la composition. Vue `.strict()` : un tel champ ferait échouer le contrat.
    /** V5.2 (C.10) : « je connais quelqu'un ici » possible (visages révélés, avant le début). */
    knowsSomeoneAvailable: z.literal(true).optional(),
    /** V5.6 (§7.5) : `YOU` si l'activité est l'une de MES activités cochées ; sinon « choisie selon le lieu et vos envies ». */
    activityChosenBy: z.enum(['YOU', 'VENUE_AND_GROUP']).optional(),
    /** V5.6 (§7.5, D-058) : une sortie n'existe que sous astreinte — toujours `covered: true`. */
    oncall: z.object({ covered: z.literal(true) }).strict().optional(),
  })
  .strict();
export type OutingView = z.infer<typeof OutingViewSchema>;

// ---------------------------------------------------------------- place
/** `POST /v1/outings/:id/seat/accept`. AUTO = crédit si disponible, sinon paiement. */
export const SeatAcceptRequestSchema = z.object({ funding: z.enum(['AUTO', 'PAY']).default('AUTO') });
export type SeatAcceptRequest = z.infer<typeof SeatAcceptRequestSchema>;

export const SeatPaymentIntentSchema = z.object({
  provider: PaymentProviderSchema,
  clientSecret: z.string().min(1),
  amountCents: AmountCentsSchema,
  currency: CurrencySchema,
});
export const SeatAcceptResponseSchema = z.object({
  seat: z.object({ status: SeatStatusSchema, funding: SeatFundingSchema.optional(), holdExpiresAt: IsoDateTimeSchema.optional() }),
  payment: SeatPaymentIntentSchema.optional(),
});
export type SeatAcceptResponse = z.infer<typeof SeatAcceptResponseSchema>;

/** `POST /v1/outings/:id/seat/cancel` ; aperçu sans effet : `GET …/seat/cancel-preview` (même réponse). */
export const SeatCancelRequestSchema = z.object({ kind: z.enum(OUTING_CANCEL_REQUEST_KINDS) });
export type SeatCancelRequest = z.infer<typeof SeatCancelRequestSchema>;
export const SeatCancelResponseSchema = SeatCancelPreviewSchema;
export type SeatCancelResponse = z.infer<typeof SeatCancelResponseSchema>;

// ---------------------------------------------------------------- « je connais quelqu'un ici » (V5.2 C.10)
/**
 * `POST /v1/outings/:id/seat/knows-someone` : signalement PRIVÉ (jamais montré à la personne visée).
 * Lien réel déjà connu dans l'app (bande, duo, blocage) → déplacement sans pénalité (`MOVED`) ;
 * sinon examen humain (`IN_REVIEW`). Au-delà d'une fois par mois : c'est une annulation (`COUNTED_AS_CANCEL`).
 */
export const KnowsSomeoneRequestSchema = z.object({ userId: UuidSchema });
export type KnowsSomeoneRequest = z.infer<typeof KnowsSomeoneRequestSchema>;
/**
 * V5.6 (A.1, E18, E23) : `MOVED` = déplacé·e vers un autre groupe du créneau (`newOutingId`) ou, faute de place,
 * retiré·e sans pénalité et remboursé·e ; `IN_REVIEW` = examen humain (lien inconnu) ; `SAFETY_REVIEW` = au-delà
 * d'1 déplacement par mois : sortie pour raison de sécurité (remboursée, sans pénalité) examinée par un humain.
 * `COUNTED_AS_CANCEL` n'est plus jamais renvoyé (gardé pour les anciens clients).
 */
export const KnowsSomeoneResponseSchema = z.object({ status: z.enum(['MOVED', 'IN_REVIEW', 'SAFETY_REVIEW', 'COUNTED_AS_CANCEL']), newOutingId: UuidSchema.optional() }).strict();

// ---------------------------------------------------------------- check-in (§2.8) — partagé avec les RDV duo
/**
 * V5.5 (D-062) : check-in **par le code à 4 chiffres du chevalet UNIQUEMENT** (sorties et RDV duo). Plus
 * aucune géolocalisation, ni demandée ni acceptée : tout champ de position (`lat`, `lng`, `accuracyM`,
 * `method: 'GEO'`) → 400 `VALIDATION_FAILED` (contrat `.strict()`).
 */
export const CheckInRequestSchema = z.object({ method: z.literal('VENUE_CODE').optional(), code: z.string().regex(/^\d{4}$/) }).strict();
export type CheckInRequest = z.infer<typeof CheckInRequestSchema>;
export const CheckInResponseSchema = z.object({ result: z.literal('ACCEPTED') });
export const CheckInResultSchema = z.enum(CHECKIN_RESULTS);
/** Détail de `412 CHECKIN_CODE_INVALID`. */
export const CheckInCodeInvalidDetailsSchema = z.object({ reason: z.literal('CHECKIN_CODE_INVALID'), attemptsLeft: z.number().int().nonnegative() });

// ---------------------------------------------------------------- votes d'après (§2.10, V5.1 A)
/**
 * Un seul écran : une ligne par personne présente, 3 choix toujours proposés à tous ; « non » par
 * défaut. Résultat = min des deux votes, « plus » incompatible ramené à « ami·e » en silence.
 * Jamais de compteur ni d'état de vote des autres ; mes accords à la clôture (date fixe) seulement.
 */
export const VoteTargetViewSchema = z
  .object({
    userId: UuidSchema,
    firstName: z.string(),
    photo: RevealedPhotoSchema.optional(),
    pet: PetCardSchema,
    /** Mon propre bulletin ; `NO` par défaut. */
    myChoice: VoteChoiceSchema,
    /** Accord mutuel, seulement après `closesAt`. Jamais « non » ni « plus » unilatéral. */
    mutual: MutualConnectionSchema.optional(),
  })
  .strict();

/** `GET /v1/outings/:id/votes` (présents seulement ; 404 sinon). */
export const OutingVotesViewSchema = z
  .object({
    closesAt: IsoDateTimeSchema,
    /** Résultats publiés (après la clôture). */
    closed: z.boolean(),
    targets: z.array(VoteTargetViewSchema),
  })
  .strict();
export type OutingVotesView = z.infer<typeof OutingVotesViewSchema>;

/** `PUT /v1/outings/:id/votes` : soumission groupée `{userId → choix}` ; une personne absente de la liste = NO. Modifiable jusqu'à la clôture. */
export const SubmitOutingVotesRequestSchema = z.object({ choices: z.record(UuidSchema, VoteChoiceSchema) });
export type SubmitOutingVotesRequest = z.infer<typeof SubmitOutingVotesRequestSchema>;
/** Aucune information sur les autres. */
export const SubmitOutingVotesResponseSchema = z.object({ myChoices: z.record(UuidSchema, VoteChoiceSchema) }).strict();

// ---------------------------------------------------------------- présence, historique, fiabilité
export const AttendanceDisputeRequestSchema = z.object({ note: z.string().trim().min(1).max(500) });
export type AttendanceDisputeRequest = z.infer<typeof AttendanceDisputeRequestSchema>;

export const OutingHistoryItemSchema = z.object({
  id: UuidSchema,
  weekKey: WeekKeySchema,
  startsAt: IsoDateTimeSchema,
  venueName: z.string(),
  attended: z.boolean(),
  memoryId: UuidSchema.optional(),
});
export const OutingHistoryPageSchema = pageOf(OutingHistoryItemSchema);

/** `GET /v1/me/reliability` : « venu·e à N sorties sur M ». */
export const ReliabilityViewSchema = z.object({
  attended: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  pausedUntil: IsoDateTimeSchema.optional(),
  newcomer: z.boolean(),
});
export type ReliabilityView = z.infer<typeof ReliabilityViewSchema>;

// ---------------------------------------------------------------- événements WS (§7.6)
export const OutingInvitedEventSchema = z.object({ outingId: UuidSchema, acceptDeadline: IsoDateTimeSchema });
/** Le client relit `GET /outings/:id` (projection). */
export const OutingUpdatedEventSchema = z.object({
  outingId: UuidSchema,
  status: OutingStatusSchema,
  confirmedCount: z.number().int().nonnegative().optional(),
  changed: z.enum(['STATUS', 'MEMBERS', 'VENUE', 'PHOTOS']),
});
export const OutingSeatUpdatedEventSchema = z.object({
  outingId: UuidSchema,
  seat: z.object({ status: SeatStatusSchema, refundState: RefundStateSchema }),
  payment: SeatPaymentIntentSchema.optional(),
});
export const OutingCheckinUpdatedEventSchema = z.object({ outingId: UuidSchema, userId: UuidSchema, arrived: z.literal(true) });
export const OutingVotesOpenedEventSchema = z.object({ outingId: UuidSchema, closesAt: IsoDateTimeSchema });
/** Mes accords seulement. */
export const OutingVotesClosedEventSchema = z.object({ outingId: UuidSchema, newBandCount: z.number().int().nonnegative(), newDuoCount: z.number().int().nonnegative() });
export const ReliabilityUpdatedEventSchema = z.object({ attended: z.number().int().nonnegative(), total: z.number().int().nonnegative(), pausedUntil: IsoDateTimeSchema.optional() });
