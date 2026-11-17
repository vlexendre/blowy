import { Inject, Injectable } from '@nestjs/common';
import { auditText, formatDate, textOf, visionText } from '@blowy/content';
import { type GeoPoint, NO_HOME, cellOf, entitlements, isAwayFromHome, isHomeSettling, manualAreaChange, storedPoint, updateHome } from '@blowy/domain';
import { ReviewPlaces } from '../../../review/review-places';
import { type Clock, todayOf } from '../../../shared/clock';
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
 * Position (app ouverte seulement), zone du domicile, zone choisie à la main sans localisation (gratuit) et ville
 * choisie (Minimoa+). Rien n'est enregistré sans accord explicite ; retirer l'accord efface la position.
 * Confidentialité : un relevé n'est jamais enregistré plus précis que la maille de ~300 m (`storedPoint`) ; le point
 * exact sert seulement, en mémoire et pendant la requête, à savoir si la personne est hors de sa zone (sortie).
 */
@Injectable()
export class Locations {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(PLACES) private readonly places: PlacesRepository,
    @Inject(MATCH_CACHE) private readonly cache: MatchCacheRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ReviewPlaces) private readonly review: ReviewPlaces,
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
    const stored = await this.places.find(userId);
    // Une zone choisie à la main cède la place au premier vrai relevé (la zone repart de la position).
    const before = stored?.source === 'manual' ? null : stored;
    // Premiers jours après l'accord : la zone se cale vite sur les vrais relevés (le premier, pris à l'inscription ou en
    // cache dans le téléphone, peut être ailleurs). Ensuite, elle ne déménage qu'après 72 h ailleurs.
    const settling = isHomeSettling(profile.locationConsentAt, now);
    const home = updateHome(before ? { home: before.home, candidate: before.candidate, candidateSince: before.candidateSince } : NO_HOME, point, now, settling);
    if (!home.home) throw new Error('zone du domicile non calculée');
    const place: PlaceRecord = {
      userId,
      // Jamais le point exact : le centre de sa maille de ~300 m.
      last: storedPoint(point),
      locatedAt: now,
      // Sortie : décidée ici avec le point exact, qui n'est pas gardé.
      lastAwayAt: isAwayFromHome(home.home, point) ? now : (before?.lastAwayAt ?? null),
      home: home.home,
      homeCell: cellOf(home.home),
      candidate: home.candidate,
      candidateSince: home.candidateSince,
      chosenCity: stored?.chosenCity ?? null,
      source: 'gps',
      manualArea: null,
    };
    await this.places.save(place);
    const moved = !stored || stored.home.lat !== place.home.lat || stored.home.lng !== place.home.lng;
    if (moved) {
      await this.cache.clear(userId);
      await this.review.follow(userId, place.home);
    }
    return { profile, place, plus: hasPlus(profile, this.clock.now()) };
  }

  /**
   * Zone choisie à la main, sans localisation (gratuit) : une ville de la liste devient le centre des rencontres et de
   * la carte. Gratuit : une fois tous les 30 jours ; Minimoa+ : quand on veut. Choisir une zone vaut accord pour qu'elle
   * serve (la position du téléphone n'est pas demandée). Refusé si la zone vient déjà du téléphone.
   */
  async chooseArea(userId: string, city: ChosenCityRecord): Promise<LocationState> {
    let { profile, place: before, plus } = await this.state(userId);
    if (before && (before.source ?? 'gps') === 'gps' && profile.locationConsentAt) throw new DomainError('conflict', textOf(auditText, (t) => t.area.fromPhone));
    const today = todayOf(this.clock);
    const home = storedPoint({ lat: city.lat, lng: city.lng });
    // Re-choisir la même ville : rien ne change (et l'attente de 30 jours ne repart pas).
    if (before?.source === 'manual' && before.manualArea?.label === city.label && before.home.lat === home.lat && before.home.lng === home.lng && profile.locationConsentAt) {
      return { profile, place: before, plus };
    }
    const change = manualAreaChange({ setOn: before?.manualArea?.setOn ?? null, today, anytime: entitlements(plus).changeCity });
    if (!change.allowed && change.nextOn) {
      const nextOn = change.nextOn;
      throw new DomainError('forbidden', (l) => auditText.in(l).area.changeLocked(formatDate(l, nextOn, { day: 'numeric', month: 'long' })));
    }
    const now = this.clock.now().toISOString();
    if (!profile.locationConsentAt) profile = await this.profiles.update(userId, { locationConsentAt: now });
    const place: PlaceRecord = {
      userId,
      last: home,
      locatedAt: now,
      lastAwayAt: null,
      home,
      homeCell: cellOf(home),
      candidate: null,
      candidateSince: null,
      chosenCity: before?.chosenCity ?? null,
      source: 'manual',
      manualArea: { label: city.label, setOn: today },
    };
    await this.places.save(place);
    await this.cache.clear(userId);
    await this.review.follow(userId, home);
    return { profile, place, plus };
  }

  /** Oublier la position et retirer l'accord : plus de carte ni de rencontres proches. */
  async forget(userId: string): Promise<LocationState> {
    await this.state(userId);
    await this.places.remove(userId);
    const profile = await this.profiles.update(userId, { locationConsentAt: null });
    await this.cache.clear(userId);
    return { profile, place: null, plus: hasPlus(profile, this.clock.now()) };
  }

  /** Changer de ville (Minimoa+) : déplace le centre des rencontres, pas la zone montrée aux autres. */
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
