/**
 * Modèles de lecture agrégés (dashboard §18.1, matching §18.9, social §18.11, IA §18.12,
 * exploitation §18.13). Valeurs calculées depuis la base réelle ; un indicateur sans source
 * instrumentée est renvoyé NOT_INSTRUMENTED (jamais un chiffre inventé). Aucun contenu privé.
 */
import type { Db } from '@blowy/database';
import type { AdminAiSummary, AdminSocialOverview, DashboardMetric, DashboardView, DeadOutboxRow, MatchingDiagnostics, OpsStatus } from '@blowy/api-contract';
import type { DashboardQueryPort, ReadModelsPort } from '../application/ports/admin.ports.js';

const DAY = 86_400_000;
export const OUTBOX_MAX_ATTEMPTS = 10;

const ratio = (v: number | null, d: number | null) => (v === null || d === null || d === 0 ? null : Math.round((v / d) * 10_000) / 10_000);
const m = (key: string, label: string, value: number | null, denominator: number | null, definition: string, status: DashboardMetric['status'] = 'OK'): DashboardMetric => ({
  key, label, value, denominator, ratio: ratio(value, denominator), definition, status,
});
const notInstrumented = (key: string, label: string, definition: string) => m(key, label, null, null, definition, 'NOT_INSTRUMENTED');

type CountRow = { n: bigint | number };
const num = (rows: CountRow[]) => Number(rows[0]?.n ?? 0);

export class PrismaDashboardQuery implements DashboardQueryPort {
  constructor(private readonly db: Db) {}

