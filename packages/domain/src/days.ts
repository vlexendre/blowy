/** Jours civils au format AAAA-MM-JJ. Le fuseau est fixé à Europe/Paris pour la V1. */
export type Day = string;
export const APP_TIMEZONE = 'Europe/Paris';

export function dayOf(date: Date, timeZone: string = APP_TIMEZONE): Day {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  return parts; // en-CA → AAAA-MM-JJ
}

const toUtc = (d: Day): number => Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10)));

/** Nombre de jours de `from` à `to` (négatif si `to` est avant). */
export const daysBetween = (from: Day, to: Day): number => Math.round((toUtc(to) - toUtc(from)) / 86_400_000);

export function addDays(d: Day, n: number): Day {
  return new Date(toUtc(d) + n * 86_400_000).toISOString().slice(0, 10);
}

export function ageOn(birthdate: Day, today: Day): number {
  let age = Number(today.slice(0, 4)) - Number(birthdate.slice(0, 4));
  if (today.slice(5) < birthdate.slice(5)) age -= 1;
  return age;
}
export const MIN_AGE = 18;
