/**
 * Adaptateurs OpenAI RÉELS (SDK officiel `openai`, Responses API + Structured Outputs stricts,
 * Moderations API, Audio Transcriptions). Vérifiés contre la documentation du 2026-11-01 :
 *  - modération : `moderations.create({ model, input: [{type:'text'}|{type:'image_url'}] })`,
 *    `category_applied_input_types` donne les modalités réellement évaluées ;
 *  - Responses : `responses.parse({ text: { format: zodTextFormat(schema, name) }, store: false })`,
 *    `output_parsed`, refus = contenu `type: 'refusal'`, `status !== 'completed'` = incomplet ;
 *  - images : `{ type: 'input_image', image_url: 'data:<mime>;base64,…', detail }` ;
 *  - transcription : `audio.transcriptions.create({ file, model })`, `languages` vide = langue
 *    non déterminée.
 * Noms de modèles : configuration (aucun nom recopié par défaut, sauf la modération dont le
 * nom est donné par la doc). `store: false` : réduit la conservation d'état applicatif côté
 * fournisseur ; ce n'est PAS une absence universelle de conservation (journaux d'abus ≤ 30 j
 * hors ZDR — voir docs/privacy/ai-data.md).
 * Toutes les sorties sont revalidées par Zod côté serveur, même après parse du SDK.
 */
import OpenAI, { toFile } from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import type { z } from 'zod';
import { estimateCostMicros, type PriceTable } from '../cost.js';
import { AiError, toAiError } from '../errors.js';
import { PROMPTS, dataBlock, type PromptSpec } from '../prompts.js';
import {
  ContextRiskSchema,
  ConversationSignalSchema,
  MissionAssessmentSchema,
  NarrationChoiceSchema,
  SuggestionSetSchema,
  type ContextRisk,
  type ConversationSignal,
  type MissionAssessment,
  type NarrationChoice,
  type SuggestionItem,
} from '../schemas.js';
import {
  MODERATION_CATEGORIES,
  type AiCall,
  type AiProviders,
  type CallOptions,
  type ContentModerationProvider,
  type ConversationSignalProvider,
  type MessageSuggestionProvider,
  type MissionVisionProvider,
  type ModerationCategory,
  type ModerationSignals,
  type NarrationContext,
  type PetNarrationProvider,
  type SignalContext,
  type SpeechTranscriptionProvider,
  type SuggestionContext,
  type TranscriptionResult,
} from '../providers.js';

export interface OpenAiConfig {
  apiKey: string;
  /** Modèle de modération (doc : omni-moderation-latest). */
  moderationModel: string;
  /** Modèle génératif texte (contexte, suggestions, signaux, narration). */
  textModel: string;
  /** Modèle vision (preuves de mission). */
  visionModel: string;
  transcriptionModel: string;
  /** Timeout par requête (ms) ; le timeout de tâche est appliqué en plus par le runner. */
  timeoutMs: number;
  prices: PriceTable;
  /** Client injectable (tests de contrat : fetch mocké). */
  client?: OpenAI;
  baseURL?: string;
  fetch?: typeof fetch;
  /** Horloge de mesure de durée (injectable). */
  nowMs?: () => number;
}

const PROVIDER = 'openai';

function makeClient(c: OpenAiConfig): OpenAI {
  if (c.client) return c.client;
  // Les retries sont bornés par NOTRE runner (backoff + circuit breaker) : pas de retries SDK cachés.
  return new OpenAI({ apiKey: c.apiKey, timeout: c.timeoutMs, maxRetries: 0, ...(c.baseURL ? { baseURL: c.baseURL } : {}), ...(c.fetch ? { fetch: c.fetch } : {}) });
}

type ParsedLike = {
  status?: string | null;
  incomplete_details?: { reason?: string | null } | null;
  output_parsed?: unknown;
  output?: Array<{ type: string; content?: Array<{ type: string }> }>;
  usage?: { input_tokens?: number; output_tokens?: number } | null;
};

