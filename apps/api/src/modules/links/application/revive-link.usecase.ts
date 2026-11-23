import { Inject, Injectable } from '@nestjs/common';
import { wakeLine } from '@blowy/content';
import { wakeLink } from '@blowy/domain';
import { DomainError, errorText } from '../../../shared/errors';
import type { LinkActionResult } from './link-action';
import { LinkSession } from './link-session';

/**
 * « Le réveiller » (`POST /v1/links/:id/revive`), sur un lien endormi (`warmth` « endormi », ADA-2027 item 27) : le
 * minimoa de la personne fait un petit coucou à l'autre (« Je lui ai fait un petit coucou. », dans le chat, vu des deux)
 * et le lien redevient « calme ». Sans limite : plus de « une seule fois », plus de vies. Rien n'est jamais bloqué :
 * un premier mot réveille aussi le lien. Les anciennes versions de l'app (bouton du lien « fantôme ») passent par ici
 * aussi ; seul un lien rangé est refusé.
 */
@Injectable()
export class ReviveLink {
  constructor(@Inject(LinkSession) private readonly session: LinkSession) {}

  async execute(linkId: string, userId: string): Promise<LinkActionResult> {
    const draft = await this.session.open(linkId, userId);
    const woken = wakeLink(draft.link, draft.today);
    if (!woken) {
      await this.session.commit(draft);
      throw new DomainError('cannot_revive', errorText('reviveNotGhost'));
    }
    draft.update(woken);
    draft.pet(userId, wakeLine(draft.localeOf(userId), draft.seed('wake', userId)));
    const messages = await this.session.commit(draft);
    return { link: draft.link, messages };
  }
}
