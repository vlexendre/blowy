/**
 * V5.6 (E11, spec §2.1, D-063) — temps de trajet entre quartiers. Source : table `NeighborhoodTravelTime` maintenue par
 * ops (transports en commun, valeur typique). À défaut, ESTIMATION documentée à partir des coordonnées en base du
 * quartier (`Neighborhood.centerLat/centerLng`, sinon moyenne de ses lieux actifs) : distance à vol d'oiseau × 1,3
 * (détour), à 18 km/h de porte à porte, + 6 min (accès / attente), arrondi à 5 min. JAMAIS la position d'une personne :
 * seul le quartier qu'elle a choisi intervient.
 */
export interface Point {
  lat: number;
  lng: number;
}

export const TRAVEL_ESTIMATE = { detour: 1.3, kmPerHour: 18, fixedMinutes: 6, roundTo: 5 } as const;

export function haversineKm(a: Point, b: Point): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Estimation en minutes (≥ 5) entre deux centres de quartier. */
export function estimateTravelMinutes(a: Point, b: Point): number {
  const km = haversineKm(a, b) * TRAVEL_ESTIMATE.detour;
  const raw = TRAVEL_ESTIMATE.fixedMinutes + (km / TRAVEL_ESTIMATE.kmPerHour) * 60;
  return Math.max(TRAVEL_ESTIMATE.roundTo, Math.round(raw / TRAVEL_ESTIMATE.roundTo) * TRAVEL_ESTIMATE.roundTo);
}

/**
 * V5.9 : trajet À PIED dans son propre quartier — distance moyenne du centre aux lieux actifs du quartier (jamais un lieu
 * précis, jamais la position de la personne) × 1,3 à 4,5 km/h, arrondi à 5 min ; sans données : 10 min (valeur type).
 */
export const WALK_ESTIMATE = { detour: 1.3, kmPerHour: 4.5, roundTo: 5, defaultMinutes: 10 } as const;
export function estimateWalkWithin(center: Point | null, venues: readonly Point[]): number {
  if (!center || venues.length === 0) return WALK_ESTIMATE.defaultMinutes;
  const km = (venues.reduce((s, v) => s + haversineKm(center, v), 0) / venues.length) * WALK_ESTIMATE.detour;
  return Math.max(WALK_ESTIMATE.roundTo, Math.round(((km / WALK_ESTIMATE.kmPerHour) * 60) / WALK_ESTIMATE.roundTo) * WALK_ESTIMATE.roundTo);
}

/** Centre d'un quartier : saisi par ops, sinon moyenne de ses lieux ; null si inconnu. */
export function centerOf(n: { centerLat: number | null; centerLng: number | null }, venues: readonly Point[]): Point | null {
  if (n.centerLat !== null && n.centerLng !== null) return { lat: n.centerLat, lng: n.centerLng };
  if (venues.length === 0) return null;
  return { lat: venues.reduce((s, v) => s + v.lat, 0) / venues.length, lng: venues.reduce((s, v) => s + v.lng, 0) / venues.length };
}
