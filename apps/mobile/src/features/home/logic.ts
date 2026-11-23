/**
 * Accueil (V6-GAccueil), ce qui se calcule sans écran ni réseau : l'état du moment (`maintenant`), la carte, la bulle
 * et la puce d'humeur qui vont avec, les étapes du chemin montrées, et le petit moment joué à l'ouverture. Pur : ni
 * horloge, ni aléa (l'heure arrive en paramètre).
 */
import type { CheminMap } from '@blowy/contract';

/** Les six états de la maquette (prop `maintenant`). */
export type HomeNow = 'seance' | 'faite' | 'membre' | 'repos' | 'bonjour' | 'sieste';
/** La carte sous la ligne de série : le bandeau de la séance, la carte « faite », « À demain », un bonjour reçu. */
export type HomeCard = 'seance' | 'faite' | 'membre' | 'repos' | 'bonjour';
/** Puce d'humeur du panneau (jamais de bouderie à l'écran). */
export type HomeMood = 'great' | 'calm' | 'content' | 'thrilled' | 'asleep';

export interface HomeInput {
  /** État du jour de Ton chemin ; null tant que la carte n'est pas lue (ou en erreur). */
  today: CheminMap['today']['state'] | null;
  /** Minimoa+ : seul un membre se voit proposer l'étape suivante (ADA-2027, décision de Fable). */
  plus: boolean;
  /** Le minimoa dort (endormi au repos sur l'accueil). */
  asleep: boolean;
  /** Un bonjour reçu attend une réponse. */
  hello: boolean;
  /** Forme du minimoa (`Pet.shape`) : seulement pour la puce d'humeur, jamais une bouderie. */
  shape: string;
}

export interface HomeState {
  now: HomeNow;
  card: HomeCard | null;
  bubble: 'rest' | 'sleep' | null;
  mood: HomeMood;
}

/**
 * L'état de l'accueil, par ordre d'importance : la séance à faire (la seule action), un bonjour reçu, le minimoa qui
 * dort, puis la séance faite (membre : l'étape suivante ; gratuit : jamais rien de vendu) et le repos. Endormi, la
 * carte de la séance faite reste à sa place (pas de saut de mise en page quand il s'endort au bout de 25 s) ; seules
 * la bulle et la puce changent.
 */
export function homeState(i: HomeInput): HomeState {
  const done: HomeCard | null =
    i.today === 'bonus' && i.plus ? 'membre' : i.today === 'done' || i.today === 'bonus' ? 'faite' : i.today === 'all_done' ? 'repos' : null;
  const now: HomeNow = i.today === 'todo' ? 'seance' : i.hello ? 'bonjour' : i.asleep ? 'sieste' : (done ?? 'repos');
  const card: HomeCard | null = now === 'seance' || now === 'bonjour' ? now : done;
  const bubble = i.asleep ? 'sleep' : card === 'repos' ? 'rest' : null;
  const mood: HomeMood = i.asleep ? 'asleep' : now === 'bonjour' ? 'thrilled' : now === 'seance' ? (i.shape === 'en_forme' ? 'great' : 'calm') : 'content';
  return { now, card, bubble, mood };
}

// ── Le chemin de l'accueil ────────────────────────────────────────────────────
export type HomeStepKind = 'done' | 'today' | 'current' | 'locked';
export interface HomeStep {
  key: string;
  kind: HomeStepKind;
  /** Rang dans tout le chemin, à partir de 1 (« Étape 3 »). */
  number: number;
}

/** Étapes faites gardées au-dessus de celle du jour (V6-GAccueil : deux). */
const BEFORE = 2;

/**
 * Les étapes montrées sur l'accueil, de haut en bas : deux faites, celle du jour, puis toute la suite (liste
 * virtualisée). Séance à faire : l'étape du jour est `current` (le seul jaune). Séance faite : plus de jaune ; l'étape
 * faite aujourd'hui est `today` (`doneTodayStepId` si la fin de séance est en mémoire, sinon la dernière faite avant
 * l'étape suivante) et la suivante est `locked`, à venir. Parcours fini : les trois dernières (une révision à faire
 * se lance depuis la dernière).
 */
export function homeSteps(
  map: Pick<CheminMap, 'units' | 'currentStepId'> & { today: Pick<CheminMap['today'], 'state'> },
  doneTodayStepId?: string | null,
): { firstIndex: number; steps: HomeStep[] } {
  const all = map.units.flatMap((u) => u.steps.map((s) => ({ key: `${u.id}:${s.id}`, id: s.id, state: s.state })));
  const todo = map.today.state === 'todo';
  const found = map.currentStepId ? all.findIndex((s) => s.id === map.currentStepId) : -1;
  // Parcours fini, séance de révision à faire : la dernière étape porte le « Commencer » (l'action reste là).
  const at = found < 0 && todo ? all.length - 1 : found;
  const lastDone = (() => {
    if (todo) return -1;
    if (doneTodayStepId) return all.findIndex((s) => s.id === doneTodayStepId && s.state === 'done');
    const before = at >= 0 ? all.slice(0, at) : all;
    for (let k = before.length - 1; k >= 0; k -= 1) if (before[k]?.state === 'done') return k;
    return -1;
  })();
  const anchor = todo && at >= 0 ? at : lastDone >= 0 ? lastDone : at >= 0 ? at : all.length - 1;
  const firstIndex = Math.max(0, anchor - BEFORE);
  const steps = all.slice(firstIndex).map((s, k): HomeStep => {
    const i = firstIndex + k;
    const kind: HomeStepKind =
      todo && i === at ? 'current' : i === lastDone ? 'today' : s.state === 'done' ? 'done' : 'locked';
    return { key: s.key, kind, number: i + 1 };
  });
  return { firstIndex, steps };
}

// ── Un moment par ouverture ───────────────────────────────────────────────────
/** Au-delà de cette absence, il fait coucou en te revoyant. */
export const HELLO_AFTER_MS = 12 * 3600_000;
/** Au-delà de cette absence, il t'accueille bras ouverts (au lieu du coucou). Jamais de reproche. */
export const WELCOME_AFTER_MS = 3 * 24 * 3600_000;

/**
 * Le petit moment joué à l'ouverture de l'accueil (un seul) : après plus de 3 jours d'absence il t'accueille bras
 * ouverts ; la nuit (`night` : après son premier jour) il bâille, sans s'endormir ; après plus de 12 h il fait
 * coucou ; sinon il arrive en marchant.
 */
export function homeEntrance(o: { last: number | null; now: number; night: boolean }): 'wave' | 'welcome' | 'arrive' | 'yawn' {
  const away = o.last === null ? 0 : o.now - o.last;
  if (away > WELCOME_AFTER_MS) return 'welcome';
  if (o.night) return 'yawn';
  if (away > HELLO_AFTER_MS) return 'wave';
  return 'arrive';
}
