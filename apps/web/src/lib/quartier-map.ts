/**
 * Carte « Ouvre ton quartier » : projection de Mercator calée sur la France, le Benelux, la Suisse et la péninsule
 * Ibérique. Partagée par le générateur des contours (scripts/quartier-map.mts → public/geo/quartiers.json) et le
 * script de la page (points des quartiers, vol vers une ville). Aucune tuile, aucun service externe.
 */
export const MAP_W = 1000;
const LON_MIN = -10.8;
const LON_MAX = 12.6;
const LAT_TOP = 53.9;
const LAT_BOTTOM = 35.7;

const rad = (d: number): number => (d * Math.PI) / 180;
const mercY = (lat: number): number => Math.log(Math.tan(Math.PI / 4 + rad(lat) / 2));
const K = MAP_W / rad(LON_MAX - LON_MIN);
const TOP = mercY(LAT_TOP);

export const MAP_H = Math.round((TOP - mercY(LAT_BOTTOM)) * K);

/** Un point (degrés) dans le repère de la carte (0…MAP_W, 0…MAP_H). */
export function project(lat: number, lng: number): [number, number] {
  return [rad(lng - LON_MIN) * K, (TOP - mercY(lat)) * K];
}

/** Fichier des contours, chargé à la demande par la page. */
export interface QuartierMapData {
  w: number;
  h: number;
  /** Pays dessinés (France, Belgique, Pays-Bas, Luxembourg, Suisse, Espagne, Portugal) : un chemin SVG par pays. */
  countries: { id: string; d: string }[];
  /** Pays voisins, en estompé (un seul chemin). */
  context: string;
}
