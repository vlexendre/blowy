import { Body, Controller, Delete, Get, Inject, Param, Post } from '@nestjs/common';
import { BlockBody, type Blocked, ReportBody, Uuid } from '@blowy/contract';
import type { z } from 'zod';
import type { AuthUser } from '../../../integrations/auth/ports';
import { CurrentUser } from '../../../shared/auth.guard';
import { ZodPipe } from '../../../shared/zod.pipe';
import { Blocks } from '../application/blocks.usecase';
import { Report } from '../application/report.usecase';

@Controller('v1')
export class SafetyController {
  constructor(
    @Inject(Blocks) private readonly blocks: Blocks,
    @Inject(Report) private readonly report: Report,
  ) {}

  @Post('blocks')
  async block(@CurrentUser() user: AuthUser, @Body(new ZodPipe(BlockBody)) body: z.infer<typeof BlockBody>): Promise<{ ok: true }> {
    await this.blocks.block(user.userId, body.userId);
    return { ok: true };
  }

  @Get('blocks')
  async list(@CurrentUser() user: AuthUser): Promise<Blocked[]> {
    return this.blocks.list(user.userId);
  }

  @Delete('blocks/:userId')
  async unblock(@CurrentUser() user: AuthUser, @Param('userId', new ZodPipe(Uuid)) userId: string): Promise<{ ok: true }> {
    await this.blocks.unblock(user.userId, userId);
    return { ok: true };
  }

  @Post('reports')
  async create(@CurrentUser() user: AuthUser, @Body(new ZodPipe(ReportBody)) body: z.infer<typeof ReportBody>): Promise<{ ok: true }> {
    await this.report.execute(user.userId, body);
    return { ok: true };
  }
}
