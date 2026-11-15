/** Jetons d'injection du module « rituels » (dépôts et ports). */
export const RITUAL_STATES = Symbol('RITUAL_STATES');
export const DAILY_CHALLENGES = Symbol('DAILY_CHALLENGES');
export const HABITS = Symbol('HABITS');
export const HABIT_CHECKS = Symbol('HABIT_CHECKS');
export const RITUAL_PHOTOS = Symbol('RITUAL_PHOTOS');
export const WEEKLY_REVIEWS = Symbol('WEEKLY_REVIEWS');

/** Vérifie une preuve d'habitude en photo (IA réelle ou adaptateur mémoire déterministe). */
export const HABIT_VERIFIER = Symbol('HABIT_VERIFIER');
/** Reformule le bilan de la semaine (IA réelle ou modèles de phrases). */
export const COACH = Symbol('COACH');
/** Lit une photo privée réduite à 512 px pour la vérification. */
export const PROOF_IMAGES = Symbol('PROOF_IMAGES');
