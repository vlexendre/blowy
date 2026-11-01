/**
 * Fonctions IA facultatives (§9.4, §9.5, §9.6).
 *
 * Suggestions : déclencheur (demande explicite ou 12 h sans message admissible), jamais sur
 * relation terminée / bloquée / en pause ; ≤ 1 génération automatique par fenêtre de 12 h ;
 * contexte = derniers messages publiés de CETTE conversation, et SEULEMENT ceux d'auteurs
 * ayant consenti à AI_SUGGESTIONS (jamais le partenaire non consentant) ; aucune donnée
 * secrète (votes, modération, position, autres rendez-vous). Sorties ≤ 3 × 160 car., chacune
 * MODÉRÉE avant affichage ; fallback éditorial. Aucun envoi automatique : l'utilisateur
 * reprend le texte via POST /conversations/:id/messages (pipeline normal).
 *
 * Signaux : ton apparent pour l'animation du pet ; evidenceEventIds revalidés (existent,
 * visibles, de cette relation) ; faible confiance → neutral ; TTL 15 min ; aucune jauge modifiée.
 */
import { MISSIONS } from '@blowy/content';
import { ConversationSignalSchema, PROMPTS, SuggestionSetSchema, decideText, deterministicChecks, editorialSuggestions, sha256, type SuggestionItem } from '@blowy/ai';
import type { Clock, RandomSource } from '../../../shared/application/clock.js';
import type { AiServices } from '../../../shared/application/ports/ai.port.js';
import { AppError, Errors } from '../../../shared/domain/errors.js';
import { CURRENT_CONSENT_VERSIONS } from '../../users/domain/consents.js';

export interface AiFeatureRepository {
  conversationFacts(conversationId: string, at: Date): Promise<{
    id: string;
    contextId: string | null;
    closed: boolean;
    status: string | null;
    branch: 'UNDECIDED' | 'FRIEND' | 'PLUS';
    level: number;
    members: { userId: string; revokedAt: Date | null }[];
    paused: boolean;
    lastHumanMessageAt: Date | null;
    zoneDay: { zoneId: string | null; day: string };
  } | null>;
  blockedBetween(a: string, b: string): Promise<boolean>;
  latestConsent(userId: string, purpose: string): Promise<{ granted: boolean; version: string } | null>;
  /** Derniers messages TEXT publiés (≤ limit), ordre chronologique. */
  recentPublished(conversationId: string, limit: number): Promise<{ id: string; authorUserId: string | null; body: string | null; createdAt: Date }[]>;
  memories(contextId: string, limit: number): Promise<{ id: string; label: string }[]>;
  publicVisionKeys(userId: string): Promise<string[]>;
  findSuggestion(conversationId: string, userId: string, windowKey: string): Promise<{ items: unknown; source: string; createdAt: Date; invalidatedAt: Date | null } | null>;
  saveSuggestion(s: { id: string; conversationId: string; userId: string; items: SuggestionItem[]; source: 'AI' | 'EDITORIAL'; windowKey: string; createdAt: Date }): Promise<void>;
  countAutoSuggestions(conversationId: string, userId: string, since: Date): Promise<number>;
  saveSignal(s: { id: string; conversationId: string; tone: string; evidenceEventIds: string[]; proposedReaction: string | null; confidence: number; expiresAt: Date }): Promise<void>;
  activeSignal(conversationId: string, at: Date): Promise<{ tone: string; proposedReaction: string | null; expiresAt: Date } | null>;
}
export const AI_FEATURE_REPOSITORY = Symbol('AiFeatureRepository');

const WINDOW_MS = 12 * 3_600_000;
const MAX_AUTO_PER_DAY = 2;

export class SuggestionsUseCase {
  constructor(
    private readonly repo: AiFeatureRepository,
    private readonly ai: AiServices,
    private readonly clock: Clock,
    private readonly random: RandomSource,
  ) {}

