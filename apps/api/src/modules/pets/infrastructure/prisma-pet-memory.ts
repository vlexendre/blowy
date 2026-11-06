/**
 * Souvenirs V5 (spec-v5 §2.13, §5.2) : le moteur pur `reduceV5` décide (XP, stade, accessoires,
 * paliers « parole tenue ») ; cet adaptateur persiste l'état V5, le souvenir (append-only, unique par
 * `dedupKey`) et les accessoires gagnés. Un pet jamais migré est migré à la volée (HATCHED compté).
 * Idempotent : un `dedupKey` déjà présent ne rejoue rien.
 */
import { memoryDedupKey, type PetMemoryKind } from '@blowy/domain';
import { uuidv7 } from '@blowy/database';
import { ENGINE_VERSION_V5, migratePetV4ToV5, reduceV5, type PetStateV5 } from '@blowy/pet-engine';
import type { Tuning } from '@blowy/tuning';
import type { MemoryInput, MemoryOutcome, PetMemoryPort } from '../../../shared/application/ports/pet-memory.port.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { txOf } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';

export class PrismaPetMemory implements PetMemoryPort {
  constructor(private readonly tuning: Tuning) {}

  async primaryPetIds(scope: TxScope, userIds: string[]) {
    const rows = await txOf(scope).pet.findMany({ where: { primaryOwnerId: { in: userIds } }, select: { id: true, primaryOwnerId: true } });
    return new Map(rows.map((r) => [r.primaryOwnerId!, r.id]));
  }

  async record(scope: TxScope, input: MemoryInput): Promise<MemoryOutcome | null> {
    const tx = txOf(scope);
    const pet = await tx.pet.findUnique({ where: { primaryOwnerId: input.userId }, include: { state: true } });
    if (!pet) return null;
    let state = (pet.state?.engineStateV5 as PetStateV5 | null | undefined) ?? null;
    if (!state) {
      state = migratePetV4ToV5({ id: pet.id, species: pet.species, stage: pet.stage, xpMilli: pet.petXpMilli });
      await this.insertMemory(scope, pet.id, 'HATCHED', 'Pet', pet.id, { species: pet.species }, pet.createdAt);
    }
    const out = await this.apply(scope, pet.id, state, input);
    if (!pet.state) return out.outcome;
    await tx.petState.update({ where: { petId: pet.id }, data: { engineStateV5: out.state as object, version: { increment: 1 } } });
    await tx.pet.update({ where: { id: pet.id }, data: { stage: out.state.stage, version: { increment: 1 } } });
    return out.outcome;
  }

  private async apply(scope: TxScope, petId: string, state: PetStateV5, input: MemoryInput): Promise<{ state: PetStateV5; outcome: MemoryOutcome }> {
    const tx = txOf(scope);
    const dedupKey = memoryDedupKey(input.kind, input.refId, petId);
    const outcome: MemoryOutcome = { petId, added: false, memoryId: null, stage: state.stage, accessoriesUnlocked: [], milestones: [] };
    const existing = await tx.petMemory.findUnique({ where: { dedupKey }, select: { id: true } });
    if (existing) return { state, outcome: { ...outcome, memoryId: existing.id } };
    const ctx = { now: scope.now.getTime(), seed: petId, engineVersion: ENGINE_VERSION_V5, tuning: this.tuning };
    const r = reduceV5(state, { type: 'MEMORY_RECORDED', eventId: dedupKey, petId, memoryKind: input.kind, refId: input.refId, ...(input.attended ? { attended: true } : {}) }, ctx);
    let next = r.state;
    outcome.memoryId = await this.insertMemory(scope, petId, input.kind, input.refType, input.refId, input.data, scope.now);
    outcome.added = true;
    for (const e of r.effects) {
      if (e.type === 'ACCESSORY_UNLOCKED') {
        await tx.petAccessory.upsert({ where: { petId_accessoryId: { petId, accessoryId: e.accessoryId } }, create: { petId, accessoryId: e.accessoryId, source: e.source, unlockedAt: scope.now }, update: {} });
        outcome.accessoriesUnlocked.push(e.accessoryId);
      }
      if (e.type === 'MILESTONE_REACHED') outcome.milestones.push(e.n);
    }
    // Palier « parole tenue » : souvenir dédié (revient au moteur comme MEMORY_RECORDED).
    for (const n of outcome.milestones) {
      const sub = await this.apply(scope, petId, next, { userId: input.userId, kind: 'PROMISE_KEPT', refType: 'Milestone', refId: uuidFromMilestone(petId, n), data: { n } });
      next = sub.state;
      outcome.accessoriesUnlocked.push(...sub.outcome.accessoriesUnlocked);
    }
    outcome.stage = next.stage;
    return { state: next, outcome };
  }

  private async insertMemory(scope: TxScope, petId: string, kind: PetMemoryKind, refType: string, refId: string, data: Record<string, unknown>, at: Date) {
    const id = uuidv7(scope.now.getTime());
    const dedupKey = memoryDedupKey(kind, refId, petId);
    const n = await txOf(scope).$executeRaw`
      INSERT INTO "PetMemory" (id, "petId", kind, "refType", "refId", "dedupKey", data, "createdAt")
      VALUES (${id}::uuid, ${petId}::uuid, ${kind}::"PetMemoryKind", ${refType}, ${refId}::uuid, ${dedupKey}, ${JSON.stringify(data)}::jsonb, ${at})
      ON CONFLICT ("dedupKey") DO NOTHING`;
    return n === 1 ? id : null;
  }
}

/** refId stable d'un palier (UUID dérivé, pas d'aléa) : `petId` avec les 12 derniers chiffres hex remplacés par n. */
function uuidFromMilestone(petId: string, n: number): string {
  return `${petId.slice(0, 24)}${n.toString(16).padStart(12, '0')}`;
}
