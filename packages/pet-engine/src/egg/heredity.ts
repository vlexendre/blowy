/**
 * Hérédité et prénom du bébé.
 *  - Axes : moyenne des parents + deltas issus des réponses, chaque delta borné à ±maxDelta,
 *    résultat borné [-1, 1]. Le PRNG seedé ne sert qu'à départager une égalité de passion ;
 *    la graine est persistée avec le résultat (replay).
 *  - Prénom : deux votes modérés en amont ; identiques → ce nom ; différents → nom composé
 *    dans un ordre stable (ordre lexicographique, indépendant de la vitesse réseau), tronqué,
 *    avec repli sur le premier nom.
 */
import { VISION_AXES, type Passion, type VisionAxes } from '@blowy/domain';
import type { Tuning } from '@blowy/tuning';
import { clamp } from '../shared/index.js';
import { pickIndex, rngFrom } from '../random/index.js';

export interface HeredityInput {
  parents: [VisionAxes, VisionAxes];
  /** Décalages d'axes déduits des réponses de couvaison (somme brute, avant bornage). */
  answerDeltas: Partial<VisionAxes>;
  /** Passions choisies pendant la couvaison (avec répétitions). */
  passionVotes: Passion[];
  seed: string;
}

export interface HeredityResult {
  axes: VisionAxes;
  passion: Passion | null;
  seed: string;
}

export function inherit(i: HeredityInput, t: Tuning): HeredityResult {
  const max = t.egg.heredityMaxDeltaPerAxis;
  const axes = {} as VisionAxes;
  for (const k of VISION_AXES) {
    const mean = (i.parents[0][k] + i.parents[1][k]) / 2;
    axes[k] = clamp(mean + clamp(i.answerDeltas[k] ?? 0, -max, max), -1, 1);
  }
  const counts = new Map<Passion, number>();
  for (const p of i.passionVotes) counts.set(p, (counts.get(p) ?? 0) + 1);
  const best = Math.max(0, ...counts.values());
  const tied = [...counts.entries()].filter(([, c]) => c === best).map(([p]) => p).sort();
  const passion = tied.length ? (tied[pickIndex(rngFrom(i.seed, 'heredity'), tied.length)] ?? null) : null;
  return { axes, passion, seed: i.seed };
}

export function composeBabyName(votes: [string, string], t: Tuning): string {
  const clean = votes.map((v) => v.trim()).filter((v) => v.length > 0);
  const [a, b] = [...new Set(clean)].sort((x, y) => x.localeCompare(y, 'fr'));
  if (!a) return '';
  const composed = b ? `${a}${t.egg.nameSeparator}${b}` : a;
  return composed.length <= t.egg.nameMaxLength ? composed : a.slice(0, t.egg.nameMaxLength);
}
