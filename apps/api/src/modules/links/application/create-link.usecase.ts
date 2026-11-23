import { Inject, Injectable, Optional } from '@nestjs/common';
import { Growth } from '../../growth/application/growth';
import { chatSystemText, linkCreatedEmail } from '@blowy/content';
import { MAX_LIVES, newLink } from '@blowy/domain';
import { Notifier } from '../../../integrations/mailer/notifier';
import { NOTIFIER, type Notifier as PushNotifier } from '../../../integrations/push/notifier';
import type { Env } from '../../../config/env';
import { type Clock, todayOf } from '../../../shared/clock';
import { DomainError, errorText } from '../../../shared/errors';
import type { Ids } from '../../../shared/ids';
import { BLOCKS, CLOCK, ENV, IDS, LINKS, PROFILES } from '../../../shared/tokens';
import type { ProfilesRepository } from '../../me/ports';
import { PetCharacter } from '../../pets/application/pet-character';
import { NotificationChannels } from '../../notifications/notification-channels';
import { Audience } from '../../safety/application/audience';
import type { BlocksRepository } from '../../safety/ports';
import type { LinkRecord, LinksRepository } from '../ports';
import { ChatMinimoas } from '../minimoas/chat-minimoas';
import { LinkSession } from './link-session';

export interface CreateLinkInput {
  /** Personne qui déclenche (accepte la rencontre, utilise le code d'invitation). */
  by: string;
  with: string;
  /** Personne prévenue de la création (push, ou e-mail si elle ne reçoit pas les push). */
  notify?: string;
  /** Pourquoi : réponse à son signe (défaut) ou invitation acceptée (texte de la notification). */
  via?: 'wave' | 'invite';
}

/**
 * Création d'un lien, commune aux rencontres, aux invitations et à l'inscription.
 * Si la paire a déjà un lien ouvert, on le rend tel quel (sans rattrapage : `LinkPresenter` montre toujours `lives` à 7
 * et jamais `ghost`). Un lien archivé revient actif, sans rattraper les jours passés en archive : on repart d'aujourd'hui.
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
    @Inject(NOTIFIER) private readonly push: PushNotifier,
    @Inject(ChatMinimoas) private readonly minimoas: ChatMinimoas,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(IDS) private readonly ids: Ids,
    @Inject(ENV) private readonly env: Env,
    @Inject(Audience) private readonly audience: Audience,
    @Optional() @Inject(Growth) private readonly growth: Growth | null = null,
    @Optional() @Inject(NotificationChannels) private readonly channels: NotificationChannels | null = null,
  ) {}

  async execute(input: CreateLinkInput): Promise<LinkRecord> {
    if (input.by === input.with) throw new DomainError('conflict', errorText('linkSelf'));
    if ((await this.blocks.blockedEitherWay(input.by)).has(input.with)) throw new DomainError('forbidden');
    // Compte suspendu : introuvable, comme partout ailleurs (Audience).
    if (await this.audience.isSuspended(input.with)) throw new DomainError('not_found', errorText('personNotFound'));
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

    // Accord de lecture de départ : le réglage par défaut de chacun (« Moi › Minimoas dans tes chats »).
    await this.minimoas.applyDefaults(created);
    const draft = (await this.session.draftsFor([created]))[0];
    if (!draft) throw new Error('brouillon de lien manquant');
    draft.system(chatSystemText(draft.systemLocale).linkCreated);
    // Brise-glace : une question tirée de vos points communs de vision (compte dans les 3 interventions du jour).
    await this.minimoas.icebreaker(draft);
    await this.session.commit(draft);

    await this.character.apply(input.by, 'met_new_pet');
    await this.character.apply(input.with, 'met_new_pet');
    // Entonnoir : premier lien de chacun (une fois).
    await this.growth?.step(input.by, 'first_link');
    await this.growth?.step(input.with, 'first_link');
    if (input.notify) {
      // Une seule notification : le push ; l'e-mail seulement si la personne ne reçoit pas les push (docs/NOTIFICATIONS.md).
      if (!this.channels || (await this.channels.emailAllowed(input.notify, 'link_created'))) {
        await this.sendCreatedEmail(input.notify, draft.otherOf(input.notify), draft.pair(input.notify));
      }
      const by = await this.profiles.findById(input.by);
      await this.push.notify(input.notify, 'new_encounter', { linkId: draft.link.id, name: by?.displayName ?? '', about: input.by, step: input.via ?? 'wave' });
    }
    return draft.link;
  }

  private async restore(link: LinkRecord): Promise<LinkRecord> {
    const [draft] = await this.session.draftsFor([link]);
    if (!draft) throw new Error('brouillon de lien manquant');
    // Un lien rangé revient actif, quel que soit son passé (plus de lien endormi : ADA-2027 item 27).
    draft.update({ status: 'active', lives: MAX_LIVES, lastTickOn: draft.today, lastActiveOn: draft.today });
    draft.system(chatSystemText(draft.systemLocale).linkCreated);
    await this.session.commit(draft);
    return draft.link;
  }

  private async sendCreatedEmail(to: string, otherId: string, pets: { self: string; other: string }): Promise<void> {
    const [me, other] = await Promise.all([this.profiles.findById(to), this.profiles.findById(otherId)]);
    if (!me || !other) return;
    await this.notifier.notify(
      to,
      linkCreatedEmail(me.locale, { displayName: me.displayName, petName: pets.self, otherName: other.displayName, otherPetName: pets.other, appUrl: this.env.webUrl }),
    );
  }
}
