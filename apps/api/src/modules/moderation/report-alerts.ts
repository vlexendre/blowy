/**
 * Alertes de l'équipe de modération (App Review 1.2 : « timely responses to concerns ») par le port `Mailer`, vers
 * `ADMIN_EMAILS` :
 * - nouveaux signalements : un récapitulatif au plus toutes les 15 minutes ; un signalement urgent (mineur, menace)
 *   part tout de suite ;
 * - signalements ouverts depuis plus de 24 h (délai cible) : remontés en priorité haute et annoncés une fois.
 * Chaque signalement est réservé en base avant l'envoi (`alerted_at`, `escalated_at`) : deux minuteurs simultanés
 * n'envoient pas deux fois la même alerte. Aucun contenu ni prénom dans l'e-mail.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { type TeamReportLine, moderationAlertEmail } from '@blowy/content';
import { REPORT_TARGET_HOURS, priorityOfRank, reportAlertDue } from '@blowy/domain';
import type { Env } from '../../config/env';
import type { Mailer } from '../../integrations/mailer/mailer';
import { ENV, MAILER, REPORTS } from '../../shared/tokens';
import type { ReportAlertRow, ReportsRepository } from '../safety/ports';

const BATCH = 100;

@Injectable()
export class ReportAlerts {
  private readonly logger = new Logger('Modération');

  constructor(
    @Inject(REPORTS) private readonly reports: ReportsRepository,
    @Inject(MAILER) private readonly mailer: Mailer,
    @Inject(ENV) private readonly env: Env,
  ) {}

  private get team(): string[] {
    return this.env.facturationAdmin.adminEmails;
  }

  /** Envoie le récapitulatif des nouveaux signalements s'il est dû. Rend le nombre de signalements annoncés. */
  async flush(now: Date): Promise<number> {
    if (this.team.length === 0) return 0;
    const pending = await this.reports.pendingAlerts();
    if (pending.count === 0) return 0;
    if (!reportAlertDue({ lastAlertAt: await this.reports.lastAlertAt(), now, urgent: pending.urgent })) return 0;
    const rows = await this.reports.claimUnalerted(now.toISOString(), BATCH);
    if (rows.length === 0) return 0;
    await this.send('new', rows, now);
    return rows.length;
  }

  /** Remonte et annonce les signalements ouverts depuis plus de 24 h. Rend leur nombre. */
  async escalate(now: Date): Promise<number> {
    const before = new Date(now.getTime() - REPORT_TARGET_HOURS * 3_600_000).toISOString();
    const rows = await this.reports.claimOverdue(before, now.toISOString(), BATCH);
    if (rows.length > 0 && this.team.length > 0) await this.send('overdue', rows, now);
    return rows.length;
  }

  private async send(kind: 'new' | 'overdue', rows: readonly ReportAlertRow[], now: Date): Promise<void> {
    const lines: TeamReportLine[] = [...rows]
      .sort((a, b) => b.priority - a.priority || a.createdAt.localeCompare(b.createdAt))
      .map((r) => ({ id: r.id, priority: priorityOfRank(r.priority), reason: r.reason, source: r.source, category: r.category, ageHours: (now.getTime() - Date.parse(r.createdAt)) / 3_600_000 }));
    const mail = moderationAlertEmail({ kind, reports: lines, adminUrl: this.env.audit.adminUrl, targetHours: REPORT_TARGET_HOURS });
    for (const to of this.team) {
      try {
        await this.mailer.send({ to, ...mail });
      } catch (err) {
        this.logger.warn(`alerte de modération non envoyée : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
      }
    }
  }
}
