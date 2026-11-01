/** Domaine pets : invariants de création et conversions de vision (aucune règle de jeu ici). */
import { FREE_SPECIES, type EntitlementKey, type Species, type Vision } from '@blowy/domain';

export const VISION_SCALE = 1000;

export function requiresPremium(species: Species): boolean {
  return !FREE_SPECIES.includes(species);
}

export function canAdopt(species: Species, entitlements: ReadonlySet<EntitlementKey>): boolean {
  return !requiresPremium(species) || entitlements.has('PLUS_PREMIUM_SPECIES');
}

export interface StoredVision {
  kindMischief: number;
  sportyContemplative: number;
  scienceArt: number;
  homeAdventure: number;
  school: string;
  sunday: string;
  passions: string[];
  limit: string;
}

export function visionToStored(v: Vision): StoredVision {
  const q = (x: number) => Math.round(Math.max(-1, Math.min(1, x)) * VISION_SCALE);
  return {
    kindMischief: q(v.axes.kindMischief),
    sportyContemplative: q(v.axes.sportyContemplative),
    scienceArt: q(v.axes.scienceArt),
    homeAdventure: q(v.axes.homeAdventure),
    school: v.school,
    sunday: v.sunday,
    passions: [...new Set(v.passions)],
    limit: v.limit,
  };
}

export function storedToVision(s: StoredVision): Vision {
  return {
    axes: {
      kindMischief: s.kindMischief / VISION_SCALE,
      sportyContemplative: s.sportyContemplative / VISION_SCALE,
      scienceArt: s.scienceArt / VISION_SCALE,
      homeAdventure: s.homeAdventure / VISION_SCALE,
    },
    school: s.school as Vision['school'],
    sunday: s.sunday as Vision['sunday'],
    passions: s.passions as Vision['passions'],
    limit: s.limit as Vision['limit'],
  };
}
