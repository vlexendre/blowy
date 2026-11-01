/** Bande : cohésion = moyenne des complicités des arêtes entre membres actifs ; < 3 membres = gains collectifs suspendus. */
import type { Tuning } from '@blowy/tuning';

export interface GroupEdge {
  a: string;
  b: string;
  complicity: number;
}

export function groupCohesion(activeMembers: readonly string[], edges: readonly GroupEdge[]): number {
  const set = new Set(activeMembers);
  const inGroup = edges.filter((e) => set.has(e.a) && set.has(e.b) && e.a !== e.b);
  if (inGroup.length === 0) return 0;
  return inGroup.reduce((s, e) => s + e.complicity, 0) / inGroup.length;
}

export const groupGainsActive = (activeCount: number, t: Tuning): boolean => activeCount >= t.group.min && activeCount <= t.group.max;

/** Mission de groupe valide : au moins N participants distincts, chacun avec sa contribution. */
export const groupMissionValid = (participantIds: readonly string[], t: Tuning): boolean => new Set(participantIds).size >= t.group.missionMinParticipants;
