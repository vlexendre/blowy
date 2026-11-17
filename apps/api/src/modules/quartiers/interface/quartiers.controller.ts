import { Body, Controller, Get, HttpCode, Inject, Param, Post, UseGuards } from '@nestjs/common';
import {
  AdminQuartierSettingsBody,
  type AdminQuartiers,
  type MyQuartier,
  type QuartierConfirmed,
  QuartierJoinBody,
  type QuartierJoined,
  QuartierTokenBody,
  QuizShareBody,
  QuizStartBody,
  QuizSubmitBody,
  type QuizResultDto,
  ZoneIdZ,
  type ZoneStatus,
} from '@blowy/contract';
import type { Locale } from '@blowy/domain';
import { z } from 'zod';
import type { AuthUser } from '../../../integrations/auth/ports';
import { CurrentUser, Public } from '../../../shared/auth.guard';
import { ReqLocale } from '../../../shared/locale';
import { RateLimit } from '../../../shared/user-rate-limit';
import { ZodPipe } from '../../../shared/zod.pipe';
import { AdminGuard } from '../../admin/interface/admin.guard';
import { Quartiers } from '../application/quartiers';
import { Quiz } from '../application/quiz';

const Code = new ZodPipe(z.string().trim().regex(/^[A-Za-z0-9]{3,16}$/));
const Zone = new ZodPipe(ZoneIdZ);

/** « Quel minimoa es-tu ? » et « Ouvre ton quartier » (docs/VIRALITE.md) : routes publiques du site, et la tienne. */
@Controller('v1')
export class QuartiersController {
  constructor(
    @Inject(Quiz) private readonly quiz: Quiz,
    @Inject(Quartiers) private readonly quartiers: Quartiers,
  ) {}

  @Public()
  @RateLimit('lookup')
  @Post('quiz/start')
  @HttpCode(200)
  async start(@Body(new ZodPipe(QuizStartBody)) body: z.infer<typeof QuizStartBody>): Promise<{ ok: true }> {
    await this.quiz.start(body.ref);
    return { ok: true };
  }

  @Public()
  @RateLimit('lookup')
  @Post('quiz/results')
  @HttpCode(200)
  submit(@Body(new ZodPipe(QuizSubmitBody)) body: QuizSubmitBody, @ReqLocale() locale: Locale): Promise<QuizResultDto> {
    return this.quiz.submit(body, locale);
  }

  @Public()
  @RateLimit('lookup')
  @Get('quiz/results/:code')
  result(@Param('code', Code) code: string): Promise<QuizResultDto> {
    return this.quiz.result(code);
  }

  @Public()
  @RateLimit('lookup')
  @Post('quiz/share')
  @HttpCode(200)
  async share(@Body(new ZodPipe(QuizShareBody)) body: z.infer<typeof QuizShareBody>): Promise<{ ok: true }> {
    await this.quiz.share(body.kind);
    return { ok: true };
  }

  @Public()
  @RateLimit('lookup')
  @Get('quartiers/:zone')
  status(@Param('zone', Zone) zone: string, @ReqLocale() locale: Locale): Promise<ZoneStatus> {
    return this.quartiers.status(zone, locale);
  }

  @Public()
  @RateLimit('lookup')
  @Post('quartiers/join')
  @HttpCode(200)
  join(@Body(new ZodPipe(QuartierJoinBody)) body: QuartierJoinBody): Promise<QuartierJoined> {
    return this.quartiers.join(body);
  }

  @Public()
  @RateLimit('lookup')
  @Post('quartiers/confirm')
  @HttpCode(200)
  confirm(@Body(new ZodPipe(QuartierTokenBody)) body: z.infer<typeof QuartierTokenBody>, @ReqLocale() locale: Locale): Promise<QuartierConfirmed> {
    return this.quartiers.confirm(body.token, locale);
  }

  @Public()
  @RateLimit('lookup')
  @Post('quartiers/unsubscribe')
  @HttpCode(200)
  async unsubscribe(@Body(new ZodPipe(QuartierTokenBody)) body: z.infer<typeof QuartierTokenBody>): Promise<{ ok: true }> {
    await this.quartiers.unsubscribe(body.token);
    return { ok: true };
  }

  @Get('me/quartier')
  mine(@CurrentUser() user: AuthUser, @ReqLocale() locale: Locale): Promise<MyQuartier> {
    return this.quartiers.mine(user.userId, locale);
  }
}

/** Administration des quartiers : compteurs réels, seuil, ouverture à la main. */
@Controller('admin/quartiers')
@UseGuards(AdminGuard)
export class AdminQuartiersController {
  constructor(@Inject(Quartiers) private readonly quartiers: Quartiers) {}

  @Get()
  list(@ReqLocale() locale: Locale): Promise<AdminQuartiers> {
    return this.quartiers.adminList(locale);
  }

  @Post('settings')
  @HttpCode(200)
  settings(@Body(new ZodPipe(AdminQuartierSettingsBody)) body: z.infer<typeof AdminQuartierSettingsBody>, @ReqLocale() locale: Locale): Promise<AdminQuartiers> {
    return this.quartiers.setThreshold(body.threshold, locale);
  }

  @Post(':zone/open')
  @HttpCode(200)
  open(@Param('zone', Zone) zone: string, @ReqLocale() locale: Locale): Promise<AdminQuartiers> {
    return this.quartiers.adminOpen(zone, locale);
  }
}
