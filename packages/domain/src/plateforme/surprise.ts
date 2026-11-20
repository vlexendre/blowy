/**
 * Questions surprises du chat (maquette V7) : de temps en temps, un minimoa pose une question à deux choix (« mer ou
 * montagne ? »). Quand les deux répondent pareil, c'est un point commun, et le compte monte. Sans IA : la question est
 * choisie par un `seed`, la réponse est reconnue par mots-clés. Pur.
 */

/** Enlève accents et majuscules, garde lettres et chiffres. */
export function normalizeAnswer(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Le choix reconnu dans une réponse : `a`, `b`, ou null (aucun des deux, ou les deux à la fois).
 * Un mot-clé compte s'il apparaît comme mot entier (« mer » dans « la mer ! », pas dans « merci »).
 */
export function classifyAnswer(text: string, a: readonly string[], b: readonly string[]): 'a' | 'b' | null {
  const words = ` ${normalizeAnswer(text)} `;
  const has = (list: readonly string[]) => list.some((k) => words.includes(` ${normalizeAnswer(k)} `));
  const inA = has(a);
  const inB = has(b);
  return inA === inB ? null : inA ? 'a' : 'b';
}
