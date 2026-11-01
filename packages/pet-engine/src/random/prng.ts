/**
 * PRNG déterministe seedé. La graine est une chaîne serveur persistée (jamais choisie par le
 * client) ; on la combine à un sel (identifiant d'événement attribué par le serveur + usage)
 * via un hachage cyrb128, puis on tire avec sfc32.
 */
export type Rng = () => number;

function cyrb128(str: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

function sfc32(a: number, b: number, c: number, d: number): Rng {
  return () => {
    a |= 0;
    b |= 0;
    c |= 0;
    d |= 0;
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

/** Générateur dérivé d'une graine serveur et de sels (ex. eventId, 'call'). */
export function rngFrom(seed: string, ...salt: readonly string[]): Rng {
  const [a, b, c, d] = cyrb128([seed, ...salt].join('␟'));
  const rng = sfc32(a, b, c, d);
  for (let i = 0; i < 12; i++) rng(); // échauffement
  return rng;
}

/** Entier uniforme dans [0, n). */
export const pickIndex = (rng: Rng, n: number): number => Math.floor(rng() * n);
