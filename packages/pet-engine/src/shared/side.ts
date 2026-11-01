/** Côté d'une arête orientée : 0 = premier pet de la paire canonique, 1 = second. */
export type Side = 0 | 1;
export const SIDES: readonly Side[] = [0, 1];
export const otherSide = (s: Side): Side => (s === 0 ? 1 : 0);
export type PerSide<T> = [T, T];
export const perSide = <T>(make: (s: Side) => T): PerSide<T> => [make(0), make(1)];
