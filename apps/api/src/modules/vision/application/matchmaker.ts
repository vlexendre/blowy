import { Inject, Injectable } from '@nestjs/common';
import {
  type Compatibility,
  EMPTY_VISION,
  type GeoPoint,
  MATCH_RADIUS_KM,
  type MatchPerson,
  type VisionProfile,
  compatibilityOf,
  distanceKm,
  entitlements,
  isMatchable,
  match,
  matchingCenter,
  cellsAround,
  shownPosition,
} from '@blowy/domain';
import { type Clock, todayOf } from '../../../shared/clock';
import { CLOCK, PROFILES } from '../../../shared/tokens';
import { hasPlus } from '../../me/application/plus';
import type { Profile, ProfilesRepository } from '../../me/ports';
import type { CachedMatch, MatchCacheRepository, PlaceRecord, PlacesRepository, VisionStore } from '../ports';
import { MATCH_CACHE, PLACES, VISION_STORE } from '../tokens';
import { VisionRecorder } from './vision-recorder';

/** Positions lues au plus par recherche (les plus récemment actives d'abord) : le coût ne dépend pas du nombre d'inscrits. */
export const CANDIDATE_CAP = 500;
/** Personnes compatibles gardées en cache par personne et par jour. */
export const CACHE_CAP = 200;

/** La personne qui cherche, telle que l'appariement la voit. */
export interface Seeker {
  profile: Profile;
  place: PlaceRecord | null;
  vision: VisionProfile;
  /** Test de vision passé : sans lui, ni suggestions ni carte (et personne ne te voit). */
  testDone: boolean;
  plus: boolean;
  /** Centre de recherche (ville choisie avec Minimoa+, sinon zone du domicile) ; null sans position. */
  center: GeoPoint | null;
}

const asPerson = (profile: Profile, vision: VisionProfile): MatchPerson => ({
  id: profile.id,
  birthdate: profile.birthdate,
  vision,
});

const toCached = (userId: string, c: Compatibility, d: number, home: GeoPoint): CachedMatch => ({
  userId,
  score: c.score,
  common: c.common.map((p) => ({ axis: p.axis, side: p.side, leans: p.leans })),
  explore: { ...c.explore },
  distanceKm: Math.round(d * 100) / 100,
  // Graine = identifiant : la même position décalée pour tout le monde, donc rien à moyenner.
  shown: shownPosition(home, userId),
});

const centerKey = (c: GeoPoint): string => `${c.lat.toFixed(4)},${c.lng.toFixed(4)}`;

/**
 * Qui le minimoa peut présenter. Pour tenir à 1 M de personnes : pré-filtre géographique sur un index
 * (mailles de 0,1° autour du centre), au plus CANDIDATE_CAP positions lues, résultat gardé un jour.
 * Les blocages, liens et refus sont appliqués à la lecture (ils changent souvent et coûtent peu).
 */
@Injectable()
export class Matchmaker {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(PLACES) private readonly places: PlacesRepository,
    @Inject(VISION_STORE) private readonly store: VisionStore,
    @Inject(MATCH_CACHE) private readonly cache: MatchCacheRepository,
    @Inject(VisionRecorder) private readonly recorder: VisionRecorder,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async seeker(profile: Profile): Promise<Seeker> {
    const [place, snapshot] = await Promise.all([this.places.find(profile.id), this.recorder.current(profile.id)]);
    const plus = hasPlus(profile, this.clock.now());
    const usable = place && profile.locationConsentAt ? place : null;
    return { profile, place: usable, vision: snapshot.profile, testDone: snapshot.testDone, plus, center: usable ? matchingCenter(usable.home, usable.chosenCity, entitlements(plus).changeCity) : null };
  }

