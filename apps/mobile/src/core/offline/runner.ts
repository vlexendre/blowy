/**
 * Runner de la file : envoie les commandes une à une (sécurité d'abord) quand le réseau est là.
 * Chaque type de commande est envoyé par un « sender » enregistré par sa feature (pattern
 * Command) : le runner ne connaît pas les routes. Le même commandId est réutilisé à chaque essai.
 */
import { errorCode, isRetryable } from '../api/errors';
import { nextToSend, type QueuedCommand, type QueuedKind } from './queue';
import { queueSnapshot, useOfflineQueue } from './store';

export type Sender = (cmd: QueuedCommand) => Promise<{ corrected?: boolean } | void>;

const senders = new Map<QueuedKind, Sender>();
const settleListeners = new Set<(cmd: QueuedCommand, ok: boolean) => void>();

export const registerSender = (kind: QueuedKind, sender: Sender): (() => void) => {
  senders.set(kind, sender);
  return () => senders.delete(kind);
};
export const onSettled = (l: (cmd: QueuedCommand, ok: boolean) => void): (() => void) => {
  settleListeners.add(l);
  return () => settleListeners.delete(l);
};

let draining = false;

export async function drainQueue(isOnline: () => boolean, now: () => number = Date.now): Promise<void> {
  if (draining) return;
  draining = true;
  try {
    for (;;) {
      if (!isOnline()) return;
      const cmd = nextToSend(queueSnapshot(), now());
      if (!cmd) return;
      const send = senders.get(cmd.kind);
      if (!send) return; // feature pas encore montée : on réessaiera
      const { dispatch } = useOfflineQueue.getState();
      dispatch({ type: 'sending', commandId: cmd.commandId });
      try {
        const r = await send(cmd);
        dispatch({ type: 'confirmed', commandId: cmd.commandId, corrected: !!(r && r.corrected) });
        settleListeners.forEach((l) => l(cmd, true));
      } catch (e) {
        const retryable = isRetryable(e);
        dispatch({ type: 'failed', commandId: cmd.commandId, error: errorCode(e), retryable, now: now() });
        if (!retryable) settleListeners.forEach((l) => l(cmd, false));
        if (retryable) return; // backoff : on attend le prochain réveil
      }
    }
  } finally {
    draining = false;
  }
}