  async compute({ from, to, zone, now }: { from: Date; to: Date; zone: string | null; now: Date }): Promise<DashboardView> {
    const db = this.db;
    const zoneRow = zone ? await db.zone.findUnique({ where: { code: zone }, select: { id: true } }) : null;
    const zoneId = zone ? (zoneRow?.id ?? '00000000-0000-0000-0000-000000000000') : null;
    const real = { isFictional: false };
    // Les comptes fictifs (seed) sont exclus des métriques ; en local, ils sont comptés à part.
    const userWhere = { ...(zoneId ? { zoneId } : {}), staffRoles: { none: {} } };
    const cohort = { ...userWhere, createdAt: { gte: from, lt: to } };

    const [signups, signupsFictional, onboarded, verifiedUsers] = await Promise.all([
      db.user.count({ where: { ...cohort, ...real } }),
      db.user.count({ where: { ...cohort, isFictional: true } }),
      db.user.count({ where: { ...cohort, ...real, onboardedAt: { not: null } } }),
      db.user.count({ where: { ...cohort, ...real, verificationSessions: { some: { status: 'VERIFIED' } } } }),
    ]);

    const zoneSql = zoneId ? `AND u."zoneId" = '${zoneId}'::uuid` : '';
    const cohortSql = `u."createdAt" >= $1 AND u."createdAt" < $2 AND u."isFictional" = false ${zoneSql} AND NOT EXISTS (SELECT 1 FROM "StaffRoleAssignment" s WHERE s."userId" = u.id)`;
    const firstMatch = num(await db.$queryRawUnsafe<CountRow[]>(`SELECT count(*)::int AS n FROM "User" u WHERE ${cohortSql} AND EXISTS (SELECT 1 FROM "RelationshipSide" rs JOIN "RelationshipContext" c ON c.id = rs."contextId" WHERE rs."userId" = u.id AND c.type = 'DATE')`, from, to));

    // N3/J14 : relations DATE démarrées dans la période (et âgées d'au moins 14 j) ayant atteint N3 dans les 14 jours.
    const n3Denominator = num(await db.$queryRawUnsafe<CountRow[]>(`SELECT count(*)::int AS n FROM "RelationshipContext" c WHERE c.type = 'DATE' AND c."startedAt" >= $1 AND c."startedAt" < $2 AND c."startedAt" <= $3`, from, to, new Date(now.getTime() - 14 * DAY)));
    const n3Value = num(await db.$queryRawUnsafe<CountRow[]>(`SELECT count(*)::int AS n FROM "RelationshipContext" c WHERE c.type = 'DATE' AND c."startedAt" >= $1 AND c."startedAt" < $2 AND c."startedAt" <= $3 AND EXISTS (SELECT 1 FROM "RelationshipEvent" e WHERE e."contextId" = c.id AND e.type = 'relationship.level_reached' AND (e.payload->>'level')::int >= 3 AND e."occurredAt" <= c."startedAt" + interval '14 days')`, from, to, new Date(now.getTime() - 14 * DAY)));

    // Rétention Jn : utilisateurs de la cohorte (âgés d'au moins n jours) dont lastActiveAt ≥ createdAt + n jours.
    // Approximation documentée : lastActiveAt est le DERNIER instant d'activité, pas un historique quotidien.
    const retention = async (d: number) => {
      const elig = num(await db.$queryRawUnsafe<CountRow[]>(`SELECT count(*)::int AS n FROM "User" u WHERE ${cohortSql} AND u."createdAt" <= $3`, from, to, new Date(now.getTime() - d * DAY)));
      const kept = num(await db.$queryRawUnsafe<CountRow[]>(`SELECT count(*)::int AS n FROM "User" u WHERE ${cohortSql} AND u."createdAt" <= $3 AND u."lastActiveAt" >= u."createdAt" + ($4 || ' days')::interval`, from, to, new Date(now.getTime() - d * DAY), String(d)));
      return m(`retention_d${d}`, `Rétention J${d}`, kept, elig, `Comptes réels créés dans la période et âgés d'au moins ${d} j, actifs au moins une fois ≥ ${d} j après création (approximation : dernière activité connue). Dénominateur : cohorte éligible.`);
    };

    const period = { gte: from, lt: to };
    const [responses, respondentsTargets, claims, rewarded, subsActive, subsRefunded, ledgerStore, reliabilityPenalties, aiJobs, aiFailed, aiCost, casesOpen, casesOverdue, casesResolved, casesResolvedInSla, jobsFailed, jobsTotal] = await Promise.all([
      db.anonymousResponse.count({ where: { createdAt: period } }),
      db.anonymousResponse.groupBy({ by: ['targetUserId'], where: { createdAt: period } }).then((r) => r.length),
      db.referralClaim.count({ where: { claimedAt: period } }),
      db.referralClaim.count({ where: { claimedAt: period, status: 'REWARDED' } }),
      db.subscription.count({ where: { state: { in: ['TRIAL', 'ACTIVE', 'GRACE_PERIOD', 'CANCELLED_PENDING_EXPIRY'] }, environment: { not: 'LOCAL_DEMO' } } }),
      db.subscription.count({ where: { refundedAt: period } }),
      db.storeTransaction.count({ where: { purchasedAt: period, environment: { not: 'LOCAL_DEMO' } } }),
      db.reliabilityEvent.count({ where: { createdAt: period, delta: { lt: 0 } } }),
      db.aIJob.count({ where: { createdAt: period } }),
      db.aIJob.count({ where: { createdAt: period, status: { in: ['FAILED', 'DEAD_LETTER'] } } }),
      db.aIJob.aggregate({ where: { createdAt: period }, _sum: { costMicros: true } }),
      db.moderationCase.count({ where: { status: { in: ['OPEN', 'ASSIGNED', 'ESCALATED'] } } }),
      db.moderationCase.count({ where: { status: { in: ['OPEN', 'ASSIGNED', 'ESCALATED'] }, dueAt: { lt: now } } }),
      db.moderationCase.count({ where: { resolvedAt: period } }),
      db.$queryRawUnsafe<CountRow[]>(`SELECT count(*)::int AS n FROM "ModerationCase" WHERE "resolvedAt" >= $1 AND "resolvedAt" < $2 AND "resolvedAt" <= "dueAt"`, from, to).then(num),
      db.jobExecution.count({ where: { startedAt: period, status: 'FAILED' } }),
      db.jobExecution.count({ where: { startedAt: period } }),
    ]);
    const activeUsers = await db.user.count({ where: { ...userWhere, ...real, lastActiveAt: { gte: new Date(now.getTime() - 30 * DAY) } } });

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      zone,
      generatedAt: now.toISOString(),
      sections: [
        {
          key: 'acquisition',
          title: 'Comptes et activation',
          metrics: [
            m('signups', 'Comptes créés', signups, null, `Comptes réels (hors fictifs du seed et staff) créés dans la période. Fictifs exclus : ${signupsFictional}.`),
            m('onboarded', 'Onboarding terminé', onboarded, signups, 'Comptes de la cohorte avec onboarding terminé / comptes créés.'),
            m('verified', 'Vérifiés', verifiedUsers, signups, 'Comptes de la cohorte avec au moins une vérification VERIFIED (toute provenance, LOCAL_DEMO incluse en local) / comptes créés.'),
            m('first_match', 'Premier match mutuel', firstMatch, signups, 'Comptes de la cohorte ayant au moins une relation DATE (double acceptation) / comptes créés.'),
            m('n3_d14', 'N3 sous 14 jours', n3Value, n3Denominator, 'Relations DATE démarrées dans la période et âgées de ≥ 14 j ayant atteint le niveau 3 en ≤ 14 j / ces relations.'),
          ],
        },
        { key: 'retention', title: 'Rétention', metrics: await Promise.all([retention(1), retention(7), retention(30)]) },
        {
          key: 'viral',
          title: 'Viralité',
          metrics: [
            m('anonymous_responses', 'Réponses « 3 mots » reçues', responses, null, 'Réponses anonymes enregistrées dans la période (toutes cibles).'),
            m('anonymous_targets', 'Personnes ayant reçu des mots', respondentsTargets, null, 'Cibles distinctes ayant reçu ≥ 1 réponse dans la période.'),
            m('referral_activation', 'Parrainages activés', rewarded, claims, 'Parrainages réclamés dans la période et récompensés (activation admissible) / réclamés.'),
          ],
        },
        {
          key: 'revenue',
          title: 'Abonnements et revenus',
          metrics: [
            m('subs_active', 'Abonnements actifs (hors démo)', subsActive, null, 'Abonnements fournisseur (hors LOCAL_DEMO) en essai, actifs, en grâce ou résiliés non échus — instantané.'),
            m('store_transactions', 'Transactions store', ledgerStore, null, 'Transactions store enregistrées dans la période (hors LOCAL_DEMO).'),
            m('reversals', 'Remboursements', subsRefunded, subsActive || null, 'Abonnements remboursés dans la période / abonnements actifs.'),
            notInstrumented('revenue_eur', 'Revenu (EUR)', 'Les montants proviennent du store via RevenueCat (non stockés localement) : à lire dans RevenueCat.'),
          ],
        },
        {
          key: 'trust',
          title: 'Fiabilité, IA, modération, jobs',
          metrics: [
            m('reliability_penalties', 'Pénalités de fiabilité', reliabilityPenalties, activeUsers, 'Événements de fiabilité négatifs dans la période / utilisateurs actifs 30 j.'),
            m('ai_jobs', 'Tâches IA', aiJobs, null, 'Tâches IA créées dans la période.'),
            m('ai_failed', 'Tâches IA en échec', aiFailed, aiJobs, 'Tâches FAILED ou DEAD_LETTER / tâches créées.'),
            m('ai_cost_micros', 'Coût IA estimé (µ$)', aiCost._sum.costMicros ?? 0, null, 'Somme des coûts estimés déclarés par les adapters (micro-dollars).'),
            m('moderation_open', 'Dossiers ouverts', casesOpen, null, 'Dossiers OPEN/ASSIGNED/ESCALATED — instantané.'),
            m('moderation_overdue', 'Dossiers hors SLA', casesOverdue, casesOpen, 'Dossiers ouverts dont l’échéance (SLA cible 24 h) est dépassée / ouverts.'),
            m('moderation_sla', 'Résolus dans le SLA', casesResolvedInSla, casesResolved, 'Dossiers résolus dans la période avant échéance / résolus dans la période.'),
            m('jobs_failed', 'Jobs en échec', jobsFailed, jobsTotal, 'Exécutions de jobs FAILED / exécutions dans la période.'),
          ],
        },
      ],
    };
  }
}

