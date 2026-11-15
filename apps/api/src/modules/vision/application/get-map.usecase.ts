import { Inject, Injectable } from '@nestjs/common';
import { textOf, visionText } from '@blowy/content';
import { BLUR_GRID_METERS, type GeoPoint, MATCH_RADIUS_KM, ZONE_RADIUS_KM, entitlements, snapToGrid } from '@blowy/domain';
import type { Clock } from '../../../shared/clock';
import { DomainError } from '../../../shared/errors';
import { CLOCK, PETS, PROFILES } from '../../../shared/tokens';
import type { Profile, ProfilesRepository } from '../../me/ports';
import { livePet } from '../../pets/application/pet-catch-up';
import type { PetRecord, PetsRepository } from '../../pets/ports';
import { Audience } from '../../safety/application/audience';
import type { CachedMatch } from '../ports';
import { Matchmaker } from './matchmaker';

/** Minimoas montrés au plus sur une carte. */
export const PIN_CAP = 100;
/** Silhouettes floues au plus au-delà de la zone. */
export const BLUR_CAP = 24;
/** Rayon par défaut quand Blowy+ regarde ailleurs. */
export const ELSEWHERE_RADIUS_KM = 10;

export interface MapQueryInput {
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

export interface MapPinResult {
  profile: Profile;
  pet: PetRecord;
  match: CachedMatch;
}

export interface MapResult {
  status: 'ok' | 'no_location';
  scope: 'zone' | 'everywhere';
  center: GeoPoint | null;
  radiusKm: number;
  pins: MapPinResult[];
  beyond: { count: number; blurred: GeoPoint[] };
  discreet: boolean;
  canChangeCity: boolean;
}

/**
 * La carte. Gratuit : sa zone (~1,5 km) autour de son centre, carte fixe ; au-delà, un nombre et des silhouettes
 * floues. Blowy+ : toute la carte (autour de son centre ou d'un point demandé). Positions toujours arrondies et
 * décalées, tirées de la zone du domicile (jamais du dernier relevé). Personnes en mode discret : jamais montrées.
 */
@Injectable()
export class GetMap {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(Audience) private readonly audience: Audience,
    @Inject(Matchmaker) private readonly matchmaker: Matchmaker,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(userId: string, query: MapQueryInput): Promise<MapResult> {
    const profile = await this.profiles.findById(userId);
    if (!profile) throw new DomainError('not_onboarded');
    const me = await this.matchmaker.seeker(profile);
    const can = entitlements(me.plus);
    const elsewhere = query.lat !== undefined && query.lng !== undefined ? { lat: query.lat, lng: query.lng } : null;
    if (elsewhere && !can.mapEverywhere) throw new DomainError('forbidden', textOf(visionText, (t) => t.errors.mapEverywherePlus));
    const base = { scope: can.mapEverywhere ? ('everywhere' as const) : ('zone' as const), discreet: profile.discreet, canChangeCity: can.changeCity };
    if (!me.center) return { ...base, status: 'no_location', center: null, radiusKm: ZONE_RADIUS_KM, pins: [], beyond: { count: 0, blurred: [] } };

    let center = me.center;
    let radiusKm = ZONE_RADIUS_KM;
    let inside: CachedMatch[];
    let outside: CachedMatch[] = [];
    if (can.mapEverywhere) {
      if (elsewhere) {
        center = elsewhere;
        radiusKm = query.radiusKm ?? ELSEWHERE_RADIUS_KM;
        inside = await this.matchmaker.around(me, center, radiusKm, PIN_CAP * 2);
      } else {
        radiusKm = MATCH_RADIUS_KM;
        inside = await this.matchmaker.nearby(me);
      }
    } else {
      const all = await this.matchmaker.nearby(me);
      inside = all.filter((m) => m.distanceKm <= ZONE_RADIUS_KM);
      outside = all.filter((m) => m.distanceKm > ZONE_RADIUS_KM);
    }

    // Relu à chaque fois (Audience) : un passage en mode discret, un blocage, une suspension ou une suppression comptent tout de suite.
    const profiles = await this.audience.visible(userId, [...inside, ...outside].map((m) => m.userId), 'map');
    const visible = new Map(profiles.map((p) => [p.id, p]));
    const shownInside = inside.filter((m) => visible.has(m.userId)).slice(0, PIN_CAP);
    const shownOutside = outside.filter((m) => visible.has(m.userId));

    const now = this.clock.now();
    const pets = new Map((await this.pets.findByOwners(shownInside.map((m) => m.userId))).map((p) => [p.ownerId, livePet(p, now)]));
    const pins = shownInside.flatMap((m): MapPinResult[] => {
      const p = visible.get(m.userId);
      const pet = pets.get(m.userId);
      return p && pet ? [{ profile: p, pet, match: m }] : [];
    });

    const blurred = new Map<string, GeoPoint>();
    for (const m of shownOutside) {
      if (blurred.size >= BLUR_CAP) break;
      const cell = snapToGrid(m.shown, BLUR_GRID_METERS);
      blurred.set(`${cell.lat},${cell.lng}`, cell);
    }
    return { ...base, status: 'ok', center, radiusKm, pins, beyond: { count: shownOutside.length, blurred: [...blurred.values()] } };
  }
}
