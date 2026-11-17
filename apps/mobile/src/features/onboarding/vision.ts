/**
 * Le test de vision dans l'inscription : les situations viennent de l'API (texte), leurs effets du domaine (pur) ;
 * on calcule « ta vision, pour l'instant » sur le téléphone avec les mêmes règles que le serveur (`visionProfile`).
 */
import type { VisionAnswer } from '@blowy/contract';
import { testSignals, VISION_AXES, VISION_TEST, type VisionAxis, type VisionProfile, visionProfile } from '@blowy/domain';

/** Un pictogramme par réponse (décor de l'app, la situation reste le texte de l'API). */
export const VISION_EMOJI: Readonly<Record<string, readonly [string, string]>> = {
  dimanche: ['🛋️', '🧺'],
  enfants: ['🍝', '🥂'],
  mutation: ['📦', '📍'],
  heritage: ['🐷', '🎟️'],
  promotion: ['📈', '🌙'],
  vacances: ['🎒', '📅'],
  appartement: ['🏡', '🎒'],
  vendredi: ['🪩', '🛏️'],
  cinq_ans: ['🏘️', '✈️'],
  projet: ['🛠️', '🏖️'],
  soirees: ['🕯️', '🎲'],
  quartier: ['🌳', '🍸'],
};

/** L'axe que vise surtout une situation (le plus fort effet de ses deux réponses). */
export function axisOfQuestion(questionId: string): VisionAxis {
  const q = VISION_TEST.find((x) => x.id === questionId);
  let best: VisionAxis = 'foyer';
  let max = -1;
  for (const choice of q?.choices ?? []) {
    for (const axis of VISION_AXES) {
      const v = Math.abs(choice[axis] ?? 0);
      if (v > max) {
        max = v;
        best = axis;
      }
    }
  }
  return best;
}

/** Sens d'une réponse sur l'axe de la situation : +1 vers le pôle +, −1 vers le pôle −. */
export function choiceDirection(questionId: string, choice: 0 | 1): 1 | -1 {
  const q = VISION_TEST.find((x) => x.id === questionId);
  const v = q?.choices[choice][axisOfQuestion(questionId)] ?? 0;
  return v < 0 ? -1 : 1;
}

/** Ta vision d'après les réponses données jusqu'ici (mêmes règles que le serveur, sans autre source). */
export function visionNow(answers: readonly VisionAnswer[], now: Date = new Date()): VisionProfile {
  const at = new Date(now.getTime() - 1000).toISOString();
  return visionProfile(testSignals(answers, at), now);
}

/** À quel point le minimoa est sûr d'un axe, en trois mots (jamais un chiffre). */
export type Sureness = 'sure' | 'fairly' | 'refine';
export const surenessOf = (confidence: number): Sureness => (confidence >= 60 ? 'sure' : confidence >= 35 ? 'fairly' : 'refine');

/**
 * Les traits les plus marqués d'une vision, pour la phrase de synthèse du résultat : 3 au plus, du plus net au moins
 * net ; un axe resté au milieu (|valeur| < 20) n'en donne pas.
 */
export function strongestTraits(profile: VisionProfile, max = 3): { axis: VisionAxis; side: 'low' | 'high' }[] {
  return VISION_AXES.map((axis) => ({ axis, value: profile[axis].value, weight: Math.abs(profile[axis].value) * (0.5 + profile[axis].confidence / 200) }))
    .filter((a) => Math.abs(a.value) >= 20)
    .sort((a, b) => b.weight - a.weight || VISION_AXES.indexOf(a.axis) - VISION_AXES.indexOf(b.axis))
    .slice(0, max)
    .map((a) => ({ axis: a.axis, side: a.value < 0 ? ('low' as const) : ('high' as const) }));
}
