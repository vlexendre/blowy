/** Repository relations : BlowyClient (agent C). Réseau obligatoire, commandId par appel. */
import type { Api } from '../../../core/api/client';

export function createRelationshipsRepository({ client }: Api) {
  return {
    list: () => client.relationships.list(),
    one: (id: string) => client.relationships.get(id),
    moveIn: (cid: string, id: string) => client.relationships.proposeMoveIn(id, { commandId: cid }),
    /** Réponse à une offre de consentement (emménager, révélation photo, rendez-vous réel…). */
    respond: (cid: string, id: string, body: { offerId: string; decision: 'ACCEPT' | 'DECLINE'; version: number }) => client.relationships.respondOffer(id, body, { commandId: cid }),
    ballot: (cid: string, id: string, choice: 'FRIEND' | 'PLUS') => client.relationships.castBallot(id, choice, { commandId: cid }),
    downgrade: (cid: string, id: string) => client.relationships.downgradeToFriend(id, { commandId: cid }),
    leave: (cid: string, id: string, reason: 'CLEAN_LEAVE' | 'REPORT_SAFETY_EXIT') => client.relationships.leave(id, reason, { commandId: cid }),
    pause: (cid: string, id: string, days: number) => client.relationships.pause(id, days, { commandId: cid }),
  };
}
