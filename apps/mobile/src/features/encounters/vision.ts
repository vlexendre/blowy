/**
 * Pourquoi une rencontre : l'explication de l'API (`MatchExplanation` : 3 points communs, 1 différence) mise en forme
 * pour l'écran, avec les repères « toi » et « l'autre » sur chaque axe.
 *
 * Les deux repères viennent de l'API (`mine` / `theirs` de chaque axe : un côté et un cran, jamais une valeur) : rien
 * n'est deviné ici. Une réponse plus ancienne sans repères : pas de piste. Jamais un pourcentage seul.
 */
import type { LookingForDto, MatchExplanation } from '@blowy/contract';
import type { AxisLean } from '@blowy/domain';
import type { VisionMatchAxis } from '@blowy/ui';
import type { VisionAnswer } from '@blowy/contract';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { keys, useApi } from '@/core';

export const visionKey = ['vision', 'mine'] as const;

/** Ta vision, pour l'instant (écran « Son caractère »). */
export function useMyVision(enabled = true) {
  const api = useApi();
  return useQuery({ queryKey: visionKey, queryFn: api.vision.mine, enabled, staleTime: 5 * 60_000 });
}

export interface AxisWords {
  /** « Toi et Sasha, du même côté. ». */
  same: (name: string) => string;
  /** « Toi : plutôt d'un côté ; Sasha : plutôt de l'autre. ». */
  apart: (name: string) => string;
}

const sameLean = (a: AxisLean, b: AxisLean): boolean => a.side === b.side;

/** Les axes de l'explication avec les deux repères donnés par l'API ; `hasMarkers` : au moins une piste à légender. */
export function matchAxes(e: MatchExplanation, otherName: string, words: AxisWords): { common: VisionMatchAxis[]; explore: VisionMatchAxis; hasMarkers: boolean } {
  const toAxis = (a: MatchExplanation['common'][number]): VisionMatchAxis => ({
    axis: a.axis,
    name: a.name,
    text: a.text,
    mine: a.mine ?? null,
    theirs: a.theirs ?? null,
    trackLabel: a.mine && a.theirs ? (sameLean(a.mine, a.theirs) ? words.same(otherName) : words.apart(otherName)) : undefined,
  });
  const common = e.common.map(toAxis);
  const explore = toAxis(e.explore);
  return { common, explore, hasMarkers: [...common, explore].some((a) => !!a.mine || !!a.theirs) };
}

/** « Vous cherchez tous les deux des potes. » : la phrase venue de `lookingFor` (null : rien à dire). */
export const lookingForLine = (v: LookingForDto | null | undefined, words: Record<LookingForDto, string>): string | null => (v ? words[v] : null);

/** Une phrase lue pour la version courte (cartes) : « 3 points communs : Foyer, Rythme, Cap. 1 différence à explorer : Ancrage. ». */
export const whyA11y = (e: MatchExplanation, join: (title: string, items: string) => string): string =>
  `${join(e.commonTitle, e.common.map((c) => c.name).join(', '))} ${join(e.exploreTitle, e.explore.name)}`;

/**
 * Passer (ou repasser) le test après l'inscription : les réponses remplacent les anciennes. Ensuite, le profil
 * (`visionTestDone`), la vision, les rencontres et la carte sont relus.
 */
export function useRetakeVisionTest() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (answers: VisionAnswer[]) => api.vision.retakeTest(answers),
    onSuccess: (profile) => {
      qc.setQueryData(visionKey, profile);
      void qc.invalidateQueries({ queryKey: keys.me });
      void qc.invalidateQueries({ queryKey: keys.encounters });
      void qc.invalidateQueries({ queryKey: ['map'] });
    },
  });
}

/** Où passer (ou repasser) le test de vision après l'inscription : 12 situations, puis « Ta vision ». */
export const VISION_TEST_ROUTE = '/vision-test' as const;
