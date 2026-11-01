/**
 * Adapters Prisma du module admin. Lectures = vues staff explicites (jamais un modèle brut),
 * sans vote privé, email complet, date de naissance, identité de signaleur/répondant ni position.
 * Écritures limitées aux tables du back-office : AuditLog (append-only), ConfigVersion,
 * MissionDefinition/DailyMission, OutboxEvent (remise en file contrôlée).
 */
import { uuidv7, type Db } from '@blowy/database';
import type { AdminAuditRow, AdminConfigVersionRow, AdminMissionVersion, AdminPetView, AdminRelationshipView, AdminUserRow, MissionDraftRequest, PageOf } from '@blowy/api-contract';
import type { StaffRole } from '@blowy/domain';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { decodeCursor, pageFrom } from '../../../shared/application/pagination.js';
import { txOf } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import { maskEmail } from '../domain/staff-tokens.js';
import type {
  AuditEntry,
  AuditLog,
  ConfigRepository,
  ConfigVersionRecord,
  MissionAdminRepository,
  OutboxAdminRepository,
  PetAdminRepository,
  UserAdminRepository,
} from '../application/ports/admin.ports.js';
import type { RelationshipRepairWriter } from '../application/use-cases/backoffice.use-cases.js';
import { STAFF_PLATFORM } from './prisma-staff.repository.js';

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

// ------------------------------------------------------------------ Audit
export class PrismaAuditLog implements AuditLog {
  constructor(private readonly db: Db) {}

  private data(e: AuditEntry, at: Date) {
    return {
      id: uuidv7(at.getTime()),
      actorUserId: e.actorUserId,
      actorRole: e.actorRole,
      action: e.action,
      targetType: e.targetType,
      targetId: e.targetId,
      reason: e.reason,
      data: (e.data ?? {}) as object,
      requestId: e.requestId ?? null,
      createdAt: at,
    };
  }

  async record(scope: TxScope, e: AuditEntry) {
    const row = await txOf(scope).auditLog.create({ data: this.data(e, scope.now) });
    return row.id;
  }

  async recordNow(e: AuditEntry) {
    const row = await this.db.auditLog.create({ data: this.data(e, new Date()) });
    return row.id;
  }

  async list(q: { targetType?: string; targetId?: string; actorUserId?: string; action?: string; cursor?: string; limit: number }): Promise<PageOf<AdminAuditRow>> {
    const c = decodeCursor(q.cursor);
    const rows = await this.db.auditLog.findMany({
      where: {
        ...(q.targetType ? { targetType: q.targetType } : {}),
        ...(q.targetId ? { targetId: q.targetId } : {}),
        ...(q.actorUserId ? { actorUserId: q.actorUserId } : {}),
        ...(q.action ? { action: { startsWith: q.action } } : {}),
        ...(c ? { id: { lt: String(c[0]) } } : {}),
      },
      orderBy: { id: 'desc' },
      take: q.limit + 1,
    });
    const page = pageFrom(rows, q.limit, (r) => [r.id]);
    return { nextCursor: page.nextCursor, items: page.items.map((r) => ({ id: r.id, at: r.createdAt.toISOString(), actorUserId: r.actorUserId, actorRole: r.actorRole, action: r.action, targetType: r.targetType, targetId: r.targetId, reason: r.reason, requestId: r.requestId })) };
  }
}

// ------------------------------------------------------------------ Utilisateurs
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ageYears(birth: Date | null, now: Date): number | null {
  if (!birth) return null;
  let a = now.getUTCFullYear() - birth.getUTCFullYear();
  const m = now.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < birth.getUTCDate())) a--;
  return a;
}

export class PrismaUserAdminRepository implements UserAdminRepository {
  constructor(private readonly db: Db) {}

