/** Âge civil calculé dans la timezone de l'utilisateur (contrôle 18+ serveur). */
export const MIN_AGE = 18;

export function localCivilDate(at: Date, timeZone: string): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get('year'), m: get('month'), d: get('day') };
}

export function parseCivilDate(s: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return { y, m: mo, d };
}

export function ageOn(birth: { y: number; m: number; d: number }, today: { y: number; m: number; d: number }): number {
  let age = today.y - birth.y;
  if (today.m < birth.m || (today.m === birth.m && today.d < birth.d)) age--;
  return age;
}

export function ageRange(age: number): string {
  if (age < 21) return '18-20';
  if (age < 25) return '21-24';
  if (age < 30) return '25-29';
  if (age < 35) return '30-34';
  return '35+';
}
