/**
 * Lecture des statistiques quotidiennes : chaque chiffre avec sa période et la période précédente.
 * Fonctions pures sur les lignes de `admin_daily_stats` (aucune grande table n'est lue à l'affichage).
 */
import type { AdminFunnel, AdminMinimoas, AdminOverview, AdminSeries, Metric, Rate } from '@blowy/contract';
import { type Day, addDays } from '@blowy/domain';
import type { DailyMetrics, DailyStatsRow } from '../ports';

type NumKey = { [K in keyof DailyMetrics]: DailyMetrics[K] extends number ? K : never }[keyof DailyMetrics];
type NullableNumKey = { [K in keyof DailyMetrics]: DailyMetrics[K] extends number | null ? K : never }[keyof DailyMetrics];

/** Jours lus pour un écran : 30 jours de période et 30 de comparaison. */
export const STATS_WINDOW_DAYS = 60;

export class StatsWindow {
  private readonly byDay: Map<Day, DailyMetrics>;
  constructor(
    rows: readonly DailyStatsRow[],
    readonly asOf: Day,
  ) {
    this.byDay = new Map(rows.map((r) => [r.day, r.metrics]));
  }

  at(day: Day): DailyMetrics | null {
    return this.byDay.get(day) ?? null;
  }

  value(day: Day, key: NullableNumKey): number | null {
    const m = this.at(day);
    return m ? (m[key] as number | null) : null;
  }

  /** Somme sur `len` jours finissant à `end` ; null si aucun jour de la fenêtre n'est calculé. */
  sum(end: Day, len: number, key: NumKey): number | null {
    let total = 0;
    let seen = false;
    for (let i = 0; i < len; i++) {
      const m = this.at(addDays(end, -i));
      if (m) {
        total += m[key];
        seen = true;
      }
    }
    return seen ? total : null;
  }

  /** Instantané : ce jour contre `back` jours plus tôt. */
  snapshot(key: NullableNumKey, back: number): Metric {
    return { value: this.value(this.asOf, key), previous: this.value(addDays(this.asOf, -back), key) };
  }

  /** Cumul : les `len` derniers jours contre les `len` d'avant. */
  windowed(key: NumKey, len: number): Metric {
    return { value: this.sum(this.asOf, len, key), previous: this.sum(addDays(this.asOf, -len), len, key) };
  }

  /** Taux sur 7 jours (et les 7 d'avant) : somme des numérateurs sur somme des dénominateurs. */
  rate(num: NumKey, den: NumKey, len = 7): Rate {
    const ratio = (end: Day): { value: number | null; base: number } => {
      const d = this.sum(end, len, den) ?? 0;
      const n = this.sum(end, len, num) ?? 0;
      return { value: d > 0 ? Math.round((n / d) * 1000) / 1000 : null, base: d };
    };
    const now = ratio(this.asOf);
    return { value: now.value, previous: ratio(addDays(this.asOf, -len)).value, base: now.base };
  }

  series(key: NullableNumKey, label: string, len = 30): AdminSeries {
    const points = [];
    for (let i = len - 1; i >= 0; i--) {
      const day = addDays(this.asOf, -i);
      points.push({ day, value: this.value(day, key) });
    }
    return { key, label, points };
  }
}

const emptyMetric: Metric = { value: null, previous: null };
const emptyRate: Rate = { value: null, previous: null, base: 0 };
const byWindow = { day: emptyMetric, week: emptyMetric, month: emptyMetric };

export function overviewOf(w: StatsWindow | null, computedAt: string | null): AdminOverview {
  if (!w) {
    return {
      asOf: null,
      computedAt,
      accounts: { total: emptyMetric, new: byWindow, active: byWindow },
      retention: { d1: emptyRate, d7: emptyRate, d30: emptyRate },
      plus: { subscribers: emptyMetric, trials: emptyMetric, newTrials: byWindow },
      averageStreak: emptyMetric,
      series: [],
    };
  }
  return {
    asOf: w.asOf,
    computedAt,
    accounts: {
      total: w.snapshot('accountsTotal', 7),
      new: { day: w.snapshot('accountsNew', 1), week: w.windowed('accountsNew', 7), month: w.windowed('accountsNew', 30) },
      active: { day: w.snapshot('dau', 1), week: w.snapshot('wau', 7), month: w.snapshot('mau', 30) },
    },
    retention: { d1: w.rate('d1Retained', 'd1Cohort'), d7: w.rate('d7Retained', 'd7Cohort'), d30: w.rate('d30Retained', 'd30Cohort') },
    plus: {
      subscribers: w.snapshot('subscribers', 7),
      trials: w.snapshot('trials', 7),
      newTrials: { day: w.snapshot('newTrials', 1), week: w.windowed('newTrials', 7), month: w.windowed('newTrials', 30) },
    },
    averageStreak: w.snapshot('averageStreak', 7),
    series: [w.series('dau', 'Actifs par jour'), w.series('accountsNew', 'Nouveaux comptes'), w.series('subscribers', 'Abonnés'), w.series('trials', 'Essais en cours')],
  };
}

export function minimoasOf(w: StatsWindow | null, computedAt: string | null): AdminMinimoas {
  if (!w) return { asOf: null, computedAt, messages: byWindow, reactionRate: emptyRate, shapes: null, visions: null, top: [], series: [] };
  const latest = w.at(w.asOf);
  const details = latest?.topDetails ?? {};
  const top = (latest?.top ?? []).map((t) => ({
    petName: t.petName,
    species: t.species,
    ownerName: t.ownerName,
    shape: details[t.userId]?.shape ?? null,
    streak: details[t.userId]?.streak ?? null,
    activeLinks: t.activeLinks,
  }));
  return {
    asOf: w.asOf,
    computedAt,
    messages: { day: w.snapshot('petMessages', 1), week: w.windowed('petMessages', 7), month: w.windowed('petMessages', 30) },
    reactionRate: w.rate('petMessagesAnswered', 'petMessages'),
    shapes: latest?.shapes ?? null,
    visions: latest?.visions ?? null,
    top,
    series: [w.series('petMessages', 'Messages de minimoas'), w.series('petMessagesAnswered', 'Suivis d’une réponse')],
  };
}

export function funnelOf(w: StatsWindow | null, computedAt: string | null): AdminFunnel {
  if (!w) return { asOf: null, computedAt, encounters: { proposed: emptyMetric, waved: emptyMetric, accepted: emptyMetric }, averageCompatibility: emptyMetric, links: { active: 0, ghost: 0, archived: 0 }, series: [] };
  const latest = w.at(w.asOf);
  const proposed = (end: Day): number | null => {
    let total = 0;
    for (let i = 0; i < 7; i++) {
      const v = w.value(addDays(end, -i), 'encountersProposed');
      if (v === null) return null;
      total += v;
    }
    return total;
  };
  return {
    asOf: w.asOf,
    computedAt,
    encounters: {
      proposed: { value: proposed(w.asOf), previous: proposed(addDays(w.asOf, -7)) },
      waved: w.windowed('encountersWaved', 7),
      accepted: w.windowed('encountersAccepted', 7),
    },
    averageCompatibility: w.snapshot('averageCompatibility', 7),
    links: { active: latest?.linksActive ?? 0, ghost: latest?.linksGhost ?? 0, archived: latest?.linksArchived ?? 0 },
    series: [w.series('encountersProposed', 'Proposées'), w.series('encountersWaved', 'Saluées'), w.series('encountersAccepted', 'Acceptées')],
  };
}
