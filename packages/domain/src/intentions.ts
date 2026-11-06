/**
 * Intentions et préférences de rencontre V5.1 (D-014 amendé par concept-v5.1 C.9–C.11, D.13–D.14,
 * B.8, F.17). Secrètes : jamais exposées à quiconque (ni utilisateurs, ni staff, ni WS) ; seulement
 * l'export RGPD de la personne. L'orientation n'est jamais stockée ; `romanceGenders` exige le
 * consentement explicite `SENSITIVE_PREFERENCES`.
 */
import type { Gender, Intention } from './vision.js';
import type { WeekKey } from './neighborhood.js';

/** « Nouveaux potes » / « Une histoire » / « Les deux ». */
export const LOOKING_FOR = ['FRIENDS', 'STORY', 'BOTH'] as const;
export type LookingFor = (typeof LOOKING_FOR)[number];

/** Sous-choix secret d'« Une histoire ». */
export const STORY_SERIOUSNESS = ['SERIOUS', 'SEE_HOW_IT_GOES'] as const;
export type StorySeriousness = (typeof STORY_SERIOUSNESS)[number];

/** Facultatif : « enfants un jour ». */
export const KIDS_SOMEDAY = ['YES', 'NO', 'DONT_KNOW'] as const;
export type KidsSomeday = (typeof KIDS_SOMEDAY)[number];
/** V5.5 (D-060) / V5.6 (B.13) : horizon enfants (remplace `KIDS_SOMEDAY`), dont « j'en ai déjà ». Secret. */
export const KIDS_HORIZONS = ['IN_1_2_YEARS', 'IN_3_5_YEARS', 'NO_PLAN', 'DONT_KNOW', 'HAS_ALREADY'] as const;
export type KidsHorizon = (typeof KIDS_HORIZONS)[number];
/** Repli : ancien `kidsSomeday` → horizon (lecture des profils V5.1). */
export function kidsHorizonOf(h: KidsHorizon | null | undefined, legacy: KidsSomeday | null | undefined): KidsHorizon | null {
  if (h) return h;
  if (legacy === 'YES') return 'IN_3_5_YEARS';
  if (legacy === 'NO') return 'NO_PLAN';
  if (legacy === 'DONT_KNOW') return 'DONT_KNOW';
  return null;
}

/** « Comment tu préfères rencontrer ? » En petit groupe / À deux, par écrit d'abord / Les deux. */
export const MEETING_MODES = ['GROUP', 'DUO', 'BOTH'] as const;
export type MeetingMode = (typeof MEETING_MODES)[number];

/** Types d'activité d'une sortie (D.14). */
/** V5.9 : + `SPORT` (« Foot à 5 », facts.json). */
export const ACTIVITY_KINDS = ['DRINK_COFFEE', 'BRUNCH', 'CLIMBING', 'WORKSHOP', 'GAMES', 'EXHIBITION', 'SPORT'] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

/** Temps de trajet maximal déclaratif (B.8). */
export const TRAVEL_MINUTES = [20, 30, 45] as const;
export type TravelMinutes = (typeof TRAVEL_MINUTES)[number];

export interface IntentionsV5 {
  lookingFor: LookingFor;
  /** Seulement si STORY ou BOTH. */
  storySeriousness: StorySeriousness | null;
  kidsSomeday: KidsSomeday | null;
  meetingMode: MeetingMode;
  /** « Qui je veux rencontrer » en groupe ; vide = tout le monde. */
  meetGenders: Gender[];
  /** Obligatoire non vide si STORY ou BOTH. */
  romanceGenders: Gender[];
}

/** Préférences de sortie (déclaratives ; jamais de géolocalisation). */
export interface OutingPreferencesV5 {
  /** Tranche d'âge souhaitée pour le groupe (défaut : âge ± `[T] preferences.groupAgeDefaultDelta`). */
  groupAge: { min: number; max: number };
  /** Créneaux de la ville cochés (identifiants de `NeighborhoodSlotTemplate`). */
  availableSlotTemplateIds: string[];
  /** Semaines off (garde alternée…). */
  weeksOff: WeekKey[];
  /** Vide = toutes les activités. */
  activities: ActivityKind[];
  /** Quartiers acceptables (≥ 1, le sien inclus). */
  neighborhoodIds: string[];
  maxTravelMinutes: TravelMinutes;
}

/** Finalité du consentement explicite requis pour `romanceGenders` (art. 9 RGPD). */
export const SENSITIVE_PREFERENCES_PURPOSE = 'SENSITIVE_PREFERENCES' as const;

