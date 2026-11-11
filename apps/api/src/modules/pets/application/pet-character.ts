import { Inject, Injectable } from '@nestjs/common';
import { type Day, type Gauges, type PetEventKind, addGauges, dayOf, daysBetween, decayGauges, deltaFor } from '@blowy/domain';
import { type Clock, todayOf } from '../../../shared/clock';
import { DomainError } from '../../../shared/errors';
import { CLOCK, PETS } from '../../../shared/tokens';
import type { PetEventRecord, PetRecord, PetsRepository } from '../ports';

/** Usure rattrapée à la lecture : les jauges retombent vers 0 pour chaque jour écoulé depuis `decayedOn`. */
export function withDecay(pet: PetRecord, today: Day): PetRecord {
  const days = daysBetween(pet.decayedOn, today);
  if (days <= 0) return pet;
  return { ...pet, gauges: decayGauges(pet.gauges, days), decayedOn: today };
}

const sameGauges = (a: Gauges, b: Gauges): boolean => a.social === b.social && a.play === b.play && a.tender === b.tender && a.talk === b.talk;

const sumDeltas = (a: Partial<Gauges>, b: Partial<Gauges>): Partial<Gauges> => {
  const out: Partial<Gauges> = { ...a };
  for (const [k, v] of Object.entries(b) as [keyof Gauges, number][]) out[k] = (out[k] ?? 0) + v;
  return out;
};

export interface ApplyOptions {
  /** Delta ajouté à celui de l'événement (réponse du défi) ou delta complet (3 mots, quiz). */
  extra?: Partial<Gauges>;
  /** Plafond d'événements de ce type par jour ; au-delà, rien ne bouge. */
  maxPerDay?: number;
}

/** Caractère du pet : seule porte d'entrée pour faire bouger ses jauges (utilisée par tous les modules). */
@Injectable()
export class PetCharacter {
  constructor(
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** Pet de la personne, usure appliquée et enregistrée si elle a changé quelque chose. */
  async load(ownerId: string): Promise<PetRecord> {
    const pet = await this.pets.findByOwner(ownerId);
    if (!pet) throw new DomainError('not_onboarded');
    const decayed = withDecay(pet, todayOf(this.clock));
    if (!sameGauges(decayed.gauges, pet.gauges)) await this.pets.save(decayed);
    return decayed;
  }

  /** Applique un événement : usure, puis delta, puis journal. Null si le plafond du jour est atteint. */
  async apply(ownerId: string, kind: PetEventKind, options: ApplyOptions = {}): Promise<PetEventRecord | null> {
    const pet = await this.load(ownerId);
    if (options.maxPerDay !== undefined && (await this.countToday(pet.id, kind)) >= options.maxPerDay) return null;
    const custom = kind === 'three_words' || kind === 'quiz';
    const delta = custom ? (options.extra ?? {}) : sumDeltas(deltaFor(kind), options.extra ?? {});
    const now = this.clock.now();
    await this.pets.save({ ...pet, gauges: addGauges(pet.gauges, delta), decayedOn: dayOf(now) });
    return this.pets.appendEvent({ petId: pet.id, kind, delta, createdAt: now.toISOString() });
  }

  async countToday(petId: string, kind: PetEventKind): Promise<number> {
    const now = this.clock.now();
    const today = dayOf(now);
    // Un jour civil à Paris dure au plus 25 h : on lit 26 h en arrière puis on filtre sur le jour.
    const since = new Date(now.getTime() - 26 * 3600_000).toISOString();
    const events = await this.pets.listEventsSince(petId, kind, since);
    return events.filter((e) => dayOf(new Date(e.createdAt)) === today).length;
  }
}
