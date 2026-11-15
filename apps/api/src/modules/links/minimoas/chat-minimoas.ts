/**
 * Les minimoas dans la conversation (spéc §9). Rôles : brise-glace, relance, remarque, garde-fou ; plus la santé
 * du lien pour le bilan de la semaine. Règles de coût :
 * - jamais un appel d'IA par message : seulement au déclencheur (garde-fou repéré par l'heuristique locale,
 *   tous les REMARK_EVERY_MESSAGES messages, silence de 72 h), après la réponse, sur une fenêtre courte ;
 * - l'IA ne lit les messages que si les DEUX personnes ont dit oui ; sinon, lignes au rythme seulement ;
 * - au plus 3 interventions par jour et par lien ; coupure possible par chacun (un seul « coupé » suffit) ;
 * - rien du texte analysé n'est conservé : seulement la réplique produite et des compteurs.
 * Quand la passerelle refuse (coupée, budget, panne), une ligne de règle (`@blowy/content` v7/chat) la remplace.
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { AI_PROCESSOR, type AiProcessor } from '../../../integrations/ai/ai-processor';
import { CHAT_AI_SYSTEM, type ChatLineContext, chatAiPrompt, chatConfidentialityText, chatLines, type Locale } from '@blowy/content';
import {
  AI_WINDOW_CHARS,
  AI_WINDOW_MESSAGES,
  GUARD_COOLDOWN_HOURS,
  classifyText,
  decideModeration,
  CHAT_MAX_INTERVENTIONS_PER_DAY,
  SILENCE_NUDGE_HOURS,
  type ChatPetState,
  type Day,
  type LinkHealthKey,
  type MinimoaVoice,
  type VisionAxis,
  ZERO_GAUGES,
  addDays,
  type ChatReadingDefault,
  type TheirConsent,
  chatReadingAllowed,
  consentFromDefault,
  theirConsentOf,
  cleanMinimoaLine,
  compatibilityOf,
  countIntervention,
  dayOf,
  daysBetween,
  guardDue,
  interventionsLeft,
  interventionsToday,
  isMatchable,
  linkHealthOf,
  minimoaVoiceOf,
  nudgeDue,
  remarkDue,
  silenceDays,
  toneScore,
} from '@blowy/domain';
import { AI_GATEWAY, type AiGateway } from '../../../integrations/ai/ai-gateway';
import { Background } from '../../../shared/background';
import { CACHE, type Cache } from '../../../shared/cache';
import type { Clock } from '../../../shared/clock';
import { DomainError, errorText } from '../../../shared/errors';
import { seedOf } from '../../../shared/seed';
import { CLOCK, LINKS, MESSAGES, PETS, PROFILES } from '../../../shared/tokens';
import type { ProfilesRepository } from '../../me/ports';
import type { PetsRepository } from '../../pets/ports';
import { VISION_READER, type VisionReader } from '../../vision/tokens';
import { LinkSession } from '../application/link-session';
import type { LinkDraft } from '../application/link-draft';
import type { LinkRecord, LinksRepository, MessageRecord, MessagesRepository } from '../ports';
import { CHAT_PET_STATE, CHAT_SETTINGS, type ChatLinkSettingRecord, type ChatPetStateRepository, type ChatSettingsRepository } from './ports';

/** Réglages d'un lien vus par une personne (forme du contrat `LinkMinimoasZ`). */
export interface LinkMinimoasView {
  linkId: string;
  consent: { mine: boolean | null; reading: boolean; text: string; theirs: TheirConsent; byDefault: boolean };
  muted: boolean;
  interventionsToday: number;
  maxPerDay: typeof CHAT_MAX_INTERVENTIONS_PER_DAY;
}

export interface LinkHealthView {
  linkId: string;
  otherName: string;
  key: LinkHealthKey;
  score: number;
  line: string;
}

/** Suite à donner après l'écriture des messages (appel d'IA en arrière-plan). */
export type FollowUp = () => Promise<void>;

const SETTINGS_TTL_MS = 60_000;
const AI_MAX_TOKENS = 60;

