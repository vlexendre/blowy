/**
 * Machine d'étapes de l'onboarding (logique pure) : ordre, reprise, garde d'accès.
 * Le pet naît avant le compte ; le compte, la vérif et le paywall viennent après le moment fort.
 */
import type { Intention, Limit, Passion, School, Species, Sunday, VisionAxes } from '@blowy/domain';
import { FREE_SPECIES, MAX_PASSIONS, PREMIUM_SPECIES } from '@blowy/domain';

export const ONBOARDING_STEPS = [
  'welcome',
  'species',
  'school',
  'sunday',
  'passions',
  'limit',
  'intention',
  'hatch',
  'account',
  'preferences',
  'verify',
  'paywall',
  'matches',
  'notifications',
] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** Étapes faisables sans compte (stockage local uniquement). */
export const PRE_ACCOUNT_STEPS: readonly OnboardingStep[] = ['welcome', 'species', 'school', 'sunday', 'passions', 'limit', 'intention', 'hatch'];

export interface InviteContext {
  code: string;
  /** Prénom public autorisé du parrain (vient du serveur ; null si non vérifié). */
  inviterName: string | null;
  status: 'unverified' | 'valid' | 'invalid';
}

export interface OnboardingDraft {
  step: OnboardingStep;
  species: Species;
  petName: string;
  axes: VisionAxes;
  school: School | null;
  sunday: Sunday | null;
  passions: Passion[];
  limit: Limit | null;
  intention: Intention | null;
  hatched: boolean;
  /** Pet enregistré serveur (après compte). */
  petCreated: boolean;
  invite: InviteContext | null;
  /** Espèce premium prévisualisée mais non adoptée faute de droit → repli choisi. */
  premiumDeclined: boolean;
  notificationsAsked: boolean;
  completed: boolean;
}

export const initialDraft: OnboardingDraft = {
  step: 'welcome',
  species: 'NINO',
  petName: '',
  axes: { kindMischief: 0, sportyContemplative: 0, scienceArt: 0, homeAdventure: 0 },
  school: null,
  sunday: null,
  passions: [],
  limit: null,
  intention: null,
  hatched: false,
  petCreated: false,
  invite: null,
  premiumDeclined: false,
  notificationsAsked: false,
  completed: false,
};

export const stepIndex = (s: OnboardingStep): number => ONBOARDING_STEPS.indexOf(s);
export const nextStep = (s: OnboardingStep): OnboardingStep | null => ONBOARDING_STEPS[stepIndex(s) + 1] ?? null;
export const prevStep = (s: OnboardingStep): OnboardingStep | null => ONBOARDING_STEPS[stepIndex(s) - 1] ?? null;

export const isPremium = (s: Species): boolean => PREMIUM_SPECIES.includes(s);
export const fallbackSpecies = (s: Species): Species => (isPremium(s) ? (FREE_SPECIES[0] ?? 'GASTON') : s);

/** Une étape est-elle complète (CTA actif) ? */
export function canContinue(d: OnboardingDraft, step: OnboardingStep): boolean {
  switch (step) {
    case 'species':
      return d.petName.trim().length >= 1 && d.petName.trim().length <= 24;
    case 'school':
      return d.school !== null;
    case 'sunday':
      return d.sunday !== null;
    case 'passions':
      return d.passions.length >= 1 && d.passions.length <= MAX_PASSIONS;
    case 'limit':
      return d.limit !== null;
    case 'intention':
      return d.intention !== null;
    case 'hatch':
      return d.hatched;
    default:
      return true;
  }
}

/**
 * Étape de reprise : première étape incomplète jusqu'à l'étape mémorisée. Un brouillon
 * incohérent (ex. vision partielle) ramène à la première étape manquante.
 */
export function resumeStep(d: OnboardingDraft, signedIn: boolean): OnboardingStep {
  if (d.completed) return 'notifications';
  const upto = stepIndex(d.step);
  for (const s of ONBOARDING_STEPS.slice(1, upto)) if (!canContinue(d, s)) return s;
  if (!signedIn && !PRE_ACCOUNT_STEPS.includes(d.step)) return 'account';
  return d.step;
}

export function togglePassion(list: readonly Passion[], p: Passion): Passion[] {
  if (list.includes(p)) return list.filter((x) => x !== p);
  if (list.length >= MAX_PASSIONS) return [...list];
  return [...list, p];
}

/** Libellé vocal d'un axe ∈ [-1,1] en 5 crans. */
export function axisBucket(v: number): 'strongLeft' | 'left' | 'balanced' | 'right' | 'strongRight' {
  if (v <= -0.6) return 'strongLeft';
  if (v < -0.15) return 'left';
  if (v <= 0.15) return 'balanced';
  if (v < 0.6) return 'right';
  return 'strongRight';
}

/** Âge révolu à une date civile (YYYY-MM-DD) — contrôle d'UX ; le serveur fait foi (18+). */
export function ageAt(birth: string, today: Date): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birth);
  if (!m) return null;
  const [y, mo, da] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(y, mo - 1, da));
  if (d.getUTCFullYear() !== y || d.getUTCMonth() !== mo - 1 || d.getUTCDate() !== da) return null;
  let age = today.getUTCFullYear() - y;
  if (today.getUTCMonth() + 1 < mo || (today.getUTCMonth() + 1 === mo && today.getUTCDate() < da)) age -= 1;
  return age;
}

/** JJ/MM/AAAA → YYYY-MM-DD (ou null). */
export function parseFrenchDate(input: string): string | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(input.trim());
  if (!m) return null;
  const iso = `${m[3]}-${m[2]!.padStart(2, '0')}-${m[1]!.padStart(2, '0')}`;
  return ageAt(iso, new Date(Date.UTC(3000, 0, 1))) === null ? null : iso;
}

/** Défauts affichés des préférences de rencontre (modifiables, jamais déduits d'Apple). */
export function defaultPreferences(age: number | null, intention: Intention) {
  const a = age ?? 25;
  return {
    ageMin: Math.max(18, a - 4),
    ageMax: Math.min(99, a + 6),
    maxDistanceKm: 8,
    seekingGenders: [] as ('WOMAN' | 'MAN' | 'NON_BINARY' | 'UNDISCLOSED')[],
    intention,
    widenConsented: false,
  };
}
