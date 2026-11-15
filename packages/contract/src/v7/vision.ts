/**
 * Contrat « vision » : qui est la personne, ce qu'elle cherche, sa vision de la vie (5 axes), la compatibilité
 * expliquée et la carte. Ce fichier ne dépend que de zod et du domaine (pas de `../index`, pour éviter un import
 * circulaire) ; les schémas qui ont besoin d'une personne (`PersonZ`) sont dans `index.ts` (SuggestionZ, MapZ).
 *
 * Données sensibles : le sexe et « qui tu veux rencontrer » peuvent révéler l'orientation sexuelle.
 * « Qui tu veux rencontrer » n'est jamais montré aux autres : il sert seulement à filtrer. Il exige un accord
 * explicite (horodaté), comme la position.
 */
import { AXIS_SIDES, AXIS_STRENGTHS, GENDERS, LOCALES, LOOKING_FOR, SEEKINGS, VISION_AXES, WHOMS } from '@blowy/domain';
import { z } from 'zod';

const Iso = z.string();

// ── Qui tu es, ce que tu cherches ────────────────────────────────────────────
/** femme · homme · non_binaire · non_dit (« je préfère ne pas dire »). */
export const GenderZ = z.enum(GENDERS);
/** potes · plus · les_deux. */
export const SeekingZ = z.enum(SEEKINGS);
/** Pour « plus » ou « les deux » : femmes · hommes · tout_le_monde. Jamais visible par les autres. */
export const WhomZ = z.enum(WHOMS);
/** Langue des textes renvoyés par l'API. */
export const LocaleZ = z.enum(LOCALES);
export type Gender = z.infer<typeof GenderZ>;
export type Seeking = z.infer<typeof SeekingZ>;
export type Whom = z.infer<typeof WhomZ>;
export type Locale = z.infer<typeof LocaleZ>;

/** Une réponse au test de vision : l'identifiant de la situation et le choix (0 ou 1). */
export const VisionAnswerZ = z.object({ questionId: z.string().min(1).max(40), choice: z.union([z.literal(0), z.literal(1)]) });
export type VisionAnswer = z.infer<typeof VisionAnswerZ>;

/** Un point (degrés décimaux). */
export const LatLngZ = z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) });
export type LatLng = z.infer<typeof LatLngZ>;

/** Ville choisie (Blowy+) : déplace le centre des rencontres sans bouger. `label` est le nom affiché, choisi par l'app. */
export const ChosenCityZ = LatLngZ.extend({ label: z.string().trim().min(1).max(60) });
export type ChosenCity = z.infer<typeof ChosenCityZ>;

/** Où en est la localisation de la personne (vu par elle seule). */
export const LocationStatusZ = z.object({
  /** Accord donné pour utiliser la position (null : pas d'accord, donc ni carte ni rencontres proches). */
  consentAt: Iso.nullable(),
  /** Dernier relevé (app ouverte seulement). */
  locatedAt: Iso.nullable(),
  /** Zone du domicile : centre arrondi à ~300 m et rayon. Elle ne bouge pas pour une sortie (seulement après 72 h ailleurs). */
  zone: z.object({ center: LatLngZ, radiusKm: z.number() }).nullable(),
  /** Ville choisie (Blowy+), même si l'abonnement a pris fin. */
  chosenCity: ChosenCityZ.nullable(),
  /** Vrai si la ville choisie sert en ce moment de centre (Blowy+ actif). */
  chosenCityActive: z.boolean(),
  /**
   * D'où vient la zone : `gps` (position du téléphone, arrondie) ou `manual` (zone choisie à la main, sans
   * localisation, gratuit) ; null sans zone.
   */
  source: z.enum(['gps', 'manual']).nullable(),
  /**
   * Zone choisie à la main (sans localisation) : la ville et le premier jour où elle pourra changer (gratuit : 30 jours
   * après le choix, ce jour peut être passé ; null avec Blowy+ : quand on veut). Null si la zone vient du téléphone.
   */
  manualArea: z.object({ label: z.string(), nextChangeOn: z.string().nullable() }).nullable(),
});
export type LocationStatus = z.infer<typeof LocationStatusZ>;