  private async consents(userId: string, purpose: 'AI_SUGGESTIONS' | 'AI_NARRATION') {
    const c = await this.repo.latestConsent(userId, purpose);
    return !!c?.granted && c.version === CURRENT_CONSENT_VERSIONS[purpose];
  }

  /** `trigger` = USER (demande) ou AUTO (12 h sans message admissible). */
  async execute(userId: string, conversationId: string, trigger: 'USER' | 'AUTO' = 'USER') {
    const now = this.clock.now();
    const f = await this.repo.conversationFacts(conversationId, now);
    const me = f?.members.find((m) => m.userId === userId && !m.revokedAt);
    if (!f || !me) throw Errors.notFound('Conversation');
    const other = f.members.find((m) => m.userId !== userId);
    // Jamais sur relation terminée, bloquée, en pause (pression).
    if (f.closed || f.status === 'ENDED' || (other && (await this.repo.blockedBetween(userId, other.userId)))) throw Errors.precondition('SUGGESTIONS_UNAVAILABLE');
    if (f.paused) throw Errors.precondition('RELATIONSHIP_PAUSED');
    if (trigger === 'AUTO') {
      if (f.lastHumanMessageAt && now.getTime() - f.lastHumanMessageAt.getTime() < WINDOW_MS) throw Errors.precondition('NOT_DUE');
      if ((await this.repo.countAutoSuggestions(conversationId, userId, new Date(now.getTime() - 86_400_000))) >= MAX_AUTO_PER_DAY) throw new AppError('RATE_LIMITED', 'Plafond de suggestions');
    }
    // Fenêtre de 12 h ; cache invalidé dès qu'un nouveau message est publié (clé = dernier message).
    const recent = await this.repo.recentPublished(conversationId, 10);
    const lastId = recent.at(-1)?.id ?? 'none';
    const windowKey = `${trigger}:${Math.floor(now.getTime() / WINDOW_MS)}:${lastId}`;
    const cached = await this.repo.findSuggestion(conversationId, userId, windowKey);
    // Un résultat IA en cache n'est jamais resservi après retrait du consentement.
    if (cached && !cached.invalidatedAt && (cached.source !== 'AI' || (await this.consents(userId, 'AI_SUGGESTIONS')))) return this.view(conversationId, cached.items as SuggestionItem[], cached.source as 'AI' | 'EDITORIAL', cached.createdAt);

    const dailyMission = MISSIONS[0]?.title ?? null;
    const memories = f.contextId ? await this.repo.memories(f.contextId, 3) : [];
    const editorial = () => editorialSuggestions({ memories, dailyMission });
    let items: SuggestionItem[] = editorial();
    let source: 'AI' | 'EDITORIAL' = 'EDITORIAL';
    if (this.ai.providers && (await this.consents(userId, 'AI_SUGGESTIONS'))) {
      // Messages du partenaire uniquement s'il a consenti à cette fonction facultative.
      const otherConsents = other ? await this.consents(other.userId, 'AI_SUGGESTIONS') : false;
      const msgs = recent
        .filter((m) => m.body && (m.authorUserId === userId || (otherConsents && m.authorUserId === other?.userId)))
        .map((m, i) => ({ ref: `m${i}`, speaker: (m.authorUserId === userId ? 'A' : 'B') as 'A' | 'B', text: m.body!.slice(0, 400) }));
      const ctx = { messages: msgs, publicVision: await this.repo.publicVisionKeys(userId), memories, dailyMission, level: f.level, branch: f.branch };
      try {
        const r = await this.ai.runner.run({
          kind: 'suggestions',
          provider: this.ai.providers.suggestions.name,
          promptVersion: PROMPTS.suggestions.version,
          subject: { type: 'CONVERSATION', id: conversationId },
          userId,
          contextId: f.contextId,
          contentHash: sha256(JSON.stringify(ctx)),
          accessScope: `user:${userId}:partnerConsent:${otherConsents}`,
          cacheTtlMs: WINDOW_MS,
          call: (o) => this.ai.providers!.suggestions.suggest(ctx, o),
          validate: (v) => SuggestionSetSchema.shape.suggestions.parse(v),
        });
        // Les sorties IA sont elles-mêmes modérées (politique déterministe + classification).
        const safe: SuggestionItem[] = [];
        const memIds = new Set(memories.map((m) => m.id));
        for (const s of r.value.slice(0, 3)) {
          if (s.memoryRefs.some((ref) => !memIds.has(ref))) continue; // souvenir inventé
          const findings = deterministicChecks(s.text, { recentOwnBodies: [] });
          if (findings.contactDetails || findings.moneyMention || findings.coercionMarker || findings.suspectedMinorSexual) continue;
          const sig = await this.ai.providers.moderation.classifyText(s.text).then((x) => x.value).catch(() => null);
          if (!sig) continue;
          if (decideText({ findings, signals: sig, context: null, level: f.level }).action !== 'ALLOW') continue;
          safe.push(s);
        }
        if (safe.length) {
          items = safe;
          source = 'AI';
        }
      } catch {
        // Panne : fallback éditorial validé.
      }
    }
    await this.repo.saveSuggestion({ id: this.random.uuid(), conversationId, userId, items, source, windowKey, createdAt: now });
    return this.view(conversationId, items, source, now);
  }

