/** Repository conversations : BlowyClient (agent C) ; suggestions hors client (agent E). */
import { z } from 'zod';
import type { Api } from '../../../core/api/client';


const SuggestionsSchema = z.object({ items: z.array(z.object({ text: z.string() })) });

export function createConversationsRepository({ client, raw }: Api) {
  return {
    list: () => client.conversations.list(),
    messages: (id: string, cursor: string | null) => client.conversations.messages(id, cursor ? { cursor } : {}),
    /** clientMessageId = commandId : un renvoi hors ligne est dédupliqué côté serveur. */
    send: (commandId: string, id: string, clientMessageId: string, body: string) => client.conversations.send(id, { clientMessageId, body }, { commandId }),
    read: (commandId: string, id: string, seq: number) => client.conversations.markRead(id, seq, { commandId }),
    reveal: (commandId: string, messageId: string) => client.conversations.revealWarned(messageId, { commandId }),
    /** Suggestions du pet : contrat attendu (agent E) `{ items: { text: string }[] }`, hors client. */
    suggestions: async (id: string) => SuggestionsSchema.parse(await raw({ method: 'GET', path: `/v1/conversations/${encodeURIComponent(id)}/suggestions` })),
  };
}

