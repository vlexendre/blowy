import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AdminCloseGroupBody,
  type AdminGroup,
  CreateGroupBody,
  type GroupAction,
  type GroupDetail,
  type GroupInviteLink,
  type GroupPreview,
  GroupJokerBody,
  type GroupMessagesPage,
  GroupReportBody,
  type Groups,
  InviteToGroupBody,
  Iso,
  RenameGroupBody,
  SendGroupMessageBody,
  type Together,
  TogetherBody,
  type TogetherResult,
  Uuid,
} from '@blowy/contract';
import { z } from 'zod';
import type { AuthUser } from '../../../integrations/auth/ports';
import { CurrentUser, Public } from '../../../shared/auth.guard';
import { DomainError } from '../../../shared/errors';
import { RateLimit } from '../../../shared/user-rate-limit';
import { ZodPipe } from '../../../shared/zod.pipe';
import { AdminGuard } from '../../admin/interface/admin.guard';
import { GroupChat } from '../application/group-chat';
import { GroupCore, groupError } from '../application/group-core';
import { GroupsUseCases } from '../application/groups.usecases';
import { TogetherUseCases } from '../application/together';

const GroupId = new ZodPipe(Uuid);
const Before = new ZodPipe(Iso.datetime({ offset: true }).optional());
const HabitId = new ZodPipe(z.string().min(1).max(40));
const LinkCode = new ZodPipe(z.string().trim().regex(/^[A-Za-z0-9]{4,16}$/));

/** Groupes (spéc §26) : `/v1/groups`. Chaque route vérifie que la personne est membre (ou invitée pour répondre). */
@Controller('v1/groups')
export class GroupsController {
  constructor(
    @Inject(GroupsUseCases) private readonly groups: GroupsUseCases,
    @Inject(GroupChat) private readonly chat: GroupChat,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<Groups> {
    return this.groups.list(user.userId);
  }

  @Post()
  @RateLimit('write')
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(CreateGroupBody)) body: z.infer<typeof CreateGroupBody>,
  ): Promise<GroupDetail> {
    return this.groups.create(user.userId, body);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id', GroupId) id: string): Promise<GroupDetail> {
    return this.groups.detail(user.userId, id);
  }

  @Patch(':id')
  @RateLimit('write')
  rename(
    @CurrentUser() user: AuthUser,
    @Param('id', GroupId) id: string,
    @Body(new ZodPipe(RenameGroupBody)) body: z.infer<typeof RenameGroupBody>,
  ): Promise<GroupAction> {
    return this.groups.rename(user.userId, id, body.name);
  }

  @Post(':id/invite')
  @RateLimit('write')
  invite(
    @CurrentUser() user: AuthUser,
    @Param('id', GroupId) id: string,
    @Body(new ZodPipe(InviteToGroupBody)) body: z.infer<typeof InviteToGroupBody>,
  ): Promise<GroupDetail> {
    return this.groups.invite(user.userId, id, body.memberIds);
  }

  /** Le lien d'invitation du groupe (code créé à la première demande). */
  @Post(':id/link')
  @RateLimit('write')
  @HttpCode(200)
  link(@CurrentUser() user: AuthUser, @Param('id', GroupId) id: string): Promise<GroupInviteLink> {
    return this.groups.inviteLink(user.userId, id);
  }

  /** Un nouveau code (créateur) : l'ancien lien ne marche plus. */
  @Post(':id/link/reset')
  @RateLimit('write')
  @HttpCode(200)
  resetLink(@CurrentUser() user: AuthUser, @Param('id', GroupId) id: string): Promise<GroupInviteLink> {
    return this.groups.resetInviteLink(user.userId, id);
  }

  @Post(':id/accept')
  @RateLimit('write')
  accept(@CurrentUser() user: AuthUser, @Param('id', GroupId) id: string): Promise<GroupDetail> {
    return this.groups.accept(user.userId, id);
  }

  @Post(':id/decline')
  @HttpCode(200)
  async decline(@CurrentUser() user: AuthUser, @Param('id', GroupId) id: string): Promise<{ ok: true }> {
    await this.groups.decline(user.userId, id);
    return { ok: true };
  }

  @Post(':id/leave')
  @HttpCode(200)
  async leave(@CurrentUser() user: AuthUser, @Param('id', GroupId) id: string): Promise<{ ok: true }> {
    await this.groups.leave(user.userId, id);
    return { ok: true };
  }

  @Post(':id/wake')
  @RateLimit('write')
  wake(@CurrentUser() user: AuthUser, @Param('id', GroupId) id: string): Promise<GroupAction> {
    return this.groups.wake(user.userId, id);
  }

  @Get(':id/messages')
  messages(
    @CurrentUser() user: AuthUser,
    @Param('id', GroupId) id: string,
    @Query('before', Before) before?: string,
  ): Promise<GroupMessagesPage> {
    return this.chat.page(user.userId, id, before ? new Date(before).toISOString() : null);
  }

  @Post(':id/messages')
  @RateLimit('message')
  send(
    @CurrentUser() user: AuthUser,
    @Param('id', GroupId) id: string,
    @Body(new ZodPipe(SendGroupMessageBody)) body: z.infer<typeof SendGroupMessageBody>,
  ): Promise<GroupAction> {
    return this.chat.send(user.userId, id, body.body);
  }

  @Post(':id/read')
  @HttpCode(200)
  async read(@CurrentUser() user: AuthUser, @Param('id', GroupId) id: string): Promise<{ ok: true }> {
    await this.chat.read(user.userId, id);
    return { ok: true };
  }

  @Post(':id/joker')
  @RateLimit('write')
  joker(
    @CurrentUser() user: AuthUser,
    @Param('id', GroupId) id: string,
    @Body(new ZodPipe(GroupJokerBody)) body: z.infer<typeof GroupJokerBody>,
  ): Promise<GroupAction> {
    return this.groups.joker(user.userId, id, body.day);
  }

  @Post(':id/report')
  @RateLimit('write')
  @HttpCode(200)
  async report(
    @CurrentUser() user: AuthUser,
    @Param('id', GroupId) id: string,
    @Body(new ZodPipe(GroupReportBody)) body: z.infer<typeof GroupReportBody>,
  ): Promise<{ ok: true }> {
    await this.groups.report(user.userId, id, body);
    return { ok: true };
  }
}

