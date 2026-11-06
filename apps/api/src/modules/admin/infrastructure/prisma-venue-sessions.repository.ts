/**
 * Sessions du lieu partenaire — CONTOURNEMENT SCHÉMA documenté (même patron que les sessions staff) :
 * lignes `DeviceSession` avec `platform = 'venue-partner'` et une empreinte HMAC à clé dédiée au lieu
 * (séparation de domaine) : ni le résolveur mobile ni le résolveur staff ne peuvent les valider, et ce
 * dépôt ignore toute autre ligne. Anti-rejeu TOTP = `CommandRecord(actor, 'venue.totp_step', …)`.
 */
import type { Db } from '@blowy/database';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { txOf } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import type { VenueSessionRecord, VenueSessionRepository } from '../application/ports/ops.ports.js';
import { uuidFromKey } from './prisma-staff.repository.js';

export const VENUE_PLATFORM = 'venue-partner';

export class PrismaVenueSessionRepository implements VenueSessionRepository {
  constructor(private readonly db: Db) {}

  async create(scope: TxScope, s: { id: string; userId: string; tokenHash: string; expiresAt: Date }) {
    await txOf(scope).deviceSession.create({ data: { id: s.id, userId: s.userId, tokenHash: s.tokenHash, expiresAt: s.expiresAt, platform: VENUE_PLATFORM, deviceLabel: 'Espace lieu', createdAt: scope.now, lastUsedAt: scope.now } });
  }

  async find(id: string): Promise<VenueSessionRecord | null> {
    const s = await this.db.deviceSession.findUnique({ where: { id } });
    if (!s || s.platform !== VENUE_PLATFORM) return null;
    return { id: s.id, userId: s.userId, tokenHash: s.tokenHash, createdAt: s.createdAt, lastUsedAt: s.lastUsedAt, expiresAt: s.expiresAt, revokedAt: s.revokedAt };
  }

  async touch(id: string, at: Date) {
    await this.db.deviceSession.updateMany({ where: { id, platform: VENUE_PLATFORM }, data: { lastUsedAt: at } });
  }

  async revoke(scope: TxScope, userId: string, id: string, at: Date) {
    const r = await txOf(scope).deviceSession.updateMany({ where: { id, userId, platform: VENUE_PLATFORM, revokedAt: null }, data: { revokedAt: at } });
    return r.count === 1;
  }

  async revokeAllFor(scope: TxScope, userId: string, at: Date) {
    const r = await txOf(scope).deviceSession.updateMany({ where: { userId, platform: VENUE_PLATFORM, revokedAt: null }, data: { revokedAt: at } });
    return r.count;
  }

  async consumeTotpStep(scope: TxScope, userId: string, step: number) {
    const n = await txOf(scope).$executeRaw`INSERT INTO "CommandRecord" (id, "actorId", operation, "commandId", "payloadHash", status, "createdAt", "completedAt")
      VALUES (${uuidFromKey(`venue-totp-row:${userId}:${step}`)}::uuid, ${userId}::uuid, 'venue.totp_step', ${uuidFromKey(`venue-totp:${userId}:${step}`)}::uuid, 'totp', 'COMPLETED', ${scope.now}, ${scope.now})
      ON CONFLICT ("actorId", operation, "commandId") DO NOTHING`;
    return n === 1;
  }
}
