/**
 * Villes proposées pour « Changer de ville » (Blowy+) : centres arrondis au centième de degré. Les noms affichés
 * sont dans `locales/rencontres.ts` (`carte.cities`), traduits ; `chooseCity` envoie le nom dans la langue de l'app.
 */
export const CITIES = [
  { id: 'paris', latitude: 48.86, longitude: 2.35 },
  { id: 'lyon', latitude: 45.76, longitude: 4.84 },
  { id: 'marseille', latitude: 43.3, longitude: 5.37 },
  { id: 'bordeaux', latitude: 44.84, longitude: -0.58 },
  { id: 'lille', latitude: 50.63, longitude: 3.06 },
  { id: 'nantes', latitude: 47.22, longitude: -1.55 },
  { id: 'toulouse', latitude: 43.6, longitude: 1.44 },
  { id: 'montpellier', latitude: 43.61, longitude: 3.88 },
  { id: 'strasbourg', latitude: 48.57, longitude: 7.75 },
  { id: 'nice', latitude: 43.7, longitude: 7.27 },
  { id: 'bruxelles', latitude: 50.85, longitude: 4.35 },
  { id: 'geneve', latitude: 46.2, longitude: 6.14 },
  { id: 'montreal', latitude: 45.5, longitude: -73.57 },
  { id: 'londres', latitude: 51.51, longitude: -0.13 },
  { id: 'amsterdam', latitude: 52.37, longitude: 4.9 },
  { id: 'lisbonne', latitude: 38.72, longitude: -9.14 },
  { id: 'madrid', latitude: 40.42, longitude: -3.7 },
  { id: 'barcelone', latitude: 41.39, longitude: 2.17 },
] as const;
export type City = (typeof CITIES)[number];
