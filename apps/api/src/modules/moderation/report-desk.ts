/**
 * Bureau des signalements : le seul endroit qui crée un signalement, qu'il vienne d'une personne (« Signaler ») ou du
 * filtre automatique (message bloqué ou signalé, photo de profil retirée). Il applique les règles d'escalade du domaine :
 * - priorité (`reportPriority`) : urgente pour un mineur ou une menace, haute pour la haine, l'arnaque, ou un compte
 *   signalé par au moins 3 personnes différentes ; la priorité de tous les signalements ouverts du compte monte avec ;
 * - suspension automatique de 72 h en attendant la modération (`autoSuspensionHours`) dans deux cas seulement :
 *   vocabulaire pédocriminel explicite repéré par le filtre, ou au moins deux personnes différentes qui signalent un
 *   compte comme mineur. Écrite dans le journal de modération (« filtre automatique »), levée ou confirmée par l'équipe ;
 * - un signalement urgent prévient l'équipe tout de suite ; les autres partent en récapitulatif (minuteur).
 * Le monde d'exemple du compte de revue d'Apple est mis à part : signalement enregistré (l'examinateur le voit
 * marcher), mais ni priorité, ni suspension, ni alerte, ni statistique.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { type ModerationCategory, autoSuspensionHours, priorityRank, reportPriority } from '@blowy/domain';
import type { Clock } from '../../shared/clock';
import { CLOCK, PROFILES, REPORTS } from '../../shared/tokens';
import { AccountGate } from '../admin/application/account-gate';
import type { AuditLogRepository, SuspensionsRepository } from '../admin/ports';
import { AUDIT_LOG, SUSPENSIONS } from '../admin/tokens';
import type { ProfilesRepository } from '../me/ports';
import type { ReportsRepository } from '../safety/ports';
import { ReportAlerts } from './report-alerts';

/** Nom écrit dans le journal de modération pour une action automatique. */
export const AUTOMATIC_MODERATOR = 'filtre automatique';

export interface FileReportInput {
  reporter: string | null;
  targetUser: string;
  linkId?: string | null;
  messageId?: string | null;
  reason: string;
  details: string | null;
  source: 'person' | 'filter';
  /** Catégorie trouvée par le filtre (dans le message, la note ou la photo) : elle décide de la priorité. */
  category: ModerationCategory | null;
  /** Libellé gardé pour l'équipe s'il diffère de `category` (photo : `photo_sexual`…). */
  label?: string;
  /** Vocabulaire pédocriminel explicite (filtre) : suspension automatique. */
  explicitMinor?: boolean;
}

@Injectable()
export class ReportDesk {
  private readonly logger = new Logger('Signalements');

  constructor(
    @Inject(REPORTS) private readonly reports: ReportsRepository,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(SUSPENSIONS) private readonly suspensions: SuspensionsRepository,
    @Inject(AUDIT_LOG) private readonly audit: AuditLogRepository,
    @Inject(AccountGate) private readonly gate: AccountGate,
    @Inject(ReportAlerts) private readonly alerts: ReportAlerts,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async file(input: FileReportInput): Promise<void> {
    const now = this.clock.now();
    const people = await this.profiles.findByIds([input.targetUser, ...(input.reporter ? [input.reporter] : [])]);
    const target = people.find((p) => p.id === input.targetUser) ?? null;
    const review = people.some((p) => !!p.reviewWorld);
    await this.reports.add({
      reporter: input.reporter,
      targetUser: input.targetUser,
      linkId: input.linkId ?? null,
      messageId: input.messageId ?? null,
      reason: input.reason,
      details: input.details,
      createdAt: now.toISOString(),
      source: input.source,
      priority: 0,
      category: input.label ?? input.category,
      review,
      alertedAt: null,
      escalatedAt: null,
    });
    if (review) return;

    const counts = await this.reports.openReportersOf(input.targetUser);
    const priority = priorityRank(reportPriority({ reason: input.reason, category: input.category, distinctReporters: counts.distinct, distinctMinorReporters: counts.minor }));
    if (priority > 0) await this.reports.raisePriority(input.targetUser, priority);

    const hours = autoSuspensionHours({ explicitMinor: input.explicitMinor === true, distinctMinorReporters: counts.minor });
    if (hours !== null && target) await this.suspendPendingReview(target.id, target.displayName, hours, input, now);
    if (priority >= 2) await this.alerts.flush(now);
  }

  private async suspendPendingReview(userId: string, name: string, hours: number, input: FileReportInput, now: Date): Promise<void> {
    const current = await this.suspensions.find(userId);
    if (current && (current.until === null || Date.parse(current.until) > now.getTime())) return;
    const at = now.toISOString();
    const until = new Date(now.getTime() + hours * 3_600_000).toISOString();
    const reason = input.explicitMinor
      ? 'Suspension automatique en attendant la modération : contenu pédocriminel repéré par le filtre.'
      : 'Suspension automatique en attendant la modération : signalé comme mineur par plusieurs personnes.';
    await this.suspensions.put({ userId, since: at, until, reason, byEmail: AUTOMATIC_MODERATOR });
    this.gate.invalidate(userId);
    await this.audit.append({ at, adminEmail: AUTOMATIC_MODERATOR, action: 'suspend', targetUserId: userId, targetName: name, reportId: null, reason, until });
    this.logger.warn(`compte suspendu ${hours} h en attendant la modération`);
  }
}