/** Vue « cherche » dérivée (moteurs) : amis et/ou romance. */
export const seeksOf = (lookingFor: LookingFor): { friends: boolean; romance: boolean } => ({ friends: lookingFor !== 'STORY', romance: lookingFor !== 'FRIENDS' });
/** La voie Duo est ouverte pour DUO ou BOTH ; désactivée par défaut pour GROUP (F.17). */
export const duoLaneEnabledFor = (mode: MeetingMode): boolean => mode !== 'GROUP';
export const groupLaneEnabledFor = (mode: MeetingMode): boolean => mode !== 'DUO';

export type IntentionsIssue = 'ROMANCE_GENDERS_REQUIRED' | 'STORY_SUBCHOICE_ONLY_WITH_STORY';
export function intentionsIssues(i: Pick<IntentionsV5, 'lookingFor' | 'romanceGenders' | 'storySeriousness' | 'kidsSomeday'>): IntentionsIssue[] {
  const out: IntentionsIssue[] = [];
  const romance = seeksOf(i.lookingFor).romance;
  if (romance && i.romanceGenders.length === 0) out.push('ROMANCE_GENDERS_REQUIRED');
  if (!romance && (i.storySeriousness !== null || i.kidsSomeday !== null)) out.push('STORY_SUBCHOICE_ONLY_WITH_STORY');
  return out;
}

/**
 * Indice « projet compatible » en Duo (F.18) : les deux cherchent une histoire, même sérieux, et
 * « enfants un jour » concordant (ou non renseigné / « je ne sais pas » d'un côté). Jamais les sous-choix eux-mêmes.
 */
export function projectCompatible(
  a: Pick<IntentionsV5, 'lookingFor' | 'storySeriousness' | 'kidsSomeday'> & { kidsHorizon?: KidsHorizon | null },
  b: Pick<IntentionsV5, 'lookingFor' | 'storySeriousness' | 'kidsSomeday'> & { kidsHorizon?: KidsHorizon | null },
): boolean {
  if (!seeksOf(a.lookingFor).romance || !seeksOf(b.lookingFor).romance) return false;
  if (a.storySeriousness === null || a.storySeriousness !== b.storySeriousness) return false;
  // V5.6 (E11) : horizon enfants (repli sur l'ancien `kidsSomeday`). Concordant si l'un ne sait pas, si les deux
  // en veulent (1–2 ans ou 3–5 ans), si aucun n'en prévoit ; « j'en ai déjà » ne ferme rien.
  const ha = kidsHorizonOf(a.kidsHorizon ?? null, a.kidsSomeday);
  const hb = kidsHorizonOf(b.kidsHorizon ?? null, b.kidsSomeday);
  const open = (h: KidsHorizon | null) => h === null || h === 'DONT_KNOW' || h === 'HAS_ALREADY';
  if (open(ha) || open(hb)) return true;
  const family = (h: KidsHorizon) => (h === 'NO_PLAN' ? 'NO' : 'WANTS');
  return family(ha!) === family(hb!);
}

/**
 * Mapping de l'ancienne intention V4 : FRIENDS_* → FRIENDS ; OPEN_TO_MORE / LET_IT_HAPPEN → BOTH
 * si `seekingGenders` non vide (copié dans `romanceGenders`), sinon FRIENDS + `needsCompletion`.
 * Sous-choix inconnus (null) ; mode GROUP (la voie Duo reste un choix explicite).
 */
export function mapLegacyIntention(intention: Intention, seekingGenders: readonly Gender[]): { intentions: IntentionsV5; needsCompletion: boolean } {
  const wantsMore = intention === 'OPEN_TO_MORE' || intention === 'LET_IT_HAPPEN';
  const romance = wantsMore && seekingGenders.length > 0;
  return {
    intentions: { lookingFor: romance ? 'BOTH' : 'FRIENDS', storySeriousness: null, kidsSomeday: null, meetingMode: 'GROUP', meetGenders: [], romanceGenders: romance ? [...seekingGenders] : [] },
    needsCompletion: wantsMore && !romance,
  };
}

/** Étapes manquantes de l'onboarding V5.1 (`ONBOARDING_INCOMPLETE {missing}`). Ville/quartier d'abord (B.5). */
export const ONBOARDING_STEPS_V5 = ['NEIGHBORHOOD', 'BIRTH_DATE', 'PET', 'VISION', 'SEEKS', 'MEETING_MODE', 'GENDER', 'SOCIAL_CONSENTS', 'DISCREET_MODE'] as const;
export type OnboardingStepV5 = (typeof ONBOARDING_STEPS_V5)[number];
