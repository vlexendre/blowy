/**
 * Fiabilité V5 (spec-v5 §2.14, D-022, V5.1 E.16) : « venu·e à N sorties sur M ». Une absence sans
 * prévenir OU une annulation après verrouillage compte comme absence ; la 2ᵉ absence d'un épisode
 * (fenêtre glissante) met en pause `pauseDays`. Après la pause, l'épisode repart à zéro.
 */
import type { Tuning } from '@blowy/tuning';

export interface ReliabilityState {
  attended: number;
  noShows: number;
  lateCancels: number;
  episodeAbsences: number;
  lastAbsenceAt: Date | null;
  pausedUntil: Date | null;
  pauseEpisode: number;
}

export const EMPTY_RELIABILITY: ReliabilityState = { attended: 0, noShows: 0, lateCancels: 0, episodeAbsences: 0, lastAbsenceAt: null, pausedUntil: null, pauseEpisode: 0 };

const DAY = 86_400_000;

export function recordAttendance(s: ReliabilityState): ReliabilityState {
  return { ...s, attended: s.attended + 1 };
}

/** Absence (no-show ou annulation tardive) ; renvoie le nouvel état et si une pause démarre. */
export function recordAbsence(s: ReliabilityState, kind: 'NO_SHOW' | 'LATE_CANCEL', now: Date, t: Tuning): { state: ReliabilityState; paused: boolean } {
  const r = t.reliability.v5;
  const fresh = !s.lastAbsenceAt || now.getTime() - s.lastAbsenceAt.getTime() > r.noShowWindowDays * DAY;
  const episode = (fresh ? 0 : s.episodeAbsences) + 1;
  const base = { ...s, noShows: s.noShows + (kind === 'NO_SHOW' ? 1 : 0), lateCancels: s.lateCancels + (kind === 'LATE_CANCEL' ? 1 : 0), lastAbsenceAt: now };
  if (episode >= r.noShowsToPause) {
    return { state: { ...base, episodeAbsences: 0, pausedUntil: new Date(now.getTime() + r.pauseDays * DAY), pauseEpisode: s.pauseEpisode + 1 }, paused: true };
  }
  return { state: { ...base, episodeAbsences: episode }, paused: false };
}

export const isPaused = (s: Pick<ReliabilityState, 'pausedUntil'> | null, now: Date): boolean => !!s?.pausedUntil && s.pausedUntil > now;
