/**
 * V5.5 (D-059) — indicateurs de ville : PURS, toujours au niveau de la VILLE (jamais d'un groupe ni d'un créneau),
 * calculés sur une photographie quotidienne, affichés seulement à partir de `[T] cityInsights.minCount` (10) et
 * ARRONDIS : 10–14 « une dizaine », 15–24 « une vingtaine », 25–34 « une trentaine », 35–94 « environ N » (dizaine),
 * 95–149 « plus de 100 », puis « environ N » arrondi à 50.
 */
export type Approx = { notEnough: true } | { notEnough?: never; approx: 'A_DOZEN' | 'ABOUT_TWENTY' | 'ABOUT_THIRTY' | 'ABOUT' | 'MORE_THAN_100'; value?: number; label: string };

export function approxCount(n: number, minCount = 10): Approx {
  if (!Number.isFinite(n) || n < Math.max(10, minCount)) return { notEnough: true };
  if (n < 15) return { approx: 'A_DOZEN', label: 'une dizaine' };
  if (n < 25) return { approx: 'ABOUT_TWENTY', label: 'une vingtaine' };
  if (n < 35) return { approx: 'ABOUT_THIRTY', label: 'une trentaine' };
  if (n < 95) {
    const v = Math.round(n / 10) * 10;
    return { approx: 'ABOUT', value: v, label: `environ ${v}` };
  }
  if (n < 150) return { approx: 'MORE_THAN_100', label: 'plus de 100' };
  const v = Math.round(n / 50) * 50;
  return { approx: 'ABOUT', value: v, label: `environ ${v}` };
}
