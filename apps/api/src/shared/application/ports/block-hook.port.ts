/**
 * Effet « sécurité des sorties » d'un blocage (D-025), fourni par `safety`, appelé par `trust`
 * DANS la transaction du blocage (verrous users tenus) : la personne bloquée est retirée des
 * sorties actives partagées (remboursée, message neutre), signal staff en cas d'usage abusif.
 */
import type { TxScope } from '../unit-of-work.js';

export interface BlockSafetyHook {
  afterBlock(scope: TxScope, i: { blockerId: string; blockedId: string }): Promise<{ removedFromOutings: number }>;
}
export const BLOCK_SAFETY_HOOK = Symbol.for('blowy.safety.blockHook');
