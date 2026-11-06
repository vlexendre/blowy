/** Croissance V5 : stade alimenté par l'XP des souvenirs ; un stade ne redescend jamais. */
import { MILLI, STAGES, type Stage } from '@blowy/domain';
import type { Tuning } from '@blowy/tuning';

export function stageForXpV5(xpMilli: number, t: Tuning): Stage {
  const th = t.memories.stageThresholds;
  return xpMilli >= th.ADULT * MILLI ? 'ADULT' : xpMilli >= th.YOUNG * MILLI ? 'YOUNG' : 'BABY';
}

export const maxStage = (a: Stage, b: Stage): Stage => (STAGES.indexOf(a) >= STAGES.indexOf(b) ? a : b);

/** Prochain stade et progression (‰) depuis le seuil précédent ; null au stade adulte (`OwnPetViewV5.nextStageAt`). */
export function nextStageProgress(stage: Stage, xpMilli: number, t: Tuning): { stage: Stage; progressPermille: number } | null {
  const th = t.memories.stageThresholds;
  if (stage === 'ADULT') return null;
  const [from, to, next] = stage === 'BABY' ? [0, th.YOUNG * MILLI, 'YOUNG' as const] : [th.YOUNG * MILLI, th.ADULT * MILLI, 'ADULT' as const];
  const span = Math.max(1, to - from);
  return { stage: next, progressPermille: Math.max(0, Math.min(1000, Math.floor(((xpMilli - from) * 1000) / span))) };
}