@Injectable()
export class ChatMinimoas {
  constructor(
    @Inject(CHAT_SETTINGS) private readonly settings: ChatSettingsRepository,
    @Inject(CHAT_PET_STATE) private readonly states: ChatPetStateRepository,
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(MESSAGES) private readonly messages: MessagesRepository,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(LinkSession) private readonly session: LinkSession,
    @Inject(AI_GATEWAY) private readonly ai: AiGateway,
    @Inject(Background) private readonly background: Background,
    @Inject(CACHE) private readonly cache: Cache,
    @Inject(CLOCK) private readonly clock: Clock,
    @Optional() @Inject(VISION_READER) private readonly vision: VisionReader | null,
    // Prestataire d'IA nommé dans la phrase d'accord (configuration ; par défaut celui de la politique de confidentialité).
    @Optional() @Inject(AI_PROCESSOR) private readonly processor: AiProcessor | null = null,
  ) {}

  // ── Réglages ─────────────────────────────────────────────────────────────

  async view(link: LinkRecord, viewerId: string): Promise<LinkMinimoasView> {
    const [rows, state, lang] = await Promise.all([this.settingsOf(link.id), this.states.get(link.id), this.langOf(viewerId)]);
    return this.toView(link, viewerId, rows, state, lang);
  }

  async update(linkId: string, userId: string, patch: { consent?: boolean; muted?: boolean }): Promise<LinkMinimoasView> {
    const link = await this.links.findById(linkId);
    if (!link || (link.userA !== userId && link.userB !== userId)) throw new DomainError('not_found', errorText('linkNotFound'));
    const now = this.clock.now().toISOString();
    const rows = await this.settings.forLink(linkId);
    const mine = rows.find((r) => r.userId === userId) ?? { linkId, userId, consent: null, consentAt: null, muted: false, byDefault: false, updatedAt: now };
    const next: ChatLinkSettingRecord = {
      ...mine,
      // Une réponse donnée dans ce chat remplace l'accord venu du réglage par défaut.
      ...(patch.consent !== undefined ? { consent: patch.consent, consentAt: now, byDefault: false } : {}),
      ...(patch.muted !== undefined ? { muted: patch.muted } : {}),
      updatedAt: now,
    };
    await this.settings.upsert(next);
    await this.cache.delete(this.settingsKey(linkId));
    return this.view(link, userId);
  }

  /** Réglages de tous les liens (non archivés) d'une personne, par pages d'identifiants de lien, et son réglage par défaut. */
  async listForUser(
    userId: string,
    cursor: string | null,
    limit: number,
  ): Promise<{ items: LinkMinimoasView[]; nextCursor: string | null; text: string; readingDefault: ChatReadingDefault }> {
    const page = await this.links.pageForUser(userId, cursor, limit + 1);
    const shown = page.slice(0, limit);
    const [lang, readingDefault] = await Promise.all([this.langOf(userId), this.settings.readingDefault(userId)]);
    const items = await Promise.all(
      shown.map(async (link) => {
        const [rows, state] = await Promise.all([this.settingsOf(link.id), this.states.get(link.id)]);
        return this.toView(link, userId, rows, state, lang);
      }),
    );
    return { items, nextCursor: page.length > limit ? (shown.at(-1)?.id ?? null) : null, text: chatConfidentialityText(lang, this.processor ?? undefined), readingDefault };
  }

  /** Réglage par défaut des nouveaux liens. Les liens existants ne changent pas (voir `setAll`). */
  async setDefault(userId: string, value: ChatReadingDefault): Promise<ChatReadingDefault> {
    await this.settings.setReadingDefault(userId, value);
    return value;
  }

  /**
   * Ton accord pour tous tes liens non archivés, en une fois (une lecture, une écriture groupée). Rend le nombre de
   * liens dont l'accord a changé. Comme une réponse dans le chat : l'accord n'est plus « par défaut ».
   */
  async setAll(userId: string, consent: boolean): Promise<number> {
    const links = (await this.links.listForUsers([userId])).filter((l) => l.status !== 'archived');
    const rows = new Map((await this.settings.forUserLinks(userId, links.map((l) => l.id))).map((r) => [r.linkId, r]));
    const now = this.clock.now().toISOString();
    const changed: ChatLinkSettingRecord[] = [];
    for (const link of links) {
      const row = rows.get(link.id);
      if (row && row.consent === consent && !row.byDefault) continue;
      changed.push({ ...(row ?? { linkId: link.id, userId, muted: false }), consent, consentAt: now, byDefault: false, updatedAt: now });
    }
    await this.settings.upsertMany(changed);
    await Promise.all(changed.map((r) => this.cache.delete(this.settingsKey(r.linkId))));
    return changed.filter((r) => rows.get(r.linkId)?.consent !== consent).length;
  }

