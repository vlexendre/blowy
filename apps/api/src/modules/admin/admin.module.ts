/**
 * Composition root du module admin (§18). Consomme par injection :
 *  - ADMIN_ECONOMY (G), ADMIN_MODERATION / ADMIN_TRUST (E) — optionnels : absents → 501
 *    « service non branché », jamais de données inventées ;
 *  - ENGINE_GATEWAY (diagnostics/réparation de niveau), SOCIAL_MODERATION (module social).
 */
import { Module, type Provider } from '@nestjs/common';
import type { Db } from '@blowy/database';
import { DEFAULT_TUNING } from '@blowy/tuning';
import type { AppConfig } from '../../config/env.js';
import type { CommandBus } from '../../shared/application/command-bus.js';
import type { Clock, RandomSource } from '../../shared/application/clock.js';
import type { EngineGateway } from '../../shared/application/ports/engine.gateway.js';
import type { UnitOfWork } from '../../shared/application/unit-of-work.js';
import { APP_CONFIG, CLOCK, COMMAND_BUS, DB, ENGINE_GATEWAY, RANDOM, REDIS, UNIT_OF_WORK } from '../../shared/shared.tokens.js';
import { selectIdentityProviders } from '../auth/auth.module.js';
import { ADMIN_ECONOMY, type AdminEconomyPort } from '../economy/application/use-cases/admin-economy.use-cases.js';
import { AdminCommandRunner } from './application/admin-command.js';
import {
  ADMIN_MODERATION,
  ADMIN_TRUST,
  AUDIT_LOG,
  CONFIG_REPOSITORY,
  DASHBOARD_QUERY,
  MISSION_ADMIN_REPOSITORY,
  OUTBOX_ADMIN_REPOSITORY,
  PET_ADMIN_REPOSITORY,
  READ_MODELS,
  REDRIVE_GUARD,
  STAFF_REPOSITORY,
  TUNING_SIMULATOR,
  USER_ADMIN_REPOSITORY,
  type AdminModerationPort,
  type AdminTrustPort,
  type AuditLog,
  type ConfigRepository,
  type DashboardQueryPort,
  type MissionAdminRepository,
  type OutboxAdminRepository,
  type PetAdminRepository,
  type ReadModelsPort,
  type RedriveGuard,
  type StaffRepository,
  type TuningSimulator,
  type UserAdminRepository,
} from './application/ports/admin.ports.js';
import { AdminSocialUseCases, SOCIAL_MODERATION, type SocialModerationPort } from './application/use-cases/admin-social.use-cases.js';
import {
  AuditUseCases,
  ContentUseCases,
  DashboardUseCase,
  EconomyAdminUseCases,
  MissionsUseCases,
  OpsUseCases,
  PetsRelationshipsUseCases,
  ReadModelsUseCases,
  RELATIONSHIP_REPAIR_WRITER,
  TrustUseCases,
  TuningUseCases,
  UsersUseCases,
  type RelationshipRepairWriter,
} from './application/use-cases/backoffice.use-cases.js';
import { StaffAuthService, STAFF_IDENTITY_VERIFIER, type StaffIdentityVerifier } from './application/use-cases/staff-auth.use-cases.js';
import { ADMIN_CONFIG, loadAdminConfig, type AdminConfig } from './infrastructure/admin-config.js';
import {
  PrismaAuditLog,
  PrismaConfigRepository,
  PrismaMissionAdminRepository,
  PrismaOutboxAdminRepository,
  PrismaPetAdminRepository,
  PrismaUserAdminRepository,
} from './infrastructure/prisma-admin.repositories.js';
import { PrismaDashboardQuery, PrismaReadModels } from './infrastructure/prisma-read-models.js';
import { PrismaStaffRepository } from './infrastructure/prisma-staff.repository.js';
import { StateAwareRedriveGuard } from './infrastructure/redrive-guard.js';
import { AuthProvidersStaffVerifier } from './infrastructure/staff-identity.verifier.js';
import { createTuningSimulator } from './infrastructure/tuning-simulator.js';
import { AdminGuard } from './interface/http/admin-guard.js';
import { AdminAuthController, AdminController } from './interface/http/admin.controllers.js';
// ---- V5 (T6) : back-office des sorties et espace lieu partenaire
import { OUTING_ADMIN_PORT, type OutingAdminPort } from '../../shared/application/ports/outing-admin.port.js';
import { PrismaEconomyJournal } from '../economy/infrastructure/prisma/prisma-economy-journal.js';
import type { RecurringJob } from '../../jobs/scheduler.js';
import {
  OPS_CONFIG_WRITER,
  OPS_READ_MODEL,
  VENUE_COMPENSATION_LEDGER,
  VENUE_PARTNER_STORE,
  VENUE_SESSION_REPOSITORY,
  type OpsConfigWriter,
  type OpsReadModel,
  type VenueCompensationLedger,
  type VenuePartnerStore,
  type VenueSessionRepository,
} from './application/ports/ops.ports.js';
import { OpsV5UseCases } from './application/use-cases/ops.use-cases.js';
import { randomUUID } from 'node:crypto';
import { MODERATION_GATEWAY, type ModerationGateway } from '../conversations/application/ports/moderation.gateway.js';
import type { VenueTextModeration } from './application/ports/ops.ports.js';
import { VenuePartnerAuthService, VenuePartnerUseCases, type VenueIdentityVerifier } from './application/use-cases/venue-partner.use-cases.js';
import { JournalVenueCompensationLedger, PrismaOpsConfigWriter, PrismaOpsReadModel, PrismaVenuePartnerStore } from './infrastructure/prisma-ops.repositories.js';
import { PrismaVenueSessionRepository } from './infrastructure/prisma-venue-sessions.repository.js';
import { AdminOpsController } from './interface/http/ops.controller.js';
import { VenuePartnerController, VenuePartnerGuard } from './interface/http/venue-partner.controller.js';