  async search(q: { q?: string; status?: string; cursor?: string; limit: number }): Promise<PageOf<AdminUserRow>> {
    const c = decodeCursor(q.cursor);
    const term = q.q?.trim();
    const rows = await this.db.user.findMany({
      where: {
        ...(q.status ? { status: q.status as never } : {}),
        ...(term
          ? {
              OR: [
                ...(UUID_RE.test(term) ? [{ id: term }] : []),
                { profile: { displayName: { contains: term, mode: 'insensitive' as const } } },
                { profile: { publicSlug: { equals: term.toLowerCase() } } },
                { authIdentities: { some: { subject: { equals: term.toLowerCase() } } } },
              ],
            }
          : {}),
        ...(c ? { id: { lt: String(c[0]) } } : {}),
      },
      orderBy: { id: 'desc' },
      take: q.limit + 1,
      select: {
        id: true, status: true, createdAt: true, lastActiveAt: true, onboardedAt: true, isFictional: true,
        profile: { select: { displayName: true } }, zone: { select: { code: true } },
        verificationSessions: { where: { status: 'VERIFIED' }, select: { id: true }, take: 1 },
        staffRoles: { where: { revokedAt: null }, select: { role: true } },
      },
    });
    const page = pageFrom(rows, q.limit, (r) => [r.id]);
    return {
      nextCursor: page.nextCursor,
      items: page.items.map((u) => ({
        id: u.id,
        displayName: u.profile?.displayName ?? null,
        status: u.status,
        zone: u.zone?.code ?? null,
        verified: u.verificationSessions.length > 0,
        onboarded: !!u.onboardedAt,
        createdAt: u.createdAt.toISOString(),
        lastActiveAt: iso(u.lastActiveAt),
        isFictional: u.isFictional,
        staffRoles: u.staffRoles.map((r) => r.role as StaffRole),
      })),
    };
  }

  async detail(userId: string, now: Date) {
    const u = await this.db.user.findUnique({
      where: { id: userId },
      include: {
        profile: true, zone: true, matchPreferences: { select: { intention: true } }, privacySettings: { select: { photoPreference: true } },
        verificationSessions: { orderBy: { createdAt: 'desc' }, take: 10 },
        deviceSessions: { where: { platform: { not: STAFF_PLATFORM } }, orderBy: { lastUsedAt: 'desc' }, take: 10 },
        subscriptions: { orderBy: { updatedAt: 'desc' }, take: 5 },
        pausePeriods: { orderBy: { startsAt: 'desc' }, take: 5 },
        dataExports: { orderBy: { requestedAt: 'desc' }, take: 5 },
        deletionRequests: { orderBy: { requestedAt: 'desc' }, take: 5 },
        primaryPet: true,
        staffRoles: { where: { revokedAt: null } },
        relationshipSides: { include: { context: { select: { id: true, type: true, status: true, branch: true, reachedLevel: true } } }, take: 20 },
      },
    });
    if (!u) return null;
    return {
      id: u.id,
      displayName: u.profile?.displayName ?? null,
      status: u.status,
      zone: u.zone?.code ?? null,
      verified: u.verificationSessions.some((v) => v.status === 'VERIFIED'),
      onboarded: !!u.onboardedAt,
      createdAt: u.createdAt.toISOString(),
      lastActiveAt: iso(u.lastActiveAt),
      isFictional: u.isFictional,
      staffRoles: u.staffRoles.map((r) => r.role as StaffRole),
      emailMasked: maskEmail(u.email),
      ageYears: ageYears(u.birthDate, now),
      timezone: u.timezone,
      reliability: u.reliability,
      // Intention : préférence privée — utile au support pour un dossier de matching ; jamais exposée publiquement.
      intention: u.matchPreferences?.intention ?? null,
      photoPreference: u.privacySettings?.photoPreference ?? null,
      verifications: u.verificationSessions.map((v) => ({ id: v.id, kind: v.kind, provenance: v.provenance, status: v.status, createdAt: v.createdAt.toISOString(), expiresAt: iso(v.expiresAt) })),
      devices: u.deviceSessions.map((d) => ({ id: d.id, platform: d.platform, appVersion: d.appVersion, lastUsedAt: d.lastUsedAt.toISOString(), revoked: !!d.revokedAt || d.expiresAt <= now })),
      subscriptions: u.subscriptions.map((s) => ({ id: s.id, provider: s.provider, environment: s.environment, state: s.state, currentPeriodEndsAt: iso(s.currentPeriodEndsAt) })),
      pauses: u.pausePeriods.map((p) => ({ id: p.id, startsAt: p.startsAt.toISOString(), endsAt: p.endsAt.toISOString(), scope: p.contextId ? 'RELATIONSHIP' : 'GLOBAL' })),
      exports: u.dataExports.map((e) => ({ id: e.id, status: e.status, requestedAt: e.requestedAt.toISOString() })),
      deletions: u.deletionRequests.map((e) => ({ id: e.id, status: e.status, requestedAt: e.requestedAt.toISOString() })),
      pet: u.primaryPet ? { id: u.primaryPet.id, name: u.primaryPet.name, species: u.primaryPet.species, stage: u.primaryPet.stage } : null,
      relationships: u.relationshipSides.map((s) => ({ id: s.context.id, type: s.context.type, status: s.context.status, branch: s.context.branch, reachedLevel: s.context.reachedLevel })),
    };
  }
}