  /**
   * Nouveau lien : l'accord de chacun part de son réglage par défaut (« on » : oui, « off » : non, sans question à la
   * première ouverture ; « ask » : rien d'écrit, la question sera posée).
   */
  async applyDefaults(link: LinkRecord): Promise<void> {
    const now = this.clock.now().toISOString();
    const records: ChatLinkSettingRecord[] = [];
    for (const userId of [link.userA, link.userB]) {
      const consent = consentFromDefault(await this.settings.readingDefault(userId));
      if (consent !== null) records.push({ linkId: link.id, userId, consent, consentAt: now, muted: false, byDefault: true, updatedAt: now });
    }
    if (records.length === 0) return;
    await this.settings.upsertMany(records);
    await this.cache.delete(this.settingsKey(link.id));
  }

  // ── Brise-glace ──────────────────────────────────────────────────────────

  /** Au début d'un lien : une question tirée du premier point commun de vision (règle, sans IA). */
  async icebreaker(draft: LinkDraft): Promise<void> {
    const link = draft.link;
    const state = await this.states.get(link.id);
    if (state.icebreakerDone || interventionsLeft(state, draft.today) === 0) return;
    const speaker = draft.speaker('icebreaker');
    const [axis, lang] = await Promise.all([this.sharedAxis(link.userA, link.userB), this.langOf(speaker)]);
    draft.pet(speaker, chatLines.icebreaker(lang, axis, draft.pair(speaker).other, draft.seed('icebreaker')), 'icebreaker');
    await this.states.save(link.id, { ...countIntervention(state, draft.today), icebreakerDone: true, lastUserAt: state.lastUserAt ?? link.createdAt });
  }

  // ── Après un message ─────────────────────────────────────────────────────

  /**
   * Ajoute au brouillon les lignes de règle (premier message du jour, réaction au ton choisi, remarque au rythme)
   * et rend la suite à lancer après l'écriture (garde-fou ou remarque par l'IA), ou null.
   */
  async onUserMessage(draft: LinkDraft, userId: string, text: string, opts: { firstToday: boolean; tone?: 'sweet' | 'tease' }): Promise<FollowUp | null> {
    const link = draft.link;
    const today = draft.today;
    const now = this.clock.now();
    const [rows, stored] = await Promise.all([this.settingsOf(link.id), this.states.get(link.id)]);
    let state: ChatPetState = { ...stored, messagesSinceRemark: stored.messagesSinceRemark + 1, lastUserAt: now.toISOString() };
    const muted = rows.some((r) => r.muted);
    const reading = this.reading(link, rows);
    let followUp: FollowUp | null = null;

    if (!muted) {
      // Garde-fou : seulement si l'IA a le droit de lire ; l'heuristique locale décide s'il y a lieu d'appeler.
      if (reading && interventionsLeft(state, today) > 0) {
        const recent = await this.messages.recentUserTexts(link.id, 4);
        const scores = recent
          .filter((m) => m.authorId === userId)
          .slice(0, 2)
          .reverse()
          .map((m) => toneScore(m.body ?? ''));
        if (guardDue({ recentScores: [...scores, toneScore(text)], lastGuardAt: state.lastGuardAt, now })) {
          state = { ...countIntervention(state, today), lastGuardAt: now.toISOString() };
          followUp = () => this.guard(link.id, userId);
        }
      }
      // Garde-fou cohérent avec le filtre des contenus : un message livré mais signalé à la modération (insulte, sexe
      // explicite) vaut un garde-fou, à son auteur seul, même sans lecture par l'IA (ligne de règle : rien ne sort du
      // serveur). Au plus un par 24 h et par lien, dans le plafond des interventions ; si l'IA a déjà été appelée
      // ci-dessus pour un garde-fou, c'est elle qui parle.
      const filtered = decideModeration('message', classifyText(text, draft.localeOf(userId)));
      const guardRested = state.lastGuardAt === null || now.getTime() - new Date(state.lastGuardAt).getTime() >= GUARD_COOLDOWN_HOURS * 3_600_000;
      if (!followUp && filtered.outcome === 'flag' && guardRested && interventionsLeft(state, today) > 0) {
        draft.pet(userId, chatLines.guard(await this.ctx(draft, userId, await this.voices(link), 'guard-filter')), 'guard', userId);
        state = { ...countIntervention(state, today), lastGuardAt: now.toISOString() };
      }
      if (!followUp) {
        const voices = await this.voices(link);
        if (opts.firstToday && interventionsLeft(state, today) > 0) {
          draft.pet(userId, chatLines.firstOfDay(await this.ctx(draft, userId, voices, 'first')), 'remark');
          state = countIntervention(state, today);
        }
        const other = draft.otherOf(userId);
        if (opts.tone && interventionsLeft(state, today) > 0) {
          const c = await this.ctx(draft, other, voices, opts.tone, String(state.messagesSinceRemark));
          draft.pet(other, opts.tone === 'sweet' ? chatLines.sweet(c) : chatLines.tease(c), 'remark');
          state = countIntervention(state, today);
        }
        if (remarkDue({ state, today, muted })) {
          const speaker = draft.speaker('remark', String(state.messagesSinceRemark), link.lastMessageAt);
          state = { ...countIntervention(state, today), messagesSinceRemark: 0 };
          if (reading) followUp = () => this.aiRemark(link.id, speaker);
          else draft.pet(speaker, chatLines.remark(await this.ctx(draft, speaker, voices, 'remark', link.lastMessageAt)), 'remark');
        }
      }
    }
    await this.states.save(link.id, state);
    return followUp;
  }

