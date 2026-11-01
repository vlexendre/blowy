/** Implémente ConversationAdmin (port consommé par relationships) au-dessus du repository. */
import { uuidv7 } from '@blowy/database';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import type { ConversationAdmin } from '../../relationships/application/ports/relationship-side-effects.port.js';
import type { ConversationRepository } from '../application/ports/conversation.repository.js';

export class ConversationAdminAdapter implements ConversationAdmin {
  constructor(private readonly repo: ConversationRepository) {}
  create(scope: TxScope, input: { id: string; contextId: string; kind: 'DATE'; memberIds: string[] }) {
    return this.repo.create(scope, input);
  }
  async postSystemMessage(scope: TxScope, conversationId: string, template: string) {
    const messageId = uuidv7(scope.now.getTime());
    const seq = await this.repo.insertSystem(scope, { id: messageId, conversationId, template });
    return { messageId, seq };
  }
  close(scope: TxScope, conversationId: string) {
    return this.repo.close(scope, conversationId);
  }
  revokeMember(scope: TxScope, conversationId: string, userId: string) {
    return this.repo.revokeMember(scope, conversationId, userId);
  }
}