export class PrismaReadModels implements ReadModelsPort {
  constructor(private readonly db: Db) {}

  async matching(now: Date): Promise<MatchingDiagnostics> {
    const zones = await this.db.zone.findMany({ orderBy: { code: 'asc' } });
    const out: MatchingDiagnostics['zones'] = [];
    for (const z of zones) {
      const base = { zoneId: z.id, staffRoles: { none: {} }, status: 'ACTIVE' as const };
      const inactiveBefore = new Date(now.getTime() - 7 * DAY);
      const [users, notOnboarded, noPet, unverified, inactive, paused, batches] = await Promise.all([
        this.db.user.count({ where: base }),
        this.db.user.count({ where: { ...base, onboardedAt: null } }),
        this.db.user.count({ where: { ...base, primaryPet: { is: null } } }),
        this.db.user.count({ where: { ...base, verificationSessions: { none: { status: 'VERIFIED' } } } }),
        this.db.user.count({ where: { ...base, OR: [{ lastActiveAt: null }, { lastActiveAt: { lt: inactiveBefore } }] } }),
        this.db.user.count({ where: { ...base, pausePeriods: { some: { contextId: null, endedAt: null, startsAt: { lte: now }, endsAt: { gt: now } } } } }),
        this.db.matchBatch.findMany({ where: { zoneId: z.id }, orderBy: { startedAt: 'desc' }, take: 10, include: { _count: { select: { proposals: true } } } }),
      ]);
      const eligible = await this.db.user.count({
        where: { ...base, onboardedAt: { not: null }, primaryPet: { isNot: null }, verificationSessions: { some: { status: 'VERIFIED' } }, lastActiveAt: { gte: inactiveBefore }, pausePeriods: { none: { contextId: null, endedAt: null, startsAt: { lte: now }, endsAt: { gt: now } } } },
      });
      const exposures = await this.db.$queryRawUnsafe<{ bucket: string; users: number }[]>(
        `SELECT CASE WHEN n = 0 THEN '0' WHEN n <= 2 THEN '1-2' WHEN n <= 5 THEN '3-5' WHEN n <= 10 THEN '6-10' ELSE '>10' END AS bucket, count(*)::int AS users
         FROM (SELECT u.id, (SELECT count(*) FROM "MatchExposure" e WHERE e."userId" = u.id AND e."shownAt" >= $2)::int AS n FROM "User" u WHERE u."zoneId" = $1::uuid AND u.status = 'ACTIVE') t GROUP BY 1 ORDER BY 1`,
        z.id, new Date(now.getTime() - 14 * DAY),
      );
      out.push({
        code: z.code, name: z.name, active: z.active, users, eligible,
        // Causes individuelles (non exclusives). Les causes par paire (âge, genre, distance, blocage, historique) sont calculées par lot et visibles dans les stats de lot.
        exclusions: { NOT_ONBOARDED: notOnboarded, NO_PET: noPet, UNVERIFIED: unverified, INACTIVE_7D: inactive, PAUSED: paused },
        lastBatches: batches.map((b) => ({ id: b.id, localDate: b.localDate, kind: b.kind, status: b.status, algoVersion: b.algoVersion, tuningVersion: b.tuningVersion, proposals: b._count.proposals, startedAt: b.startedAt.toISOString(), finishedAt: b.finishedAt?.toISOString() ?? null })),
        exposureHistogram: exposures.map((e) => ({ bucket: e.bucket, users: Number(e.users) })),
      });
    }
    return { zones: out };
  }

