/**
 * Pause (P-5.14) : ≤ 14 jours cumulés par période. Période = trimestre civil UTC (HYPOTHÈSE documentée).
 */
export const MAX_PAUSE_DAYS = 14;
const DAY = 86_400_000;

export function pausePeriodKey(at: Date): string {
  return `${at.getUTCFullYear()}-Q${Math.floor(at.getUTCMonth() / 3) + 1}`;
}

export interface PauseSpan {
  startsAt: Date;
  endsAt: Date;
  endedAt: Date | null;
}

export function usedPauseMs(spans: readonly PauseSpan[]): number {
  return spans.reduce((acc, s) => acc + Math.max(0, (s.endedAt ?? s.endsAt).getTime() - s.startsAt.getTime()), 0);
}

export function remainingPauseDays(spans: readonly PauseSpan[]): number {
  return Math.max(0, Math.floor((MAX_PAUSE_DAYS * DAY - usedPauseMs(spans)) / DAY));
}
