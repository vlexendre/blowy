/**
 * Arithmétique calendaire pure (algorithmes de H. Hinnant), sans objet Date.
 * Un « numéro de jour » est le nombre de jours depuis 1970-01-01 (calendrier grégorien proleptique).
 */
export function daysFromCivil(y: number, m: number, d: number): number {
  const yy = m <= 2 ? y - 1 : y;
  const era = Math.floor(yy / 400);
  const yoe = yy - era * 400;
  const mp = (m + 9) % 12;
  const doy = Math.floor((153 * mp + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

export function civilFromDays(n: number): { y: number; m: number; d: number } {
  const z = n + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp < 10 ? mp + 3 : mp - 9;
  return { y: yoe + era * 400 + (m <= 2 ? 1 : 0), m, d };
}

const pad = (v: number, w: number): string => String(v).padStart(w, '0');

/** Clé de jour 'YYYY-MM-DD'. */
export function dayKeyFromDays(n: number): string {
  const { y, m, d } = civilFromDays(n);
  return `${pad(y, 4)}-${pad(m, 2)}-${pad(d, 2)}`;
}

const dayKeyCache = new Map<string, number>();
export function daysFromDayKey(key: string): number {
  let n = dayKeyCache.get(key);
  if (n === undefined) {
    const [y, m, d] = key.split('-').map(Number) as [number, number, number];
    n = daysFromCivil(y, m, d);
    if (dayKeyCache.size > 50_000) dayKeyCache.clear();
    dayKeyCache.set(key, n);
  }
  return n;
}

/** 0 = dimanche … 6 = samedi. */
export function weekdayFromDays(n: number): number {
  return ((n % 7) + 11) % 7;
}
