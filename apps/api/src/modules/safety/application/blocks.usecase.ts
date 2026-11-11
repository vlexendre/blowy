import { Inject, Injectable } from '@nestjs/common';
import type { Clock } from '../../../shared/clock';
import { DomainError } from '../../../shared/errors';
import { BLOCKS, CLOCK, LINKS, PROFILES } from '../../../shared/tokens';
import type { LinksRepository } from '../../links/ports';
import type { Profile, ProfilesRepository } from '../../me/ports';
import type { BlocksRepository } from '../ports';

export interface BlockedPerson {
  userId: string;
  displayName: string;
}

/** Bloquer coupe tout : le lien est archivé, la personne disparaît des rencontres (dans les deux sens). */
@Injectable()
export class Blocks {
  constructor(
    @Inject(BLOCKS) private readonly blocks: BlocksRepository,
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async block(userId: string, targetId: string): Promise<void> {
    if (userId === targetId) throw new DomainError('invalid', 'Tu ne peux pas te bloquer toi-même.');
    if (!(await this.profiles.findById(targetId))) throw new DomainError('not_found', 'Cette personne est introuvable.');
    await this.blocks.add({ blocker: userId, blocked: targetId, createdAt: this.clock.now().toISOString() });
    const [a, b] = userId < targetId ? [userId, targetId] : [targetId, userId];
    const link = await this.links.findBetween(a, b);
    if (link && link.status !== 'archived') await this.links.save({ ...link, status: 'archived' });
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