// ------------------------------------------------------------------ Pets / relations (lecture) + réparation
export class PrismaPetAdminRepository implements PetAdminRepository, RelationshipRepairWriter {
  constructor(private readonly db: Db) {}

  async pet(petId: string): Promise<AdminPetView | null> {
    const p = await this.db.pet.findUnique({ where: { id: petId }, include: { state: true, location: true, careEvents: { orderBy: { occurredAt: 'desc' }, take: 50 } } });
    if (!p) return null;
    return {
      id: p.id, name: p.name, species: p.species, stage: p.stage, kind: p.kind, engineVersion: p.engineVersion,
      state: p.state ? { satiety: p.state.satiety, energy: p.state.energy, mood: p.state.mood, health: p.state.health, advancedTo: p.state.advancedTo.toISOString(), tuningVersion: p.state.tuningVersion } : null,
      location: p.location ? { kind: p.location.kind, contextId: p.location.contextId } : null,
      careTimeline: p.careEvents.map((e) => ({ at: e.occurredAt.toISOString(), action: e.action, actorUserId: e.actorUserId, engineVersion: e.engineVersion, tuningVersion: e.tuningVersion, effects: e.effects })),
    };
  }

  async relationship(id: string): Promise<Omit<AdminRelationshipView, 'diagnostics'> | null> {
    const r = await this.db.relationshipContext.findUnique({
      where: { id },
      include: {
        sides: { select: { userId: true, petId: true, active: true, exclusive: true } },
        // Les événements ACTOR_ONLY (ex. son propre vote) ne sont jamais renvoyés au staff ; payloads omis.
        events: { where: { visibility: { not: 'ACTOR_ONLY' } }, orderBy: { seq: 'desc' }, take: 100, select: { seq: true, type: true, occurredAt: true, visibility: true, engineVersion: true, tuningVersion: true } },
      },
    });
    if (!r) return null;
    return {
      id: r.id, type: r.type, status: r.status, branch: r.branch, xpMilli: r.xpMilli, eligibleLevel: r.eligibleLevel, reachedLevel: r.reachedLevel,
      engineVersion: r.engineVersion, tuningVersion: r.tuningVersion, legacy: r.legacy, startedAt: r.startedAt.toISOString(), endedAt: iso(r.endedAt),
      sides: r.sides,
      timeline: r.events.map((e) => ({ seq: e.seq, type: e.type, at: e.occurredAt.toISOString(), visibility: e.visibility, engineVersion: e.engineVersion, tuningVersion: e.tuningVersion })),
    };
  }

  async load(scope: TxScope, id: string) {
    const r = await txOf(scope).relationshipContext.findUnique({ where: { id }, select: { xpMilli: true, branch: true, eligibleLevel: true } });
    return r ? { xpMilli: r.xpMilli, branch: r.branch as 'UNDECIDED' | 'FRIEND' | 'PLUS', eligibleLevel: r.eligibleLevel } : null;
  }

  /**
   * Correction du seul niveau éligible dérivé + événement SYSTEM séquencé (journal append-only).
   * CONTOURNEMENT documenté : écriture sur la table du module relations (agent C), restreinte à
   * ces deux colonnes ; à remplacer par un port `RelationshipCorrections` exposé par C.
   */
  async correctEligible(scope: TxScope, id: string, level: number, meta: { actorUserId: string; before: number; engineVersion: string; tuningVersion: string; commandId: string }) {
    const tx = txOf(scope);
    const ctx = await tx.relationshipContext.update({ where: { id }, data: { eligibleLevel: level, lastEventSeq: { increment: 1 }, version: { increment: 1 } }, select: { lastEventSeq: true } });
    await tx.relationshipEvent.create({
      data: {
        id: uuidv7(scope.now.getTime()), contextId: id, seq: ctx.lastEventSeq, type: 'relationship.staff_correction', actorUserId: null, visibility: 'SYSTEM',
        payload: { field: 'eligibleLevel', before: meta.before, after: level, staffUserId: meta.actorUserId, commandId: meta.commandId },
        engineVersion: meta.engineVersion, tuningVersion: meta.tuningVersion, occurredAt: scope.now,
      },
    });
  }
}

