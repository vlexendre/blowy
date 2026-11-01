/**
 * ModerationGateway IA (agent E) branchée derrière le port de conversations :
 * pipeline @blowy/ai (déterministe → classification → contexte limité → politique versionnée).
 *  - fenêtre de contexte : ≤ 8 messages publiés de CETTE conversation, pseudonymisés A/B ;
 *  - niveau de relation (coordonnées précoces) ;
 *  - panne IA ⇒ exception ⇒ PROCESSING_FAILED côté use case (jamais d'approbation implicite) ;
 *  - voix : transcription serveur (média) puis modération du texte ; silence/incertain → revue.
 * Journalisation : identifiants, codes, version de politique — jamais le texte.
 */
import { decideTranscriptGate, type ModerationPipeline, type PolicyDecision } from '@blowy/ai';
import type { Db } from '@blowy/database';
import type { LoggerPort } from '../../../shared/application/logger.port.js';
import type { ModerationGateway, ModerationVerdict } from '../../conversations/application/ports/moderation.gateway.js';

/** Transcription d'un vocal (fournie par media) : type/durée vérifiés à la finalisation. */
export interface VoiceTranscriber {
  transcribe(mediaId: string, ownerId: string, contextId: string | null): Promise<{ text: string; quality: 'OK' | 'SILENCE' | 'UNCERTAIN' | 'UNSUPPORTED_LANGUAGE' | 'NON_VERBAL' }>;
}

const toVerdict = (d: PolicyDecision, provider: string, source: 'DETERMINISTIC' | 'AUTO'): ModerationVerdict => ({
  action: d.action,
  reasonCode: d.reasonCode,
  policyVersion: d.policyVersion,
  provider,
  source,
  signals: d.signals,
  distress: d.distress,
  ...(d.caseRequired ? { case: { priority: d.priority, restricted: d.restricted } } : {}),
});

export class AiModerationGateway implements ModerationGateway {
  readonly provider: string;
  constructor(
    private readonly pipeline: ModerationPipeline,
    providerName: string,
    private readonly db: Db,
    private readonly voice: VoiceTranscriber | null,
    private readonly logger: LoggerPort,
  ) {
    this.provider = providerName;
  }

  private async context(conversationId: string, authorId: string, messageId: string | undefined) {
    const conv = await this.db.conversation.findUnique({ where: { id: conversationId }, select: { contextId: true, context: { select: { reachedLevel: true } } } });
    const target = messageId ? await this.db.message.findUnique({ where: { id: messageId }, select: { createdAt: true } }) : null;
    const before = target?.createdAt ?? new Date(8.64e15);
    const recent = await this.db.message.findMany({ where: { conversationId, kind: 'TEXT', status: { in: ['PUBLISHED', 'WARNED'] }, createdAt: { lt: before } }, include: { content: true }, orderBy: { createdAt: 'desc' }, take: 8 });
    const own = await this.db.message.findMany({ where: { conversationId, authorUserId: authorId, kind: 'TEXT', createdAt: { lt: before, gte: new Date(before.getTime() - 10 * 60_000) } }, include: { content: true }, orderBy: { createdAt: 'desc' }, take: 5 });
    return {
      contextId: conv?.contextId ?? null,
      level: conv?.context?.reachedLevel ?? 1,
      window: recent
        .reverse()
        .filter((m) => m.content && !m.content.purgedAt)
        .map((m, i) => ({ ref: `w${i}`, speaker: (m.authorUserId === authorId ? 'A' : 'B') as 'A' | 'B', text: m.content!.body.slice(0, 500) })),
      recentOwnBodies: own.filter((m) => m.content && !m.content.purgedAt).map((m) => m.content!.body),
    };
  }

  async moderateText(input: { text: string; conversationId: string; authorId: string; messageId?: string }): Promise<ModerationVerdict> {
    const ctx = await this.context(input.conversationId, input.authorId, input.messageId);
    const r = await this.pipeline.moderateText({ messageRef: input.messageId ?? 'n/a', text: input.text, authorId: input.authorId, contextId: ctx.contextId, level: ctx.level, window: ctx.window, recentOwnBodies: ctx.recentOwnBodies });
    if (r.outcome === 'UNAVAILABLE') {
      this.logger.warn({ messageId: input.messageId, provider: r.provider, code: r.errorCode }, 'ai_moderation_unavailable');
      throw new Error(`moderation_unavailable:${r.errorCode}`);
    }
    return toVerdict(r.decision, r.provider, r.source);
  }

  async moderateVoice(input: { mediaId: string; conversationId: string; authorId: string; messageId: string }): Promise<ModerationVerdict> {
    if (!this.voice) throw new Error('voice_unavailable');
    const conv = await this.db.conversation.findUnique({ where: { id: input.conversationId }, select: { contextId: true } });
    const t = await this.voice.transcribe(input.mediaId, input.authorId, conv?.contextId ?? null);
    // Silence / incertain / langue / non verbal : revue explicite (pas de modération parfaite du son).
    const gate = decideTranscriptGate(t.quality);
    if (gate) return toVerdict(gate, this.provider, 'DETERMINISTIC');
    return this.moderateText({ text: t.text, conversationId: input.conversationId, authorId: input.authorId, messageId: input.messageId });
  }
}
