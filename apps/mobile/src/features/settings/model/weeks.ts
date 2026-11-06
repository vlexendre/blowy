/**
 * « Une semaine sur deux » (V5.4 §B9, garde alternée) : calcul pur des semaines sans sortie.
 * Le contrat ne connaît que des semaines ISO cochées (`weeksOff`, 26 au plus) : l'alternance est
 * envoyée comme la liste explicite des 13 prochaines semaines concernées (≈ 6 mois).
 */
const DAY = 86_400_000;

/** Lundi (UTC, minuit) de la semaine qui suit `now`, puis la suivante. */
export function nextMondays(now: number, count = 2): number[] {
  const d = new Date(now);
  const dow = (d.getUTCDay() + 6) % 7; // 0 = lundi
  const monday = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - dow * DAY + 7 * DAY;
  return Array.from({ length: count }, (_, i) => monday + i * 7 * DAY);
}

/** Clé ISO « 2026-W47 » d'un instant. */
export function isoWeekKey(t: number): string {
  const d = new Date(t);
  const day = (d.getUTCDay() + 6) % 7;
  const thursday = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - day * DAY + 3 * DAY;
  const year = new Date(thursday).getUTCFullYear();
  const jan4 = Date.UTC(year, 0, 4);
  const week = 1 + Math.round((thursday - (jan4 - ((new Date(jan4).getUTCDay() + 6) % 7) * DAY + 3 * DAY)) / (7 * DAY));
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** Lundis sans sortie : une semaine sur deux à partir de `fromMonday`. */
export function alternateMondays(fromMonday: number, count = 13): number[] {
  return Array.from({ length: count }, (_, i) => fromMonday + i * 14 * DAY);
}

export const alternateWeekKeys = (fromMonday: number, count = 13): string[] => alternateMondays(fromMonday, count).map(isoWeekKey);