  /** Personnes compatibles autour du centre de recherche (MATCH_RADIUS_KM), du plus au moins compatible. Gardé un jour. */
  async nearby(me: Seeker): Promise<CachedMatch[]> {
    if (!me.center || !me.testDone || !isMatchable(me.vision)) return [];
    const day = todayOf(this.clock);
    const key = centerKey(me.center);
    const cached = await this.cache.get(me.profile.id);
    // Une entrée écrite avant l'ajout des repères (`leans`) est refaite : sinon les repères manqueraient jusqu'à demain.
    const complete = (m: CachedMatch): boolean => !!m.explore.leans && m.common.every((p) => !!p.leans);
    if (cached && cached.day === day && cached.centerKey === key && cached.matches.every(complete)) return cached.matches;
    const matches = await this.around(me, me.center, MATCH_RADIUS_KM, CACHE_CAP);
    await this.cache.put(me.profile.id, { day, centerKey: key, matches });
    return matches;
  }

  /** Personnes compatibles autour d'un point quelconque (carte de Minimoa+), sans cache. */
  async around(me: Seeker, center: GeoPoint, radiusKm: number, cap: number): Promise<CachedMatch[]> {
    if (!me.testDone || !isMatchable(me.vision)) return [];
    const places = await this.places.listInCells(cellsAround(center, radiusKm), CANDIDATE_CAP, me.profile.id);
    const ids = places.map((p) => p.userId);
    const [profiles, snapshots] = await Promise.all([this.profiles.findByIds(ids), this.store.findSnapshots(ids)]);
    const profileById = new Map(profiles.map((p) => [p.id, p]));
    // Seulement les personnes qui ont passé le test.
    const visionById = new Map(snapshots.filter((s) => s.testDone).map((s) => [s.userId, s.profile]));
    const today = todayOf(this.clock);
    const mePerson = asPerson(me.profile, me.vision);
    const out: CachedMatch[] = [];
    for (const place of places) {
      const other = profileById.get(place.userId);
      if (!other?.locationConsentAt) continue;
      const d = distanceKm(center, place.home);
      const c = match(mePerson, asPerson(other, visionById.get(place.userId) ?? EMPTY_VISION), { today, blocked: new Set(), distanceKm: d, radiusKm });
      if (c) out.push(toCached(place.userId, c, d, place.home));
    }
    return out.sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm || a.userId.localeCompare(b.userId)).slice(0, cap);
  }

  /** Appariement sans filtre de zone (amis d'amis) : seulement celles et ceux qui passent les filtres et le seuil. */
  async matchAmong(me: Seeker, others: readonly Profile[]): Promise<Map<string, Compatibility>> {
    const out = new Map<string, Compatibility>();
    if (others.length === 0 || !me.testDone || !isMatchable(me.vision)) return out;
    const snapshots = await this.store.findSnapshots(others.map((p) => p.id));
    const visionById = new Map(snapshots.filter((s) => s.testDone).map((s) => [s.userId, s.profile]));
    const today = todayOf(this.clock);
    const mePerson = asPerson(me.profile, me.vision);
    for (const other of others) {
      const c = match(mePerson, asPerson(other, visionById.get(other.id) ?? EMPTY_VISION), { today, blocked: new Set(), distanceKm: null, radiusKm: null });
      if (c) out.set(other.id, c);
    }
    return out;
  }

  /**
   * Explication pour quelqu'un qui t'a salué (il est passé par ses propres filtres) : sans seuil ;
   * null si l'une des deux visions est trop peu connue.
   */
  async explainFor(me: Seeker, others: readonly Profile[]): Promise<Map<string, Compatibility>> {
    const out = new Map<string, Compatibility>();
    if (others.length === 0 || !isMatchable(me.vision)) return out;
    const snapshots = await this.store.findSnapshots(others.map((p) => p.id));
    const visionById = new Map(snapshots.map((s) => [s.userId, s.profile]));
    for (const other of others) {
      const vision = visionById.get(other.id);
      if (!vision || !isMatchable(vision)) continue;
      out.set(other.id, compatibilityOf(me.vision, vision));
    }
    return out;
  }
}