/**
 * Lien d'invitation d'un groupe (`minimoa.app/g/<code>`) : la page publique (nom, habitude, jours tenus, nombre de
 * membres ; jamais de prénom ni de position) et « rejoindre ».
 */
@Controller('v1/groups/code')
export class GroupCodesController {
  constructor(@Inject(GroupsUseCases) private readonly groups: GroupsUseCases) {}

  @Public()
  @RateLimit('lookup')
  @Get(':code')
  preview(@Param('code', LinkCode) code: string): Promise<GroupPreview> {
    return this.groups.preview(code);
  }

  @Post(':code/join')
  @RateLimit('write')
  @HttpCode(200)
  join(@CurrentUser() user: AuthUser, @Param('code', LinkCode) code: string): Promise<GroupDetail> {
    return this.groups.joinByCode(user.userId, code);
  }
}

/** « La tenir ensemble » : `/v1/together`. Un nombre seulement, jamais d'identité ni de position. */
@Controller('v1/together')
export class TogetherController {
  constructor(@Inject(TogetherUseCases) private readonly together: TogetherUseCases) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<Together> {
    return this.together.suggestions(user.userId);
  }

  @Post()
  @RateLimit('write')
  @HttpCode(200)
  propose(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(TogetherBody)) body: z.infer<typeof TogetherBody>,
  ): Promise<TogetherResult> {
    return this.together.propose(user.userId, body.habitId);
  }

  @Delete(':habitId')
  async withdraw(
    @CurrentUser() user: AuthUser,
    @Param('habitId', HabitId) habitId: string,
  ): Promise<{ ok: true }> {
    await this.together.withdraw(user.userId, habitId);
    return { ok: true };
  }
}

/** Administration des groupes (modération) : voir un groupe signalé, le fermer. Aucune lecture des messages ici. */
@Controller('admin/groups')
@UseGuards(AdminGuard)
export class AdminGroupsController {
  constructor(@Inject(GroupCore) private readonly core: GroupCore) {}

  private async view(id: string): Promise<AdminGroup> {
    const group = await this.core.groups.find(id);
    if (!group)
      throw new DomainError(
        'not_found',
        groupError((t) => t.notFound),
      );
    const members = await this.core.members.listForGroups([id]);
    return {
      id: group.id,
      name: group.name,
      kind: group.kind,
      status: group.status,
      memberCount: members.filter((m) => m.status === 'active').length,
      createdAt: group.createdAt,
      closedAt: group.closedAt,
      closedReason: group.closedReason,
    };
  }

  @Get(':id')
  get(@Param('id', GroupId) id: string): Promise<AdminGroup> {
    return this.view(id);
  }

  @Post(':id/close')
  @HttpCode(200)
  async close(
    @Param('id', GroupId) id: string,
    @Body(new ZodPipe(AdminCloseGroupBody)) body: z.infer<typeof AdminCloseGroupBody>,
  ): Promise<AdminGroup> {
    const group = await this.core.groups.find(id);
    if (!group)
      throw new DomainError(
        'not_found',
        groupError((t) => t.notFound),
      );
    if (group.status !== 'closed') {
      const at = this.core.now().toISOString();
      await this.core.groups.update(id, {
        status: 'closed',
        closedAt: at,
        closedReason: body.reason,
        updatedAt: at,
      });
      await this.core.event(id, 'closed', {});
    }
    return this.view(id);
  }
}
