import type { ReportCategory } from '@blowy/domain';

/** Ordre d'affichage : sécurité d'abord. */
export const REPORT_CATEGORIES_ORDER: readonly ReportCategory[] = ['SAFETY', 'MINOR', 'HARASSMENT', 'MONEY_REQUEST', 'INAPPROPRIATE', 'FAKE_PROFILE', 'OTHER'];

/** Tranche d'âge affichée quand l'âge exact est masqué. */
export function ageRange(age: number): string {
  if (age < 21) return '18–20';
  const lo = Math.floor((age - 21) / 5) * 5 + 21;
  return `${lo}–${lo + 4}`;
}
