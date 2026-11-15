import { Inject, Injectable } from '@nestjs/common';
import { textOf, visionText } from '@blowy/content';
import { type GeoPoint, cellOf, entitlements, isAwayFromHome, updateHome } from '@blowy/domain';
import type { Clock } from '../../../shared/clock';
import { DomainError } from '../../../shared/errors';
import { CLOCK, PROFILES } from '../../../shared/tokens';
import { hasPlus } from '../../me/application/plus';
import type { Profile, ProfilesRepository } from '../../me/ports';
import type { ChosenCityRecord, MatchCacheRepository, PlaceRecord, PlacesRepository } from '../ports';
import { MATCH_CACHE, PLACES } from '../tokens';

export interface LocationState {
  profile: Profile;
  place: PlaceRecord | null;
  plus: boolean;
}

/**
 * Position (app ouverte seulement), zone du domicile et ville choisie (Blowy+).
 * Rien n'est enregistré sans accord explicite ; retirer l'accord efface la position.
 */
@Injectable()
export class Locations {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(PLACES) private readonly places: PlacesRepository,
    @Inject(MATCH_CACHE) private readonly cache: MatchCacheRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async state(userId: string): Promise<LocationState> {
    const profile = await this.profiles.findById(userId);
    if (!profile) throw new DomainError('not_onboarded');
    return { profile, place: await this.places.find(userId), plus: hasPlus(profile, this.clock.now()) };
  }

  /** Nouveau relevé. `consent` : accord donné à cet instant (obligatoire la première fois). */
  async record(userId: string, point: GeoPoint, consent = false): Promise<LocationState> {
    let { profile } = await this.state(userId);
    const now = this.clock.now().toISOString();
    if (!profile.locationConsentAt) {
      if (!consent) throw new DomainError('forbidden', textOf(visionText, (t) => t.errors.locationConsent));
      profile = await this.profiles.update(userId, { locationConsentAt: now });
    }
    const before = await this.places.find(userId);
    const home = updateHome(before ? { home: before.home, candidate: before.candidate, candidateSince: before.candidateSince } : { home: null, candidate: null, candidateSince: null }, point, now);
    if (!home.home) throw new Error('zone du domicile non calculée');
    const place: PlaceRecord = {
      userId,
      last: { lat: point.lat, lng: point.lng },
      locatedAt: now,
      lastAwayAt: isAwayFromHome(home.home, point) ? now : (before?.lastAwayAt ?? null),
      home: home.home,
      homeCell: cellOf(home.home),
      candidate: home.candidate,
      candidateSince: home.candidateSince,
      chosenCity: before?.chosenCity ?? null,
    };
    await this.places.save(place);
    if (!before || before.home.lat !== place.home.lat || before.home.lng !== place.home.lng) await this.cache.clear(userId);
    return { profile, place, plus: hasPlus(profile, this.clock.now()) };
  }

  /** Oublier la position et retirer l'accord : plus de carte ni de rencontres proches. */
  async forget(userId: string): Promise<LocationState> {
    await this.state(userId);
    await this.places.remove(userId);
    const profile = await this.profiles.update(userId, { locationConsentAt: null });
    await this.cache.clear(userId);
    return { profile, place: null, plus: hasPlus(profile, this.clock.now()) };
  }

  /** Changer de ville (Blowy+) : déplace le centre des rencontres, pas la zone montrée aux autres. */
  async chooseCity(userId: string, city: ChosenCityRecord): Promise<LocationState> {
    const s = await this.state(userId);
    if (!entitlements(s.plus).changeCity) throw new DomainError('forbidden', textOf(visionText, (t) => t.errors.changeCityPlus));
    if (!s.place) throw new DomainError('invalid', textOf(visionText, (t) => t.errors.locationConsent));
    const place: PlaceRecord = { ...s.place, chosenCity: { label: city.label, lat: city.lat, lng: city.lng } };
    await this.places.save(place);
    await this.cache.clear(userId);
    return { ...s, place };
  }

  async clearCity(userId: string): Promise<LocationState> {
    const s = await this.state(userId);
    if (!s.place?.chosenCity) return s;
    const place: PlaceRecord = { ...s.place, chosenCity: null };
    await this.places.save(place);
    await this.cache.clear(userId);
    return { ...s, place };
  }
}
