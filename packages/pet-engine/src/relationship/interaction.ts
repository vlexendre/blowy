/** Interaction partagée : remet à zéro inactivité/absence et nourrit l'envie (une seule implémentation). */
import type { Tuning } from '@blowy/tuning';
import type { EffectSink, RelationshipState } from '../model/index.js';
import { SCORE_MAX, clamp } from '../shared/index.js';

export function touchInteraction(rel: RelationshipState, t: Tuning): void {
  rel.idleMs = 0;
  rel.inactivityCrossed = false;
  rel.absenceStepsApplied = 0;
  for (const s of rel.sides) s.desire = clamp(s.desire + t.actions.desire.perSharedAction, 0, t.actions.desire.max);
}

/** Clés i18n des souvenirs (textes dans @blowy/content/locales). */
export const MEMORY_KEYS = { GIFT: 'memory.gift', JOINT_MISSION: 'memory.joint_mission' } as const;

export const bumpScore = (v: number, delta: number): number => clamp(v + delta, 0, SCORE_MAX);

export function addMemory(rel: RelationshipState, memory: string, t: Tuning, out: EffectSink): void {
  rel.memories.push(memory);
  if (rel.memories.length > t.actions.memoriesMax) rel.memories.splice(0, rel.memories.length - t.actions.memoriesMax);
  out.push({ type: 'MEMORY_ADDED', relationshipId: rel.id, memory });
}
