/**
 * Parcours d'onboarding V5.3 (D.13) : une question par écran, 9 étapes avant la Trouvée.
 * Welcome → Ville (1) → Naissance (2) → Genre (3) → Pet (4) → Rencontrer (5) → Tu cherches (6)
 * → [Consentement (7) → Pour une histoire (8)] seulement si « histoire » → Créneaux (9).
 * Logique pure, testée (flow.test.ts).
 */
import type { Gender, LookingFor, MeetingMode, Species } from '@blowy/domain';

export const ONBOARDING_STEPS = [
  'welcome',
  'city',
  'birthdate',
  'gender',
  'pet',
  'meet',
  'looking',
  'consent',
  'story',
  'slots',
] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** Numéro affiché (1/9…9/9) ; le consentement compte comme l'étape 7 même s'il est sauté. */
export const STEP_NUMBER: Record<Exclude<OnboardingStep, 'welcome'>, number> = {
  city: 1,
  birthdate: 2,
  gender: 3,
  pet: 4,
  meet: 5,
  looking: 6,
  consent: 7,
  story: 8,
  slots: 9,
};
export const STEP_TOTAL = 9;

export type SlotKey =
  'tue_evening' | 'thu_evening' | 'fri_evening' | 'sat_afternoon' | 'sun_brunch';
export const SLOT_KEYS: readonly SlotKey[] = [
  'tue_evening',
  'thu_evening',
  'fri_evening',
  'sat_afternoon',
  'sun_brunch',
];
/** Trajets affichés par la maquette ; le contrat n'accepte que 20/30/45 (`TRAVEL_MINUTES`). */
export const TRAVEL_CHOICES = [15, 20, 30, 45] as const;
export type TravelChoice = (typeof TRAVEL_CHOICES)[number];

export interface OnboardingDraft {
  step: OnboardingStep;
  city: { query: string; neighborhoodId: string | null; name: string | null; live: boolean | null };
  birthDate: { day: string; month: string; year: string };
  gender: Gender | null;
  species: Species | null;
  meetingMode: MeetingMode | null;
  lookingFor: LookingFor | null;
  /** Consentement art. 9 : null = pas encore demandé ; false = « amitié seulement ». */
  sensitiveConsent: boolean | null;
  romanceGenders: Gender[];
  slots: SlotKey[];
  weeksOff: boolean;
  travel: TravelChoice;
  completed: boolean;
  /** Lien d'invitation de team reçu (V5-Invite) : rejoint après la création du compte. */
  inviteRef: string | null;
}

export const initialDraft: OnboardingDraft = {
  step: 'welcome',
  city: { query: '', neighborhoodId: null, name: null, live: null },
  birthDate: { day: '', month: '', year: '' },
  gender: null,
  species: null,
  meetingMode: null,
  lookingFor: null,
  sensitiveConsent: null,
  romanceGenders: [],
  slots: [],
  weeksOff: false,
  travel: 30,
  completed: false,
  inviteRef: null,
};

export const wantsStory = (d: Pick<OnboardingDraft, 'lookingFor'>): boolean =>
  d.lookingFor === 'STORY' || d.lookingFor === 'BOTH';

/** Étape suivante (les étapes 7–8 n'existent que pour « histoire » ; refus du consentement → créneaux). */
export function nextStep(step: OnboardingStep, d: OnboardingDraft): OnboardingStep | 'found' {
  switch (step) {
    case 'welcome':
      return 'city';
    case 'city':
      return 'birthdate';
    case 'birthdate':
      return 'gender';
    case 'gender':
      return 'pet';
    case 'pet':
      return 'meet';
    case 'meet':
      return 'looking';
    case 'looking':
      return wantsStory(d) ? 'consent' : 'slots';
    case 'consent':
      return d.sensitiveConsent ? 'story' : 'slots';
    case 'story':
      return 'slots';
    case 'slots':
      return 'found';
  }
}

export function previousStep(step: OnboardingStep, d: OnboardingDraft): OnboardingStep | null {
  switch (step) {
    case 'welcome':
      return null;
    case 'city':
      return 'welcome';
    case 'slots':
      return wantsStory(d) ? (d.sensitiveConsent ? 'story' : 'consent') : 'looking';
    default: {
      const i = ONBOARDING_STEPS.indexOf(step);
      return ONBOARDING_STEPS[i - 1] ?? null;
    }
  }
}

/** L'étape est-elle répondue (bouton « Continuer » actif) ? */
export function isAnswered(step: OnboardingStep, d: OnboardingDraft, now: number): boolean {
  switch (step) {
    case 'welcome':
      return true;
    case 'city':
      // `GET /v1/neighborhoods` exige une session : avant le compte, la saisie libre suffit ; le
      // quartier est résolu à la création du compte (suggestion choisie, sinon 1ʳᵉ correspondance).
      return d.city.neighborhoodId !== null || d.city.query.trim().length >= 2;
    case 'birthdate':
      return (
        parseBirthDate(d.birthDate) !== null && ageOn(parseBirthDate(d.birthDate)!, now) !== null
      );
    case 'gender':
      return d.gender !== null;
    case 'pet':
      return d.species !== null;
    case 'meet':
      return d.meetingMode !== null;
    case 'looking':
      return d.lookingFor !== null;
    case 'consent':
      return d.sensitiveConsent !== null;
    case 'story':
      return d.romanceGenders.length > 0;
    case 'slots':
      return d.slots.length > 0;
  }
}

/** « JJ / MM / AAAA » → date civile valide (YYYY-MM-DD) ou null. */
export function parseBirthDate(b: OnboardingDraft['birthDate']): string | null {
  const d = Number(b.day);
  const m = Number(b.month);
  const y = Number(b.year);
  if (!/^\d{1,2}$/.test(b.day) || !/^\d{1,2}$/.test(b.month) || !/^\d{4}$/.test(b.year))
    return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Âge révolu à `now` (null si la date est dans le futur ou improbable > 120 ans). */
export function ageOn(civilDate: string, now: number): number | null {
  const [y, m, d] = civilDate.split('-').map(Number) as [number, number, number];
  const t = new Date(now);
  let age = t.getUTCFullYear() - y;
  if (t.getUTCMonth() + 1 < m || (t.getUTCMonth() + 1 === m && t.getUTCDate() < d)) age -= 1;
  return age < 0 || age > 120 ? null : age;
}

export const isMinor = (civilDate: string, now: number): boolean =>
  (ageOn(civilDate, now) ?? 99) < 18;

/** Les intentions envoyées à l'API (`PUT /v1/preferences/intentions`) ; null si incomplètes. */
export function intentionsOf(d: OnboardingDraft): {
  lookingFor: LookingFor;
  storySeriousness: null;
  kidsSomeday: null;
  meetingMode: MeetingMode;
  meetGenders: Gender[];
  romanceGenders: Gender[];
} | null {
  if (!d.lookingFor || !d.meetingMode) return null;
  // Consentement refusé (« amitié seulement ») : on n'envoie que l'amitié (aucune donnée art. 9).
  const lookingFor: LookingFor = wantsStory(d) && d.sensitiveConsent ? d.lookingFor : 'FRIENDS';
  return {
    lookingFor,
    storySeriousness: null,
    kidsSomeday: null,
    meetingMode: d.meetingMode,
    meetGenders: [],
    romanceGenders: lookingFor === 'FRIENDS' ? [] : d.romanceGenders,
  };
}