  /** Lance la suite en arrière-plan (la réponse à la personne n'attend pas l'IA). */
  later(followUp: FollowUp | null): void {
    if (followUp) this.background.run('minimoas du chat', followUp);
  }

  // ── Relances (minuteur) ──────────────────────────────────────────────────

  /** Relance les liens silencieux depuis 72 h, par lots, jusqu'à `deadline`. Rend le nombre de relances. */
  async nudgeSilent(now: Date, deadline: number, batch = 50): Promise<number> {
    const before = new Date(now.getTime() - SILENCE_NUDGE_HOURS * 3_600_000).toISOString();
    const today = dayOf(now);
    let cursor: string | null = null;
    let done = 0;
    while (Date.now() < deadline) {
      const silent = await this.states.listSilent(before, cursor, batch);
      for (const { linkId, state } of silent) {
        if (Date.now() >= deadline) return done;
        if (await this.nudge(linkId, state, now, today)) done += 1;
      }
      if (silent.length < batch) break;
      cursor = silent.at(-1)?.state.lastUserAt ?? null;
    }
    return done;
  }

  private async nudge(linkId: string, state: ChatPetState, now: Date, today: Day): Promise<boolean> {
    const link = await this.links.findById(linkId);
    const lastUserAt = state.lastUserAt;
    if (!link || link.status !== 'active' || lastUserAt === null) {
      // Lien endormi ou archivé : il sort de la liste des silences (index partiel).
      await this.states.save(linkId, { ...state, lastUserAt: null });
      return false;
    }
    const rows = await this.settingsOf(link.id);
    const muted = rows.some((r) => r.muted);
    if (!nudgeDue({ state, today, muted, active: true, now })) return false;
    // L'état passe d'abord : un tick répété ou concurrent ne relance pas deux fois le même silence.
    await this.states.save(link.id, { ...countIntervention(state, today), lastNudgeFor: lastUserAt });
    const speaker = seedOf(link.id, lastUserAt, 'nudge') % 2 === 0 ? link.userA : link.userB;
    const days = silenceDays(lastUserAt, now);
    let line: string | null = null;
    if (this.reading(link, rows)) {
      const ai = await this.askModel(link, speaker, 'relance', days);
      if (ai.kind === 'line') line = ai.line;
      if (ai.kind === 'nothing') return true;
    }
    if (line === null) {
      const voices = await this.voices(link);
      line = chatLines.nudge(await this.ctxFor(link, speaker, voices, 'nudge', lastUserAt), days);
    }
    await this.session.addPetLine(link.id, speaker, line, 'nudge');
    return true;
  }