/** Interprète une réponse Responses API : refus / incomplet / format invalide → AiError. */
export function interpretStructured<S extends z.ZodType>(res: ParsedLike, schema: S): z.infer<S> {
  const refused = res.output?.some((o) => o.type === 'message' && o.content?.some((c) => c.type === 'refusal'));
  if (refused) throw new AiError('REFUSED', 'refus du modèle', { provider: PROVIDER });
  if (res.status && res.status !== 'completed') {
    const reason = res.incomplete_details?.reason ?? res.status;
    throw new AiError(reason === 'content_filter' ? 'REFUSED' : 'INCOMPLETE', `réponse incomplète (${reason})`, { provider: PROVIDER });
  }
  const parsed = schema.safeParse(res.output_parsed);
  if (!parsed.success) throw new AiError('INVALID_FORMAT', 'sortie non conforme au schéma', { provider: PROVIDER });
  return parsed.data;
}

class OpenAiBase {
  protected readonly client: OpenAI;
  constructor(protected readonly cfg: OpenAiConfig) {
    this.client = makeClient(cfg);
  }
  protected now(): number {
    return this.cfg.nowMs ? this.cfg.nowMs() : performance.now();
  }

  protected async structured<S extends z.ZodType>(
    prompt: PromptSpec,
    schema: S,
    name: string,
    model: string,
    userContent: Array<{ type: 'input_text'; text: string } | { type: 'input_image'; image_url: string; detail: 'low' | 'high' | 'auto' }>,
    opts: CallOptions | undefined,
    maxOutputTokens: number,
  ): Promise<AiCall<z.infer<S>>> {
    const t0 = this.now();
    let res: ParsedLike;
    try {
      res = (await this.client.responses.parse(
        {
          model,
          store: false,
          max_output_tokens: maxOutputTokens,
          instructions: prompt.system,
          input: [{ role: 'user', content: userContent }],
          text: { format: zodTextFormat(schema, name) },
        } as never,
        { signal: opts?.signal ?? null },
      )) as unknown as ParsedLike;
    } catch (e) {
      throw toAiError(e, PROVIDER);
    }
    const value = interpretStructured(res, schema);
    const inputTokens = res.usage?.input_tokens ?? null;
    const outputTokens = res.usage?.output_tokens ?? null;
    return {
      value,
      usage: { provider: PROVIDER, model, promptVersion: prompt.version, durationMs: Math.round(this.now() - t0), inputTokens, outputTokens, costMicros: estimateCostMicros(this.cfg.prices, model, { inputTokens, outputTokens }), priceTableVersion: this.cfg.prices.version },
    };
  }
}

const b64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');

export class OpenAiModerationProvider extends OpenAiBase implements ContentModerationProvider {
  readonly name = 'openai-moderation';

  private async moderate(input: unknown, modality: 'text' | 'image', opts?: CallOptions): Promise<AiCall<ModerationSignals>> {
    const t0 = this.now();
    let res: { results: Array<{ flagged: boolean; category_scores: Record<string, number>; category_applied_input_types?: Record<string, string[]> }> };
    try {
      res = (await this.client.moderations.create({ model: this.cfg.moderationModel, input: input as never }, { signal: opts?.signal ?? null })) as never;
    } catch (e) {
      throw toAiError(e, PROVIDER);
    }
    const r = res.results?.[0];
    if (!r || typeof r.flagged !== 'boolean' || typeof r.category_scores !== 'object') throw new AiError('INVALID_FORMAT', 'réponse de modération inattendue', { provider: PROVIDER });
    const scores: Partial<Record<ModerationCategory, number>> = {};
    const evaluated: ModerationCategory[] = [];
    for (const c of MODERATION_CATEGORIES) {
      const v = r.category_scores[c];
      if (typeof v === 'number' && Number.isFinite(v)) scores[c] = Math.min(1, Math.max(0, v));
      // Modalités réellement évaluées : seules celles que le fournisseur déclare.
      const applied = r.category_applied_input_types?.[c];
      if (applied ? applied.includes(modality) : modality === 'text') evaluated.push(c);
    }
    return {
      value: { flagged: r.flagged, scores, evaluated, modality },
      usage: { provider: PROVIDER, model: this.cfg.moderationModel, promptVersion: 'n/a', durationMs: Math.round(this.now() - t0), inputTokens: null, outputTokens: null, costMicros: estimateCostMicros(this.cfg.prices, this.cfg.moderationModel, {}), priceTableVersion: this.cfg.prices.version },
    };
  }

