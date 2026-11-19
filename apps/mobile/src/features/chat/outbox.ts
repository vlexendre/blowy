/**
 * Envoi optimiste du chat, partie pure (testée) : un message tapé devient tout de suite un brouillon (`Pending`) affiché
 * en bas du fil, avec une clé d'idempotence (`clientId`) que l'API garde. Il disparaît quand le vrai message arrive,
 * par la réponse de l'envoi ou, souvent plus tôt, par le temps réel qui relit le fil : on le reconnaît alors à son
 * texte, parmi les messages à soi plus récents que tout ce qu'on avait au moment d'envoyer.
 */

/** `sent` : l'API a répondu (`serverId`), en attendant que le message du serveur soit dans le fil affiché. */
export type PendingStatus = 'queued' | 'sending' | 'failed' | 'sent';

export interface Pending {
  clientId: string;
  body: string;
  /** Heure du téléphone : sert au séparateur de jour, jamais d'ordre ni de repère. */
  at: string;
  status: PendingStatus;
  /** Heure (serveur) du message le plus récent du fil au moment d'envoyer ; '' si le fil était vide ou pas lu. */
  since: string;
  /** Id du message du serveur, une fois l'envoi confirmé. */
  serverId?: string;
}

/** Ce qu'on lit d'un message du serveur pour le rapprocher d'un brouillon. */
export interface SentLike {
  id: string;
  /** Le message est à soi (`me`). */
  mine: boolean;
  body: string | null;
  at: string;
}

/**
 * Brouillons déjà arrivés dans le fil (même texte, à soi, plus récent que `since`), un message du serveur pour un
 * brouillon au plus, dans l'ordre d'envoi. Rend `clientId → id du serveur`.
 */
export function matchSent(pending: readonly Pending[], server: readonly SentLike[]): Map<string, string> {
  const out = new Map<string, string>();
  if (pending.length === 0) return out;
  const used = new Set<string>();
  // Du plus ancien au plus récent, pour que deux « ok » envoyés à la suite trouvent chacun le leur.
  const mine = server.filter((m) => m.mine).sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
  for (const p of pending) {
    const body = p.body.trim();
    const hit = mine.find((m) => !used.has(m.id) && m.at > p.since && (m.body ?? '').trim() === body);
    if (hit) {
      used.add(hit.id);
      out.set(p.clientId, hit.id);
    }
  }
  return out;
}

export interface ThreadView {
  /** Brouillons encore à montrer, dans l'ordre d'envoi (après tous les messages du serveur). */
  visible: Pending[];
  /** Id du serveur → `clientId` du brouillon qu'il remplace (sa ligne garde la clé du brouillon). */
  replaced: Map<string, string>;
  /** Brouillons arrivés dans le fil : à retirer de la file. */
  done: string[];
}

/**
 * Ce que le fil montre : les messages du serveur, puis les brouillons qui n'y sont pas encore. Un brouillon confirmé
 * (`sent`) reste visible tant que sa réponse n'est pas rangée dans le fil (jamais de trou entre les deux) ; un brouillon
 * en route, ou « pas envoyé » alors que le serveur l'a bien écrit (réponse perdue), est reconnu à son texte.
 */
export function threadView(pending: readonly Pending[], server: readonly SentLike[]): ThreadView {
  const replaced = new Map<string, string>();
  const done: string[] = [];
  if (pending.length === 0) return { visible: [], replaced, done };
  const ids = new Set(server.map((m) => m.id));
  const open: Pending[] = [];
  for (const p of pending) {
    if (p.serverId && ids.has(p.serverId)) {
      replaced.set(p.serverId, p.clientId);
      done.push(p.clientId);
    } else if (p.status !== 'sent') open.push(p);
  }
  const taken = new Set(replaced.keys());
  const guessed = matchSent(
    open,
    server.filter((m) => !taken.has(m.id)),
  );
  for (const [clientId, serverId] of guessed) {
    replaced.set(serverId, clientId);
    done.push(clientId);
  }
  const gone = new Set(done);
  return { visible: pending.filter((p) => !gone.has(p.clientId)), replaced, done };
}

/** Heure du message le plus récent d'un fil (repère `since` d'un nouvel envoi). */
export const newestAt = (server: readonly { at: string }[]): string => server.reduce((max, m) => (m.at > max ? m.at : max), '');

/** Clé de ligne d'un brouillon, gardée par le message du serveur qui le remplace (la bulle ne remonte pas). */
export const draftKey = (clientId: string): string => `c:${clientId}`;

/**
 * Un échec qui ne se règle pas en réessayant (refus du filtre, lien endormi, plus membre…) : le brouillon est retiré
 * et son texte revient dans le champ. Les autres (réseau, serveur, débit) laissent la bulle « Pas envoyé · Réessayer ».
 */
const FINAL = new Set(['content_refused', 'link_not_active', 'forbidden', 'not_found', 'invalid', 'conflict', 'unauthorized', 'not_onboarded', 'app_update_required']);
export const isFinalSendError = (error: unknown): boolean =>
  !!error && typeof error === 'object' && 'code' in error && FINAL.has(String((error as { code: unknown }).code));

/** Le texte refusé revient dans le champ, sans écraser ce qu'on a commencé à écrire depuis. */
export const restoreDraft = (current: string, refused: string): string => (current.trim() ? `${refused}\n${current}` : refused);

/** Après une relance de l'app, un brouillon resté « en route » n'a pas de réponse : il passe à « pas envoyé ». */
export const afterRestart = (pending: readonly Pending[]): Pending[] => pending.map((p) => (p.status === 'failed' ? p : { ...p, status: 'failed' }));

/** Identifiant v4 (clé d'idempotence) ; `crypto.randomUUID` quand il existe, sinon tiré à la main. */
export function newClientId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  const hex = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) out += '-';
    else if (i === 14) out += '4';
    else if (i === 19) out += hex[8 + Math.floor(Math.random() * 4)];
    else out += hex[Math.floor(Math.random() * 16)];
  }
  return out;
}
