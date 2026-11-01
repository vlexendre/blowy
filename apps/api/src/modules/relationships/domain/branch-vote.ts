/**
 * Vote de branche secret (P-5.8) : on ne publie que la branche résultante, après collecte
 * des deux choix ou à l'échéance commune. Aucun vote individuel n'est jamais exposé.
 */
export type Choice = 'FRIEND' | 'PLUS';

export function resolveBranch(choices: readonly Choice[], expected: number, deadlinePassed: boolean): 'FRIEND' | 'PLUS' | null {
  if (choices.length < expected && !deadlinePassed) return null;
  // Plus seulement si les deux l'ont choisi ; sinon Ami (personne n'est « rejeté »).
  return choices.length === expected && choices.every((c) => c === 'PLUS') ? 'PLUS' : 'FRIEND';
}
