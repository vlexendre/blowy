/**
 * Politique métier VERSIONNÉE de modération (§9.1 étapes 3-5). Pure et déterministe :
 * elle transforme des signaux (contrôles déterministes, scores fournisseur, analyse
 * contextuelle) en une action allow | warn | quarantine | reject | human_review.
 *
 * Principes :
 *  - les scores fournisseur ne sont pas des probabilités calibrées de culpabilité ; ils ne
 *    déclenchent jamais seuls une sanction de compte (seul un humain sanctionne) ;
 *  - une catégorie non évaluée pour la modalité (ex. sexual/minors sur image) n'est pas une
 *    preuve d'innocuité : la politique image est plus stricte et route vers la revue ;
 *  - une demande d'aide / détresse n'est jamais sanctionnée : ALLOW + ressource d'aide ;
 *  - une mention ordinaire d'argent ou de téléphone n'est pas une arnaque : contexte requis ;
 *  - absence de signaux (panne) ⇒ l'appelant ne doit PAS appeler decide() avec null comme
 *    s'il s'agissait d'une approbation : `decide` renvoie alors HUMAN_REVIEW/PROCESSING.
 *  - soupçon d'exploitation sexuelle de mineurs : jamais transmis au fournisseur généraliste
 *    (voir `suspectedMinorSexual`), QUARANTINE restreinte.
 */
import type { ContextRisk } from './schemas.js';
import type { ModerationCategory, ModerationSignals } from './providers.js';

export const POLICY_VERSION = 'blowy-policy-2026.11.1';

export type PolicyAction = 'ALLOW' | 'WARN' | 'QUARANTINE' | 'REJECT' | 'HUMAN_REVIEW';

export interface PolicyDecision {
  action: PolicyAction;
  reasonCode: string;
  policyVersion: string;
  /** Dossier à accès spécialisé (protection des mineurs). */
  restricted: boolean;
  /** Expression de détresse : proposer des ressources d'aide à l'auteur, sans sanction. */
  distress: boolean;
  /** Créer un dossier de modération (priorité 1 = la plus haute). */
  caseRequired: boolean;
  priority: 1 | 2 | 3;
  /** Signaux numériques conservés (sans texte). */
  signals: Record<string, number>;
}