  // ── Santé du lien (bilan de la semaine) ──────────────────────────────────

  /**
   * Santé de chaque lien actif de la personne sur les 7 derniers jours, sans lire le contenu des messages
   * (comptes par auteur, jours où les deux ont écrit, série, vies). Utilisé par le bilan de la semaine (chantier « rituels »).
   */
  async linkHealth(userId: string, now: Date = this.clock.now()): Promise<LinkHealthView[]> {
    const all = await this.links.listForUsers([userId]);
    const active = all.filter((l) => l.status === 'active');
    if (active.length === 0) return [];
    const today = dayOf(now);
    const sinceDay = addDays(today, -6);
    const since = new Date(now.getTime() - 7 * 86_400_000).toISOString();
    const others = active.map((l) => (l.userA === userId ? l.userB : l.userA));
    const [profiles, lang] = await Promise.all([this.profiles.findByIds(others), this.langOf(userId)]);
    const names = new Map(profiles.map((p) => [p.id, p.displayName]));
    return Promise.all(
      active.map(async (link, i) => {
        const otherId = others[i] ?? '';
        const counts = await this.messages.countUserTextsSince(link.id, since);
        const duoDays = link.recentDays.filter((d) => d.day >= sinceDay && d.a && d.b).length;
        const health = linkHealthOf({
          mine: counts.get(userId) ?? 0,
          theirs: counts.get(otherId) ?? 0,
          duoDays,
          streak: link.streak,
          lives: link.lives,
          ageDays: daysBetween(dayOf(new Date(link.createdAt)), today),
        });
        const otherName = names.get(otherId) ?? '';
        return { linkId: link.id, otherName, key: health.key, score: health.score, line: chatLines.health(lang, health.key, otherName) };
      }),
    );
  }

  // ── Arrière-plan : appels au modèle ──────────────────────────────────────

  private async aiRemark(linkId: string, speaker: string): Promise<void> {
    const link = await this.links.findById(linkId);
    if (!link || link.status !== 'active') return;
    const ai = await this.askModel(link, speaker, 'remarque');
    let line: string | null = null;
    if (ai.kind === 'line') line = ai.line;
    else if (ai.kind === 'declined') line = chatLines.remark(await this.ctxFor(link, speaker, await this.voices(link), 'remark', link.lastMessageAt));
    if (line) await this.session.addPetLine(link.id, speaker, line, 'remark');
  }

  private async guard(linkId: string, userId: string): Promise<void> {
    const link = await this.links.findById(linkId);
    if (!link || link.status !== 'active') return;
    const ai = await this.askModel(link, userId, 'garde-fou', undefined, 'moderation');
    let line: string | null = null;
    if (ai.kind === 'line') line = ai.line;
    // « rien » : le modèle juge que le ton ne monte pas vraiment ; l'heuristique s'était trompée.
    else if (ai.kind === 'declined') line = chatLines.guard(await this.ctxFor(link, userId, await this.voices(link), 'guard', link.lastMessageAt));
    if (line) await this.session.addPetLine(link.id, userId, line, 'guard', userId);
  }

  /** Un appel au petit modèle sur une fenêtre courte et anonymisée (A / B). Rien n'est conservé de la fenêtre. */
  private async askModel(
    link: LinkRecord,
    speaker: string,
    role: 'relance' | 'remarque' | 'garde-fou',
    silence?: number,
    feature: 'chat_remark' | 'moderation' = 'chat_remark',
  ): Promise<{ kind: 'line'; line: string } | { kind: 'nothing' } | { kind: 'declined' }> {
    const recent = await this.messages.recentUserTexts(link.id, AI_WINDOW_MESSAGES);
    if (recent.length === 0) return { kind: 'declined' };
    const window = [...recent].reverse().map((m: MessageRecord) => ({ who: m.authorId === link.userA ? ('A' as const) : ('B' as const), text: (m.body ?? '').slice(0, AI_WINDOW_CHARS) }));
    const [voices, lang] = await Promise.all([this.voices(link), this.langOf(speaker)]);
    const result = await this.ai.complete({
      feature,
      userId: speaker,
      system: CHAT_AI_SYSTEM,
      prompt: chatAiPrompt({ role, lang, voice: voices.get(speaker) ?? 'pose', owner: speaker === link.userA ? 'A' : 'B', window, silenceDays: silence }),
      maxTokens: AI_MAX_TOKENS,
      tier: 'small',
      locale: lang,
    });
    if (!result.ok) return { kind: 'declined' };
    const line = cleanMinimoaLine(result.text);
    return line === null ? { kind: 'nothing' } : { kind: 'line', line };
  }

