import { Body, Controller, Get, HttpCode, Inject, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  type AdminCreators,
  type AdminGrowth,
  type CodeLookup,
  CreateCreatorBody,
  FirstOpenBody,
  ShareBody,
  SignupBody,
  UpdateCreatorBody,
} from '@blowy/contract';
import { normalizeCode } from '@blowy/domain';
import { z } from 'zod';
import { Public } from '../../../shared/auth.guard';
import { DomainError, errorText } from '../../../shared/errors';
import { RateLimit } from '../../../shared/user-rate-limit';
import { ZodPipe } from '../../../shared/zod.pipe';
import { AdminGuard } from '../../admin/interface/admin.guard';
import { GrowthAdmin } from '../application/growth-admin';
import { Growth } from '../application/growth';
import { Codes } from '../application/codes';

const Code = new ZodPipe(z.string().trim().regex(/^[A-Za-z0-9_-]{3,32}$/));
const CreatorCode = new ZodPipe(z.string().trim().regex(/^[A-Za-z0-9]{3,20}$/).transform((s) => s.toUpperCase()));

/**
 * Mesure de l'entonnoir sans SDK tiers (docs/VIRALITE.md) : premier lancement et inscription (compteurs du jour, sans
 * identifiant d'appareil), partages, et ce qu'est un code tapé ou lu dans un lien.
 */
@Controller('v1')
export class GrowthController {
  constructor(
    @Inject(Growth) private readonly growth: Growth,
    @Inject(Codes) private readonly codes: Codes,
  ) {}

  @Public()
  @RateLimit('lookup')
  @Post('growth/open')
  @HttpCode(200)
  async open(@Body(new ZodPipe(FirstOpenBody)) body: z.infer<typeof FirstOpenBody>): Promise<{ ok: true }> {
    await this.growth.arrival('first_open', body);
    return { ok: true };
  }

  @RateLimit('write')
  @Post('growth/signup')
  @HttpCode(200)
  async signup(@Body(new ZodPipe(SignupBody)) body: z.infer<typeof SignupBody>): Promise<{ ok: true }> {
    await this.growth.arrival('signup', body);
    return { ok: true };
  }

  @RateLimit('write')
  @Post('growth/share')
  @HttpCode(200)
  async share(@Body(new ZodPipe(ShareBody)) body: z.infer<typeof ShareBody>): Promise<{ ok: true }> {
    await this.growth.share(body.kind);
    return { ok: true };
  }

  /** Public : un code tapé à l'inscription (« Un code ? ») ou la page d'un créateur (`?page=c` compte la visite). */
  @Public()
  @RateLimit('lookup')
  @Get('codes/:code')
  async code(@Param('code', Code) code: string, @Query('page') page?: string): Promise<CodeLookup> {
    const found = await this.codes.lookup(code);
    if (page === 'c' && found?.kind === 'creator') await this.growth.visit('c', found.code);
    if (!found) throw new DomainError('not_found', errorText('codeNotFound'));
    return found;
  }
}

/** Administration de la croissance : le tableau et les codes des créateurs. */
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminGrowthController {
  constructor(@Inject(GrowthAdmin) private readonly admin: GrowthAdmin) {}

  @Get('growth')
  report(): Promise<AdminGrowth> {
    return this.admin.report();
  }

  @Get('creators')
  creators(): Promise<AdminCreators> {
    return this.admin.listCreators();
  }

  @Post('creators')
  @HttpCode(200)
  create(@Body(new ZodPipe(CreateCreatorBody)) body: z.infer<typeof CreateCreatorBody>): Promise<AdminCreators> {
    return this.admin.createCreator(body.code, body.name);
  }

  @Post('creators/:code')
  @HttpCode(200)
  update(@Param('code', CreatorCode) code: string, @Body(new ZodPipe(UpdateCreatorBody)) body: z.infer<typeof UpdateCreatorBody>): Promise<AdminCreators> {
    return this.admin.updateCreator(normalizeCode(code), body);
  }
}
