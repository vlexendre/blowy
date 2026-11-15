import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  AdminAudit,
  AdminAuditEntry,
  AdminAuditQuery,
  AdminContextMessage,
  AdminReportDetail,
  AdminReportItem,
  AdminReports,
  AdminReportsQuery,
  AdminSuspensions,
  ModerationActionBody,
} from '@blowy/contract';
import { moderationTextIn } from '@blowy/content';
import { priorityOfRank } from '@blowy/domain';
import { Notifier as MailNotifier } from '../../../integrations/mailer/notifier';
import type { Storage } from '../../../integrations/storage/ports';
import type { Clock } from '../../../shared/clock';
import { DomainError } from '../../../shared/errors';
import { CLOCK, PROFILES, STORAGE } from '../../../shared/tokens';
import { DeleteMe } from '../../me/application/delete-me.usecase';
import { Bans } from '../../retention/application/bans';
import type { ProfilesRepository } from '../../me/ports';
import { reportCursor } from '../infrastructure/memory-admin.repositories';
import type { AdminReportRow, AuditLogRepository, AuditRecord, ModerationRepository, SuspensionsRepository } from '../ports';
import { AUDIT_LOG, MODERATION, SUSPENSIONS } from '../tokens';
import { AccountGate } from './account-gate';

/** Délai cible de traitement d'un signalement. */
export const REPORT_TARGET_HOURS = 24;
/** Messages montrés avant et après le message signalé. */
export const CONTEXT_AROUND = 2;
const PHOTO_URL_SECONDS = 300;

const hoursBetween = (from: string, to: string): number => Math.round(((Date.parse(to) - Date.parse(from)) / 3_600_000) * 10) / 10;

export const presentAudit = (e: AuditRecord): AdminAuditEntry => ({ ...e });

/**
 * Modération : signalements à traiter (le plus ancien d'abord), contexte limité au message signalé et à ses voisins
 * immédiats, actions (avertir, suspendre, supprimer, classer, lever) toutes écrites dans le journal.
 */
@Injectable()
export class Moderation {
  private readonly logger = new Logger('Modération');

  constructor(
    @Inject(MODERATION) private readonly reports: ModerationRepository,
    @Inject(AUDIT_LOG) private readonly audit: AuditLogRepository,
    @Inject(SUSPENSIONS) private readonly suspensions: SuspensionsRepository,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(STORAGE) private readonly storage: Storage,
    @Inject(DeleteMe) private readonly deleteMe: DeleteMe,
    @Inject(MailNotifier) private readonly mail: MailNotifier,
    @Inject(AccountGate) private readonly gate: AccountGate,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(Bans) private readonly bans: Bans,
  ) {}

  async list(query: AdminReportsQuery): Promise<AdminReports> {
    const now = this.clock.now().toISOString();
    const targetIds = query.q ? await this.reports.searchPeople(query.q, 50) : undefined;
    const rows =
      targetIds && targetIds.length === 0
        ? []
        : await this.reports.page({ status: query.status, reason: query.reason, targetIds }, query.cursor ?? null, query.limit + 1);
    const page = rows.slice(0, query.limit);
    const counts = await this.reports.counts(now, REPORT_TARGET_HOURS);
    const last = page[page.length - 1];
    return {
      items: await this.present(page, now),
      nextCursor: rows.length > query.limit && last ? reportCursor(last, query.status === 'open') : null,
      open: counts.open,
      overdue: counts.overdue,
      targetHours: REPORT_TARGET_HOURS,
    };
  }

  async detail(id: string): Promise<AdminReportDetail> {
    const row = await this.reports.find(id);
    if (!row) throw new DomainError('not_found', 'Ce signalement n’existe pas.');
    const now = this.clock.now().toISOString();
    const [item] = await this.present([row], now);
    const history = row.targetUser ? await this.audit.page({ targetUserId: row.targetUser }, null, 20) : [];
    return { report: item as AdminReportItem, context: await this.context(row), history: history.map(presentAudit) };
  }

  /**
   * Seul contenu de conversation visible : le message signalé et ses voisins immédiats, dans le lien du
   * signalement (lien dont la personne qui signale est membre, vérifié à la création du signalement).
   */
  private async context(row: AdminReportRow): Promise<AdminContextMessage[]> {
    if (!row.linkId || !row.messageId) return [];
    const messages = await this.reports.context(row.linkId, row.messageId, CONTEXT_AROUND);
    return Promise.all(
      messages.map(async (m) => {
        const reported = m.id === row.messageId;
        const author = m.authorKind === 'pet' ? 'minimoa' : m.authorKind === 'system' ? 'system' : m.authorId === row.reporter ? 'reporter' : m.authorId === row.targetUser ? 'target' : 'system';
        return {
          id: m.id,
          at: m.createdAt,
          author,
          kind: m.kind,
          body: m.kind === 'photo' ? null : m.body,
          photoUrl: reported && m.kind === 'photo' && m.mediaPath ? await this.storage.signedUrl(m.mediaPath, PHOTO_URL_SECONDS) : null,
          reported,
        } satisfies AdminContextMessage;
      }),
    );
  }

