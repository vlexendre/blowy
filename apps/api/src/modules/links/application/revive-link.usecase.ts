import { Inject, Injectable } from '@nestjs/common';
import { wakeLine, wakeNoticeText, wakeOtherLine } from '@blowy/content';
import { linkWarmth, wakeLink } from '@blowy/domain';
import { NOTIFIER, type Notifier } from '../../../integrations/push/notifier';
import { PROFILES } from '../../../shared/tokens';
import type { ProfilesRepository } from '../../me/ports';
import type { LinkActionResult } from './link-action';
import { LinkSession } from './link-session';

/**
 * « Le réveiller » (`POST /v1/links/:id/revive`), seulement sur un lien endormi (`warmth` « endormi », ADA-2027 item 27,
 * décision du relecteur du 23/11/2026 : prévenir l'autre, une fois, doucement) :
 * - le minimoa de qui réveille lui dit « Je lui ai fait un petit coucou. » (vu de lui seul) ;
 * - le minimoa de l'autre lui transmet, dans sa langue : « Coucou de la part de {prénom}. Un mot quand tu veux. » (vu de
 *   l'autre seul) ;
 * - l'autre reçoit une notification par le canal existant `message` (« {minimoa} te fait un petit coucou. ») : réglage
 *   des messages, heures calmes, délai par conversation et `Audience` appliqués par le notifieur ; jamais d'e-mail.
 * Le lien redevient « calme » : un second appel le même jour (ou sur un lien qui ne dort pas) rend le lien tel quel,
 * sans réplique, sans notification, sans erreur. Aucun effet de jeu : ni série, ni expérience, ni rappel.
 * Les anciennes versions de l'app (bouton du lien « fantôme ») passent par ici aussi.
 */
@Injectable()
export class ReviveLink {
  constructor(
    @Inject(LinkSession) private readonly session: LinkSession,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(NOTIFIER) private readonly notifier: Notifier,
  ) {}

  async execute(linkId: string, userId: string): Promise<LinkActionResult> {
    const draft = await this.session.open(linkId, userId);
    const woken = linkWarmth(draft.link, draft.today) === 'endormi' ? wakeLink(draft.link, draft.today) : null;
    if (!woken) {
      await this.session.commit(draft);
      return { link: draft.link, messages: [] };
    }
    const otherId = draft.otherOf(userId);
    const me = await this.profiles.findById(userId);
    const name = me?.displayName ?? '';
    const pet = draft.pair(userId).self;
    draft.update(woken);
    draft.pet(userId, wakeLine(draft.localeOf(userId), draft.seed('wake', userId)), 'event', userId);
    draft.pet(otherId, wakeOtherLine(draft.localeOf(otherId), name), 'event', otherId);
    const messages = await this.session.commit(draft);
    await this.notifier.notify(otherId, 'message', {
      linkId: draft.link.id,
      name,
      about: userId,
      text: wakeNoticeText(draft.localeOf(otherId), pet),
    });
    return { link: draft.link, messages };
  }
}