  async social(now: Date): Promise<AdminSocialOverview> {
    const [groups, claims, reported, leagues] = await Promise.all([
      this.db.group.findMany({ orderBy: { createdAt: 'desc' }, take: 50, include: { members: { where: { status: 'ACTIVE' }, select: { id: true } } } }),
      this.db.referralClaim.findMany({ orderBy: { claimedAt: 'desc' }, take: 50 }),
      this.db.anonymousResponse.findMany({ where: { reportedAt: { not: null } }, orderBy: { reportedAt: 'desc' }, take: 50, include: { target: { select: { profile: { select: { displayName: true } } } } } }),
      this.db.leagueSeason.findMany({ orderBy: { endsAt: 'desc' }, take: 20 }),
    ]);
    const since = new Date(now.getTime() - DAY);
    const perReferrer = new Map<string, number>();
    for (const c of await this.db.referralClaim.groupBy({ by: ['referrerUserId'], where: { claimedAt: { gte: since } }, _count: { _all: true } })) perReferrer.set(c.referrerUserId, c._count._all);
    return {
      groups: groups.map((g) => ({ id: g.id, name: g.name, status: g.status, activeMembers: g.members.length, createdAt: g.createdAt.toISOString() })),
      referrals: claims.map((c) => {
        const n = perReferrer.get(c.referrerUserId) ?? 0;
        return { id: c.id, status: c.status, claimedAt: c.claimedAt.toISOString(), rewardedAt: c.rewardedAt?.toISOString() ?? null, referrerUserId: c.referrerUserId, refereeUserId: c.refereeUserId, referrerClaims24h: n, suspicious: n >= 10 };
      }),
      // Réponses signalées : mots et cible seulement — jamais d'empreinte visiteur ni d'indice d'identité.
      reportedAnonymous: reported.map((r) => ({ id: r.id, words: r.words, targetUserId: r.targetUserId, targetDisplayName: r.target.profile?.displayName ?? null, reportedAt: r.reportedAt?.toISOString() ?? null, hidden: !!r.hiddenAt })),
      leagues: leagues.map((l) => ({ id: l.id, kind: l.kind, tier: l.tier, weekKey: l.weekKey, status: l.status, endsAt: l.endsAt.toISOString() })),
    };
  }