  classifyText(text: string, opts?: CallOptions) {
    return this.moderate([{ type: 'text', text }], 'text', opts);
  }

  classifyImage(image: { bytes: Uint8Array; mime: string }, opts?: CallOptions) {
    return this.moderate([{ type: 'image_url', image_url: { url: `data:${image.mime};base64,${b64(image.bytes)}` } }], 'image', opts);
  }

  async analyzeContext(input: { target: { ref: string; speaker: 'A' | 'B'; text: string }; window: { ref: string; speaker: 'A' | 'B'; text: string }[] }, opts?: CallOptions): Promise<AiCall<ContextRisk>> {
    const data = { target: input.target, window: input.window.slice(-8) };
    return this.structured(PROMPTS.contextRisk, ContextRiskSchema, 'context_risk', this.cfg.textModel, [{ type: 'input_text', text: dataBlock(data) }], opts, 200);
  }
}

export class OpenAiMissionVisionProvider extends OpenAiBase implements MissionVisionProvider {
  readonly name = 'openai-vision';
  assess(input: { missionKey: string; criteria: string[]; image: { bytes: Uint8Array; mime: string } }, opts?: CallOptions): Promise<AiCall<MissionAssessment>> {
    return this.structured(
      PROMPTS.missionVision,
      MissionAssessmentSchema,
      'mission_assessment',
      this.cfg.visionModel,
      [
        { type: 'input_text', text: dataBlock({ missionKey: input.missionKey, criteria: input.criteria }) },
        // Image normalisée serveur (sans EXIF/GPS) ; détail « low » suffit aux critères observables.
        { type: 'input_image', image_url: `data:${input.image.mime};base64,${b64(input.image.bytes)}`, detail: 'low' },
      ],
      opts,
      400,
    );
  }
}

export class OpenAiSuggestionProvider extends OpenAiBase implements MessageSuggestionProvider {
  readonly name = 'openai-suggestions';
  async suggest(ctx: SuggestionContext, opts?: CallOptions): Promise<AiCall<SuggestionItem[]>> {
    const r = await this.structured(PROMPTS.suggestions, SuggestionSetSchema, 'suggestions', this.cfg.textModel, [{ type: 'input_text', text: dataBlock(ctx) }], opts, 500);
    return { value: r.value.suggestions, usage: r.usage };
  }
}

export class OpenAiSignalProvider extends OpenAiBase implements ConversationSignalProvider {
  readonly name = 'openai-signals';
  analyze(ctx: SignalContext, opts?: CallOptions): Promise<AiCall<ConversationSignal>> {
    return this.structured(PROMPTS.signals, ConversationSignalSchema, 'conversation_signal', this.cfg.textModel, [{ type: 'input_text', text: dataBlock(ctx) }], opts, 200);
  }
}

export class OpenAiNarrationProvider extends OpenAiBase implements PetNarrationProvider {
  readonly name = 'openai-narration';
  choose(ctx: NarrationContext, opts?: CallOptions): Promise<AiCall<NarrationChoice>> {
    return this.structured(PROMPTS.narration, NarrationChoiceSchema, 'narration_choice', this.cfg.textModel, [{ type: 'input_text', text: dataBlock(ctx) }], opts, 100);
  }
}

