/**
 * Ce que Minimoa+ ouvre, en un seul endroit. Les autres règles (habitudes, jokers, carte, renommage,
 * bilan, rencontres) lisent ces limites au lieu de tester `plus` elles-mêmes.
 * Savoir si quelqu'un a Minimoa+ reste le rôle de `hasPlus(profile, now)` côté API.
 * Ton chemin (docs/CHEMIN.md) : Minimoa+ ne vend pas de questions (une séance par jour pour tout le monde, plus un
 * bonus gagné par un geste social) ; il vend les gens et un gel de série par semaine au lieu d'un par mois.
 */
import { CHEMIN_STREAK_MILESTONES, type StreakRules } from './rituels/streak';

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
  /** Groupes à la fois, membre ou en formation (spéc §26). */
  groups: 2 | 10;
  /** Ton chemin : gels de série (1 par mois en gratuit, 1 par semaine avec Minimoa+). */
  cheminFreezes: { period: 'week' | 'month'; perPeriod: 1 };
  /** Ton chemin : rapport détaillé du profil. */
  detailedProfile: boolean;
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
  groups: 2,
  cheminFreezes: Object.freeze({ period: 'month', perPeriod: 1 }),
  detailedProfile: false,
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
  groups: 10,
  cheminFreezes: Object.freeze({ period: 'week', perPeriod: 1 }),
  detailedProfile: true,
});

/** Limites selon l'abonnement. Pur : `plus` vient de `hasPlus(profile, now)`. */
export function entitlements(plus: boolean): Entitlements {
  return plus ? PLUS : FREE;
}

/** Ce que Minimoa+ ajoute, dans l'ordre où le paywall le présente (clés de texte dans `@blowy/content`). */
export const PLUS_PERKS = ['map_everywhere', 'more_encounters', 'streak_jokers', 'more_habits', 'detailed_review', 'free_rename', 'premium_items'] as const;
export type PlusPerk = (typeof PLUS_PERKS)[number];

/** Règles de la série pour une personne passée à Ton chemin (gels selon l'abonnement, paliers 7, 30, 100, 365). */
export const cheminStreakRules = (plus: boolean): StreakRules => ({ ...entitlements(plus).cheminFreezes, milestones: CHEMIN_STREAK_MILESTONES });
