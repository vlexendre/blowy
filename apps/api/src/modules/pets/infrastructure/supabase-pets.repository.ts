import type { Gauges, PetEventKind, Species } from '@blowy/domain';
import type { Db } from '../../../persistence/database.types';
import { check, iso } from '../../../persistence/supabase';
import type { PetEventRecord, PetRecord, PetsRepository } from '../ports';

interface PetRow {
  id: string;
  owner_id: string;
  name: string;
  species: Species;
  social: number;
  play: number;
  tender: number;
  talk: number;
  decayed_on: string;
  created_at: string;
}

interface PetEventRow {
  id: number;
  pet_id: string;
  kind: PetEventKind;
  delta: Partial<Gauges>;
  created_at: string;
}

const fromRow = (r: PetRow): PetRecord => ({
  id: r.id,
  ownerId: r.owner_id,
  name: r.name,
  species: r.species,
  gauges: { social: r.social, play: r.play, tender: r.tender, talk: r.talk },
  decayedOn: r.decayed_on,
  createdAt: iso(r.created_at),
});

const eventFromRow = (r: PetEventRow): PetEventRecord => ({
  id: String(r.id),
  petId: r.pet_id,
  kind: r.kind,
  delta: r.delta,
  createdAt: iso(r.created_at),
});

export class SupabasePetsRepository implements PetsRepository {
  constructor(private readonly client: Db) {}

  async findByOwner(ownerId: string): Promise<PetRecord | null> {
    const { data, error } = await this.client.from('pets').select('*').eq('owner_id', ownerId).maybeSingle();
    check(error, 'lecture du pet');
    return data ? fromRow(data as PetRow) : null;
  }

  async findByOwners(ownerIds: readonly string[]): Promise<PetRecord[]> {
    if (ownerIds.length === 0) return [];
    const { data, error } = await this.client.from('pets').select('*').in('owner_id', [...ownerIds]);
    check(error, 'lecture des pets');
    return (data as PetRow[]).map(fromRow);
  }

  async create(pet: PetRecord): Promise<void> {
    const { error } = await this.client.from('pets').insert({ ...this.toRow(pet), id: pet.id, owner_id: pet.ownerId, created_at: pet.createdAt });
    check(error, 'création du pet');
  }

  async save(pet: PetRecord): Promise<void> {
    const { error } = await this.client.from('pets').update(this.toRow(pet)).eq('id', pet.id);
    check(error, 'enregistrement du pet');
  }

  async appendEvent(event: Omit<PetEventRecord, 'id'>): Promise<PetEventRecord> {
    const { data, error } = await this.client
      .from('pet_events')
      .insert({ pet_id: event.petId, kind: event.kind, delta: event.delta, created_at: event.createdAt })
      .select('*')
      .single();
    check(error, "ajout d'un événement du pet");
    return eventFromRow(data as PetEventRow);
  }

  async listEvents(petId: string, limit: number): Promise<PetEventRecord[]> {
    const { data, error } = await this.client
      .from('pet_events')
      .select('*')
      .eq('pet_id', petId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit);
    check(error, 'lecture des événements du pet');
    return (data as PetEventRow[]).map(eventFromRow);
  }

  async listEventsSince(petId: string, kind: PetEventKind, sinceIso: string): Promise<PetEventRecord[]> {
    const { data, error } = await this.client.from('pet_events').select('*').eq('pet_id', petId).eq('kind', kind).gte('created_at', sinceIso);
    check(error, 'lecture des événements du pet');
    return (data as PetEventRow[]).map(eventFromRow);
  }

  private toRow(pet: PetRecord) {
    return { name: pet.name, species: pet.species, ...pet.gauges, decayed_on: pet.decayedOn };
  }
}
