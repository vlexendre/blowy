import type { Needs, PetEventKind } from '@blowy/domain';
import type { MemoryDb } from '../../../persistence/memory-db';
import type { PetEventRecord, PetRecord, PetsRepository } from '../ports';

const copy = (p: PetRecord): PetRecord => ({ ...p, gauges: { ...p.gauges }, needs: { ...p.needs }, outfit: { ...p.outfit } });

export class MemoryPetsRepository implements PetsRepository {
  constructor(private readonly db: MemoryDb) {}

  async findByOwner(ownerId: string): Promise<PetRecord | null> {
    for (const p of this.db.pets.values()) if (p.ownerId === ownerId) return copy(p);
    return null;
  }

  async findByOwners(ownerIds: readonly string[]): Promise<PetRecord[]> {
    const wanted = new Set(ownerIds);
    return [...this.db.pets.values()].filter((p) => wanted.has(p.ownerId)).map(copy);
  }

  async create(pet: PetRecord): Promise<void> {
    if ([...this.db.pets.values()].some((p) => p.ownerId === pet.ownerId)) throw new Error('pet déjà existant');
    this.db.pets.set(pet.id, copy(pet));
  }

  async save(pet: PetRecord): Promise<void> {
    const current = this.db.pets.get(pet.id);
    if (!current) throw new Error('pet introuvable');
    // Comme l'adaptateur Supabase : les besoins ne sont pas écrits ici.
    this.db.pets.set(pet.id, copy({ ...pet, needs: current.needs, needsAt: current.needsAt }));
  }

  async saveNeeds(petId: string, needs: Needs, needsAt: string): Promise<void> {
    const current = this.db.pets.get(petId);
    if (!current) throw new Error('pet introuvable');
    this.db.pets.set(petId, copy({ ...current, needs, needsAt }));
  }

  async raiseBestStreak(ownerIds: readonly string[], streak: number): Promise<void> {
    for (const p of this.db.pets.values()) if (ownerIds.includes(p.ownerId) && p.bestStreak < streak) p.bestStreak = streak;
  }

  async appendEvent(event: Omit<PetEventRecord, 'id'>): Promise<PetEventRecord> {
    const row: PetEventRecord = { ...event, id: this.db.nextId(), delta: { ...event.delta } };
    this.db.petEvents.push(row);
    return { ...row };
  }

  async listEvents(petId: string, limit: number): Promise<PetEventRecord[]> {
    return this.db.petEvents
      .filter((e) => e.petId === petId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || Number(b.id) - Number(a.id))
      .slice(0, limit)
      .map((e) => ({ ...e }));
  }

  async listEventsSince(petId: string, kind: PetEventKind, sinceIso: string): Promise<PetEventRecord[]> {
    return this.db.petEvents.filter((e) => e.petId === petId && e.kind === kind && e.createdAt >= sinceIso).map((e) => ({ ...e }));
  }

  async countEvents(petId: string, kind: PetEventKind): Promise<number> {
    return this.db.petEvents.filter((e) => e.petId === petId && e.kind === kind).length;
  }
}
