import { Inject, Injectable } from '@nestjs/common';
import type { ReportBody } from '@blowy/contract';
import { DomainError, errorText } from '../../../shared/errors';
import { LINKS, PROFILES } from '../../../shared/tokens';
import type { LinksRepository } from '../../links/ports';
import type { ProfilesRepository } from '../../me/ports';
import { ContentFilter } from '../../moderation/content-filter';
import { ReportDesk } from '../../moderation/report-desk';

/**
 * Signalement par une personne. Il passe par le bureau des signalements (`ReportDesk`) : priorité, escalade,
 * suspension automatique dans les cas prévus, alerte de l'équipe. La note n'est jamais refusée par le filtre : elle
 * sert seulement à la priorité (une menace ou un mineur décrits dans la note rendent le signalement urgent).
 */
@Injectable()
export class Report {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(ReportDesk) private readonly desk: ReportDesk,
    @Inject(ContentFilter) private readonly filter: ContentFilter,
  ) {}

  async execute(userId: string, body: ReportBody): Promise<void> {
    if (body.userId === userId) throw new DomainError('invalid');
    const [target, me] = await Promise.all([this.profiles.findById(body.userId), this.profiles.findById(userId)]);
    if (!target) throw new DomainError('not_found', errorText('personNotFound'));
    if (body.messageId && !body.linkId) throw new DomainError('invalid');
    if (body.linkId) {
      const link = await this.links.findById(body.linkId);
      const members = link ? [link.userA, link.userB] : [];
      if (!members.includes(userId) || !members.includes(body.userId)) throw new DomainError('not_found', errorText('linkNotFound'));
    }
    const details = body.details ? body.details : null;
    const note = this.filter.noteCategory(details, me?.locale ?? 'fr');
    await this.desk.file({
      reporter: userId,
      targetUser: body.userId,
      linkId: body.linkId ?? null,
      messageId: body.messageId ?? null,
      reason: body.reason,
      details,
      source: 'person',
      category: note.category,
    });
  }
}
