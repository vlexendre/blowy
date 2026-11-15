/**
 * Adaptateur mémoire, déterministe (tests et mode local) : aucune sortie réseau.
 * Par défaut il rend une réplique fixe selon le rôle demandé ; les tests peuvent imposer une réponse ou une panne.
 * Jetons comptés comme ~4 caractères par jeton, pour que le compteur et les coûts aient des valeurs réalistes.
 */
import type { ModelCall, ModelClient, ModelReply } from './model-client';

const tokens = (s: string): number => Math.ceil(s.length / 4);

export class MemoryModel implements ModelClient {
  /** Appels reçus (les tests vérifient qu'aucun appel n'a lieu sans accord, ou au-delà des plafonds). */
  readonly calls: ModelCall[] = [];
  private reply: ((call: ModelCall) => string) | null = null;
  private failing = false;

  /** Impose la réponse (null : comportement par défaut). */
  respondWith(reply: ((call: ModelCall) => string) | null): void {
    this.reply = reply;
  }

  failWith(failing: boolean): void {
    this.failing = failing;
  }

  async complete(call: ModelCall): Promise<ModelReply> {
    this.calls.push(call);
    if (this.calls.length > 500) this.calls.shift();
    if (this.failing) throw new Error('modèle mémoire en panne (simulée)');
    const text = this.reply ? this.reply(call) : defaultReply(call.prompt);
    return { text, usage: { input: tokens(call.system) + tokens(call.prompt) + (call.image ? 361 : 0), output: tokens(text), cacheWrite: 0, cacheRead: 0 } };
  }
}

function defaultReply(prompt: string): string {
  if (prompt.includes('relance')) return 'Vous en étiez où, déjà ? Je vous écoute.';
  if (prompt.includes('remarque')) return 'Vous êtes d’accord sur plus de choses que vous ne croyez.';
  if (prompt.includes('garde-fou')) return 'On souffle un peu ? Dix minutes, et tu reprends.';
  return 'oui';
}
