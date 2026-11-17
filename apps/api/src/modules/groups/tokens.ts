/** Jetons d'injection du module « groupes » (dépôts globaux, fournis par CoreModule). */
export const GROUPS = Symbol('GROUPS');
export const GROUP_MEMBERS = Symbol('GROUP_MEMBERS');
export const GROUP_MESSAGES = Symbol('GROUP_MESSAGES');
export const GROUP_DAYS = Symbol('GROUP_DAYS');
export const HABIT_JOKERS = Symbol('HABIT_JOKERS');
export const TOGETHER = Symbol('TOGETHER');
/**
 * Monde de démo (BLOWY_DEMO=1) seulement : personnes de démo comptées comme « dans ta zone, compatibles » pour la
 * suggestion « la tenir ensemble » (les autres règles s'appliquent toujours). Absent en production.
 */
export const TOGETHER_FIXTURES = Symbol('TOGETHER_FIXTURES');
export interface TogetherFixtures {
  candidatesFor(userId: string): Promise<string[]>;
}
