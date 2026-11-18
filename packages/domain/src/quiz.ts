/**
 * « Quel minimoa es-tu ? » (site, sans compte ; docs/VIRALITE.md) : 7 situations neutres (amitié, quotidien, sorties),
 * trois réponses chacune. Chaque réponse fait bouger les 4 jauges du caractère (les mêmes que dans l'app) ; le résultat
 * est le pôle le plus marqué (un des 8 caractères réels) et l'espèce qui le porte. Aucune question de couple, aucune
 * donnée sensible : rien ici ne touche la vision (l'appariement), seulement le caractère de départ du minimoa.
 * Pur : aucun aléa (le code court du résultat est tiré par l'API).
 */
import { GAUGE_KEYS, GAUGE_POLES, type GaugeKey, type Gauges, ZERO_GAUGES, clampGauge } from './gauges';
import type { Species } from './pet';

export const QUIZ_THEMES = ['amitie', 'quotidien', 'sorties'] as const;
export type QuizTheme = (typeof QUIZ_THEMES)[number];

export interface QuizChoice {
  /** `a`, `b`, `c` : la clé du texte (`quizText.questions.<id>.<choix>`). */
  id: 'a' | 'b' | 'c';
  delta: Partial<Gauges>;
}
export interface QuizQuestion {
  id: string;
  theme: QuizTheme;
  choices: readonly [QuizChoice, QuizChoice, QuizChoice];
}

const q = (id: string, theme: QuizTheme, a: Partial<Gauges>, b: Partial<Gauges>, c: Partial<Gauges>): QuizQuestion => ({
  id,
  theme,
  choices: [
    { id: 'a', delta: a },
    { id: 'b', delta: b },
    { id: 'c', delta: c },
  ],
});

/** Les 7 situations, dans l'ordre (≈ 60 secondes). Chaque pôle est atteignable par au moins deux réponses. */
export const QUIZ: readonly QuizQuestion[] = [
  q('plan', 'sorties', { social: 30, talk: 10 }, { social: 5, tender: -10 }, { social: -30 }),
  q('sale_journee', 'amitie', { tender: 25, talk: 20 }, { tender: 25, social: 10 }, { tender: -20, play: 15 }),
  q('dimanche', 'quotidien', { play: 30 }, { play: -30 }, { social: 20, play: 5 }),
  q('groupe', 'amitie', { talk: 30 }, { talk: -30 }, { play: 20, talk: 10 }),
  q('jeu', 'sorties', { play: -20, talk: 15 }, { tender: -25, play: 15 }, { play: 20, social: 15 }),
  q('voisin', 'quotidien', { talk: -20, social: -10 }, { talk: 25, social: 15 }, { tender: 25 }),
  q('coupe', 'amitie', { tender: -30 }, { tender: 25 }, { talk: -20 }),
];
export const QUIZ_IDS: readonly string[] = QUIZ.map((x) => x.id);

export interface QuizAnswer {
  questionId: string;
  choice: 'a' | 'b' | 'c';
}

/** Les 8 caractères (pôles des jauges), dans l'ordre des jauges. */
export const QUIZ_TRAITS = GAUGE_KEYS.flatMap((k) => [GAUGE_POLES[k].low, GAUGE_POLES[k].high]) as readonly QuizTrait[];
export type QuizTrait = 'casanier' | 'sociable' | 'pose' | 'joueur' | 'piquant' | 'tendre' | 'discret' | 'bavard';

/** Quelle espèce porte quel caractère (deux chacune) : le minimoa du résultat est une vraie espèce de l'app. */
export const TRAIT_SPECIES: Readonly<Record<QuizTrait, Species>> = {
  sociable: 'nino',
  joueur: 'nino',
  tendre: 'suzie',
  bavard: 'suzie',
  pose: 'gaston',
  casanier: 'gaston',
  piquant: 'pia',
  discret: 'pia',
};

/** Pose en pied du résultat (images du pack : `<espèce>_corps_<pose>`). */
export const TRAIT_POSE: Readonly<Record<QuizTrait, string>> = {
  sociable: 'coucou',
  joueur: 'danse',
  tendre: 'joie',
  bavard: 'rit',
  pose: 'pense',
  casanier: 'assis',
  piquant: 'fier',
  discret: 'timide',
};

export interface QuizResult {
  species: Species;
  trait: QuizTrait;
  /** Second trait net (|jauge| ≥ 15), s'il y en a un. */
  second: QuizTrait | null;
  /** Jauges de départ du minimoa (bornées), reprises à l'inscription. */
  gauges: Gauges;
}

/** Les réponses sont complètes et connues : une par situation, un choix valable. */
export function validQuizAnswers(answers: readonly QuizAnswer[]): boolean {
  if (answers.length !== QUIZ.length) return false;
  const seen = new Set<string>();
  for (const a of answers) {
    if (seen.has(a.questionId) || !QUIZ_IDS.includes(a.questionId) || !['a', 'b', 'c'].includes(a.choice)) return false;
    seen.add(a.questionId);
  }
  return true;
}

const poleOf = (k: GaugeKey, v: number): QuizTrait => (v < 0 ? GAUGE_POLES[k].low : GAUGE_POLES[k].high) as QuizTrait;

/**
 * Le résultat : la somme des réponses donne les jauges ; le pôle le plus marqué est le caractère (égalité : l'ordre des
 * jauges, sociable d'abord), le suivant s'il est net. Aucune réponse marquée : sociable.
 */
export function quizResult(answers: readonly QuizAnswer[]): QuizResult {
  const g: Gauges = { ...ZERO_GAUGES };
  for (const a of answers) {
    const choice = QUIZ.find((x) => x.id === a.questionId)?.choices.find((c) => c.id === a.choice);
    if (!choice) continue;
    for (const k of GAUGE_KEYS) g[k] += choice.delta[k] ?? 0;
  }
  const gauges = Object.fromEntries(GAUGE_KEYS.map((k) => [k, clampGauge(g[k])])) as Gauges;
  const ranked = [...GAUGE_KEYS].sort((a, b) => Math.abs(gauges[b]) - Math.abs(gauges[a]));
  const [first, next] = ranked as [GaugeKey, GaugeKey];
  const trait = gauges[first] === 0 ? 'sociable' : poleOf(first, gauges[first]);
  const second = Math.abs(gauges[next]) >= 15 ? poleOf(next, gauges[next]) : null;
  return { species: TRAIT_SPECIES[trait], trait, second, gauges };
}

/** Code court d'un résultat (`Q` + 6 caractères sans ambiguïté) : repris dans l'app (« Un code ? », `minimoa://quiz/<code>`). */
export const QUIZ_CODE_RE = /^Q[2-9A-HJ-NP-Z]{6}$/;
export const QUIZ_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export const isQuizCode = (raw: string): boolean => QUIZ_CODE_RE.test(raw.trim().toUpperCase());
/** Code à partir de 6 nombres de 0 à 1 (tirés par l'API). */
export const quizCodeFrom = (rand: readonly number[]): string =>
  `Q${rand
    .slice(0, 6)
    .map((r) => QUIZ_CODE_ALPHABET[Math.min(QUIZ_CODE_ALPHABET.length - 1, Math.floor(r * QUIZ_CODE_ALPHABET.length))])
    .join('')}`;

/** Un résultat est gardé un an (reprise dans l'app), puis effacé par le minuteur. */
export const QUIZ_KEEP_DAYS = 365;
