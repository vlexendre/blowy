/**
 * File d'actions hors ligne — logique PURE (réducteur + sélection), testée sans RN.
 *
 * Règles (§13) :
 *  - chaque commande porte un commandId (UUID) généré une fois et conservé à chaque retry ;
 *  - seules les commandes autorisées hors ligne entrent dans la file (soins, messages en brouillon,
 *    sécurité). Consentements, révélation, achats, dépenses de pièces, matching : jamais en file ;
 *  - BLOCK et REPORT passent en tête (priorité sécurité) ; un blocage annule les envois en attente
 *    vers la même conversation/relation ;
 *  - états : queued → sending → confirmed | corrected | failed | cancelled ;
 *  - une erreur non réessayable sort de la file (failed) ; une erreur réseau/retryable reste en file
 *    avec backoff exponentiel plafonné.
 */
export type QueuedKind = 'PET_ACTION' | 'SEND_MESSAGE' | 'BLOCK' | 'REPORT' | 'MARK_READ';

export const OFFLINE_ALLOWED: readonly QueuedKind[] = ['PET_ACTION', 'SEND_MESSAGE', 'BLOCK', 'REPORT', 'MARK_READ'];
export const SAFETY_KINDS: readonly QueuedKind[] = ['BLOCK', 'REPORT'];

/** Commandes qui exigent réseau et validation serveur immédiate (jamais en file). */
export const NETWORK_ONLY = ['CONSENT', 'REVEAL', 'PURCHASE', 'SPEND_COINS', 'MATCH_ACCEPT', 'MOVE_IN', 'BRANCH_VOTE', 'DELETE_ACCOUNT'] as const;
export type NetworkOnlyKind = (typeof NETWORK_ONLY)[number];

export type CommandStatus = 'queued' | 'sending' | 'confirmed' | 'corrected' | 'failed' | 'cancelled';

export interface QueuedCommand {
  commandId: string;
  kind: QueuedKind;
  /** Corps de la requête (déjà validé côté client). */
  payload: Record<string, unknown>;
  /** Cible de sécurité/annulation : conversationId ou relationshipId. */
  scope: string | null;
  createdAt: number;
  attempts: number;
  nextAttemptAt: number;
  status: CommandStatus;
  lastError: string | null;
}

export interface QueueState {
  items: readonly QueuedCommand[];
  /** Scopes masqués localement (blocage/signalement en attente). */
  hiddenScopes: readonly string[];
}

export const emptyQueue: QueueState = { items: [], hiddenScopes: [] };

export type QueueEvent =
  | { type: 'enqueue'; command: Omit<QueuedCommand, 'attempts' | 'nextAttemptAt' | 'status' | 'lastError'> }
  | { type: 'sending'; commandId: string }
  | { type: 'confirmed'; commandId: string; corrected?: boolean }
  | { type: 'failed'; commandId: string; error: string; retryable: boolean; now: number }
  | { type: 'prune'; olderThan: number };

export const BACKOFF = { baseMs: 2_000, maxMs: 5 * 60_000 } as const;
export const backoffDelay = (attempts: number): number => Math.min(BACKOFF.maxMs, BACKOFF.baseMs * 2 ** Math.max(0, attempts - 1));

const isActive = (c: QueuedCommand) => c.status === 'queued' || c.status === 'sending';

export function reduceQueue(state: QueueState, ev: QueueEvent): QueueState {
  switch (ev.type) {
    case 'enqueue': {
      if (!OFFLINE_ALLOWED.includes(ev.command.kind)) throw new Error(`Commande ${ev.command.kind} non autorisée hors ligne`);
      if (state.items.some((c) => c.commandId === ev.command.commandId)) return state; // idempotent
      const cmd: QueuedCommand = { ...ev.command, attempts: 0, nextAttemptAt: ev.command.createdAt, status: 'queued', lastError: null };
      if (SAFETY_KINDS.includes(cmd.kind) && cmd.scope) {
        const scope = cmd.scope;
        // Blocage/signalement : masquage local immédiat + arrêt des envois en attente vers ce scope.
        const items = state.items.map((c) => (c.scope === scope && c.kind === 'SEND_MESSAGE' && isActive(c) && cmd.kind === 'BLOCK' ? { ...c, status: 'cancelled' as const } : c));
        return { items: [...items, cmd], hiddenScopes: state.hiddenScopes.includes(scope) ? state.hiddenScopes : [...state.hiddenScopes, scope] };
      }
      return { ...state, items: [...state.items, cmd] };
    }
    case 'sending':
      return { ...state, items: state.items.map((c) => (c.commandId === ev.commandId ? { ...c, status: 'sending', attempts: c.attempts + 1 } : c)) };
    case 'confirmed':
      return { ...state, items: state.items.map((c) => (c.commandId === ev.commandId ? { ...c, status: ev.corrected ? 'corrected' : 'confirmed', lastError: null } : c)) };
    case 'failed':
      return {
        ...state,
        items: state.items.map((c) =>
          c.commandId === ev.commandId
            ? ev.retryable
              ? { ...c, status: 'queued', lastError: ev.error, nextAttemptAt: ev.now + backoffDelay(c.attempts) }
              : { ...c, status: 'failed', lastError: ev.error }
            : c,
        ),
      };
    case 'prune':
      return { ...state, items: state.items.filter((c) => isActive(c) || c.createdAt >= ev.olderThan) };
  }
}

/**
 * Prochaine commande à envoyer : sécurité d'abord, puis FIFO. Une seule commande en vol par
 * scope (ordre préservé pour une même relation/conversation).
 */
export function nextToSend(state: QueueState, now: number): QueuedCommand | null {
  const inFlightScopes = new Set(state.items.filter((c) => c.status === 'sending').map((c) => c.scope));
  const ready = state.items.filter((c) => c.status === 'queued' && c.nextAttemptAt <= now && !inFlightScopes.has(c.scope));
  if (ready.length === 0) return null;
  const safety = ready.filter((c) => SAFETY_KINDS.includes(c.kind));
  const pool = safety.length > 0 ? safety : ready;
  return [...pool].sort((a, b) => a.createdAt - b.createdAt)[0] ?? null;
}

export const pendingCount = (s: QueueState): number => s.items.filter(isActive).length;
export const isHidden = (s: QueueState, scope: string | null | undefined): boolean => !!scope && s.hiddenScopes.includes(scope);
export const statusOf = (s: QueueState, commandId: string): CommandStatus | null => s.items.find((c) => c.commandId === commandId)?.status ?? null;
export const pendingForScope = (s: QueueState, scope: string, kind?: QueuedKind): QueuedCommand[] =>
  s.items.filter((c) => c.scope === scope && isActive(c) && (!kind || c.kind === kind));

/** Sérialisation tolérante (stockage persistant) : un état corrompu redevient vide. */
export function parseQueue(raw: string | null): QueueState {
  if (!raw) return emptyQueue;
  try {
    const v = JSON.parse(raw) as Partial<QueueState>;
    if (!Array.isArray(v.items) || !Array.isArray(v.hiddenScopes)) return emptyQueue;
    // Une commande « sending » interrompue (app tuée) repart en file avec le même commandId.
    return { items: v.items.map((c) => (c.status === 'sending' ? { ...c, status: 'queued' as const } : c)), hiddenScopes: v.hiddenScopes };
  } catch {
    return emptyQueue;
  }
}
