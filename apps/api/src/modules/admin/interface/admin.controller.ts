import { Body, Controller, Get, HttpCode, Inject, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  type AdminAiCosts,
  AdminAiCostsQuery,
  type AdminAudit,
  AdminAuditQuery,
  type AdminFunnel,
  type AdminMe,
  type AdminMinimoas,
  type AdminOverview,
  AdminPageQuery,
  type AdminReportDetail,
  type AdminReports,
  AdminReportsQuery,
  type AdminSuspensions,
  ModerationActionBody,
} from '@blowy/contract';
import { z } from 'zod';
import type { AuthUser } from '../../../integrations/auth/ports';
import { CurrentUser } from '../../../shared/auth.guard';
import { ZodPipe } from '../../../shared/zod.pipe';
import { AiCosts, Dashboards } from '../application/dashboards.usecases';
import { Moderation } from '../application/moderation.usecases';
import { AdminGuard } from './admin.guard';

const ReportId = z.string().regex(/^\d{1,18}$/);

/**
 * Administration : lecture seule, sauf la modération (`POST /admin/moderation/actions`).
 * Chaque route exige un jeton valide (garde globale) ET une adresse de `ADMIN_EMAILS` (AdminGuard).
 */
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    @Inject(Dashboards) private readonly dashboards: Dashboards,
    @Inject(Moderation) private readonly moderation: Moderation,
    @Inject(AiCosts) private readonly aiCosts: AiCosts,
  ) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser): AdminMe {
    return { email: (user.email ?? '').toLowerCase(), admin: true };
  }

  @Get('overview')
  overview(): Promise<AdminOverview> {
    return this.dashboards.overview();
  }

  @Get('minimoas')
  minimoas(): Promise<AdminMinimoas> {
    return this.dashboards.minimoas();
  }

  @Get('funnel')
  funnel(): Promise<AdminFunnel> {
    return this.dashboards.funnel();
  }

  @Get('reports')
  reports(@Query(new ZodPipe(AdminReportsQuery)) query: z.infer<typeof AdminReportsQuery>): Promise<AdminReports> {
    return this.moderation.list(query);
  }

  @Get('reports/:id')
  report(@Param('id', new ZodPipe(ReportId)) id: string): Promise<AdminReportDetail> {
    return this.moderation.detail(id);
  }

  @Post('moderation/actions')
  @HttpCode(200)
  async act(@CurrentUser() user: AuthUser, @Body(new ZodPipe(ModerationActionBody)) body: z.infer<typeof ModerationActionBody>) {
    const entry = await this.moderation.act((user.email ?? '').toLowerCase(), body);
    return { ok: true as const, entry };
  }

  @Get('audit')
  audit(@Query(new ZodPipe(AdminAuditQuery)) query: z.infer<typeof AdminAuditQuery>): Promise<AdminAudit> {
    return this.moderation.auditPage(query);
  }

  @Get('suspensions')
  suspensions(@Query(new ZodPipe(AdminPageQuery)) query: z.infer<typeof AdminPageQuery>): Promise<AdminSuspensions> {
    return this.moderation.suspended(query.cursor ?? null, query.limit);
  }

  @Get('ai-costs')
  ai(@Query(new ZodPipe(AdminAiCostsQuery)) query: z.infer<typeof AdminAiCostsQuery>): Promise<AdminAiCosts> {
    return this.aiCosts.execute(query.days);
  }
}
