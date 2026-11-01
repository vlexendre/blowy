/**
 * Missions (§18.6) : machine d'états DRAFT → PUBLISHED → ARCHIVED, versions immuables une fois
 * publiées, récompenses bornées par le tuning (aucune constante ici).
 */
import { AppError } from '../../../shared/domain/errors.js';

export type MissionStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface MissionBoundsValues {
  maxLinkXpMilli: number;
  maxPetXpMilli: number;
  maxCoins: number;
}

export function assertRewardsWithin(r: { linkXpMilli: number; petXpMilli: number; coins: number }, b: MissionBoundsValues): void {
  const over: string[] = [];
  if (r.linkXpMilli > b.maxLinkXpMilli) over.push('linkXpMilli');
  if (r.petXpMilli > b.maxPetXpMilli) over.push('petXpMilli');
  if (r.coins > b.maxCoins) over.push('coins');
  if (over.length) throw new AppError('VALIDATION_FAILED', 'Récompense au-delà des bornes du tuning', { detailsSafe: { over, bounds: b } });
}

const TRANSITIONS: Record<MissionStatus, MissionStatus[]> = {
  DRAFT: ['PUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['ARCHIVED'],
  ARCHIVED: [],
};

export function assertMissionTransition(from: MissionStatus, to: MissionStatus): void {
  if (!TRANSITIONS[from].includes(to)) {
    throw new AppError('PRECONDITION_FAILED', `Transition ${from} → ${to} interdite`, { detailsSafe: { reason: 'INVALID_TRANSITION', from, to } });
  }
}

export function assertEditable(status: MissionStatus): void {
  if (status !== 'DRAFT') throw new AppError('PRECONDITION_FAILED', 'Une version publiée ou archivée est immuable : créer une nouvelle version', { detailsSafe: { reason: 'IMMUTABLE_VERSION' } });
}
