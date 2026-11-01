/**
 * Adaptateurs LOCAUX DÉTERMINISTES (Strategy, interdits en production) : implémentent les
 * interfaces finales, sans réseau. Ils ne prétendent pas classifier le contenu réel ; ils
 * produisent des signaux reproductibles à partir de lexiques synthétiques sûrs et de
 * marqueurs de test, pour les tests métier et le développement local.
 *
 * Marqueurs (compatibles avec les tests du socle) : [reject] [quarantine] [review] [warn]
 * [fail] (erreur fournisseur) [timeout] [refuse] (refus du modèle) [invalid] (format invalide).
 */
import { PET_LINES } from '@blowy/content';
import { AiError } from '../errors.js';
import type {
  AiCall,
  AiUsage,
  CallOptions,
  ContentModerationProvider,
  ContextWindowMessage,
  ConversationSignalProvider,
  MessageSuggestionProvider,
  MissionVisionInput,
  MissionVisionProvider,
  ModerationCategory,
  ModerationSignals,
  NarrationContext,
  PetNarrationProvider,
  SignalContext,
  SpeechTranscriptionProvider,
  SuggestionContext,
  TranscriptionResult,
} from '../providers.js';
import { IMAGE_EVALUATED_CATEGORIES, MODERATION_CATEGORIES } from '../providers.js';
import { PROMPTS } from '../prompts.js';
import type { ContextRisk, ConversationSignal, MissionAssessment, NarrationChoice, SuggestionItem } from '../schemas.js';
import { SUGGESTION_MAX_CHARS } from '../schemas.js';
import { parseWav } from './audio.js';

const LOCAL = 'local-deterministic';
const usage = (promptVersion: string): AiUsage => ({ provider: LOCAL, model: 'local', promptVersion, durationMs: 0, inputTokens: null, outputTokens: null, costMicros: 0, priceTableVersion: 'local' });

function markerErrors(text: string): void {
  const t = text.toLowerCase();
  if (t.includes('[fail]')) throw new AiError('PROVIDER_ERROR', 'panne simulée', { provider: LOCAL });
  if (t.includes('[timeout]')) throw new AiError('TIMEOUT', 'délai simulé', { provider: LOCAL });
  if (t.includes('[refuse]')) throw new AiError('REFUSED', 'refus simulé', { provider: LOCAL });
  if (t.includes('[invalid]')) throw new AiError('INVALID_FORMAT', 'format invalide simulé', { provider: LOCAL });
}

function abortable(opts?: CallOptions): void {
  if (opts?.signal?.aborted) throw new AiError('CANCELLED', 'annulé', { provider: LOCAL });
}

/** Lexique synthétique FR (termes génériques, aucun contenu illégal). */
const LEX: { re: RegExp; cat: ModerationCategory; score: number }[] = [
  { re: /\[reject\]/i, cat: 'hate', score: 0.95 },
  { re: /\[quarantine\]/i, cat: 'harassment/threatening', score: 0.9 },
  { re: /\[review\]/i, cat: 'illicit', score: 0.9 },
  { re: /\[warn\]/i, cat: 'harassment', score: 0.85 },
  { re: /\b(?:connard|connasse|abruti(?:e)?|débile|sale (?:type|meuf|mec)|ferme[- ]la|t'es (?:qu'?)?une? (?:merde|nul(?:le)?))\b/i, cat: 'harassment', score: 0.88 },
  { re: /\b(?:je vais te (?:tuer|buter|frapper|défoncer)|tu vas le regretter|fais gaffe à toi)\b/i, cat: 'harassment/threatening', score: 0.9 },
  { re: /\b(?:me faire du mal|en finir|plus envie de vivre|je veux mourir)\b/i, cat: 'self-harm', score: 0.75 },
  { re: /\b(?:acheter de la drogue|dealer|deal de)\b/i, cat: 'illicit', score: 0.85 },
  { re: /\b(?:photos? (?:hot|nue?s?)|nude?s?|déshabille[- ]toi)\b/i, cat: 'sexual', score: 0.85 },
];

export class LocalContentModerationProvider implements ContentModerationProvider {
  readonly name = LOCAL;
  constructor(isProduction: boolean) {
    if (isProduction) throw new Error('Adaptateur IA local interdit en production');
  }