  // ── Outils ───────────────────────────────────────────────────────────────

  private toView(link: LinkRecord, viewerId: string, rows: readonly ChatLinkSettingRecord[], state: ChatPetState, lang: Locale): LinkMinimoasView {
    const mine = rows.find((r) => r.userId === viewerId);
    const other = link.userA === viewerId ? link.userB : link.userA;
    // Refus et question pas encore vue se disent pareil (« pas encore activé de son côté ») : aucune pression.
    const theirs = theirConsentOf(rows.find((r) => r.userId === other)?.consent ?? null);
    return {
      linkId: link.id,
      consent: { mine: mine?.consent ?? null, reading: this.reading(link, rows), text: chatConfidentialityText(lang, this.processor ?? undefined), theirs, byDefault: mine?.byDefault ?? false },
      muted: mine?.muted ?? false,
      interventionsToday: interventionsToday(state, dayOf(this.clock.now())),
      maxPerDay: CHAT_MAX_INTERVENTIONS_PER_DAY,
    };
  }

  private reading(link: LinkRecord, rows: readonly ChatLinkSettingRecord[]): boolean {
    const of = (u: string) => rows.find((r) => r.userId === u)?.consent ?? null;
    return chatReadingAllowed(of(link.userA), of(link.userB));
  }

  private settingsKey(linkId: string): string {
    return `chat:settings:${linkId}`;
  }

  private settingsOf(linkId: string): Promise<ChatLinkSettingRecord[]> {
    return this.cache.wrap(this.settingsKey(linkId), SETTINGS_TTL_MS, () => this.settings.forLink(linkId));
  }

  private async langOf(userId: string): Promise<Locale> {
    const profile = await this.profiles.findById(userId);
    return profile?.locale ?? 'fr';
  }

  /** Voix des deux minimoas, d'après le style de leur humain. */
  private async voices(link: LinkRecord): Promise<Map<string, MinimoaVoice>> {
    const pets = await this.pets.findByOwners([link.userA, link.userB]);
    const out = new Map<string, MinimoaVoice>();
    for (const owner of [link.userA, link.userB]) out.set(owner, minimoaVoiceOf(pets.find((p) => p.ownerId === owner)?.gauges ?? ZERO_GAUGES));
    return out;
  }

  private async ctx(draft: LinkDraft, speaker: string, voices: Map<string, MinimoaVoice>, ...seed: string[]): Promise<ChatLineContext> {
    return { lang: await this.langOf(speaker), voice: voices.get(speaker) ?? 'pose', seed: draft.seed(...seed), other: draft.pair(speaker).other };
  }

  private async ctxFor(link: LinkRecord, speaker: string, voices: Map<string, MinimoaVoice>, ...seed: string[]): Promise<ChatLineContext> {
    const otherOwner = speaker === link.userA ? link.userB : link.userA;
    const [lang, pet] = await Promise.all([this.langOf(speaker), this.pets.findByOwner(otherOwner)]);
    return { lang, voice: voices.get(speaker) ?? 'pose', seed: seedOf(link.id, ...seed), other: pet?.name ?? '' };
  }

  /** Premier point commun de vision de la paire (via le lecteur public du chantier « vision »), ou null. */
  private async sharedAxis(a: string, b: string): Promise<VisionAxis | null> {
    if (!this.vision) return null;
    try {
      const [pa, pb] = await Promise.all([this.vision.profileOf(a), this.vision.profileOf(b)]);
      if (!isMatchable(pa) || !isMatchable(pb)) return null;
      return compatibilityOf(pa, pb, 'potes').common[0].axis;
    } catch {
      return null;
    }
  }
}

