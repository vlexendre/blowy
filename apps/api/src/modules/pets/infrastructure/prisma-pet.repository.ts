import type { Db } from '@blowy/database';
import type { PetSnapshot } from '../../../shared/application/ports/engine.gateway.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { txOf } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import type { NewPet, PetAggregate, PetRepository } from '../application/ports/pet.repository.js';

const include = {
  vision: true,
  state: true,
  location: true,
  ownerships: { where: { endedAt: null }, select: { userId: true } },
  primaryOwner: { select: { timezone: true } },
} as const;

export class PrismaPetRepository implements PetRepository {
  constructor(private readonly db: Db) {}

  async findPrimaryOf(userId: string): Promise<string | null> {
    return (await this.db.pet.findUnique({ where: { primaryOwnerId: userId }, select: { id: true } }))?.id ?? null;
  }

  async load(scope: TxScope | null, petId: string): Promise<PetAggregate | null> {
    const client = scope ? txOf(scope) : this.db;
    const p = await client.pet.findUnique({ where: { id: petId }, include });
    if (!p || !p.state) return null;
    const s = p.state;
    return {
      id: p.id,
      kind: p.kind,
      species: p.species,
      stage: p.stage,
      name: p.name,
      primaryOwnerId: p.primaryOwnerId,
      ownerIds: p.ownerships.map((o) => o.userId),
      vision: p.vision,
      snapshot: {
        gauges: { satiety: s.satiety, energy: s.energy, mood: s.mood, health: s.health },
        petXpMilli: p.petXpMilli,
        asOf: s.advancedTo,
        engineState: s.engineState,
        engineVersion: s.engineVersion,
        tuningVersion: s.tuningVersion,
      },
      rngSeed: s.rngSeed,
      rngCounter: s.rngCounter,
      lastCallRefused: s.lastCallRefused,
      location: p.location ? { kind: p.location.kind, contextId: p.location.contextId, since: p.location.since } : { kind: 'HOME', contextId: null, since: p.createdAt },
      version: p.version + s.version,
      ownerTimezone: p.primaryOwner?.timezone ?? 'Europe/Paris',
    };
  }

  async create(scope: TxScope, n: NewPet): Promise<void> {
    const tx = txOf(scope);
    const s = n.snapshot;
    await tx.pet.create({
      data: {
        id: n.id,
        kind: 'PRIMARY',
        species: n.species,
        name: n.name,
        primaryOwnerId: n.ownerId,
        engineVersion: s.engineVersion,
        createdAt: scope.now,
        ownerships: { create: { userId: n.ownerId, role: 'OWNER', createdAt: scope.now } },
        vision: { create: { ...n.vision, contentVersion: 'content-2026.11.0' } },
        state: {
          create: {
            ...s.gauges,
            advancedTo: s.asOf,
            engineVersion: s.engineVersion,
            tuningVersion: s.tuningVersion,
            engineState: (s.engineState ?? {}) as object,
            rngSeed: n.rngSeed,
          },
        },
        appearance: { create: {} },
        location: { create: { kind: 'HOME', since: scope.now } },
      },
    });
  }

  async saveState(scope: TxScope, petId: string, s: PetSnapshot, extra: { rngCounter?: number; lastCallRefused?: boolean } = {}): Promise<void> {
    const tx = txOf(scope);
    await tx.petState.update({
      where: { petId },
      data: {
        ...s.gauges,
        advancedTo: s.asOf,
        engineState: (s.engineState ?? {}) as object,
        engineVersion: s.engineVersion,
        tuningVersion: s.tuningVersion,
        ...(extra.rngCounter !== undefined ? { rngCounter: extra.rngCounter } : {}),
        ...(extra.lastCallRefused !== undefined ? { lastCallRefused: extra.lastCallRefused } : {}),
        version: { increment: 1 },
      },
    });
    await tx.pet.update({ where: { id: petId }, data: { petXpMilli: s.petXpMilli } });
  }

  async moveTo(scope: TxScope, petId: string, kind: PetAggregate['location']['kind'], contextId: string | null): Promise<void> {
    await txOf(scope).virtualLocation.upsert({
      where: { petId },
      create: { petId, kind, contextId, since: scope.now },
      update: { kind, contextId, since: scope.now, version: { increment: 1 } },
    });
  }

  async recordCare(scope: TxScope, e: Parameters<PetRepository['recordCare']>[1]): Promise<void> {
    await txOf(scope).petCareEvent.create({ data: { ...e, effects: e.effects as object, occurredAt: scope.now } });
  }

  async globalPauses(userId: string, from: Date, to: Date): Promise<{ from: Date; to: Date }[]> {
    const rows = await this.db.pausePeriod.findMany({ where: { userId, contextId: null, startsAt: { lt: to }, endsAt: { gt: from } }, select: { startsAt: true, endsAt: true, endedAt: true } });
    return rows.map((r) => ({ from: r.startsAt, to: r.endedAt && r.endedAt < r.endsAt ? r.endedAt : r.endsAt }));
  }

  async dueForTick(advancedBefore: Date, activeSince: Date, limit: number): Promise<string[]> {
    const rows = await this.db.pet.findMany({
      where: { state: { advancedTo: { lt: advancedBefore } }, ownerships: { some: { endedAt: null, user: { lastActiveAt: { gte: activeSince }, status: 'ACTIVE' } } } },
      select: { id: true },
      take: limit,
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => r.id);
  }
}