  private view(conversationId: string, items: SuggestionItem[], source: 'AI' | 'EDITORIAL', at: Date) {
    return { conversationId, source, items: items.map((s, i) => ({ id: `s${i + 1}`, text: s.text, tone: s.tone, reasonCode: s.reasonCode, memoryRefs: s.memoryRefs })), createdAt: at.toISOString() };
  }
}

export class ConversationSignalUseCase {
  constructor(
    private readonly repo: AiFeatureRepository,
    private readonly ai: AiServices,
    private readonly clock: Clock,
    private readonly random: RandomSource,
  ) {}

  /** Calcule (si autorisé) puis renvoie le signal actif. Appelé à la publication, jamais par tick. */
  async refresh(conversationId: string) {
    const now = this.clock.now();
    const f = await this.repo.conversationFacts(conversationId, now);
    if (!f || f.closed || !this.ai.providers) return null;
    const members = f.members.filter((m) => !m.revokedAt);
    // Chaque auteur décide : seuls ses messages s'il a consenti à AI_NARRATION.
    const consenting = new Set<string>();
    for (const m of members) {
      const c = await this.repo.latestConsent(m.userId, 'AI_NARRATION');
      if (c?.granted && c.version === CURRENT_CONSENT_VERSIONS.AI_NARRATION) consenting.add(m.userId);
    }
    const events = (await this.repo.recentPublished(conversationId, 8)).filter((m) => m.body && m.authorUserId && consenting.has(m.authorUserId));
    if (!events.length) return null;
    const first = members[0]?.userId;
    const ctx = { events: events.map((e) => ({ id: e.id, speaker: (e.authorUserId === first ? 'A' : 'B') as 'A' | 'B', text: e.body!.slice(0, 300) })) };
    let s;
    try {
      s = (
        await this.ai.runner.run({
          kind: 'signals',
          provider: this.ai.providers.signals.name,
          promptVersion: PROMPTS.signals.version,
          subject: { type: 'CONVERSATION', id: conversationId },
          userId: null,
          contextId: f.contextId,
          contentHash: sha256(JSON.stringify(ctx)),
          accessScope: `consenting:${[...consenting].sort().join(',')}`,
          cacheTtlMs: 0,
          call: (o) => this.ai.providers!.signals.analyze(ctx, o),
          validate: (v) => ConversationSignalSchema.parse(v),
        })
      ).value;
    } catch {
      return null;
    }
    // Revalidation serveur des preuves : seulement des ids fournis (visibles, de cette relation).
    const allowed = new Set(ctx.events.map((e) => e.id));
    const evidence = s.evidenceEventIds.filter((id) => allowed.has(id));
    const invalid = evidence.length !== s.evidenceEventIds.length;
    const weak = s.confidenceSignal < 0.6 || invalid || evidence.length === 0;
    const tone = weak ? 'neutral' : s.tone;
    const reaction = weak ? 'neutral' : s.proposedReaction;
    const ttl = Math.min(900, Math.max(0, s.ttlSeconds || 900));
    await this.repo.saveSignal({ id: this.random.uuid(), conversationId, tone, evidenceEventIds: weak ? [] : evidence, proposedReaction: reaction, confidence: s.confidenceSignal, expiresAt: new Date(now.getTime() + ttl * 1000) });
    return { tone, proposedReaction: reaction, expiresAt: new Date(now.getTime() + ttl * 1000).toISOString() };
  }