/** Le bloc « qui tu es » de `Me` : vu seulement par la personne. */
export const IdentityZ = z.object({
  gender: GenderZ,
  seeking: SeekingZ,
  /** Null quand la personne ne cherche que des potes. */
  whom: WhomZ.nullable(),
  locale: LocaleZ,
  /** Mode discret : la personne n'apparaît sur la carte de personne (elle reste proposée en rencontre). */
  discreet: z.boolean(),
  /** Accord pour « qui tu veux rencontrer ». */
  sensitiveConsentAt: Iso.nullable(),
  location: LocationStatusZ,
});
export type Identity = z.infer<typeof IdentityZ>;

/** Accords donnés à l'écran (cases à cocher explicites). L'API horodate chaque accord. */
export const ConsentsZ = z.object({
  /** Accord pour enregistrer « qui tu veux rencontrer » (obligatoire dès que `whom` est envoyé). */
  sensitive: z.boolean().default(false),
  /** Accord pour utiliser la position (obligatoire dès qu'une position est envoyée). */
  location: z.boolean().default(false),
});

/** Champs « qui tu es » de l'inscription (ajoutés à OnboardBody). */
export const OnboardIdentityFields = {
  gender: GenderZ.default('non_dit'),
  seeking: SeekingZ.default('potes'),
  /** Requis si `seeking` vaut « plus » ou « les_deux » ; interdit pour « potes ». Demande `consents.sensitive`. */
  whom: WhomZ.nullable().optional(),
  locale: LocaleZ.default('fr'),
  consents: ConsentsZ.default({ sensitive: false, location: false }),
  /** Position relevée pendant l'inscription (demande `consents.location`). */
  location: LatLngZ.optional(),
  /** Réponses au test de vision, passé avant la connexion. */
  visionAnswers: z.array(VisionAnswerZ).max(24).default([]),
};

/**
 * Champs « qui tu es » modifiables (ajoutés à UpdateMeBody). Passer à « potes » efface `whom` ;
 * `sensitiveConsent: false` retire l'accord, efface `whom` et repasse à « potes ».
 */
export const UpdateIdentityFields = {
  gender: GenderZ.optional(),
  seeking: SeekingZ.optional(),
  whom: WhomZ.nullable().optional(),
  locale: LocaleZ.optional(),
  discreet: z.boolean().optional(),
  sensitiveConsent: z.boolean().optional(),
};

/** Position relevée à l'ouverture de l'app. `consent: true` la première fois (accord horodaté). */
export const LocationBody = LatLngZ.extend({ consent: z.boolean().optional() });
export type LocationBody = z.infer<typeof LocationBody>;

// ── Test de vision ───────────────────────────────────────────────────────────
export const VisionAxisZ = z.enum(VISION_AXES);
export type VisionAxisKey = z.infer<typeof VisionAxisZ>;
/** low : pôle − · mid : entre les deux · high : pôle +. */
export const AxisSideZ = z.enum(AXIS_SIDES);
/**
 * Où penche une personne sur un axe, en gros : le côté et une force en trois crans (light : entre les deux, à peine
 * d'un côté ou peu sûr · clear : nettement · strong : très). Jamais la valeur ni la confiance.
 */
export const AxisLeanZ = z.object({ side: AxisSideZ, strength: z.enum(AXIS_STRENGTHS) });
export type AxisLeanDto = z.infer<typeof AxisLeanZ>;
/**
 * Ce que vous cherchez tous les deux, une fois le filtre réciproque passé (« Vous cherchez tous les deux… ») :
 * friends (des potes) · more (plus) · both (les deux). Jamais « qui » l'autre veut rencontrer.
 */
export const LookingForZ = z.enum(LOOKING_FOR);
export type LookingForDto = z.infer<typeof LookingForZ>;