  async classifyText(text: string, opts?: CallOptions): Promise<AiCall<ModerationSignals>> {
    abortable(opts);
    markerErrors(text);
    const scores: Partial<Record<ModerationCategory, number>> = {};
    for (const c of MODERATION_CATEGORIES) scores[c] = 0;
    for (const l of LEX) if (l.re.test(text)) scores[l.cat] = Math.max(scores[l.cat] ?? 0, l.score);
    const flagged = Object.values(scores).some((v) => (v ?? 0) >= 0.5);
    return { value: { flagged, scores, evaluated: [...MODERATION_CATEGORIES], modality: 'text' }, usage: usage('n/a') };
  }

  /** Image : signal synthétique dérivé des 4 premiers octets du hash ; 0 par défaut. */
  async classifyImage(image: { bytes: Uint8Array }, opts?: CallOptions): Promise<AiCall<ModerationSignals>> {
    abortable(opts);
    const scores: Partial<Record<ModerationCategory, number>> = {};
    for (const c of IMAGE_EVALUATED_CATEGORIES) scores[c] = 0;
    if (image.bytes.length === 0) throw new AiError('INVALID_FORMAT', 'image vide', { provider: LOCAL });
    return { value: { flagged: false, scores, evaluated: [...IMAGE_EVALUATED_CATEGORIES], modality: 'image' }, usage: usage('n/a') };
  }

  async analyzeContext(input: { target: ContextWindowMessage; window: ContextWindowMessage[] }, opts?: CallOptions): Promise<AiCall<ContextRisk>> {
    abortable(opts);
    markerErrors(input.target.text);
    return { value: localContextRisk(input.target, input.window), usage: usage(PROMPTS.contextRisk.version) };
  }
}

