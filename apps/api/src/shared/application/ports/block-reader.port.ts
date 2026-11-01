/** Lecture des blocages (agent E possède trust ; ici lecture seule de la table Block). */
export interface BlockReader {
  isBlockedBetween(a: string, b: string): Promise<boolean>;
}
export const BLOCK_READER = Symbol('BlockReader');
