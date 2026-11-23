import { Inject, Injectable } from '@nestjs/common';
import { textOf, visionText } from '@blowy/content';
import { BLUR_GRID_METERS, type GeoPoint, MATCH_RADIUS_KM, ZONE_RADIUS_KM, dayOf, entitlements, farSummary, snapToGrid } from '@blowy/domain';
import type { Clock } from '../../../shared/clock';
import { DomainError } from '../../../shared/errors';
import { CLOCK, ENCOUNTERS, LINKS, PETS, PROFILES } from '../../../shared/tokens';
import { RITUAL_STATES } from '../../rituels/tokens';
import type { RitualStatesRepository } from '../../rituels/ports';
import type { EncountersRepository } from '../../encounters/ports';
import type { LinksRepository } from '../../links/ports';
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
/** Rayon par défaut quand Minimoa+ regarde ailleurs. */
export const ELSEWHERE_RADIUS_KM = 10;

export interface MapQueryInput {
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

/** Où vous en êtes : rien · tu as salué · on t'a salué (avec la rencontre à accepter). */
export type PinRelation = { kind: 'none' } | { kind: 'waved' } | { kind: 'waved_you'; encounterId: string };

export interface MapPinResult {
  profile: Profile;
  pet: PetRecord;
  match: CachedMatch;
  relation: PinRelation;
  /** Venu dans l'app aujourd'hui (pastille verte, jamais l'heure). */
  activeToday: boolean;
  /**
   * Photo : jamais sur la carte, ni nette ni floue (docs/ADA-2027.md, décision 7 : visages cachés pour tout le monde,
   * gratuit ou Minimoa+, jusqu'au lien noué ; les liens n'ont pas d'épingle). Le flou ne peut pas se faire sur le
   * téléphone (l'URL nette partirait quand même) et l'API ne transforme pas d'images : aucune URL n'est donc signée.
   */
  clearFace: false;
}

export interface MapResult {
  status: 'ok' | 'no_location';
  scope: 'zone' | 'everywhere';
  center: GeoPoint | null;
  radiusKm: number;
  pins: MapPinResult[];
  /** Au-delà de la zone (gratuit) : vraies personnes compatibles, dont `strong` à 85 % ou plus ; positions grossières. */
  beyond: { count: number; strong: number; blurred: GeoPoint[] };
  discreet: boolean;
  canChangeCity: boolean;
}

/**
 * La carte. Gratuit : sa zone (~1,5 km) autour de son centre, carte fixe ; au-delà, un nombre et des silhouettes
 * floues. Minimoa+ : toute la carte (autour de son centre ou d'un point demandé). Positions toujours arrondies et
 * décalées, tirées de la zone du domicile (jamais du dernier relevé). Personnes en mode discret : jamais montrées.
 * Mêmes règles que les rencontres : une personne déjà liée (lien vivant, fantôme ou archivé) ou dont un coucou a été
 * refusé (dans un sens ou dans l'autre) n'apparaît pas, ni en repère ni dans les silhouettes ; un coucou en attente
 * est dit sur le repère (`waved`, `waved_you`).
 */
@Injectable()
export class GetMap {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(Audience) private readonly audience: Audience,
    @Inject(Matchmaker) private readonly matchmaker: Matchmaker,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(ENCOUNTERS) private readonly encounters: EncountersRepository,
    @Inject(RITUAL_STATES) private readonly states: RitualStatesRepository,
  ) {}

  /** Liens et coucous de la personne : qui écarter de la carte, et où en est chaque coucou en attente. */
  private async relations(userId: string): Promise<{ excluded: Set<string>; relationOf: (id: string) => PinRelation }> {
    const [links, involved] = await Promise.all([this.links.listForUsers([userId]), this.encounters.listInvolving(userId)]);
    const otherOf = (a: string, b: string): string => (a === userId ? b : a);
    const excluded = new Set<string>([...links.map((l) => otherOf(l.userA, l.userB))]);
    for (const e of involved) if (e.status === 'declined') excluded.add(otherOf(e.fromUser, e.toUser));
    const waved = new Set(involved.filter((e) => e.status === 'waved' && e.fromUser === userId).map((e) => e.toUser));
    const wavedYou = new Map(involved.filter((e) => e.status === 'waved' && e.toUser === userId).map((e) => [e.fromUser, e.id]));
    const relationOf = (id: string): PinRelation => {
      const encounterId = wavedYou.get(id);
      if (encounterId) return { kind: 'waved_you', encounterId };
      return waved.has(id) ? { kind: 'waved' } : { kind: 'none' };
    };
    return { excluded, relationOf };
  }

  async execute(userId: string, query: MapQueryInput): Promise<MapResult> {
    const profile = await this.profiles.findById(userId);
    if (!profile) throw new DomainError('not_onboarded');
    const me = await this.matchmaker.seeker(profile);
    const can = entitlements(me.plus);
    const elsewhere = query.lat !== undefined && query.lng !== undefined ? { lat: query.lat, lng: query.lng } : null;
    if (elsewhere && !can.mapEverywhere) throw new DomainError('forbidden', textOf(visionText, (t) => t.errors.mapEverywherePlus));
    const base = { scope: can.mapEverywhere ? ('everywhere' as const) : ('zone' as const), discreet: profile.discreet, canChangeCity: can.changeCity };
    if (!me.center) return { ...base, status: 'no_location', center: null, radiusKm: ZONE_RADIUS_KM, pins: [], beyond: { count: 0, strong: 0, blurred: [] } };

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
    // Liens et refus aussi (mêmes règles que les rencontres).
    const { excluded, relationOf } = await this.relations(userId);
    inside = inside.filter((m) => !excluded.has(m.userId));
    outside = outside.filter((m) => !excluded.has(m.userId));
    const profiles = await this.audience.visible(userId, [...inside, ...outside].map((m) => m.userId), 'map');
    const visible = new Map(profiles.map((p) => [p.id, p]));
    const shownInside = inside.filter((m) => visible.has(m.userId)).slice(0, PIN_CAP);
    const shownOutside = outside.filter((m) => visible.has(m.userId));

    const now = this.clock.now();
    const pets = new Map((await this.pets.findByOwners(shownInside.map((m) => m.userId))).map((p) => [p.ownerId, livePet(p, now)]));
    const today = dayOf(now);
    const seen = new Map((await this.states.findMany(shownInside.map((m) => m.userId))).map((s) => [s.userId, s.lastSeenOn]));
    const pins = shownInside.flatMap((m): MapPinResult[] => {
      const p = visible.get(m.userId);
      const pet = pets.get(m.userId);
      return p && pet ? [{ profile: p, pet, match: m, relation: relationOf(m.userId), activeToday: seen.get(m.userId) === today, clearFace: false }] : [];
    });

    const blurred = new Map<string, GeoPoint>();
    for (const m of shownOutside) {
      if (blurred.size >= BLUR_CAP) break;
      const cell = snapToGrid(m.shown, BLUR_GRID_METERS);
      blurred.set(`${cell.lat},${cell.lng}`, cell);
    }
    return { ...base, status: 'ok', center, radiusKm, pins, beyond: { count: shownOutside.length, strong: farSummary(shownOutside.map((m) => m.score)).strong, blurred: [...blurred.values()] } };
  }
}