  async act(adminEmail: string, body: ModerationActionBody): Promise<AdminAuditEntry> {
    const now = this.clock.now();
    const at = now.toISOString();
    const report = body.reportId ? await this.reports.find(body.reportId) : null;
    if (body.reportId && !report) throw new DomainError('not_found', 'Ce signalement n’existe pas.');
    if (report && report.targetUser !== null && report.targetUser !== body.targetUserId) throw new DomainError('invalid', 'Ce signalement vise une autre personne.');
    const profile = await this.profiles.findById(body.targetUserId);
    if (!profile && body.action !== 'dismiss') throw new DomainError('not_found', 'Ce compte n’existe plus.');
    let until: string | null = null;

    switch (body.action) {
      case 'warn': {
        const sent = await this.mail.notify(body.targetUserId, moderationTextIn(profile?.locale ?? 'fr').warningEmail({ displayName: profile?.displayName ?? '', reason: body.reason }));
        if (!sent) this.logger.warn('avertissement non envoyé (pas d’adresse e-mail)');
        break;
      }
      case 'suspend': {
        until = body.days ? new Date(now.getTime() + body.days * 86_400_000).toISOString() : null;
        await this.suspensions.put({ userId: body.targetUserId, since: at, until, reason: body.reason, byEmail: adminEmail });
        this.gate.invalidate(body.targetUserId);
        break;
      }
      case 'lift': {
        if (!(await this.suspensions.find(body.targetUserId))) throw new DomainError('conflict', 'Ce compte n’est pas suspendu.');
        await this.suspensions.remove(body.targetUserId);
        this.gate.invalidate(body.targetUserId);
        break;
      }
      case 'delete': {
        const expected = profile?.displayName.trim().toLowerCase();
        if (!body.confirmName || body.confirmName.trim().toLowerCase() !== expected) {
          throw new DomainError('invalid', 'Recopie le prénom du compte pour confirmer la suppression.');
        }
        break;
      }
      case 'dismiss':
        break;
    }

    // Le signalement traité (ou, pour suspendre ou supprimer, tous ceux ouverts sur la personne), puis le journal :
    // avant la suppression, qui efface le compte (le journal garde le prénom recopié).
    if (body.action === 'suspend' || body.action === 'delete') {
      await this.reports.resolve({ reportId: null, targetUserId: body.targetUserId, at, by: adminEmail, resolution: body.action });
    }
    if (body.reportId) await this.reports.resolve({ reportId: body.reportId, targetUserId: body.targetUserId, at, by: adminEmail, resolution: body.action });
    const entry = await this.audit.append({
      at,
      adminEmail,
      action: body.action,
      targetUserId: body.targetUserId,
      targetName: profile?.displayName ?? null,
      reportId: body.reportId ?? null,
      reason: body.reason,
      until,
    });
    // Exclusion définitive (par défaut) : l'empreinte de l'identifiant de connexion, lue avant la suppression.
    if (body.action === 'delete' && body.ban !== false) await this.bans.ban(body.targetUserId);
    // Même chemin que « Supprimer mon compte » dans l'app : médias, puis compte d'authentification (cascade).
    if (body.action === 'delete') await this.deleteMe.execute(body.targetUserId);
    return presentAudit(entry);
  }

  async auditPage(query: AdminAuditQuery): Promise<AdminAudit> {
    const rows = await this.audit.page({ action: query.action, q: query.q }, query.cursor ?? null, query.limit + 1);
    const page = rows.slice(0, query.limit);
    const last = page[page.length - 1];
    return { items: page.map(presentAudit), nextCursor: rows.length > query.limit && last ? last.id : null };
  }

  async suspended(cursor: string | null, limit: number): Promise<AdminSuspensions> {
    const rows = await this.suspensions.listActive(this.clock.now().toISOString(), cursor, limit + 1);
    const page = rows.slice(0, limit);
    const names = new Map((await this.profiles.findByIds(page.map((s) => s.userId))).map((p) => [p.id, p.displayName]));
    const last = page[page.length - 1];
    return {
      items: page.map((s) => ({ userId: s.userId, displayName: names.get(s.userId) ?? '—', since: s.since, until: s.until, reason: s.reason })),
      nextCursor: rows.length > limit && last ? last.since : null,
    };
  }

  private async present(rows: readonly AdminReportRow[], now: string): Promise<AdminReportItem[]> {
    const ids = [...new Set(rows.flatMap((r) => [r.reporter, r.targetUser]).filter((x): x is string => x !== null))];
    const targets = [...new Set(rows.map((r) => r.targetUser).filter((x): x is string => x !== null))];
    const [people, counts, suspensions] = await Promise.all([
      this.profiles.findByIds(ids),
      this.reports.countsByTarget(targets),
      Promise.all(targets.map((t) => this.suspensions.find(t))),
    ]);
    const nameOf = new Map(people.map((p) => [p.id, p.displayName]));
    const activeSuspension = new Map(
      suspensions.filter((s): s is NonNullable<typeof s> => s !== null && (s.until === null || s.until > now)).map((s) => [s.userId, s.until]),
    );
    return rows.map((r) => {
      const age = hoursBetween(r.createdAt, r.handledAt ?? now);
      const person = (id: string | null) => (id && nameOf.has(id) ? { id, displayName: nameOf.get(id) as string } : null);
      const target = person(r.targetUser);
      const c = r.targetUser ? counts.get(r.targetUser) : undefined;
      const suspended = r.targetUser !== null && activeSuspension.has(r.targetUser);
      return {
        id: r.id,
        createdAt: r.createdAt,
        reason: r.reason,
        details: r.details,
        status: r.handledAt ? 'handled' : 'open',
        ageHours: age,
        overdue: r.handledAt === null && age > REPORT_TARGET_HOURS,
        reporter: person(r.reporter),
        target: target
          ? { ...target, suspended, suspendedUntil: suspended ? (activeSuspension.get(target.id) ?? null) : null, openReports: c?.open ?? 0, totalReports: c?.total ?? 0 }
          : null,
        linkId: r.linkId,
        hasMessage: r.messageId !== null,
        resolution: r.handledAt && r.resolution && r.handledBy ? { action: r.resolution, at: r.handledAt, by: r.handledBy } : null,
        priority: priorityOfRank(r.priority),
        source: r.source,
        category: r.category,
        review: r.review,
      } satisfies AdminReportItem;
    });
  }
}