/** Le test : 12 situations à deux choix, une par écran (public : il se passe avant la connexion). */
export const VisionTestZ = z.object({
  title: z.string(),
  intro: z.string(),
  questions: z.array(z.object({ id: z.string(), situation: z.string(), choices: z.tuple([z.string(), z.string()]) })),
});
export type VisionTest = z.infer<typeof VisionTestZ>;

/** Repasser le test après l'inscription : les nouvelles réponses remplacent les anciennes. */
export const VisionTestBody = z.object({ answers: z.array(VisionAnswerZ).min(1).max(24) });
export type VisionTestBody = z.infer<typeof VisionTestBody>;

// ── Profil de vision (vu par son propriétaire) ───────────────────────────────
export const VisionAxisReadingZ = z.object({
  axis: VisionAxisZ,
  name: z.string(),
  /** Ce que l'axe mesure. */
  about: z.string(),
  lowLabel: z.string(),
  highLabel: z.string(),
  /** De −100 (pôle −) à 100 (pôle +). */
  value: z.number().int().min(-100).max(100),
  /** De 0 à 100 : à quel point le minimoa en est sûr. */
  confidence: z.number().int().min(0).max(100),
  side: AxisSideZ,
  /** Formulation : « Plutôt fonder un foyer. » */
  line: z.string(),
});
export const VisionProfileZ = z.object({
  /** « Ta vision, pour l'instant ». */
  title: z.string(),
  /** « Indicatif, il s'affine avec toi. » (à afficher). */
  note: z.string(),
  axes: z.array(VisionAxisReadingZ).length(5),
  testDone: z.boolean(),
});
export type VisionProfileDto = z.infer<typeof VisionProfileZ>;

// ── Compatibilité expliquée (vue par l'autre personne) ───────────────────────
/**
 * Pourquoi le minimoa présente quelqu'un : 3 points communs et 1 différence à explorer. C'est tout ce que
 * l'autre voit de ta vision (jamais tes chiffres, jamais « qui tu veux rencontrer »).
 * `mine` / `theirs` (sur ces 4 axes seulement) : où penche chacun, en gros (côté et cran), pour placer les deux
 * repères. Absents d'une réponse plus ancienne.
 */
const ExplainedAxisZ = z.object({ axis: VisionAxisZ, name: z.string(), text: z.string(), mine: AxisLeanZ.optional(), theirs: AxisLeanZ.optional() });
export const MatchExplanationZ = z.object({
  commonTitle: z.string(),
  common: z.array(ExplainedAxisZ).length(3),
  exploreTitle: z.string(),
  explore: ExplainedAxisZ,
});
export type MatchExplanation = z.infer<typeof MatchExplanationZ>;

// ── Carte : briques (le schéma complet MapZ est dans index.ts) ───────────────
/** ?lat=&lng=&radiusKm= : Blowy+ seulement, pour regarder ailleurs (rayon de 25 km au plus). Sans paramètre : sa zone. */
export const MapQuery = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(0.5).max(25).optional(),
});
export type MapQuery = z.infer<typeof MapQuery>;

/** Silhouettes floues au-delà de ce qu'on peut voir : un nombre et des positions grossières (~2 km), sans identité. */
export const MapBeyondZ = z.object({ count: z.number().int().min(0), label: z.string(), blurred: z.array(LatLngZ) });

export const visionRoutes = {
  /** GET, public : le test. POST (connecté) : le repasser. */
  visionTest: () => '/v1/vision/test',
  /** GET : ta vision, pour l'instant. */
  vision: () => '/v1/vision',
  /** POST : position relevée (app ouverte) · DELETE : oublier la position et retirer l'accord. */
  location: () => '/v1/me/location',
  /** PUT : changer de ville (Blowy+) · DELETE : revenir à sa zone. */
  city: () => '/v1/me/city',
  /** PUT : choisir sa zone à la main, sans localisation (gratuit ; corps `ChosenCityZ`). DELETE `location` l'oublie. */
  area: () => '/v1/me/area',
  /** GET : la carte. */
  map: () => '/v1/map',
} as const;
