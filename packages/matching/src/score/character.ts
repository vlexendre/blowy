/** C : ressemblance (1−|x−y|/2) sur sportif/contemplatif et casanier/aventurier, complémentarité (1−|x+y|/2) sur gentil/espiègle et scientifique/artiste. */
import type { VisionAxes } from '@blowy/domain';
import { clamp01 } from '@blowy/tuning';

const similarity = (x: number, y: number): number => clamp01(1 - Math.abs(x - y) / 2);
const complementarity = (x: number, y: number): number => clamp01(1 - Math.abs(x + y) / 2);

export function characterScore(a: VisionAxes, b: VisionAxes): number {
  return (similarity(a.sportyContemplative, b.sportyContemplative) + similarity(a.homeAdventure, b.homeAdventure) + complementarity(a.kindMischief, b.kindMischief) + complementarity(a.scienceArt, b.scienceArt)) / 4;
}