  async current(userId: string, conversationId: string) {
    const now = this.clock.now();
    const f = await this.repo.conversationFacts(conversationId, now);
    if (!f || !f.members.some((m) => m.userId === userId && !m.revokedAt)) throw Errors.notFound('Conversation');
    const s = await this.repo.activeSignal(conversationId, now);
    return s ? { tone: s.tone, proposedReaction: s.proposedReaction, expiresAt: s.expiresAt.toISOString() } : { tone: 'neutral', proposedReaction: null, expiresAt: now.toISOString() };
  }
}

const DISCLOSURES = {
  AI_MODERATION: { required: true, usages: ['Modération des messages, photos et vocaux avant livraison', 'Analyse contextuelle limitée (argent, pression, harcèlement)'], dataTypes: ['Texte des messages envoyés', 'Photos envoyées', 'Transcription des vocaux', '≤ 8 messages récents de la même conversation, pseudonymisés'] },
  AI_SUGGESTIONS: { required: false, usages: ['Idées de messages (jamais envoyées automatiquement)'], dataTypes: ['Vos derniers messages publiés dans cette conversation', 'Ceux du partenaire seulement s’il a aussi accepté', 'Vision publique et souvenirs communs'] },
  AI_NARRATION: { required: false, usages: ['Ton apparent de la conversation pour animer le pet (fiction)'], dataTypes: ['Vos messages publiés récents (seulement si vous avez accepté)'] },
} as const;

export class AiConsentUseCase {
  constructor(
    private readonly repo: AiFeatureRepository,
    private readonly ai: AiServices,
    /** Enregistrement append-only via la commande me.record_consents (émet user.consent_withdrawn). */
    private readonly recorder: { execute(userId: string, commandId: string, req: { items: { purpose: 'AI_MODERATION' | 'AI_SUGGESTIONS' | 'AI_NARRATION'; version: string; granted: boolean }[] }): Promise<unknown> },
  ) {}

  async state(userId: string) {
    const items = [];
    for (const purpose of ['AI_MODERATION', 'AI_SUGGESTIONS', 'AI_NARRATION'] as const) {
      const c = await this.repo.latestConsent(userId, purpose);
      const d = DISCLOSURES[purpose];
      items.push({ purpose, required: d.required, usages: [...d.usages], dataTypes: [...d.dataTypes], provider: this.ai.providerLabel, version: CURRENT_CONSENT_VERSIONS[purpose], granted: !!c?.granted && c.version === CURRENT_CONSENT_VERSIONS[purpose], recordedAt: null });
    }
    return { items, providerMode: this.ai.mode };
  }

  async record(userId: string, commandId: string, req: { purpose: 'AI_MODERATION' | 'AI_SUGGESTIONS' | 'AI_NARRATION'; version: string; granted: boolean }) {
    await this.recorder.execute(userId, commandId, { items: [req] });
    return this.state(userId);
  }
}
