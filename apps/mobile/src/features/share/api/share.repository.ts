/**
 * Liens de partage (V5.6 §2.17) : `POST /v1/share-links {cardKind}` crée un NOUVEAU lien à chaque partage
 * (jamais réutilisé) ; `GET /v1/me/share-links` liste les miens ; aperçu public d'une invitation reçue.
 */
import {
  CreateShareLinkRequestSchema,
  InvitePreviewSchema,
  ShareLinkListSchema,
  ShareLinkViewSchema,
  type ShareCardKind as ContractCardKind,
} from '@blowy/api-contract';
import type { Api } from '../../../core/api/client';
import { routes } from '../../../core/api/routes';
import type { ShareCardKind } from '../model/cards';

/** Carte de l'app → type de carte du contrat (« Ma bande » et « Ma bande s'agrandit » : BAND). */
export const CONTRACT_CARD: Record<Exclude<ShareCardKind, 'invitation'>, ContractCardKind> = {
  confirmation: 'CONFIRMED',
  checkin: 'HERE',
  jeudi: 'TEASER',
  soiree: 'EVENING',
  dimanche: 'BAND',
  bande: 'BAND',
  ville: 'HELP_CITY',
};

export function createShareRepository(api: Api) {
  return {
    invitePreview: (ref: string) =>
      api.request('GET', routes.invitePreview(ref), InvitePreviewSchema),
    link: async (card: Exclude<ShareCardKind, 'invitation'>, commandId: string) =>
      api.request(
        'POST',
        routes.shareLinks,
        ShareLinkViewSchema,
        CreateShareLinkRequestSchema.parse({ cardKind: CONTRACT_CARD[card] }),
        { commandId },
      ),
    mine: () => api.request('GET', routes.myShareLinks, ShareLinkListSchema),
  };
}
