/**
 * Profils d'engagement du simulateur (HYPOTHÈSES d'équilibrage, pas des mesures).
 * Probabilités par heure ÉVEILLÉE (8 h–23 h locale) ou par jour.
 */
export interface EngagementProfile {
  name: string;
  share: number;
  /** Proba qu'une personne ouvre l'app sur une heure éveillée. */
  openPerHour: number;
  /** Messages envoyés par ouverture (moyenne, Poisson borné). */
  messagesPerOpen: number;
  /** Proba de jouer / câliner si les deux sont au lieu. */
  playPerOpen: number;
  hugPerOpen: number;
  /** Proba quotidienne de valider une mission (et de la faire en commun). */
  missionPerDay: number;
  jointMissionShare: number;
  /** Proba de nourrir par ouverture si faim affichée < 60. */
  feedPerOpen: number;
  /** Proba quotidienne de cesser définitivement (churn silencieux). */
  churnPerDay: number;
  /** Proba quotidienne de déclencher une pause (3–10 j) ou une absence (2–6 j). */
  pausePerDay: number;
  absencePerDay: number;
  /** Proba quotidienne d'acheter un gel / boost s'il a assez de pièces. */
  spendPerDay: number;
}

export const PROFILES: readonly EngagementProfile[] = [
  { name: 'assidu', share: 0.2, openPerHour: 0.3, messagesPerOpen: 2.5, playPerOpen: 0.5, hugPerOpen: 0.5, missionPerDay: 0.75, jointMissionShare: 0.55, feedPerOpen: 0.7, churnPerDay: 0.004, pausePerDay: 0.004, absencePerDay: 0.006, spendPerDay: 0.12 },
  { name: 'regulier', share: 0.35, openPerHour: 0.15, messagesPerOpen: 1.8, playPerOpen: 0.4, hugPerOpen: 0.35, missionPerDay: 0.45, jointMissionShare: 0.35, feedPerOpen: 0.6, churnPerDay: 0.012, pausePerDay: 0.005, absencePerDay: 0.012, spendPerDay: 0.06 },
  { name: 'occasionnel', share: 0.3, openPerHour: 0.06, messagesPerOpen: 1.3, playPerOpen: 0.3, hugPerOpen: 0.2, missionPerDay: 0.18, jointMissionShare: 0.2, feedPerOpen: 0.5, churnPerDay: 0.03, pausePerDay: 0.004, absencePerDay: 0.03, spendPerDay: 0.03 },
  { name: 'fantome', share: 0.15, openPerHour: 0.02, messagesPerOpen: 1, playPerOpen: 0.15, hugPerOpen: 0.1, missionPerDay: 0.05, jointMissionShare: 0.05, feedPerOpen: 0.4, churnPerDay: 0.08, pausePerDay: 0.002, absencePerDay: 0.06, spendPerDay: 0.01 },
];
