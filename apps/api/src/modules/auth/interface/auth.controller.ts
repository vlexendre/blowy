import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Post } from '@nestjs/common';
import { DeviceSessionListSchema, SessionSchema, SignInRequestSchema, UuidSchema, type SignInRequest } from '@blowy/api-contract';
import { Public } from '../../../shared/interface/auth.guard.js';
import { CurrentUser } from '../../../shared/interface/decorators.js';
import type { AuthenticatedUser } from '../../../shared/interface/request-context.js';
import { ZodPipe } from '../../../shared/interface/zod.pipe.js';
import { ListSessionsQuery, RevokeSessionUseCase } from '../application/manage-sessions.use-case.js';
import { SignInUseCase } from '../application/sign-in.use-case.js';

@Controller('v1/auth')
export class AuthController {
  constructor(
    @Inject(SignInUseCase) private readonly signIn: SignInUseCase,
    @Inject(ListSessionsQuery) private readonly listSessions: ListSessionsQuery,
    @Inject(RevokeSessionUseCase) private readonly revokeSession: RevokeSessionUseCase,
  ) {}

  @Public()
  @Post('sessions')
  async createSession(@Body(new ZodPipe(SignInRequestSchema)) body: SignInRequest) {
    return SessionSchema.parse(await this.signIn.execute(body));
  }

  @Get('sessions')
  async sessions(@CurrentUser() user: AuthenticatedUser) {
    return DeviceSessionListSchema.parse({ items: await this.listSessions.execute(user.userId, user.sessionId) });
  }

  /** Déconnexion de l'appareil courant. */
  @Delete('sessions/current')
  @HttpCode(204)
  async logout(@CurrentUser() user: AuthenticatedUser) {
    await this.revokeSession.execute(user.userId, user.sessionId);
  }

  @Delete('sessions/:id')
  @HttpCode(204)
  async revoke(@CurrentUser() user: AuthenticatedUser, @Param('id', new ZodPipe(UuidSchema)) id: string) {
    await this.revokeSession.execute(user.userId, id);
  }
}
