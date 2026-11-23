/**
 * Accueil (V6-GAccueil), ce qui se calcule sans écran ni réseau : l'état du moment (`maintenant`), la carte, la bulle
 * et la puce d'humeur qui vont avec, les étapes du chemin montrées, et le petit moment joué à l'ouverture. Pur : ni
 * horloge, ni aléa (l'heure arrive en paramètre).
 */
import type { CheminMap } from '@blowy/contract';
import { type GradientName, speciesGradient } from '@blowy/tokens';

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
  /**
   * Une personne du jour présentée : d'après la fin de séance du jour gardée en mémoire (`result.person`) ; sinon
   * faux si les rencontres sont lues et sans suggestion (le serveur n'aurait présenté personne) ; null : on ne sait pas.
   */
  person: boolean | null;
}

export interface HomeState {
  now: HomeNow;
  card: HomeCard | null;
  bubble: 'rest' | 'sleep' | null;
  mood: HomeMood;
  /** Carte faite : « Ta personne du jour » et « Revoir ta personne du jour » (jamais s'il n'y a personne). */
  person: boolean;
}

/**
 * L'état de l'accueil, par ordre d'importance : la séance à faire (la seule action), un bonjour reçu, le minimoa qui
 * dort, puis la séance faite (membre : l'étape suivante ; gratuit : jamais rien de vendu) et le repos. Séance faite
 * sans personne présentée (`person === false`) : gratuit, le repos (« À demain ») ; membre, la carte sans la personne
 * du jour, seulement l'étape suivante. Endormi, la carte de la séance faite reste à sa place (pas de saut de mise en
 * page quand il s'endort au bout de 25 s) ; seules la bulle et la puce changent.
 */
export function homeState(i: HomeInput): HomeState {
  const nobody = i.person === false;
  const done: HomeCard | null =
    i.today === 'bonus' && i.plus
      ? 'membre'
      : i.today === 'done' || i.today === 'bonus'
        ? nobody
          ? 'repos'
          : 'faite'
        : i.today === 'all_done'
          ? 'repos'
          : null;
  const now: HomeNow = i.today === 'todo' ? 'seance' : i.hello ? 'bonjour' : i.asleep ? 'sieste' : (done ?? 'repos');
  const card: HomeCard | null = now === 'seance' || now === 'bonjour' ? now : done;
  const bubble = i.asleep ? 'sleep' : card === 'repos' ? 'rest' : null;
  const mood: HomeMood = i.asleep ? 'asleep' : now === 'bonjour' ? 'thrilled' : now === 'seance' ? (i.shape === 'en_forme' ? 'great' : 'calm') : 'content';
  const person = (card === 'faite' || card === 'membre') && !nobody;
  return { now, card, bubble, mood, person };
}

/**
 * Y a-t-il une personne du jour ? La fin de séance gardée en mémoire le dit, si elle est du jour (une fin d'hier ne
 * compte pas) ; sinon, des rencontres lues sans aucune suggestion veulent dire que le serveur n'a présenté personne
 * (`person: null` : premier ici, pas de position, profil pas prêt) ; sinon on ne sait pas (null).
 */
export function homePerson(o: {
  done: { day: string; person: boolean } | null;
  today: string | null;
  suggestions: readonly unknown[] | undefined;
}): boolean | null {
  if (o.done && o.today && o.done.day === o.today) return o.done.person;
  if (o.suggestions && o.suggestions.length === 0) return false;
  return null;
}

// ── Le panneau du minimoa ─────────────────────────────────────────────────────
/**
 * Panneau de l'accueil : celui de l'espèce, jamais jaune (le seul jaune de l'écran est l'étape du jour « Commencer »).
 * Pia (panneau `accent` ailleurs) passe sur `wine` : nom blanc à 17,4:1 en haut du dégradé, « Garde-robe » (blanc,
 * encre `#14101F`) à 18,7:1, et son pelage violet s'y détache.
 */
export function homePanelGradient(species: keyof typeof speciesGradient): GradientName {
  const g: GradientName = speciesGradient[species];
  return g === 'accent' ? 'wine' : g;
}

// ── Le chemin de l'accueil ────────────────────────────────────────────────────
export type HomeStepKind = 'done' | 'today' | 'current' | 'locked';
export interface HomeStep {
  key: string;
  kind: HomeStepKind;
  /** Rang dans tout le chemin, à partir de 1 (« Étape 3 »). */
  number: number;
}

/**
 * Étapes faites gardées au-dessus de celle du jour (V6-GAccueil : deux). Petit écran (375×667) : une seule, pour que
 * « Commencer » reste loin au-dessus du fondu même quand le titre de l'univers passe sur deux lignes.
 */
export const HOME_STEPS_BEFORE = 2;
export const HOME_STEPS_BEFORE_COMPACT = 1;

/**
 * Les étapes montrées sur l'accueil, de haut en bas : deux faites (`before`), celle du jour, puis la suite jusqu'à la fin de son
 * univers (pas une longue colonne de cadenas : `more` dit qu'il reste des univers après, l'écran le dit en une ligne). Séance à faire : l'étape du jour est `current` (le seul jaune). Séance faite : plus de jaune ; l'étape
 * faite aujourd'hui est `today` seulement d'après la fin de séance du jour gardée en mémoire (`doneTodayStepId`) ;
 * sans elle, aucune étape n'est marquée (rien d'inventé) et les lignes partent de l'étape suivante, `locked`, à venir.
 * Parcours fini : les trois dernières (une révision à faire se lance depuis la dernière).
 */
export function homeSteps(
  map: Pick<CheminMap, 'units' | 'currentStepId'> & { today: Pick<CheminMap['today'], 'state'> },
  doneTodayStepId?: string | null,
  before: number = HOME_STEPS_BEFORE,
): { firstIndex: number; steps: HomeStep[]; more: boolean } {
  const all = map.units.flatMap((u, unit) => u.steps.map((s) => ({ key: `${u.id}:${s.id}`, id: s.id, state: s.state, unit })));
  const todo = map.today.state === 'todo';
  const found = map.currentStepId ? all.findIndex((s) => s.id === map.currentStepId) : -1;
  // Parcours fini, séance de révision à faire : la dernière étape porte le « Commencer » (l'action reste là).
  const at = found < 0 && todo ? all.length - 1 : found;
  const lastDone = !todo && doneTodayStepId ? all.findIndex((s) => s.id === doneTodayStepId && s.state === 'done') : -1;
  const anchor = todo && at >= 0 ? at : lastDone >= 0 ? lastDone : at >= 0 ? at : all.length - 1;
  const firstIndex = Math.max(0, anchor - before);
  // Jusqu'à la fin de l'univers de l'étape du jour (ou de la suivante, après la séance).
  const unit = all[Math.max(anchor, at)]?.unit;
  const after = unit === undefined ? -1 : all.findIndex((s) => s.unit > unit);
  const end = after < 0 ? all.length : after;
  const steps = all.slice(firstIndex, end).map((s, k): HomeStep => {
    const i = firstIndex + k;
    const kind: HomeStepKind =
      todo && i === at ? 'current' : i === lastDone ? 'today' : s.state === 'done' ? 'done' : 'locked';
    return { key: s.key, kind, number: i + 1 };
  });
  return { firstIndex, steps, more: end < all.length };
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
