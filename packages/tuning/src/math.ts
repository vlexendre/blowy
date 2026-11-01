/**
 * Helpers arithmétiques partagés par pet-engine et matching (écrits une seule fois).
 * Placés ici car @blowy/tuning est la seule dépendance commune autorisée de ces packages ;
 * à déplacer dans @blowy/domain si l'orchestrateur l'accepte (cf. handoff B).
 */
export const clamp = (value: number, min: number, max: number): number => (value < min ? min : value > max ? max : value);
export const clamp01 = (value: number): number => clamp(value, 0, 1);

/** floor(a·b / c) en entiers sûrs (BigInt si le produit dépasse 2^53). */
export function mulDivFloor(a: number, b: number, c: number): number {
  const p = a * b;
  if (Number.isSafeInteger(p)) return Math.floor(p / c);
  const big = (BigInt(a) * BigInt(b)) / BigInt(c);
  const neg = BigInt(a) * BigInt(b) < 0n && (BigInt(a) * BigInt(b)) % BigInt(c) !== 0n;
  return Number(neg ? big - 1n : big);
}

/** Valeur en millièmes (multiplicateurs permille, milli-points). */
export const PERMILLE = 1000;