/** Jobs du module admin (worker) : re-matérialisation quotidienne de la politique de créneaux des lieux. */
export const ADMIN_JOBS = Symbol('AdminJobs');

const optional = (token: symbol) => ({ token, optional: true });

const providers: Provider[] = [
  { provide: ADMIN_CONFIG, useFactory: () => loadAdminConfig() },
  { provide: STAFF_REPOSITORY, useFactory: (db: Db) => new PrismaStaffRepository(db), inject: [DB] },
  { provide: AUDIT_LOG, useFactory: (db: Db, c: Clock) => new PrismaAuditLog(db, c), inject: [DB, CLOCK] },
  { provide: DASHBOARD_QUERY, useFactory: (db: Db) => new PrismaDashboardQuery(db), inject: [DB] },
  { provide: USER_ADMIN_REPOSITORY, useFactory: (db: Db) => new PrismaUserAdminRepository(db), inject: [DB] },
  { provide: PET_ADMIN_REPOSITORY, useFactory: (db: Db) => new PrismaPetAdminRepository(db), inject: [DB] },
  { provide: RELATIONSHIP_REPAIR_WRITER, useExisting: PET_ADMIN_REPOSITORY },
  { provide: CONFIG_REPOSITORY, useFactory: (db: Db) => new PrismaConfigRepository(db), inject: [DB] },
  { provide: MISSION_ADMIN_REPOSITORY, useFactory: (db: Db) => new PrismaMissionAdminRepository(db), inject: [DB] },
  { provide: READ_MODELS, useFactory: (db: Db) => new PrismaReadModels(db), inject: [DB] },
  { provide: OUTBOX_ADMIN_REPOSITORY, useFactory: (db: Db) => new PrismaOutboxAdminRepository(db), inject: [DB] },
  { provide: REDRIVE_GUARD, useFactory: (db: Db) => new StateAwareRedriveGuard(db), inject: [DB] },
  { provide: TUNING_SIMULATOR, useFactory: createTuningSimulator },
  { provide: STAFF_IDENTITY_VERIFIER, useFactory: (cfg: AppConfig) => new AuthProvidersStaffVerifier(selectIdentityProviders(cfg)), inject: [APP_CONFIG] },
  {
    provide: StaffAuthService,
    useFactory: (v: StaffIdentityVerifier, r: StaffRepository, a: AuditLog, u: UnitOfWork, c: Clock, rnd: RandomSource, cfg: AdminConfig) =>
      new StaffAuthService(v, r, a, u, c, rnd, { staffSessionSecret: cfg.staffSessionSecret, staffMfaKey: cfg.staffMfaKey, sessionTtlMs: cfg.sessionTtlMs, idleTimeoutMs: cfg.idleTimeoutMs }),
    inject: [STAFF_IDENTITY_VERIFIER, STAFF_REPOSITORY, AUDIT_LOG, UNIT_OF_WORK, CLOCK, RANDOM, ADMIN_CONFIG],
  },
  AdminGuard,
  { provide: AdminCommandRunner, useFactory: (b: CommandBus, a: AuditLog) => new AdminCommandRunner(b, a), inject: [COMMAND_BUS, AUDIT_LOG] },
  { provide: DashboardUseCase, useFactory: (q: DashboardQueryPort, c: Clock) => new DashboardUseCase(q, c), inject: [DASHBOARD_QUERY, CLOCK] },
  {
    provide: UsersUseCases,
    useFactory: (u: UserAdminRepository, a: AuditLog, run: AdminCommandRunner, m: AdminModerationPort | undefined, c: Clock) => new UsersUseCases(u, a, run, m ?? null, c),
    inject: [USER_ADMIN_REPOSITORY, AUDIT_LOG, AdminCommandRunner, optional(ADMIN_MODERATION), CLOCK],
  },
  {
    provide: PetsRelationshipsUseCases,
    useFactory: (p: PetAdminRepository, e: EngineGateway, run: AdminCommandRunner, w: RelationshipRepairWriter) => new PetsRelationshipsUseCases(p, e, run, w),
    inject: [PET_ADMIN_REPOSITORY, ENGINE_GATEWAY, AdminCommandRunner, RELATIONSHIP_REPAIR_WRITER],
  },
  {
    provide: TrustUseCases,
    useFactory: (m: AdminModerationPort | undefined, t: AdminTrustPort | undefined, run: AdminCommandRunner) => new TrustUseCases(m ?? null, t ?? null, run),
    inject: [optional(ADMIN_MODERATION), optional(ADMIN_TRUST), AdminCommandRunner],
  },
  { provide: MissionsUseCases, useFactory: (r: MissionAdminRepository, run: AdminCommandRunner, rnd: RandomSource) => new MissionsUseCases(r, run, rnd), inject: [MISSION_ADMIN_REPOSITORY, AdminCommandRunner, RANDOM] },
  { provide: ContentUseCases, useFactory: (r: ConfigRepository, run: AdminCommandRunner, rnd: RandomSource) => new ContentUseCases(r, run, rnd), inject: [CONFIG_REPOSITORY, AdminCommandRunner, RANDOM] },
  { provide: TuningUseCases, useFactory: (r: ConfigRepository, run: AdminCommandRunner, rnd: RandomSource, s: TuningSimulator) => new TuningUseCases(r, run, rnd, s), inject: [CONFIG_REPOSITORY, AdminCommandRunner, RANDOM, TUNING_SIMULATOR] },
  { provide: ReadModelsUseCases, useFactory: (rm: ReadModelsPort, c: Clock) => new ReadModelsUseCases(rm, c), inject: [READ_MODELS, CLOCK] },
  {
    provide: EconomyAdminUseCases,
    useFactory: (p: AdminEconomyPort | undefined, run: AdminCommandRunner, a: AuditLog) => new EconomyAdminUseCases(p ?? null, run, a),
    inject: [optional(ADMIN_ECONOMY), AdminCommandRunner, AUDIT_LOG],
  },
  {
    provide: OpsUseCases,
    useFactory: (rm: ReadModelsPort, o: OutboxAdminRepository, g: RedriveGuard, run: AdminCommandRunner, c: Clock, cfg: AppConfig, redis: unknown, engine: EngineGateway) =>
      new OpsUseCases(rm, o, g, run, c, () => ({
        api: { version: process.env.npm_package_version ?? '0.1.0', env: cfg.BLOWY_ENV, engineVersion: engine.engineVersion, tuningVersion: engine.tuningVersion, node: process.version, uptimeSeconds: Math.round(process.uptime()) },
        redis: { configured: !!redis, ok: redis ? (redis as { status?: string }).status === 'ready' : null },
        featureFlags: [
          { key: 'AUTH_PROVIDER', value: cfg.AUTH_PROVIDER, note: 'Sélection d’adaptateur (lecture seule, configuration de déploiement).' },
          { key: 'MODERATION_PROVIDER', value: cfg.MODERATION_PROVIDER, note: 'Lecture seule.' },
          { key: 'VERIFICATION_PROVIDER', value: cfg.VERIFICATION_PROVIDER, note: 'Lecture seule.' },
          { key: 'ENABLE_SCHEDULERS', value: cfg.ENABLE_SCHEDULERS, note: 'Lecture seule.' },
          { key: 'tuning.version (package)', value: DEFAULT_TUNING.version, note: 'Version embarquée par le moteur courant.' },
        ],
      })),
    inject: [READ_MODELS, OUTBOX_ADMIN_REPOSITORY, REDRIVE_GUARD, AdminCommandRunner, CLOCK, APP_CONFIG, REDIS, ENGINE_GATEWAY],
  },
  { provide: AuditUseCases, useFactory: (a: AuditLog) => new AuditUseCases(a), inject: [AUDIT_LOG] },
  { provide: AdminSocialUseCases, useFactory: (s: SocialModerationPort, run: AdminCommandRunner) => new AdminSocialUseCases(s, run), inject: [SOCIAL_MODERATION, AdminCommandRunner] },
  // ---- V5 (T6)
  { provide: OPS_READ_MODEL, useFactory: (db: Db) => new PrismaOpsReadModel(db), inject: [DB] },
  { provide: OPS_CONFIG_WRITER, useFactory: (db: Db) => new PrismaOpsConfigWriter(db), inject: [DB] },
  { provide: VENUE_PARTNER_STORE, useFactory: (db: Db) => new PrismaVenuePartnerStore(db), inject: [DB] },
  { provide: VENUE_SESSION_REPOSITORY, useFactory: (db: Db) => new PrismaVenueSessionRepository(db), inject: [DB] },
  // Lecture du journal de G (adapter de G, lecture + contre-écriture exportée par G) — aucune écriture directe.
  { provide: VENUE_COMPENSATION_LEDGER, useFactory: (db: Db) => new JournalVenueCompensationLedger(new PrismaEconomyJournal(db)), inject: [DB] },
  {
    provide: OpsV5UseCases,
    useFactory: (r: OpsReadModel, w: OpsConfigWriter, st: VenuePartnerStore, se: VenueSessionRepository, l: VenueCompensationLedger, o: OutingAdminPort | undefined, t: AdminTrustPort | undefined, run: AdminCommandRunner, u: UnitOfWork, c: Clock, rnd: RandomSource) =>
      new OpsV5UseCases(r, w, st, se, l, o ?? null, t ?? null, run, u, c, rnd, DEFAULT_TUNING),
    inject: [OPS_READ_MODEL, OPS_CONFIG_WRITER, VENUE_PARTNER_STORE, VENUE_SESSION_REPOSITORY, VENUE_COMPENSATION_LEDGER, optional(OUTING_ADMIN_PORT), optional(ADMIN_TRUST), AdminCommandRunner, UNIT_OF_WORK, CLOCK, RANDOM],
  },
  {
    provide: VenuePartnerAuthService,
    useFactory: (v: StaffIdentityVerifier, r: OpsReadModel, st: VenuePartnerStore, se: VenueSessionRepository, a: AuditLog, u: UnitOfWork, c: Clock, rnd: RandomSource, cfg: AdminConfig) =>
      new VenuePartnerAuthService(v as VenueIdentityVerifier, r, st, se, a, u, c, rnd, {
        staffSessionSecret: cfg.staffSessionSecret,
        staffMfaKey: cfg.staffMfaKey,
        sessionTtlMs: cfg.venueSessionTtlMs,
        idleTimeoutMs: cfg.venueIdleTimeoutMs,
        onCallPhone: cfg.venueOnCallPhone,
        onCallHours: cfg.venueOnCallHours,
      }),
    inject: [STAFF_IDENTITY_VERIFIER, OPS_READ_MODEL, VENUE_PARTNER_STORE, VENUE_SESSION_REPOSITORY, AUDIT_LOG, UNIT_OF_WORK, CLOCK, RANDOM, ADMIN_CONFIG],
  },
  {
    provide: VenuePartnerUseCases,
    useFactory: (au: VenuePartnerAuthService, r: OpsReadModel, st: VenuePartnerStore, w: OpsConfigWriter, l: VenueCompensationLedger, o: OutingAdminPort | undefined, b: CommandBus, a: AuditLog, c: Clock, rnd: RandomSource, m: ModerationGateway | undefined) =>
      new VenuePartnerUseCases(au, r, st, w, l, o ?? null, b, a, c, rnd, DEFAULT_TUNING, m ? venueTextModeration(m) : null),
    inject: [VenuePartnerAuthService, OPS_READ_MODEL, VENUE_PARTNER_STORE, OPS_CONFIG_WRITER, VENUE_COMPENSATION_LEDGER, optional(OUTING_ADMIN_PORT), COMMAND_BUS, AUDIT_LOG, CLOCK, RANDOM, optional(MODERATION_GATEWAY)],
  },
  VenuePartnerGuard,
  {
    provide: ADMIN_JOBS,
    useFactory: (ops: OpsV5UseCases): RecurringJob[] => [{ name: 'venues.apply_slot_policy', everyMs: 24 * 3_600_000, windowKey: (d: Date) => d.toISOString().slice(0, 10), run: () => ops.applyAllVenuePolicies() }],
    inject: [OpsV5UseCases],
  },
];

@Module({ controllers: [AdminAuthController, AdminController, AdminOpsController, VenuePartnerController], providers, exports: [STAFF_REPOSITORY, AUDIT_LOG, ADMIN_JOBS] })
export class AdminModule {}

/** V5.7 (E30) : le message d'accueil est modéré comme un message (même passerelle que les conversations). */
function venueTextModeration(m: ModerationGateway): VenueTextModeration {
  return {
    async moderate(i) {
      const v = await m.moderateText({ text: i.text, conversationId: i.venueId, authorId: i.authorId, messageId: randomUUID() });
      return v.action === 'ALLOW' ? 'ALLOW' : 'REJECT';
    },
  };
}
