/**
 * Le défi du jour : un par personne et par jour (jour de Paris), choisi par le serveur de façon déterministe
 * (jour + personne) dans un catalogue typé. Une question vise l'axe de vision le moins sûr : c'est aussi la question du jour.
 */
import type { Day } from '../days';
import type { VisionAxis } from '../vision';
import { seedOf } from './week';

export const DAILY_KINDS = ['question', 'photo', 'write', 'go_out'] as const;
/** question : répondre (2 choix) · photo : prendre une photo · write : écrire à un lien · go_out : sortir. */
export type DailyKind = (typeof DAILY_KINDS)[number];

export const DAILY_STATUSES = ['offered', 'seen', 'accepted', 'done'] as const;
export type DailyStatus = (typeof DAILY_STATUSES)[number];

export interface DailyCandidate {
  id: string;
  kind: DailyKind;
  /** Axe visé (questions seulement). */
  axis: VisionAxis | null;
}

/** Part de chaque type dans le tirage : une question un jour sur deux environ. */
export const DAILY_KIND_WEIGHTS: Record<DailyKind, number> = { question: 4, photo: 2, write: 2, go_out: 2 };

export interface PickInput {
  userId: string;
  day: Day;
  catalogue: readonly DailyCandidate[];
  /** Axe le moins sûr de la personne (`leastConfidentAxis` de la vision ; null si inconnu : toutes les questions). */
  weakestAxis: VisionAxis | null;
  /** Sans lien actif, pas de défi « écrire à un lien ». */
  hasLinks: boolean;
}

/** Choix stable pour une personne et un jour. */
export function pickDailyChallenge(input: PickInput): DailyCandidate {
  const kinds = DAILY_KINDS.filter((k) => (k !== 'write' || input.hasLinks) && input.catalogue.some((c) => c.kind === k));
  if (kinds.length === 0) throw new Error('catalogue de défis vide');
  const total = kinds.reduce((sum, k) => sum + DAILY_KIND_WEIGHTS[k], 0);
  let roll = seedOf('daily-kind', input.userId, input.day) % total;
  let kind = kinds[0]!;
  for (const k of kinds) {
    if (roll < DAILY_KIND_WEIGHTS[k]) {
      kind = k;
      break;
    }
    roll -= DAILY_KIND_WEIGHTS[k];
  }
  let pool = input.catalogue.filter((c) => c.kind === kind);
  if (kind === 'question' && input.weakestAxis) {
    const onAxis = pool.filter((c) => c.axis === input.weakestAxis);
    if (onAxis.length > 0) pool = onAxis;
  }
  return pool[seedOf('daily-item', input.userId, input.day) % pool.length]!;
}

const RANK: Record<DailyStatus, number> = { offered: 0, seen: 1, accepted: 2, done: 3 };

/** Nouvel état après une action ; on n'avance jamais à reculons (voir puis accepter, ou faire directement). */
export function advanceDaily(status: DailyStatus, to: DailyStatus): DailyStatus {
  return RANK[to] > RANK[status] ? to : status;
}

/** La carte monte en plein écran à cette ouverture : elle n'a pas encore été vue aujourd'hui. */
export const presentDailyCard = (status: DailyStatus): boolean => status === 'offered';