// ------------------------------------------------------------------ ConfigVersion (tuning / contenus)
type Kind = 'TUNING' | 'CONTENT';
const toRecord = (r: { id: string; kind: string; version: string; payload: unknown; authorId: string | null; activatedAt: Date | null; minClientVersion: string | null; createdAt: Date }): ConfigVersionRecord => ({
  id: r.id, kind: r.kind as Kind, version: r.version, payload: (r.payload ?? {}) as Record<string, unknown>, authorId: r.authorId, activatedAt: r.activatedAt, minClientVersion: r.minClientVersion, createdAt: r.createdAt,
});

/**
 * Active = version au `activatedAt` le plus récent (aucune colonne « status » au schéma) ;
 * les versions antérieurement activées passent SUPERSEDED (calculé), l'archivage est noté dans
 * le payload (`status: 'ARCHIVED'`) faute de colonne — voir handoff F.
 */
export class PrismaConfigRepository implements ConfigRepository {
  constructor(private readonly db: Db) {}

  async list(kind: Kind): Promise<AdminConfigVersionRow[]> {
    const rows = await this.db.configVersion.findMany({ where: { kind }, orderBy: { createdAt: 'desc' }, take: 200 });
    const activeId = rows.filter((r) => r.activatedAt).sort((a, b) => b.activatedAt!.getTime() - a.activatedAt!.getTime())[0]?.id;
    return rows.map((r) => {
      const archived = (r.payload as { status?: string } | null)?.status === 'ARCHIVED';
      const status = r.id === activeId ? 'ACTIVE' : archived ? 'ARCHIVED' : r.activatedAt ? 'SUPERSEDED' : 'DRAFT';
      return { id: r.id, kind: r.kind, version: r.version, status, authorId: r.authorId, createdAt: r.createdAt.toISOString(), activatedAt: iso(r.activatedAt), minClientVersion: r.minClientVersion };
    });
  }

  async get(scope: TxScope | null, id: string) {
    const r = await (scope ? txOf(scope) : this.db).configVersion.findUnique({ where: { id } });
    return r ? toRecord(r) : null;
  }

  async active(scope: TxScope | null, kind: Kind) {
    const r = await (scope ? txOf(scope) : this.db).configVersion.findFirst({ where: { kind, activatedAt: { not: null } }, orderBy: { activatedAt: 'desc' } });
    return r ? toRecord(r) : null;
  }

