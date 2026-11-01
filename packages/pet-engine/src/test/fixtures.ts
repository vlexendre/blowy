/** Fixtures de test partagées (aucune logique métier ici). */
import { DEFAULT_TUNING } from '@blowy/tuning';
import { daysFromCivil } from '../time/index.js';
import { createPet, createRelationship, emptyWorld } from '../factory.js';
import { ENGINE_VERSION, type EngineContext, type World } from '../model/index.js';
import type { Species } from '@blowy/domain';

export const T = DEFAULT_TUNING;
export const TZ = 'Europe/Paris';
export const HOUR = 3_600_000;
export const utc = (y: number, m: number, d: number, h = 0, min = 0): number => daysFromCivil(y, m, d) * 86_400_000 + h * HOUR + min * 60_000;
export const ctxAt = (now: number, seed = 'seed-test'): EngineContext => ({ now, seed, engineVersion: ENGINE_VERSION, tuning: T });
export const NEUTRAL = { kindMischief: 0, sportyContemplative: 0, scienceArt: 0, homeAdventure: 0 };

export function pairWorld(nowMs: number, opts: { species?: [Species, Species]; affinity?: number; together?: boolean; level?: number } = {}): World {
  const w = emptyWorld();
  const [sa, sb] = opts.species ?? ['NINO', 'SUZIE'];
  w.pets.a = createPet({ id: 'a', species: sa, axes: NEUTRAL, tz: TZ, nowMs }, T);
  w.pets.b = createPet({ id: 'b', species: sb, axes: NEUTRAL, tz: TZ, nowMs }, T);
  const rel = createRelationship({ id: 'r', petIds: ['a', 'b'], tz: TZ, affinity: opts.affinity ?? 50, nowMs }, T);
  w.relationships.r = rel;
  if (opts.together ?? true) {
    w.pets.a.location = { ...rel.spot };
    w.pets.b.location = { ...rel.spot };
  }
  if (opts.level && opts.level >= 2) {
    rel.xpMilli = T.link.levelThresholds[opts.level - 1]! * 1000;
    rel.reachedLevel = opts.level as 2;
  }
  return w;
}
