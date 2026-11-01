/**
 * Modération locale déterministe (Strategy, interdite en production). Règles simples
 * reproductibles pour les tests : mots-clés synthétiques sûrs. Elle ne prétend pas
 * classifier le contenu réel ; l'agent E branche OpenAI derrière le même port.
 *  - contient "[reject]"     → REJECT
 *  - contient "[quarantine]" → QUARANTINE
 *  - contient "[warn]"       → WARN
 *  - contient "[review]"     → HUMAN_REVIEW
 *  - contient "[fail]"       → erreur fournisseur simulée (PROCESSING_FAILED)
 *  - URL / email / téléphone → WARN (coordonnées précoces, contextualisé — jamais REJECT seul)
 *  - sinon ALLOW
 */
import type { ModerationGateway, ModerationVerdict } from '../application/ports/moderation.gateway.js';

const POLICY = 'local-policy-2026.11.0';
const URL_RE = /\bhttps?:\/\/|\bwww\./i;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/;
const PHONE_RE = /(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}/;

export class LocalModerationGateway implements ModerationGateway {
  readonly provider = 'local-deterministic';
  constructor(isProduction: boolean) {
    if (isProduction) throw new Error('Modération locale interdite en production');
  }
  async moderateText({ text }: { text: string; conversationId: string; authorId: string }): Promise<ModerationVerdict> {
    const v = (action: ModerationVerdict['action'], reasonCode: string, source: ModerationVerdict['source'] = 'AUTO'): ModerationVerdict => ({ action, reasonCode, policyVersion: POLICY, provider: this.provider, source });
    const t = text.toLowerCase();
    if (t.includes('[fail]')) throw new Error('local provider failure');
    if (t.includes('[reject]')) return v('REJECT', 'LOCAL_REJECT_MARKER');
    if (t.includes('[quarantine]')) return v('QUARANTINE', 'LOCAL_QUARANTINE_MARKER');
    if (t.includes('[review]')) return v('HUMAN_REVIEW', 'LOCAL_REVIEW_MARKER');
    if (t.includes('[warn]')) return v('WARN', 'LOCAL_WARN_MARKER');
    if (URL_RE.test(text) || EMAIL_RE.test(text) || PHONE_RE.test(text)) return v('WARN', 'EARLY_CONTACT_DETAILS', 'DETERMINISTIC');
    return v('ALLOW', 'OK');
  }
}

/** Aucun fournisseur configuré : chaque message reste en revue (jamais d'approbation implicite). */
export class UnavailableModerationGateway implements ModerationGateway {
  readonly provider = 'not-configured';
  async moderateText(): Promise<ModerationVerdict> {
    throw new Error('moderation provider not configured');
  }
}
