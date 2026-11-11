import { Body, Controller, Delete, Get, Inject, Patch, Post } from '@nestjs/common';
import { ConfirmUploadBody, type Me, OnboardBody, UpdateMeBody, UploadTicketBody, type UploadTicket } from '@blowy/contract';
import type { z } from 'zod';
import type { AuthUser } from '../../../integrations/auth/ports';
import { CurrentUser } from '../../../shared/auth.guard';
import { ZodPipe } from '../../../shared/zod.pipe';
import { Avatar } from '../application/avatar.usecase';
import { DeleteMe } from '../application/delete-me.usecase';
import { GetMe } from '../application/get-me.usecase';
import { Onboard } from '../application/onboard.usecase';
import { UpdateMe } from '../application/update-me.usecase';
import { MePresenter } from './me.presenter';

@Controller('v1/me')
export class MeController {
  constructor(
    @Inject(GetMe) private readonly getMe: GetMe,
    @Inject(Onboard) private readonly onboard: Onboard,
    @Inject(UpdateMe) private readonly updateMe: UpdateMe,
    @Inject(DeleteMe) private readonly deleteMe: DeleteMe,
    @Inject(Avatar) private readonly avatar: Avatar,
    @Inject(MePresenter) private readonly presenter: MePresenter,
  ) {}

  @Get()
  async get(@CurrentUser() user: AuthUser): Promise<Me> {
    return this.me(user.userId);
  }

  @Post('onboard')
  async create(@CurrentUser() user: AuthUser, @Body(new ZodPipe(OnboardBody)) body: z.infer<typeof OnboardBody>): Promise<Me> {
    await this.onboard.execute({ userId: user.userId, email: user.email, body });
    return this.me(user.userId);
  }

  @Patch()
  async update(@CurrentUser() user: AuthUser, @Body(new ZodPipe(UpdateMeBody)) body: z.infer<typeof UpdateMeBody>): Promise<Me> {
    await this.updateMe.execute(user.userId, body);
    return this.me(user.userId);
  }

  @Delete()
  async remove(@CurrentUser() user: AuthUser): Promise<{ ok: true }> {
    await this.deleteMe.execute(user.userId);
    return { ok: true };
  }

  @Post('avatar/ticket')
  async avatarTicket(@CurrentUser() user: AuthUser, @Body(new ZodPipe(UploadTicketBody)) body: z.infer<typeof UploadTicketBody>): Promise<UploadTicket> {
    return this.avatar.ticket(user.userId, body.contentType);
  }

  @Post('avatar')
  async setAvatar(@CurrentUser() user: AuthUser, @Body(new ZodPipe(ConfirmUploadBody)) body: z.infer<typeof ConfirmUploadBody>): Promise<Me> {
    await this.avatar.confirm(user.userId, body.path);
    return this.me(user.userId);
  }

  private async me(userId: string): Promise<Me> {
    return this.presenter.present(await this.getMe.execute(userId));
  }
}