const MONEY_REQUEST_RE = /\b(?:envoie[- ]moi|prête[- ]moi|vire[- ]moi|fais[- ]moi un virement|tu (?:peux|pourrais) me (?:prêter|virer|envoyer|payer)|j'ai besoin (?:de|d')\s?(?:\d+|argent|thunes?|sous)|ton (?:iban|rib|code)|carte cadeau|paysafe(?:card)?|bitcoin|crypto)\b/i;
const COERCE_RE = /\b(?:sinon (?:je|tu|on)|si tu (?:ne|n')\s?\w+ pas[^.?!]*(?:je|j')|tu me dois|t'as pas le choix|tu n'as pas le choix|je vais (?:tout )?(?:dire|montrer|publier))\b/i;
const OFFPLATFORM_RE = /\b(?:ajoute[- ]moi|viens sur|écris[- ]moi sur|parle[- ]moi sur|mon (?:snap|insta|whatsapp|telegram|num(?:éro)?))\b/i;
const DISTRESS_RE = /\b(?:je vais mal|j'en peux plus|aide[- ]moi|au secours|me faire du mal|plus envie de vivre)\b/i;
const NO_RE = /\b(?:non|arrête|stop|laisse[- ]moi|pas intéressée?)\b/i;

export function localContextRisk(target: ContextWindowMessage, window: ContextWindowMessage[]): ContextRisk {
  const t = target.text;
  if (COERCE_RE.test(t)) return { risk: 'coercion', confidenceSignal: 0.8, targetMessageIsRequest: true, rationaleCode: 'PRESSURE' };
  if (MONEY_REQUEST_RE.test(t)) return { risk: 'money_request', confidenceSignal: 0.8, targetMessageIsRequest: true, rationaleCode: 'EXPLICIT_REQUEST' };
  // Insistance : l'autre a dit non dans la fenêtre et A continue (≥ 2 messages A après le refus).
  const lastNo = window.map((m, i) => (m.speaker === 'B' && NO_RE.test(m.text) ? i : -1)).reduce((a, b) => Math.max(a, b), -1);
  if (lastNo >= 0 && window.slice(lastNo + 1).filter((m) => m.speaker === 'A').length >= 2) return { risk: 'harassment_repeated', confidenceSignal: 0.75, targetMessageIsRequest: false, rationaleCode: 'REPEATED_UNWANTED' };
  if (OFFPLATFORM_RE.test(t)) return { risk: 'circumvention', confidenceSignal: 0.7, targetMessageIsRequest: true, rationaleCode: 'OFF_PLATFORM_PUSH' };
  if (DISTRESS_RE.test(t)) return { risk: 'distress', confidenceSignal: 0.7, targetMessageIsRequest: false, rationaleCode: 'HELP_SEEKING' };
  return { risk: 'none', confidenceSignal: 0.7, targetMessageIsRequest: false, rationaleCode: 'ORDINARY_MENTION' };
}

/**
 * Vision locale : règle synthétique sur le cadrage (largeur/hauteur de l'image normalisée).
 * carré ±25 % → consistent ; paysage > 2:1 → inconsistent (hors sujet) ; portrait > 2:1 → uncertain.
 */
export class LocalMissionVisionProvider implements MissionVisionProvider {
  readonly name = LOCAL;
  constructor(isProduction: boolean) {
    if (isProduction) throw new Error('Adaptateur IA local interdit en production');
  }
  async assess(input: MissionVisionInput, opts?: CallOptions): Promise<AiCall<MissionAssessment>> {
    abortable(opts);
    const { width = 1, height = 1 } = input.image;
    const r = width / height;
    let value: MissionAssessment;
    if (r > 2) value = { status: 'inconsistent', visibleEvidence: [], missingEvidence: [...input.criteria], qualityIssues: [], confidenceSignal: 0.8, requiresReview: false, reasonCode: 'OFF_TOPIC' };
    else if (r < 0.5) value = { status: 'uncertain', visibleEvidence: [], missingEvidence: [], qualityIssues: ['cadrage ambigu'], confidenceSignal: 0.3, requiresReview: true, reasonCode: 'UNREADABLE' };
    else if (r >= 0.75 && r <= 1.34) value = { status: 'consistent', visibleEvidence: input.criteria.map((c) => `élément visible : ${c}`.slice(0, 120)), missingEvidence: [], qualityIssues: [], confidenceSignal: 0.9, requiresReview: false, reasonCode: 'CRITERIA_VISIBLE' };
    else value = { status: 'uncertain', visibleEvidence: [], missingEvidence: [], qualityIssues: ['éléments partiels'], confidenceSignal: 0.5, requiresReview: true, reasonCode: 'CRITERIA_PARTIAL' };
    return { value, usage: usage(PROMPTS.missionVision.version) };
  }
}

/** Suggestions locales : bibliothèque éditoriale + souvenirs réels fournis (jamais inventés). */
export class LocalSuggestionProvider implements MessageSuggestionProvider {
  readonly name = LOCAL;
  constructor(isProduction: boolean) {
    if (isProduction) throw new Error('Adaptateur IA local interdit en production');
  }
  async suggest(ctx: SuggestionContext, opts?: CallOptions): Promise<AiCall<SuggestionItem[]>> {
    abortable(opts);
    for (const m of ctx.messages) markerErrors(m.text);
    return { value: editorialSuggestions(ctx), usage: usage(PROMPTS.suggestions.version) };
  }
}

/** Fallback éditorial sûr (aussi utilisé en panne IA ou sans consentement). */
export function editorialSuggestions(ctx: Pick<SuggestionContext, 'memories' | 'dailyMission'>): SuggestionItem[] {
  const out: SuggestionItem[] = [];
  const mem = ctx.memories[0];
  if (mem) out.push({ text: `Tu te souviens de « ${mem.label} » ? On remet ça ?`.slice(0, SUGGESTION_MAX_CHARS), tone: 'gentle', reasonCode: 'SHARED_MEMORY', memoryRefs: [mem.id] });
  if (ctx.dailyMission) out.push({ text: `La mission du jour, « ${ctx.dailyMission} » : tu la tentes avec moi ?`.slice(0, SUGGESTION_MAX_CHARS), tone: 'playful', reasonCode: 'DAILY_MISSION', memoryRefs: [] });
  const nudges = PET_LINES.filter((l) => l.situation === 'NUDGE' && !l.fr.includes('{'));
  for (const l of nudges) {
    if (out.length >= 3) break;
    out.push({ text: l.fr.slice(0, SUGGESTION_MAX_CHARS), tone: out.length === 2 ? 'direct' : 'playful', reasonCode: 'OPEN_QUESTION', memoryRefs: [] });
  }
  return out.slice(0, 3);
}

const WARM_RE = /\b(?:merci|trop (?:mignon|chou)|j'adore|génial|super|hâte|❤️|🥰|😊)\b/i;
const PLAY_RE = /\b(?:haha|mdr|ptdr|lol|😂|😜|défi|pari)\b/i;
const TENSE_RE = /\b(?:énervé|agacé|pourquoi tu|t'as pas répondu|bof|laisse tomber)\b/i;

export class LocalSignalProvider implements ConversationSignalProvider {
  readonly name = LOCAL;
  constructor(isProduction: boolean) {
    if (isProduction) throw new Error('Adaptateur IA local interdit en production');
  }
  async analyze(ctx: SignalContext, opts?: CallOptions): Promise<AiCall<ConversationSignal>> {
    abortable(opts);
    const pick = (re: RegExp) => ctx.events.filter((e) => re.test(e.text)).map((e) => e.id);
    const bogus = ctx.events.some((e) => e.text.includes('[bogus-evidence]')) ? ['00000000-0000-7000-8000-000000000000'] : [];
    const warm = pick(WARM_RE);
    const play = pick(PLAY_RE);
    const tense = pick(TENSE_RE);
    let value: ConversationSignal;
    if (tense.length) value = { tone: 'tense', evidenceEventIds: [...tense, ...bogus], proposedReaction: 'pouting', confidenceSignal: 0.7, ttlSeconds: 900 };
    else if (play.length) value = { tone: 'playful', evidenceEventIds: [...play, ...bogus], proposedReaction: 'joyful', confidenceSignal: 0.8, ttlSeconds: 900 };
    else if (warm.length) value = { tone: 'warm', evidenceEventIds: [...warm, ...bogus], proposedReaction: 'affectionate', confidenceSignal: 0.8, ttlSeconds: 900 };
    else value = { tone: 'neutral', evidenceEventIds: bogus, proposedReaction: null, confidenceSignal: 0.4, ttlSeconds: 900 };
    return { value, usage: usage(PROMPTS.signals.version) };
  }
}

export class LocalNarrationProvider implements PetNarrationProvider {
  readonly name = LOCAL;
  constructor(isProduction: boolean) {
    if (isProduction) throw new Error('Adaptateur IA local interdit en production');
  }
  async choose(ctx: NarrationContext, opts?: CallOptions): Promise<AiCall<NarrationChoice>> {
    abortable(opts);
    const c = ctx.candidates[0];
    if (!c) throw new AiError('INVALID_FORMAT', 'aucun candidat', { provider: LOCAL });
    return { value: { lineId: c.id, reaction: null }, usage: usage(PROMPTS.narration.version) };
  }
}

/**
 * Transcription locale : WAV PCM uniquement (analyse de l'énergie), sinon UNCERTAIN.
 * RMS < 200 → SILENCE ; échantillonnage 8 kHz → UNCERTAIN (qualité téléphone) ; sinon texte fixe.
 */
export class LocalTranscriptionProvider implements SpeechTranscriptionProvider {
  readonly name = LOCAL;
  constructor(isProduction: boolean) {
    if (isProduction) throw new Error('Adaptateur IA local interdit en production');
  }
  async transcribe(audio: { bytes: Uint8Array; mime: string; durationMs: number }, opts?: CallOptions): Promise<AiCall<TranscriptionResult>> {
    abortable(opts);
    const wav = parseWav(audio.bytes);
    let value: TranscriptionResult;
    if (!wav) value = { text: '', languages: [], confidence: null, quality: 'UNCERTAIN' };
    else if (wav.rms < 200) value = { text: '', languages: [], confidence: null, quality: 'SILENCE' };
    else if (wav.sampleRate <= 8000) value = { text: 'bonjour… (inaudible)', languages: [], confidence: 0.3, quality: 'UNCERTAIN' };
    else value = { text: 'message vocal de démonstration', languages: ['fr'], confidence: 0.9, quality: 'OK' };
    return { value, usage: usage('n/a') };
  }
}
