/**
 * Interfaces des services IA (§9). Chaque service est distinct ; IdentityVerificationProvider
 * est hors de ce paquet (fournisseur spécialisé, jamais un modèle généraliste de vision).
 *
 * Règles communes :
 *  - les entrées utilisateur (texte, OCR, métadonnées, transcriptions) sont des DONNÉES non
 *    fiables, jamais des instructions ;
 *  - le contexte est minimal et pseudonymisé (A/B, aucun nom, âge, position, identité, vote) ;
 *  - toute erreur est une AiError ; aucune ne vaut approbation ;
 *  - chaque appel renvoie un AiUsage (modèle, version de prompt, durée, tokens, coût estimé)
 *    destiné aux journaux — jamais le contenu.
 */
import type { ContextRisk, ConversationSignal, MissionAssessment, NarrationChoice, SuggestionItem } from './schemas.js';

export interface AiUsage {
  provider: string;
  model: string;
  promptVersion: string;
  durationMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
  /** Estimation en micro-dollars, datée par `priceTableVersion` (pas une facture). */
  costMicros: number;
  priceTableVersion: string;
}

export interface AiCall<T> {
  value: T;
  usage: AiUsage;
}

export interface CallOptions {
  /** Annulation (timeout de tâche, retrait de consentement, blocage). */
  signal?: AbortSignal;
}

// ---------------------------------------------------------------- modération
/** Catégories du modèle de modération (doc OpenAI vérifiée le 2026-11-01). */
export const MODERATION_CATEGORIES = [
  'harassment',
  'harassment/threatening',
  'hate',
  'hate/threatening',
  'illicit',
  'illicit/violent',
  'self-harm',
  'self-harm/intent',
  'self-harm/instructions',
  'sexual',
  'sexual/minors',
  'violence',
  'violence/graphic',
] as const;
export type ModerationCategory = (typeof MODERATION_CATEGORIES)[number];

/** Catégories évaluées sur image (les autres sont « text only » : un 0 sur image n'est PAS une preuve d'innocuité). */
export const IMAGE_EVALUATED_CATEGORIES: readonly ModerationCategory[] = ['self-harm', 'self-harm/intent', 'self-harm/instructions', 'sexual', 'violence', 'violence/graphic'];

export interface ModerationSignals {
  flagged: boolean;
  /** Scores 0..1 du fournisseur — signaux, pas des probabilités calibrées de culpabilité. */
  scores: Partial<Record<ModerationCategory, number>>;
  /** Catégories réellement évaluées pour cette modalité. */
  evaluated: ModerationCategory[];
  modality: 'text' | 'image';
}

export interface ContextWindowMessage {
  /** Identifiant opaque (pas l'id DB) ; A = auteur du message ciblé, B = l'autre. */
  ref: string;
  speaker: 'A' | 'B';
  text: string;
}

export interface ContentModerationProvider {
  readonly name: string;
  classifyText(text: string, opts?: CallOptions): Promise<AiCall<ModerationSignals>>;
  classifyImage(image: { bytes: Uint8Array; mime: 'image/jpeg' | 'image/png' | 'image/webp' }, opts?: CallOptions): Promise<AiCall<ModerationSignals>>;
  /** Analyse contextuelle limitée (≤ 8 messages de CETTE conversation, pseudonymisés). */
  analyzeContext(input: { target: ContextWindowMessage; window: ContextWindowMessage[] }, opts?: CallOptions): Promise<AiCall<ContextRisk>>;
}

// ---------------------------------------------------------------- vision mission
export interface MissionVisionInput {
  missionKey: string;
  /** Critères observables (bibliothèque éditoriale), jamais du texte utilisateur. */
  criteria: string[];
  /** Image NORMALISÉE serveur (sans métadonnées), dimensions connues. */
  image: { bytes: Uint8Array; mime: 'image/jpeg' | 'image/png' | 'image/webp'; width?: number; height?: number };
}
export interface MissionVisionProvider {
  readonly name: string;
  assess(input: MissionVisionInput, opts?: CallOptions): Promise<AiCall<MissionAssessment>>;
}

// ---------------------------------------------------------------- suggestions
export interface SuggestionContext {
  /** Derniers messages autorisés de CETTE conversation (≤ 10), auteurs consentants uniquement. */
  messages: ContextWindowMessage[];
  /** Éléments publics de vision (clés éditoriales). */
  publicVision: string[];
  /** Souvenirs fondés sur des événements réels : id + libellé éditorial. */
  memories: { id: string; label: string }[];
  dailyMission: string | null;
  level: number;
  branch: 'UNDECIDED' | 'FRIEND' | 'PLUS';
}
export interface MessageSuggestionProvider {
  readonly name: string;
  suggest(ctx: SuggestionContext, opts?: CallOptions): Promise<AiCall<SuggestionItem[]>>;
}

// ---------------------------------------------------------------- signaux
export interface SignalContext {
  /** Événements visibles de la relation, ids opaques que le backend revalidera. */
  events: { id: string; speaker: 'A' | 'B'; text: string }[];
}
export interface ConversationSignalProvider {
  readonly name: string;
  analyze(ctx: SignalContext, opts?: CallOptions): Promise<AiCall<ConversationSignal>>;
}

// ---------------------------------------------------------------- narration
export interface NarrationContext {
  species: string;
  situation: string;
  /** Candidats éditoriaux (id + texte) : l'IA choisit, n'écrit pas. */
  candidates: { id: string; text: string }[];
  memories: { id: string; label: string }[];
}
export interface PetNarrationProvider {
  readonly name: string;
  choose(ctx: NarrationContext, opts?: CallOptions): Promise<AiCall<NarrationChoice>>;
}

// ---------------------------------------------------------------- transcription
export interface TranscriptionResult {
  text: string;
  /** Langues détectées ; vide = non déterminée. */
  languages: string[];
  /** Confiance moyenne si le modèle la fournit (logprobs), sinon null. */
  confidence: number | null;
  /** Classification explicite du résultat (§9.2). */
  quality: 'OK' | 'SILENCE' | 'UNCERTAIN' | 'UNSUPPORTED_LANGUAGE' | 'NON_VERBAL';
}
export interface SpeechTranscriptionProvider {
  readonly name: string;
  transcribe(audio: { bytes: Uint8Array; mime: string; durationMs: number }, opts?: CallOptions): Promise<AiCall<TranscriptionResult>>;
}

export interface AiProviders {
  moderation: ContentModerationProvider;
  vision: MissionVisionProvider;
  suggestions: MessageSuggestionProvider;
  signals: ConversationSignalProvider;
  narration: PetNarrationProvider;
  transcription: SpeechTranscriptionProvider;
}
