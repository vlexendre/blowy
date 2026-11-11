import { randomBytes, randomUUID } from 'node:crypto';

/** Générateur d'identifiants injectable. */
export interface Ids {
  uuid(): string;
  /** Code court lisible (invitations, « 3 mots »). */
  code(): string;
}

/** Alphabet sans caractères ambigus (pas de 0/O, 1/I/L). */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 8;

export const cryptoIds: Ids = {
  uuid: () => randomUUID(),
  code: () => {
    const bytes = randomBytes(CODE_LENGTH);
    let out = '';
    // 256 n'est pas un multiple de 31 : le léger biais est sans conséquence pour un code d'invitation.
    for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
    return out;
  },
};
