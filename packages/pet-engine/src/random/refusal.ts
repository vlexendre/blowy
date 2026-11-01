/**
 * Refus d'un appel (§6) :
 *   E = (axeGentilEspiègle + 1)/2 ; A = clamp(attenteEnHeures, 0, 100)
 *   p = clamp(0,10 + 0,15·E + 0,35·V/100 − 0,25·A/100 + bonusEspèce, 0, 0,60)
 * Jamais deux refus consécutifs ; jamais de refus d'une aide vitale.
 * Le tirage utilise la graine serveur + l'identifiant du pet + le rang de l'appel : un client
 * ne peut pas « pêcher » un résultat en changeant son identifiant d'idempotence.
 */
import type { Species } from '@blowy/domain';
import type { Tuning } from '@blowy/tuning';
import { clamp } from '../shared/index.js';
import { rngFrom } from './prng.js';

export interface RefusalInput {
  species: Species;
  kindMischief: number;
  /** Envie actuelle pour le pet avec qui il se trouve (0 s'il est seul). */
  desire: number;
  /** Attente (h) de l'autre pet au lieu de destination. */
  waitingHours: number;
}

export function refusalProbability(i: RefusalInput, t: Tuning): number {
  const r = t.refusal;
  const E = (clamp(i.kindMischief, -1, 1) + 1) / 2;
  const A = clamp(i.waitingHours, 0, r.waitingHoursCap);
  const p = r.base + r.mischiefWeight * E + (r.desireWeight * clamp(i.desire, 0, 100)) / 100 + (r.waitingWeight * A) / r.waitingHoursCap + r.speciesBonus[i.species];
  return clamp(p, r.min, r.max);
}

export interface CallDecisionInput extends RefusalInput {
  consecutiveRefusals: number;
  /** Aide vitale (pet malade/affamé, soin, retour maison pour soin) : jamais refusée. */
  vital: boolean;
  seed: string;
  petId: string;
  callIndex: number;
}

export interface CallDecision {
  refused: boolean;
  probability: number;
  /** Le pet cède parce qu'il a déjà refusé (ou aide vitale). */
  forcedAccept: boolean;
}

export function resolveCall(i: CallDecisionInput, t: Tuning): CallDecision {
  const probability = refusalProbability(i, t);
  if (i.vital || i.consecutiveRefusals >= t.refusal.maxConsecutiveRefusals) return { refused: false, probability, forcedAccept: true };
  const roll = rngFrom(i.seed, 'call', i.petId, String(i.callIndex))();
  return { refused: roll < probability, probability, forcedAccept: false };
}
