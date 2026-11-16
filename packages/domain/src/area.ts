/**
 * Zone sans localisation (App Review 5.1.1(iv) : une autre solution quand la position est refusée) et position
 * enregistrée arrondie. Pur.
 *
 * - Sans position du téléphone, chacun peut choisir gratuitement une zone approximative (une ville de la liste) :
 *   elle sert de centre aux rencontres et à la carte, comme une zone du domicile. Gratuit : la changer au plus une fois
 *   tous les 30 jours (on déménage ; on ne se promène pas). Minimoa+ (`changeCity`) : quand on veut, et « changer de
 *   ville » même avec la position.
 * - Ce qui est enregistré d'une position n'est jamais plus précis que la maille de ~300 m : le relevé exact sert
 *   seulement, en mémoire, à savoir si la personne est hors de sa zone (sortie), puis il est oublié.
 */
import { addDays, type Day } from './days';
import { GRID_METERS, type GeoPoint, snapToGrid } from './vision';

/** Jours entre deux changements de zone choisie à la main (sans Minimoa+). */
export const MANUAL_AREA_CHANGE_DAYS = 30;

/** D'où vient le centre d'une personne : la position du téléphone, ou une zone choisie à la main. */
export type PlaceSource = 'gps' | 'manual';

/**
 * Peut-on (re)choisir sa zone à la main maintenant ? `setOn` : jour du dernier choix (null : jamais).
 * `nextOn` : premier jour où ce sera possible (null : tout de suite).
 */
export function manualAreaChange(i: { setOn: Day | null; today: Day; anytime: boolean }): { allowed: boolean; nextOn: Day | null } {
  if (i.anytime || i.setOn === null) return { allowed: true, nextOn: null };
  const nextOn = addDays(i.setOn, MANUAL_AREA_CHANGE_DAYS);
  return nextOn <= i.today ? { allowed: true, nextOn: null } : { allowed: false, nextOn };
}

/** Ce qui est enregistré d'un relevé : le centre de sa maille de ~300 m (jamais le point exact). */
export const storedPoint = (p: GeoPoint): GeoPoint => snapToGrid(p, GRID_METERS);
