import { Inject, Injectable } from '@nestjs/common';
import type { Clock } from '../../../shared/clock';
import { DomainError, errorText } from '../../../shared/errors';
import { BLOCKS, CLOCK, IDS, LINKS, PROFILES } from '../../../shared/tokens';
import type { Ids } from '../../../shared/ids';
import { leaveGroupsSharedWith } from '../../groups/application/group-exits';
import type { GroupMembersRepository, GroupMessagesRepository } from '../../groups/ports';
import { GROUP_MEMBERS, GROUP_MESSAGES } from '../../groups/tokens';
import type { LinksRepository } from '../../links/ports';
import type { Profile, ProfilesRepository } from '../../me/ports';
import type { BlocksRepository } from '../ports';

export interface BlockedPerson {
  userId: string;
  displayName: string;
}

/** Bloquer coupe tout : le lien est archivé, la personne disparaît des rencontres (dans les deux sens), on quitte les groupes partagés. */
@Injectable()
export class Blocks {
  constructor(
    @Inject(BLOCKS) private readonly blocks: BlocksRepository,
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(GROUP_MEMBERS) private readonly groupMembers: GroupMembersRepository,
    @Inject(GROUP_MESSAGES) private readonly groupMessages: GroupMessagesRepository,
    @Inject(IDS) private readonly ids: Ids,
  ) {}

  async block(userId: string, targetId: string): Promise<void> {
    if (userId === targetId) throw new DomainError('invalid', errorText('blockSelf'));
    if (!(await this.profiles.findById(targetId))) throw new DomainError('not_found', errorText('personNotFound'));
    const me = await this.profiles.findById(userId);
    await this.blocks.add({ blocker: userId, blocked: targetId, createdAt: this.clock.now().toISOString() });
    const [a, b] = userId < targetId ? [userId, targetId] : [targetId, userId];
    const link = await this.links.findBetween(a, b);
    if (link && link.status !== 'archived') await this.links.save({ ...link, status: 'archived' });
    // Groupes (spéc §26) : celui qui bloque quitte les groupes qu'ils partagent.
    if (me) await leaveGroupsSharedWith({ members: this.groupMembers, messages: this.groupMessages, ids: this.ids }, me, targetId, this.clock.now().toISOString());
  }

  async unblock(userId: string, targetId: string): Promise<void> {
    await this.blocks.remove(userId, targetId);
  }

  async list(userId: string): Promise<BlockedPerson[]> {
    const rows = await this.blocks.listBy(userId);
    const profiles = new Map((await this.profiles.findByIds(rows.map((r) => r.blocked))).map((p): [string, Profile] => [p.id, p]));
    return rows.flatMap((r) => {
      const p = profiles.get(r.blocked);
      return p ? [{ userId: p.id, displayName: p.displayName }] : [];
    });
  }
}