  async lockKind(scope: TxScope, kind: Kind) {
    await txOf(scope).$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`config:${kind}`}))`;
  }

  async create(scope: TxScope, r: Omit<ConfigVersionRecord, 'createdAt' | 'activatedAt'>) {
    await txOf(scope).configVersion.create({ data: { id: r.id, kind: r.kind, version: r.version, payload: r.payload as object, authorId: r.authorId, minClientVersion: r.minClientVersion, createdAt: scope.now } });
  }

  async activate(scope: TxScope, id: string, at: Date) {
    // Garantit un ordre strict même si deux publications tombent dans la même milliseconde.
    const last = await txOf(scope).configVersion.findFirst({ where: { activatedAt: { not: null } }, orderBy: { activatedAt: 'desc' }, select: { activatedAt: true } });
    const when = last?.activatedAt && last.activatedAt >= at ? new Date(last.activatedAt.getTime() + 1) : at;
    await txOf(scope).configVersion.update({ where: { id }, data: { activatedAt: when } });
  }

  async archive(scope: TxScope, id: string) {
    const r = await txOf(scope).configVersion.findUniqueOrThrow({ where: { id } });
    await txOf(scope).configVersion.update({ where: { id }, data: { payload: { ...((r.payload ?? {}) as object), status: 'ARCHIVED' } } });
  }

  async versionExists(scope: TxScope, kind: Kind, version: string) {
    return !!(await txOf(scope).configVersion.findUnique({ where: { kind_version: { kind, version } }, select: { id: true } }));
  }
}

// ------------------------------------------------------------------ Missions
export class PrismaMissionAdminRepository implements MissionAdminRepository {
  constructor(private readonly db: Db) {}

  private map(r: { id: string; key: string; version: number; status: string; titleKey: string; criteria: unknown; accessibleAlternative: string | null; linkXpMilli: number; petXpMilli: number; coins: number; createdAt: Date; publishedAt: Date | null; dailyMissions: { day: string; zone: { code: string } }[] }): AdminMissionVersion {
    return {
      id: r.id, key: r.key, version: r.version, status: r.status as AdminMissionVersion['status'], titleKey: r.titleKey, title: null, criteria: r.criteria,
      accessibleAlternative: r.accessibleAlternative, linkXpMilli: r.linkXpMilli, petXpMilli: r.petXpMilli, coins: r.coins,
      createdAt: r.createdAt.toISOString(), publishedAt: iso(r.publishedAt), scheduled: r.dailyMissions.map((d) => ({ zone: d.zone.code, day: d.day })),
    };
  }

  async list() {
    const rows = await this.db.missionDefinition.findMany({ orderBy: [{ key: 'asc' }, { version: 'desc' }], include: { dailyMissions: { orderBy: { day: 'desc' }, take: 14, select: { day: true, zone: { select: { code: true } } } } }, take: 500 });
    return rows.map((r) => this.map(r));
  }

  async get(scope: TxScope | null, id: string) {
    const r = await (scope ? txOf(scope) : this.db).missionDefinition.findUnique({ where: { id }, include: { dailyMissions: { take: 14, select: { day: true, zone: { select: { code: true } } } } } });
    return r ? this.map(r) : null;
  }

  async nextVersion(scope: TxScope, key: string) {
    await txOf(scope).$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`mission:${key}`}))`;
    const agg = await txOf(scope).missionDefinition.aggregate({ where: { key }, _max: { version: true } });
    return (agg._max.version ?? 0) + 1;
  }

  async create(scope: TxScope, id: string, version: number, d: MissionDraftRequest) {
    await txOf(scope).missionDefinition.create({ data: { id, key: d.key, version, status: 'DRAFT', titleKey: d.titleKey, criteria: d.criteria as object, accessibleAlternative: d.accessibleAlternative, linkXpMilli: d.linkXpMilli, petXpMilli: d.petXpMilli, coins: d.coins, createdAt: scope.now } });
  }

  async update(scope: TxScope, id: string, d: MissionDraftRequest) {
    await txOf(scope).missionDefinition.update({ where: { id }, data: { titleKey: d.titleKey, criteria: d.criteria as object, accessibleAlternative: d.accessibleAlternative, linkXpMilli: d.linkXpMilli, petXpMilli: d.petXpMilli, coins: d.coins } });
  }

  async setStatus(scope: TxScope, id: string, status: 'PUBLISHED' | 'ARCHIVED', at: Date) {
    await txOf(scope).missionDefinition.update({ where: { id }, data: { status, ...(status === 'PUBLISHED' ? { publishedAt: at } : {}) } });
  }

  async archiveOtherPublished(scope: TxScope, key: string, keepId: string) {
    const others = await txOf(scope).missionDefinition.findMany({ where: { key, status: 'PUBLISHED', id: { not: keepId } }, select: { id: true } });
    if (others.length) await txOf(scope).missionDefinition.updateMany({ where: { id: { in: others.map((o) => o.id) } }, data: { status: 'ARCHIVED' } });
    return others.map((o) => o.id);
  }

  async schedule(scope: TxScope, definitionId: string, zoneCode: string, day: string) {
    const tx = txOf(scope);
    const zone = await tx.zone.findUnique({ where: { code: zoneCode }, select: { id: true } });
    if (!zone) throw Object.assign(new Error('zone'), { name: 'ZoneNotFound' });
    const existing = await tx.dailyMission.findUnique({ where: { zoneId_day: { zoneId: zone.id, day } }, select: { id: true } });
    if (existing) return { id: existing.id, created: false };
    const id = uuidv7(scope.now.getTime());
    await tx.dailyMission.create({ data: { id, definitionId, zoneId: zone.id, day, createdAt: scope.now } });
    return { id, created: true };
  }
}

// ------------------------------------------------------------------ Outbox (redrive)
export class PrismaOutboxAdminRepository implements OutboxAdminRepository {
  constructor(private readonly db: Db) {}
  async loadForRedrive(scope: TxScope | null, id: string) {
    const client = scope ? txOf(scope) : this.db;
    if (scope) await txOf(scope).$queryRaw`SELECT 1 FROM "OutboxEvent" WHERE id = ${id}::uuid FOR UPDATE`;
    const r = await client.outboxEvent.findUnique({ where: { id } });
    return r ? { id: r.id, topic: r.topic, aggregateType: r.aggregateType, aggregateId: r.aggregateId, payload: (r.payload ?? {}) as Record<string, unknown>, attempts: r.attempts, publishedAt: r.publishedAt } : null;
  }
  async requeue(scope: TxScope, id: string, at: Date) {
    await txOf(scope).outboxEvent.update({ where: { id }, data: { attempts: 0, availableAt: at, lastError: null } });
  }
}
