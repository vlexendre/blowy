import { Inject, Injectable } from '@nestjs/common';
import type { ReportBody } from '@blowy/contract';
import type { Clock } from '../../../shared/clock';
import { DomainError } from '../../../shared/errors';
import { CLOCK, LINKS, PROFILES, REPORTS } from '../../../shared/tokens';
import type { LinksRepository } from '../../links/ports';
import type { ProfilesRepository } from '../../me/ports';
import type { ReportsRepository } from '../ports';

@Injectable()
export class Report {
  constructor(
    @Inject(REPORTS) private readonly reports: ReportsRepository,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(userId: string, body: ReportBody): Promise<void> {
    if (body.userId === userId) throw new DomainError('invalid');
    if (!(await this.profiles.findById(body.userId))) throw new DomainError('not_found', 'Cette personne est introuvable.');
    if (body.linkId) {
      const link = await this.links.findById(body.linkId);
      const members = link ? [link.userA, link.userB] : [];
      if (!members.includes(userId) || !members.includes(body.userId)) throw new DomainError('not_found', 'Ce lien n’existe pas.');
    }
    await this.reports.add({
      reporter: userId,
      targetUser: body.userId,
      linkId: body.linkId ?? null,
      reason: body.reason,
      details: body.details ? body.details : null,
      createdAt: this.clock.now().toISOString(),
    });
  }
}
