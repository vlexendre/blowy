import { Controller, Get, Inject, Param, Post } from '@nestjs/common';
import type { Invite, Link } from '@blowy/contract';
import { z } from 'zod';
import type { AuthUser } from '../../../integrations/auth/ports';
import { CurrentUser, Public } from '../../../shared/auth.guard';
import { ZodPipe } from '../../../shared/zod.pipe';
import { LinkPresenter } from '../../links/interface/link.presenter';
import { toPublicPet } from '../../pets/interface/pet.presenter';
import { Invites } from '../application/invites.usecase';

const Code = new ZodPipe(z.string().trim().min(4).max(32));

@Controller('v1/invites')
export class InvitesController {
  constructor(
    @Inject(Invites) private readonly invites: Invites,
    @Inject(LinkPresenter) private readonly links: LinkPresenter,
  ) {}

  @Public()
  @Get(':code')
  async get(@Param('code', Code) code: string): Promise<Invite> {
    const { profile, pet } = await this.invites.get(code);
    return { displayName: profile.displayName, pet: toPublicPet(pet, 'salut') };
  }

  @Post(':code/accept')
  async accept(@CurrentUser() user: AuthUser, @Param('code', Code) code: string): Promise<Link> {
    return this.links.link(await this.invites.accept(code, user.userId), user.userId);
  }
}
