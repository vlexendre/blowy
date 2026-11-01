import type { TxScope } from '../unit-of-work.js';

/** Actions partagées (jeu/câlin) : implémentées par le module relationships (écrit ses tables). */
export interface SharedActionOutcome {
  outcome: 'APPLIED' | 'NO_GAIN';
  linkXpMilli: number;
  petXpMilli: number;
}
export interface SharedActionPort {
  apply(
    scope: TxScope,
    input: { actorId: string; petId: string; contextId: string; action: 'PLAY' | 'HUG' },
  ): Promise<SharedActionOutcome>;
}
export const SHARED_ACTION_PORT = Symbol('SharedActionPort');
