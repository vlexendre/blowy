import { CHALLENGES, type Challenge } from '@blowy/content';
import type { Day } from '@blowy/domain';
import { pickBySeed, seedOf } from '../../../shared/seed';

/** Défi du jour : choisi de façon stable pour une personne et un jour (pas d'aléa). */
export const challengeOfDay = (ownerId: string, today: Day): Challenge => pickBySeed(CHALLENGES, seedOf('challenge', ownerId, today));
