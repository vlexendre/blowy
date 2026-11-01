/** Effet outbox `message.submitted` → modération hors transaction (worker). Idempotent par l'état PENDING. */
import type { OutboxEffect, OutboxEnvelope } from '../../../shared/application/outbox-consumer.js';
import type { ModerateMessageUseCase } from '../application/moderate-message.use-case.js';

export class MessageModerationEffect implements OutboxEffect {
  readonly name = 'conversations.moderation';
  readonly topics = ['message.submitted'] as const;
  constructor(private readonly moderate: ModerateMessageUseCase) {}
  async run(e: OutboxEnvelope): Promise<void> {
    await this.moderate.execute(String(e.payload.messageId));
  }
}