/** Seuils de qualité de transcription (§9.2). */
const SILENCE_MAX_CHARS = 2;
const NON_VERBAL_RE = /^\s*[[(][^\])]*(?:musique|music|rires?|laughter|bruit|noise|silence)[^\])]*[\])]\s*$/i;

export function classifyTranscript(t: { text: string; languages: string[]; confidence: number | null }, supported: readonly string[] = ['fr', 'en']): TranscriptionResult['quality'] {
  const txt = t.text.trim();
  if (txt.length <= SILENCE_MAX_CHARS) return 'SILENCE';
  if (NON_VERBAL_RE.test(txt)) return 'NON_VERBAL';
  if (t.languages.length === 0) return 'UNCERTAIN';
  if (!t.languages.some((l) => supported.includes(l.slice(0, 2).toLowerCase()))) return 'UNSUPPORTED_LANGUAGE';
  if (t.confidence !== null && t.confidence < 0.6) return 'UNCERTAIN';
  return 'OK';
}

export class OpenAiTranscriptionProvider extends OpenAiBase implements SpeechTranscriptionProvider {
  readonly name = 'openai-transcription';
  async transcribe(audio: { bytes: Uint8Array; mime: string; durationMs: number }, opts?: CallOptions): Promise<AiCall<TranscriptionResult>> {
    const t0 = this.now();
    const ext = audio.mime.includes('mp4') || audio.mime.includes('m4a') ? 'm4a' : audio.mime.includes('webm') ? 'webm' : audio.mime.includes('wav') ? 'wav' : audio.mime.includes('ogg') ? 'ogg' : 'mp3';
    let res: { text?: unknown; languages?: Array<{ language?: string } | string>; logprobs?: Array<{ logprob?: number }>; usage?: { input_tokens?: number; output_tokens?: number } };
    try {
      res = (await this.client.audio.transcriptions.create(
        { file: await toFile(Buffer.from(audio.bytes), `voice.${ext}`, { type: audio.mime }), model: this.cfg.transcriptionModel, response_format: 'json' } as never,
        { signal: opts?.signal ?? null },
      )) as never;
    } catch (e) {
      throw toAiError(e, PROVIDER);
    }
    if (typeof res?.text !== 'string') throw new AiError('INVALID_FORMAT', 'transcription inattendue', { provider: PROVIDER });
    const languages = (res.languages ?? []).map((l) => (typeof l === 'string' ? l : (l.language ?? ''))).filter(Boolean);
    const lp = res.logprobs?.map((x) => x.logprob).filter((x): x is number => typeof x === 'number') ?? [];
    const confidence = lp.length ? Math.exp(lp.reduce((a, b) => a + b, 0) / lp.length) : null;
    const value = { text: res.text, languages, confidence };
    return {
      value: { ...value, quality: classifyTranscript(value) },
      usage: { provider: PROVIDER, model: this.cfg.transcriptionModel, promptVersion: 'n/a', durationMs: Math.round(this.now() - t0), inputTokens: res.usage?.input_tokens ?? null, outputTokens: res.usage?.output_tokens ?? null, costMicros: estimateCostMicros(this.cfg.prices, this.cfg.transcriptionModel, { inputTokens: res.usage?.input_tokens, outputTokens: res.usage?.output_tokens, audioMs: audio.durationMs }), priceTableVersion: this.cfg.prices.version },
    };
  }
}

export function createOpenAiProviders(cfg: OpenAiConfig): AiProviders {
  const shared = { ...cfg, client: makeClient(cfg) };
  return {
    moderation: new OpenAiModerationProvider(shared),
    vision: new OpenAiMissionVisionProvider(shared),
    suggestions: new OpenAiSuggestionProvider(shared),
    signals: new OpenAiSignalProvider(shared),
    narration: new OpenAiNarrationProvider(shared),
    transcription: new OpenAiTranscriptionProvider(shared),
  };
}
