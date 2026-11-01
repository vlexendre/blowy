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

const STARTED_AT = Date.now();
const optional = (token: symbol) => ({ token, optional: true });

const providers: Provider[] = [
  { provide: ADMIN_CONFIG, useFactory: () => loadAdminConfig() },
  { provide: STAFF_REPOSITORY, useFactory: (db: Db) => new PrismaStaffRepository(db), inject: [DB] },
  { provide: AUDIT_LOG, useFactory: (db: Db) => new PrismaAuditLog(db), inject: [DB] },
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
        api: { version: process.env.npm_package_version ?? '0.1.0', env: cfg.BLOWY_ENV, engineVersion: engine.engineVersion, tuningVersion: engine.tuningVersion, node: process.version, uptimeSeconds: Math.round((Date.now() - STARTED_AT) / 1000) },
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
];

@Module({ controllers: [AdminAuthController, AdminController], providers, exports: [STAFF_REPOSITORY, AUDIT_LOG] })
export class AdminModule {}
