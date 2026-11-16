/**
 * Ce que Minimoa+ ouvre, en un seul endroit. Les autres règles (habitudes, jokers, carte, renommage,
 * bilan, rencontres) lisent ces limites au lieu de tester `plus` elles-mêmes.
 * Savoir si quelqu'un a Minimoa+ reste le rôle de `hasPlus(profile, now)` côté API.
 */
export interface Entitlements {
  /** Nombre d'habitudes suivies en même temps. */
  habits: 2 | 6;
  /** Jokers de série offerts chaque semaine. */
  jokersPerWeek: 1 | 3;
  /** Toute la carte (sinon : sa zone seulement, ~1,5 km, carte fixe). */
  mapEverywhere: boolean;
  /** Changer de ville sur la carte sans bouger. */
  changeCity: boolean;
  /** Renommer son minimoa sans attendre 60 jours. */
  freeRename: boolean;
  /** Bilan de la semaine détaillé (axes sur 4 semaines, audit de chaque lien). */
  detailedReview: boolean;
  /** Rencontres supplémentaires par jour, ajoutées au quota qui dépend de la forme du minimoa (0 sans Minimoa+). */
  encounterBonus: 0 | 1;
  /** Objets premium de la garde-robe. */
  premiumItems: boolean;
}

const FREE: Entitlements = Object.freeze({
  habits: 2,
  jokersPerWeek: 1,
  mapEverywhere: false,
  changeCity: false,
  freeRename: false,
  detailedReview: false,
  encounterBonus: 0,
  premiumItems: false,
});

const PLUS: Entitlements = Object.freeze({
  habits: 6,
  jokersPerWeek: 3,
  mapEverywhere: true,
  changeCity: true,
  freeRename: true,
  detailedReview: true,
  encounterBonus: 1,
  premiumItems: true,
});

/** Limites selon l'abonnement. Pur : `plus` vient de `hasPlus(profile, now)`. */
export function entitlements(plus: boolean): Entitlements {
  return plus ? PLUS : FREE;
}

/** Ce que Minimoa+ ajoute, dans l'ordre où le paywall le présente (clés de texte dans `@blowy/content`). */
export const PLUS_PERKS = ['map_everywhere', 'more_encounters', 'streak_jokers', 'more_habits', 'detailed_review', 'free_rename', 'premium_items'] as const;
export type PlusPerk = (typeof PLUS_PERKS)[number];