  async ai(now: Date, windowHours: number): Promise<AdminAiSummary> {
    const since = new Date(now.getTime() - windowHours * 3_600_000);
    const where = { createdAt: { gte: since } };
    const [byStatus, byKind, failedByKind, errors, versions] = await Promise.all([
      this.db.aIJob.groupBy({ by: ['status'], where, _count: { _all: true } }),
      this.db.aIJob.groupBy({ by: ['kind'], where, _count: { _all: true }, _avg: { durationMs: true }, _sum: { costMicros: true } }),
      this.db.aIJob.groupBy({ by: ['kind'], where: { ...where, status: { in: ['FAILED', 'DEAD_LETTER'] } }, _count: { _all: true } }),
      this.db.aIJob.groupBy({ by: ['lastErrorCode'], where: { ...where, lastErrorCode: { not: null } }, _count: { _all: true } }),
      this.db.aIJob.groupBy({ by: ['kind', 'provider', 'model', 'promptVersion'], where, _count: { _all: true } }),
    ]);
    const failed = new Map(failedByKind.map((f) => [f.kind, f._count._all]));
    return {
      windowHours,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
      byKind: byKind.map((k) => ({ kind: k.kind, count: k._count._all, failed: failed.get(k.kind) ?? 0, avgDurationMs: k._avg.durationMs === null ? null : Math.round(k._avg.durationMs), costMicros: k._sum.costMicros ?? 0 })),
      errors: errors.map((e) => ({ code: e.lastErrorCode ?? 'UNKNOWN', count: e._count._all })),
      promptVersions: versions.map((v) => ({ kind: v.kind, provider: v.provider, model: v.model, promptVersion: v.promptVersion, jobs: v._count._all })),
      budgets: { configured: false, note: 'Budgets/quotas IA : à fournir par le module IA (agent E) — aucune valeur affichée tant qu’ils ne sont pas configurés.' },
    };
  }

  async ops(now: Date): Promise<Omit<OpsStatus, 'api' | 'featureFlags' | 'redis'>> {
    // Mesure de DURÉE (horloge monotone), pas une date métier.
    const t0 = performance.now();
    let dbOk = true;
    try {
      await this.db.$queryRawUnsafe('SELECT 1');
    } catch {
      dbOk = false;
    }
    const latencyMs = Math.round(performance.now() - t0);
    const [pending, dead, oldest, jobs] = await Promise.all([
      this.db.outboxEvent.count({ where: { publishedAt: null, attempts: { lt: OUTBOX_MAX_ATTEMPTS } } }),
      this.db.outboxEvent.count({ where: { publishedAt: null, attempts: { gte: OUTBOX_MAX_ATTEMPTS } } }),
      this.db.outboxEvent.findFirst({ where: { publishedAt: null }, orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
      this.db.$queryRawUnsafe<{ jobName: string; status: string; startedAt: Date; error: string | null; failed24h: number }[]>(
        `SELECT DISTINCT ON (j."jobName") j."jobName", j.status, j."startedAt", j.error,
           (SELECT count(*)::int FROM "JobExecution" f WHERE f."jobName" = j."jobName" AND f.status = 'FAILED' AND f."startedAt" >= $1) AS "failed24h"
         FROM "JobExecution" j ORDER BY j."jobName", j."startedAt" DESC`,
        new Date(now.getTime() - DAY),
      ),
    ]);
    return {
      generatedAt: now.toISOString(),
      database: { ok: dbOk, latencyMs },
      outbox: { pending, dead, oldestPendingAgeSeconds: oldest ? Math.round((now.getTime() - oldest.createdAt.getTime()) / 1000) : null, maxAttempts: OUTBOX_MAX_ATTEMPTS },
      jobs: jobs.map((j) => ({ name: j.jobName, lastStatus: j.status, lastStartedAt: j.startedAt.toISOString(), lastError: j.error ? j.error.slice(0, 200) : null, failed24h: Number(j.failed24h) })),
    };
  }

  async deadOutbox(limit: number): Promise<DeadOutboxRow[]> {
    const rows = await this.db.outboxEvent.findMany({ where: { publishedAt: null, attempts: { gte: OUTBOX_MAX_ATTEMPTS } }, orderBy: { createdAt: 'asc' }, take: limit });
    // Le payload n'est pas exposé (peut référencer des contenus) : topic, agrégat et erreur tronquée seulement.
    return rows.map((r) => ({ id: r.id, topic: r.topic, aggregateType: r.aggregateType, attempts: r.attempts, lastError: r.lastError ? r.lastError.slice(0, 200) : null, createdAt: r.createdAt.toISOString(), redrivable: false, blockedReason: null }));
  }
}
