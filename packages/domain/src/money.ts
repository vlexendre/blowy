/** Pièces : entiers uniquement. XP : milli-points entiers. Aucun flottant persistant. */
export type Coins = number;
export type MilliXp = number;

export const toMilli = (points: number): MilliXp => Math.round(points * 1000);
export const fromMilli = (milli: MilliXp): number => Math.floor(milli / 1000);