// ------------------------------------------------------------- déterministe
const URL_RE = /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|fr|net|org|io|me|ly|gg)\b(?:\/\S*)?/i;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/;
const PHONE_RE = /(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}\b|\+\d{1,3}[\s.-]?\d{3,}[\s.-]?\d{3,}/;
const HANDLE_RE = /\b(?:snap(?:chat)?|insta(?:gram)?|whats ?app|telegram|tiktok|signal)\b\s*[:@]?\s*@?[\w.]{3,}/i;
const MONEY_RE = /(?:\d+\s?(?:€|euros?|eur\b|\$)|\b(?:argent|virement|vire[rz]?|iban|rib|paypal|lydia|western union|carte cadeau|gift ?card|crypto|bitcoin|usdt|prête?r?|rembourse|payer|paie|sous|thunes?|fric)\b)/i;
const COERCION_RE = /\b(?:sinon|si tu (?:ne|n')\s?\w+ pas|tu me dois|t'as pas le choix|tu n'as pas le choix|prouve(?:-moi)?|je vais (?:tout )?(?:dire|montrer|publier))\b/i;
const DISTRESS_RE = /\b(?:je (?:veux|vais) (?:mourir|en finir)|plus envie de vivre|me faire du mal|suicid\w*|j'en peux plus|je vais mal|au secours|aide[- ]moi)\b/i;
const URGENT_THREAT_RE = /\b(?:je vais te (?:tuer|buter|frapper|retrouver)|je sais où tu (?:habites|vis))\b/i;

export interface DeterministicFindings {
  contactDetails: boolean;
  url: boolean;
  moneyMention: boolean;
  coercionMarker: boolean;
  distressMarker: boolean;
  urgentThreat: boolean;
  repeated: boolean;
  /** Soupçon d'exploitation sexuelle de mineurs : NE PAS envoyer au fournisseur. */
  suspectedMinorSexual: boolean;
}

/**
 * Lexique de protection des mineurs : combinaison indicateur d'âge mineur + terme sexuel.
 * Injectable (tests : lexique synthétique ; aucun contenu illégal en fixture).
 */
export interface MinorSafetyLexicon {
  minorMarkers: readonly RegExp[];
  sexualMarkers: readonly RegExp[];
}
export const DEFAULT_MINOR_LEXICON: MinorSafetyLexicon = {
  minorMarkers: [/\bj'ai (?:1[0-7]|[0-9]) ans\b/i, /\b(?:1[0-7]|[0-9]) ?ans\b.*\b(?:fille|garçon|ado)\b/i, /\bmineur(?:e|s)?\b/i, /\b(?:collégien(?:ne)?|en (?:4e|3e|6e|5e))\b/i],
  sexualMarkers: [/\b(?:nude?s?|nue?s?|sexe?|sexy|coquin(?:e)?s?|photos? hot|déshabill\w*)\b/i],
};

export function deterministicChecks(text: string, ctx: { recentOwnBodies: readonly string[] }, lexicon: MinorSafetyLexicon = DEFAULT_MINOR_LEXICON): DeterministicFindings {
  const norm = text.normalize('NFKC');
  const flat = norm.toLowerCase().replace(/\s+/g, ' ').trim();
  const url = URL_RE.test(norm);
  return {
    url,
    contactDetails: url || EMAIL_RE.test(norm) || PHONE_RE.test(norm) || HANDLE_RE.test(norm),
    moneyMention: MONEY_RE.test(norm),
    coercionMarker: COERCION_RE.test(norm),
    distressMarker: DISTRESS_RE.test(norm),
    urgentThreat: URGENT_THREAT_RE.test(norm),
    repeated: ctx.recentOwnBodies.filter((b) => b.toLowerCase().replace(/\s+/g, ' ').trim() === flat).length >= 2,
    suspectedMinorSexual: lexicon.minorMarkers.some((r) => r.test(norm)) && lexicon.sexualMarkers.some((r) => r.test(norm)),
  };
}

/** L'analyse contextuelle limitée n'est appelée que si un signal le justifie. */
export function needsContextAnalysis(f: DeterministicFindings, s: ModerationSignals | null, window: readonly { speaker: 'A' | 'B' }[] = []): boolean {
  const harass = s?.scores.harassment ?? 0;
  // Insistance : ≥ 2 messages consécutifs de l'auteur en fin de fenêtre après une réponse de l'autre.
  let streak = 0;
  for (let k = window.length - 1; k >= 0 && window[k]!.speaker === 'A'; k--) streak++;
  const insisting = streak >= 2 && window.some((m) => m.speaker === 'B');
  return f.moneyMention || f.coercionMarker || f.contactDetails || f.repeated || harass >= 0.3 || insisting;
}

// ------------------------------------------------------------- texte
export interface TextPolicyInput {
  findings: DeterministicFindings;
  /** null = classification indisponible (l'appelant ne publie pas : voir decideText). */
  signals: ModerationSignals | null;
  context: ContextRisk | null;
  /** Niveau atteint de la relation (coordonnées « précoces » avant N3). */
  level: number;
}

const s = (sig: ModerationSignals | null, c: ModerationCategory) => sig?.scores[c] ?? 0;

function d(action: PolicyAction, reasonCode: string, o: Partial<Omit<PolicyDecision, 'action' | 'reasonCode' | 'policyVersion'>> = {}): PolicyDecision {
  return { action, reasonCode, policyVersion: POLICY_VERSION, restricted: false, distress: false, caseRequired: action === 'HUMAN_REVIEW' || action === 'QUARANTINE', priority: 2, signals: {}, ...o };
}

/** Décision texte. `signals === null` ⇒ HUMAN_REVIEW (jamais d'approbation implicite). */
export function decideText(i: TextPolicyInput): PolicyDecision {
  const f = i.findings;
  const sig = i.signals;
  const numeric: Record<string, number> = {};
  for (const [k, v] of Object.entries(sig?.scores ?? {})) if (typeof v === 'number' && v >= 0.01) numeric[k] = Math.round(v * 1000) / 1000;
  if (i.context) numeric[`context.${i.context.risk}`] = i.context.confidenceSignal;
  const base = { signals: numeric };

  if (f.suspectedMinorSexual || s(sig, 'sexual/minors') >= 0.2) return d('QUARANTINE', 'MINOR_SAFETY', { ...base, restricted: true, caseRequired: true, priority: 1 });
  if (f.urgentThreat) return d('QUARANTINE', 'THREAT', { ...base, caseRequired: true, priority: 1 });
  if (!sig) return d('HUMAN_REVIEW', 'CLASSIFICATION_UNAVAILABLE', { ...base, caseRequired: false, priority: 3 });

  // Détresse : jamais sanctionnée. Instructions d'automutilation → revue (protection de l'autre).
  const selfHarm = Math.max(s(sig, 'self-harm'), s(sig, 'self-harm/intent'));
  if (s(sig, 'self-harm/instructions') >= 0.5) return d('HUMAN_REVIEW', 'SELF_HARM_INSTRUCTIONS', { ...base, distress: true, priority: 1 });

  if (s(sig, 'harassment/threatening') >= 0.7 || s(sig, 'hate/threatening') >= 0.5 || s(sig, 'illicit/violent') >= 0.7) return d('QUARANTINE', 'THREAT', { ...base, priority: 1 });
  if (s(sig, 'hate') >= 0.7) return d('REJECT', 'HATE', { ...base, caseRequired: true });
  if (s(sig, 'violence/graphic') >= 0.8) return d('REJECT', 'GRAPHIC_VIOLENCE', base);

  const ctx = i.context && i.context.confidenceSignal >= 0.6 ? i.context : null;
  if (ctx?.risk === 'coercion') return d('QUARANTINE', 'COERCION', { ...base, priority: 1 });
  if (ctx?.risk === 'money_request' && ctx.targetMessageIsRequest) return d('HUMAN_REVIEW', 'MONEY_REQUEST', { ...base, priority: 1 });
  if (ctx?.risk === 'harassment_repeated') return d('WARN', 'HARASSMENT_REPEATED', { ...base, caseRequired: true });

  if (s(sig, 'illicit') >= 0.8) return d('HUMAN_REVIEW', 'ILLICIT', base);
  if (s(sig, 'harassment') >= 0.8) return d('WARN', 'HARASSMENT', base);
  if (s(sig, 'sexual') >= 0.8 && i.level < 4) return d('WARN', 'SEXUAL_EARLY', base);
  if (s(sig, 'violence') >= 0.8) return d('WARN', 'VIOLENCE', base);

  if (f.contactDetails && i.level < 3) return d('WARN', ctx?.risk === 'circumvention' ? 'CIRCUMVENTION' : 'EARLY_CONTACT_DETAILS', base);
  if (f.repeated) return d('WARN', 'REPETITION', base);

  const distress = f.distressMarker || selfHarm >= 0.5 || ctx?.risk === 'distress';
  return d('ALLOW', distress ? 'DISTRESS_SUPPORT' : 'OK', { ...base, distress, caseRequired: false });
}

// ------------------------------------------------------------- image
export type ImagePurpose = 'PROFILE_PHOTO' | 'MISSION_PROOF' | 'CHAT_IMAGE' | 'VERIFICATION_SELFIE';

/**
 * Décision image. Les catégories « text only » ne sont pas évaluées sur image : faute de
 * signal sur sexual/minors, tout contenu sexuel même faible part en revue humaine.
 */
export function decideImage(signals: ModerationSignals | null, purpose: ImagePurpose): PolicyDecision {
  if (!signals) return d('HUMAN_REVIEW', 'CLASSIFICATION_UNAVAILABLE', { caseRequired: false, priority: 3 });
  const numeric: Record<string, number> = {};
  for (const c of signals.evaluated) numeric[c] = Math.round((signals.scores[c] ?? 0) * 1000) / 1000;
  const base = { signals: numeric };
  const sex = s(signals, 'sexual');
  if (sex >= 0.8) return d('REJECT', 'SEXUAL_IMAGE', { ...base, caseRequired: true });
  if (sex >= 0.3) return d('HUMAN_REVIEW', 'SEXUAL_IMAGE_UNCERTAIN', base);
  if (s(signals, 'violence/graphic') >= 0.6) return d('REJECT', 'GRAPHIC_VIOLENCE', base);
  if (Math.max(s(signals, 'self-harm'), s(signals, 'self-harm/intent'), s(signals, 'self-harm/instructions')) >= 0.5) return d('HUMAN_REVIEW', 'SELF_HARM_IMAGE', { ...base, distress: true, priority: 1 });
  if (s(signals, 'violence') >= 0.8 && purpose !== 'MISSION_PROOF') return d('HUMAN_REVIEW', 'VIOLENCE_IMAGE', base);
  return d('ALLOW', 'OK', { ...base, caseRequired: false });
}

// ------------------------------------------------------------- transcription
/** §9.2 : silence / incertain / langue non prise en charge / non verbal → revue (jamais publié auto). */
export function decideTranscriptGate(quality: 'OK' | 'SILENCE' | 'UNCERTAIN' | 'UNSUPPORTED_LANGUAGE' | 'NON_VERBAL'): PolicyDecision | null {
  if (quality === 'OK') return null;
  return d('HUMAN_REVIEW', `VOICE_${quality}`, { caseRequired: true, priority: 3 });
}
