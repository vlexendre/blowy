/**
 * Réducteur d'affichage optimiste « pending → confirmé / corrigé » (logique pure).
 * Le pet reste figé à son dernier état OFFICIEL : on n'invente jamais une jauge. On ne fait
 * qu'annoter l'action en cours (réaction décorative) puis on applique la réponse serveur.
 */
export type OptimisticPhase = 'idle' | 'pending' | 'confirmed' | 'corrected' | 'failed' | 'queued';

export interface OptimisticEntry<TResult> {
  commandId: string;
  key: string;
  phase: OptimisticPhase;
  result: TResult | null;
  error: string | null;
  startedAt: number;
}

export type OptimisticState<T> = Readonly<Record<string, OptimisticEntry<T>>>;

export type OptimisticEvent<T> =
  | { type: 'start'; key: string; commandId: string; now: number }
  | { type: 'queued'; key: string }
  | { type: 'settle'; key: string; commandId: string; result: T; corrected: boolean }
  | { type: 'fail'; key: string; commandId: string; error: string }
  | { type: 'clear'; key: string };

export function reduceOptimistic<T>(
  state: OptimisticState<T>,
  ev: OptimisticEvent<T>,
): OptimisticState<T> {
  switch (ev.type) {
    case 'start':
      return {
        ...state,
        [ev.key]: {
          commandId: ev.commandId,
          key: ev.key,
          phase: 'pending',
          result: null,
          error: null,
          startedAt: ev.now,
        },
      };
    case 'queued': {
      const e = state[ev.key];
      return e ? { ...state, [ev.key]: { ...e, phase: 'queued' } } : state;
    }
    case 'settle': {
      const e = state[ev.key];
      // Réponse d'une commande périmée (une autre a démarré depuis) : ignorée.
      if (!e || e.commandId !== ev.commandId) return state;
      return {
        ...state,
        [ev.key]: { ...e, phase: ev.corrected ? 'corrected' : 'confirmed', result: ev.result },
      };
    }
    case 'fail': {
      const e = state[ev.key];
      if (!e || e.commandId !== ev.commandId) return state;
      return { ...state, [ev.key]: { ...e, phase: 'failed', error: ev.error } };
    }
    case 'clear': {
      const { [ev.key]: _drop, ...rest } = state;
      return rest;
    }
  }
}

/**
 * Le résultat serveur « corrige » l'affichage quand il diffère de ce que l'UI a annoncé
 * (refus du pet, gain nul car plafond atteint…).
 */
export function isCorrection(
  expected: { outcome: string; gainedXp: number } | null,
  actual: { outcome: string; gainedXp: number },
): boolean {
  if (!expected) return false;
  return expected.outcome !== actual.outcome || expected.gainedXp !== actual.gainedXp;
}
