import { Body, Controller, Get, HttpCode, Inject, Post, Query } from '@nestjs/common';
import { CheminAnswersBody, type CheminMap, type CheminResult, type CheminSessionResponse, CheminSessionQuery, type Profil } from '@blowy/contract';
import type { Locale } from '@blowy/domain';
import type { AuthUser } from '../../../integrations/auth/ports';
import { CurrentUser } from '../../../shared/auth.guard';
import { ClientApp, type ClientAppInfo } from '../../../shared/client-app';
import { ReqLocale } from '../../../shared/locale';
import { RateLimit } from '../../../shared/user-rate-limit';
import { ZodPipe } from '../../../shared/zod.pipe';
import { CheminService, parseFormats } from '../application/chemin.service';
import { ProfilService } from '../application/profil.service';

/** Ton chemin (docs/CHEMIN.md) : carte, séance du jour, réponses, profil. */
@Controller('v1')
export class CheminController {
  constructor(
    @Inject(CheminService) private readonly chemin: CheminService,
    @Inject(ProfilService) private readonly profil: ProfilService,
  ) {}

  @Get('chemin')
  map(@CurrentUser() user: AuthUser, @ReqLocale() locale: Locale, @ClientApp() client: ClientAppInfo): Promise<CheminMap> {
    return this.chemin.map(user.userId, locale, client);
  }

  @Get('chemin/seance')
  session(
    @CurrentUser() user: AuthUser,
    @ReqLocale() locale: Locale,
    @ClientApp() client: ClientAppInfo,
    @Query(new ZodPipe(CheminSessionQuery)) query: CheminSessionQuery,
  ): Promise<CheminSessionResponse> {
    return this.chemin.session(user.userId, locale, client, parseFormats(query.formats));
  }

  @RateLimit('write')
  @Post('chemin/reponses')
  @HttpCode(200)
  answer(@CurrentUser() user: AuthUser, @ReqLocale() locale: Locale, @ClientApp() client: ClientAppInfo, @Body(new ZodPipe(CheminAnswersBody)) body: CheminAnswersBody): Promise<CheminResult> {
    return this.chemin.answer(user.userId, locale, client, body);
  }

  @Get('profil')
  get(@CurrentUser() user: AuthUser, @ReqLocale() locale: Locale): Promise<Profil> {
    return this.profil.get(user.userId, locale);
  }
}
