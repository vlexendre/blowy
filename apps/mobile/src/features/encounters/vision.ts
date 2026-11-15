/**
 * Pourquoi une rencontre : l'explication de l'API (`MatchExplanation` : 3 points communs, 1 différence) mise en forme
 * pour l'écran, avec les repères « toi » et « l'autre » sur chaque axe quand on peut les placer honnêtement.
 *
 * Ce que l'app sait : ta vision (`api.vision.mine`, côté de chaque axe). Un point commun veut dire « du même côté » :
 * les deux repères vont au même tiers. Pour la différence, l'API ne dit pas (encore) de quel côté est l'autre
 * (seulement dans la phrase) : seul ton repère est placé. Jamais de valeur chiffrée, jamais un pourcentage seul.
 */
import type { MatchExplanation, VisionProfileDto } from '@blowy/contract';
import { sideOf } from '@blowy/domain';
import type { VisionMatchAxis } from '@blowy/ui';
import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/core';

export const visionKey = ['vision', 'mine'] as const;

/** Ta vision, pour l'instant (sert aux repères « toi »). */
export function useMyVision(enabled = true) {
  const api = useApi();
  return useQuery({ queryKey: visionKey, queryFn: api.vision.mine, enabled, staleTime: 5 * 60_000 });
}

export interface AxisWords {
  /** « Toi et Sasha, du même côté. ». */
  same: (name: string) => string;
  /** « Toi : plutôt fonder un foyer. ». */
  mineOnly: (line: string) => string;
}

/** Les axes de l'explication, avec tes repères (et ceux de l'autre quand c'est sûr). */
export function matchAxes(e: MatchExplanation, mine: VisionProfileDto | undefined, otherName: string, words: AxisWords): { common: VisionMatchAxis[]; explore: VisionMatchAxis } {
  const sideFor = (axis: string) => {
    const a = mine?.axes.find((x) => x.axis === axis);
    return a ? { side: sideOf(a.value), line: a.line } : null;
  };
  const common = e.common.map((c): VisionMatchAxis => {
    const s = sideFor(c.axis);
    return { axis: c.axis, name: c.name, text: c.text, mine: s?.side ?? null, theirs: s?.side ?? null, trackLabel: s ? words.same(otherName) : undefined };
  });
  const s = sideFor(e.explore.axis);
  const explore: VisionMatchAxis = { axis: e.explore.axis, name: e.explore.name, text: e.explore.text, mine: s?.side ?? null, theirs: null, trackLabel: s ? words.mineOnly(s.line) : undefined };
  return { common, explore };
}

/** Une phrase lue pour la version courte (cartes) : « 3 points communs : Foyer, Rythme, Cap. 1 différence à explorer : Ancrage. ». */
export const whyA11y = (e: MatchExplanation, join: (title: string, items: string) => string): string =>
  `${join(e.commonTitle, e.common.map((c) => c.name).join(', '))} ${join(e.exploreTitle, e.explore.name)}`;

/**
 * Où passer (ou repasser) le test de vision après l'inscription. Aucune route dédiée n'existe encore côté app :
 * « Son caractère » montre la vision (spéc §15). À remplacer par l'écran du test quand il existera.
 */
export const VISION_TEST_ROUTE = '/pet/caractere' as const;
