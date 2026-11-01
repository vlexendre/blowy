/**
 * Pipeline de modération texte (§9.1 étapes 3-5), indépendant du transport :
 *   déterministe → (soupçon mineur ⇒ AUCUN appel fournisseur) → classification →
 *   contexte limité si nécessaire → politique versionnée.
 * En panne IA : renvoie `{ outcome: 'UNAVAILABLE' }` — l'appelant garde le message non
 * publié (PROCESSING_FAILED / revue), jamais d'approbation implicite.
 */
import type { AiError } from '../errors.js';
import { isAiError } from '../errors.js';
import { decideImage, decideText, deterministicChecks, needsContextAnalysis, type ImagePurpose, type MinorSafetyLexicon, type PolicyDecision } from '../policy.js';
import { PROMPTS } from '../prompts.js';
import type { ContentModerationProvider, ContextWindowMessage, ModerationSignals } from '../providers.js';
import { ContextRiskSchema, type ContextRisk } from '../schemas.js';
import { sha256, type AiRunner } from '../runtime/runner.js';

export interface TextModerationInput {
  messageRef: string;
  text: string;
  authorId: string;
  contextId: string | null;
  level: number;
  /** Fenêtre ≤ 8 messages publiés de CETTE conversation, pseudonymisés (A = auteur). */
  window: ContextWindowMessage[];
  recentOwnBodies: string[];
}

export type PipelineOutcome =
  | { outcome: 'DECIDED'; decision: PolicyDecision; source: 'DETERMINISTIC' | 'AUTO'; provider: string }
  | { outcome: 'UNAVAILABLE'; errorCode: AiError['code'] | 'UNKNOWN'; provider: string };

const isSignals = (v: unknown): ModerationSignals => {
  const s = v as ModerationSignals;
  if (!s || typeof s.flagged !== 'boolean' || typeof s.scores !== 'object' || !Array.isArray(s.evaluated)) throw new Error('signaux invalides');
  return s;
};

export class ModerationPipeline {
  constructor(
    private readonly provider: ContentModerationProvider,
    private readonly runner: AiRunner,
    private readonly lexicon?: MinorSafetyLexicon,
  ) {}

  async moderateText(i: TextModerationInput): Promise<PipelineOutcome> {
    const findings = deterministicChecks(i.text, { recentOwnBodies: i.recentOwnBodies }, this.lexicon);
    // Protection des mineurs : jamais envoyé à l'API généraliste.
    if (findings.suspectedMinorSexual || findings.urgentThreat) {
      return { outcome: 'DECIDED', decision: decideText({ findings, signals: null, context: null, level: i.level }), source: 'DETERMINISTIC', provider: 'deterministic' };
    }
    const contentHash = sha256(i.text);
    let signals: ModerationSignals;
    try {
      signals = (
        await this.runner.run({
          kind: 'moderation.text',
          provider: this.provider.name,
          promptVersion: 'moderation-api',
          subject: { type: 'MESSAGE', id: i.messageRef },
          userId: i.authorId,
          contextId: i.contextId,
          contentHash,
          accessScope: 'text',
          cacheTtlMs: 24 * 3_600_000,
          call: (o) => this.provider.classifyText(i.text, o),
          validate: isSignals,
        })
      ).value;
    } catch (e) {
      return { outcome: 'UNAVAILABLE', errorCode: isAiError(e) ? e.code : 'UNKNOWN', provider: this.provider.name };
    }
    let context: ContextRisk | null = null;
    if (needsContextAnalysis(findings, signals, i.window)) {
      try {
        context = (
          await this.runner.run({
            kind: 'moderation.context',
            provider: this.provider.name,
            promptVersion: PROMPTS.contextRisk.version,
            subject: { type: 'MESSAGE', id: i.messageRef },
            userId: i.authorId,
            contextId: i.contextId,
            // Le contexte dépend de la fenêtre : pas de cache partagé entre conversations.
            contentHash: sha256(JSON.stringify([i.text, i.window])),
            accessScope: `ctx:${i.contextId ?? 'none'}`,
            cacheTtlMs: 0,
            call: (o) => this.provider.analyzeContext({ target: { ref: 'target', speaker: 'A', text: i.text }, window: i.window.slice(-8) }, o),
            validate: (v) => ContextRiskSchema.parse(v),
          })
        ).value;
      } catch (e) {
        // Contexte requis mais indisponible : pas d'approbation, revue.
        if (findings.moneyMention || findings.coercionMarker) return { outcome: 'UNAVAILABLE', errorCode: isAiError(e) ? e.code : 'UNKNOWN', provider: this.provider.name };
      }
    }
    const decision = decideText({ findings, signals, context, level: i.level });
    return { outcome: 'DECIDED', decision, source: decision.reasonCode === 'EARLY_CONTACT_DETAILS' || decision.reasonCode === 'REPETITION' ? 'DETERMINISTIC' : 'AUTO', provider: this.provider.name };
  }

  async moderateImage(i: { mediaId: string; ownerId: string; contextId: string | null; bytes: Uint8Array; mime: 'image/jpeg' | 'image/png' | 'image/webp'; sha256: string; purpose: ImagePurpose }): Promise<PipelineOutcome> {
    try {
      const signals = (
        await this.runner.run({
          kind: 'moderation.image',
          provider: this.provider.name,
          promptVersion: 'moderation-api',
          subject: { type: 'MEDIA', id: i.mediaId },
          userId: i.ownerId,
          contextId: i.contextId,
          contentHash: i.sha256,
          accessScope: 'image',
          cacheTtlMs: 24 * 3_600_000,
          call: (o) => this.provider.classifyImage({ bytes: i.bytes, mime: i.mime }, o),
          validate: isSignals,
        })
      ).value;
      return { outcome: 'DECIDED', decision: decideImage(signals, i.purpose), source: 'AUTO', provider: this.provider.name };
    } catch (e) {
      return { outcome: 'UNAVAILABLE', errorCode: isAiError(e) ? e.code : 'UNKNOWN', provider: this.provider.name };
    }
  }
}
