import { Inject, Injectable } from '@nestjs/common';
import { linkCreatedEmail, linkCreatedLine, systemText } from '@blowy/content';
import { newLink } from '@blowy/domain';
import { Notifier } from '../../../integrations/mailer/notifier';
import type { Env } from '../../../config/env';
import { type Clock, todayOf } from '../../../shared/clock';
import { DomainError } from '../../../shared/errors';
import type { Ids } from '../../../shared/ids';
import { BLOCKS, CLOCK, ENV, IDS, LINKS, PROFILES } from '../../../shared/tokens';
import type { ProfilesRepository } from '../../me/ports';
import { PetCharacter } from '../../pets/application/pet-character';
import type { BlocksRepository } from '../../safety/ports';
import type { LinkRecord, LinksRepository } from '../ports';
import { LinkSession } from './link-session';

export interface CreateLinkInput {
  /** Personne qui déclenche (accepte la rencontre, utilise le code d'invitation). */
  by: string;
  with: string;
  /** Personne prévenue par e-mail de la création. */
  notify?: string;
}

/**
 * Création d'un lien, commune aux rencontres, aux invitations et à l'inscription.
 * Si la paire a déjà un lien actif ou fantôme, on le rend tel quel. Un lien archivé est restauré
 * dans l'état où il était (actif s'il lui restait des vies, fantôme sinon) sans rattraper les jours
 * passés en archive : on repart d'aujourd'hui.
 */
@Injectable()
export class CreateLink {
  constructor(
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(BLOCKS) private readonly blocks: BlocksRepository,
    @Inject(LinkSession) private readonly session: LinkSession,
    @Inject(PetCharacter) private readonly character: PetCharacter,
    @Inject(Notifier) private readonly notifier: Notifier,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(IDS) private readonly ids: Ids,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async execute(input: CreateLinkInput): Promise<LinkRecord> {
    if (input.by === input.with) throw new DomainError('conflict', 'Tu ne peux pas créer un lien avec toi-même.');
    if ((await this.blocks.blockedEitherWay(input.by)).has(input.with)) throw new DomainError('forbidden');
    const [userA, userB] = input.by < input.with ? [input.by, input.with] : [input.with, input.by];
    const today = todayOf(this.clock);

    const existing = await this.links.findBetween(userA, userB);
    if (existing) return existing.status === 'archived' ? this.restore(existing) : existing;

    const now = this.clock.now().toISOString();
    const created = await this.links.create({
      ...newLink(today),
      id: this.ids.uuid(),
      userA,
      userB,
      messageXpOn: null,
      messageXp: 0,
      lastMessageAt: now,
      createdAt: now,
    });
    // Course perdue contre une création simultanée : on rend le lien déjà là.
    if (!created) {
      const raced = await this.links.findBetween(userA, userB);
      if (!raced) throw new Error('lien introuvable après conflit');
      return raced;
    }

    const draft = (await this.session.draftsFor([created]))[0];
    if (!draft) throw new Error('brouillon de lien manquant');
    draft.system(systemText.linkCreated);
    for (const owner of [input.with, input.by]) draft.pet(owner, linkCreatedLine(draft.pair(owner), draft.seed('created', owner)));
    await this.session.commit(draft);

    await this.character.apply(input.by, 'met_new_pet');
    await this.character.apply(input.with, 'met_new_pet');
    if (input.notify) await this.sendCreatedEmail(input.notify, draft.otherOf(input.notify), draft.pair(input.notify));
    return draft.link;
  }

  private async restore(link: LinkRecord): Promise<LinkRecord> {
    const [draft] = await this.session.draftsFor([link]);
    if (!draft) throw new Error('brouillon de lien manquant');
    const alive = link.lives > 0;
    draft.update({ status: alive ? 'active' : 'ghost', lastTickOn: draft.today, ...(alive ? { lastActiveOn: draft.today } : {}) });
    draft.system(systemText.linkCreated);
    await this.session.commit(draft);
    return draft.link;
  }

  private async sendCreatedEmail(to: string, otherId: string, pets: { self: string; other: string }): Promise<void> {
    const [me, other] = await Promise.all([this.profiles.findById(to), this.profiles.findById(otherId)]);
    if (!me || !other) return;
    await this.notifier.notify(
      to,
      linkCreatedEmail({ displayName: me.displayName, petName: pets.self, otherName: other.displayName, otherPetName: pets.other, appUrl: this.env.webUrl }),
    );
  }
}
