import { Inject, Injectable } from '@nestjs/common';
import { refusedText } from '@blowy/content';
import type { GroupAction, GroupMessagesPage } from '@blowy/contract';
import { type ModerationCategory, classifyText, decideModeration } from '@blowy/domain';
import { DomainError } from '../../../shared/errors';
import { ReportDesk } from '../../moderation/report-desk';
import { GroupPresenter } from '../interface/group.presenter';
import type { GroupMessageRecord } from '../ports';
import { GroupCore } from './group-core';
import { GroupsUseCases } from './groups.usecases';

const PAGE = 50;
const EXCERPT_CHARS = 280;
const excerpt = (text: string): string =>
  text.length > EXCERPT_CHARS ? `${text.slice(0, EXCERPT_CHARS)}…` : text;
const reasonOf = (c: ModerationCategory | null): string =>
  c === 'minor_sexual'
    ? 'mineur'
    : c === 'insult' || c === 'threat' || c === 'hate'
      ? 'harcelement'
      : 'contenu_inapproprie';

/**
 * Le chat d'un groupe : messages texte, même filtre des contenus que les liens (une violation nette n'est jamais
 * écrite, un cas limite est signalé), **aucune lecture par une IA** (pas de confirmation des cas douteux, pas de
 * minimoa qui réagit). Push « message de groupe » : un seul tant que la personne n'a pas lu, dans le plafond du jour.
 */
@Injectable()
export class GroupChat {
  constructor(
    @Inject(GroupCore) private readonly core: GroupCore,
    @Inject(GroupPresenter) private readonly presenter: GroupPresenter,
    @Inject(GroupsUseCases) private readonly groups: GroupsUseCases,
    @Inject(ReportDesk) private readonly desk: ReportDesk,
  ) {}

  async page(userId: string, groupId: string, before: string | null): Promise<GroupMessagesPage> {
    await this.core.asMember(groupId, userId, true);
    const rows = await this.core.messages.page(groupId, before, PAGE);
    const messages = await this.presenter.messages(userId, [...rows].reverse());
    return { messages, nextBefore: rows.length === PAGE ? (rows[rows.length - 1]?.createdAt ?? null) : null };
  }

  async send(userId: string, groupId: string, text: string): Promise<GroupAction> {
    const { group, active } = await this.core.asMember(groupId, userId);
    const profile = await this.core.profile(userId);
    const verdict = classifyText(text, profile.locale);
    const decision = decideModeration('message', verdict);
    if (decision.outcome === 'block') {
      await this.desk.file({
        reporter: null,
        targetUser: userId,
        groupId,
        reason: reasonOf(decision.category),
        details: `Message de groupe non envoyé : « ${excerpt(text)} »`,
        source: 'filter',
        category: decision.category,
        explicitMinor: verdict.explicitMinor,
      });
      const category = decision.category;
      throw new DomainError('content_refused', (l) => refusedText(l, 'message', category));
    }
    const now = this.core.stamp();
    const record: GroupMessageRecord = {
      id: this.core.ids.uuid(),
      groupId,
      authorKind: 'user',
      authorId: userId,
      kind: 'text',
      body: text,
      event: null,
      eventVars: {},
      createdAt: now,
    };
    await this.core.messages.add([record]);
    await this.core.members.update(groupId, userId, { lastReadAt: now });
    // Cas limite : envoyé et signalé. Une hésitation reste envoyée : aucune IA ne relit un groupe.
    if (decision.outcome === 'flag') {
      await this.desk.file({
        reporter: null,
        targetUser: userId,
        groupId,
        groupMessageId: record.id,
        reason: reasonOf(decision.category),
        details: null,
        source: 'filter',
        category: decision.category,
      });
    }
    const toNotify = active.filter(
      (m) =>
        m.userId !== userId &&
        (m.notifiedAt === null || (m.lastReadAt !== null && m.notifiedAt <= m.lastReadAt)),
    );
    for (const m of toNotify) await this.core.members.update(groupId, m.userId, { notifiedAt: now });
    await this.core.notify(
      toNotify.map((m) => m.userId),
      'group_message',
      { groupId, group: group.name, name: profile.displayName, about: userId },
    );
    return this.groups.action(userId, groupId, [record]);
  }

  async read(userId: string, groupId: string): Promise<void> {
    await this.core.asMember(groupId, userId, true);
    await this.core.members.update(groupId, userId, { lastReadAt: this.core.stamp() });
  }
}
