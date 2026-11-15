/**
 * Les minimoas dans la conversation (spéc §9) : rôles, plafonds, déclencheurs, accord de lecture, ton, santé du lien.
 * Pur : l'instant et les compteurs sont passés en paramètre.
 */
import type { Day } from '../days';
import type { Gauges } from '../gauges';

/**
 * Rôle d'une réplique de minimoa :
 * - icebreaker : au début d'un lien, une question tirée des points communs ;
 * - nudge : relance après un long silence ;
 * - remark : remarque de temps en temps (dont réactions au premier message du jour, mots doux et vannes) ;
 * - guard : garde-fou quand le ton monte, visible par la seule personne concernée ;
 * - event : annonce de jeu (niveau, vies, photo à deux) — ni plafonnée ni coupée.
 */
export const PET_ROLES = ['icebreaker', 'nudge', 'remark', 'guard', 'event'] as const;
export type PetRole = (typeof PET_ROLES)[number];

/** Rôles qui comptent dans le plafond quotidien et que l'on peut couper. */
export const COUNTED_PET_ROLES: readonly PetRole[] = ['icebreaker', 'nudge', 'remark', 'guard'];
export const isCountedRole = (role: PetRole): boolean => COUNTED_PET_ROLES.includes(role);

/** Au plus 3 interventions par jour et par lien. */
export const CHAT_MAX_INTERVENTIONS_PER_DAY = 3;
/** Relance après 3 jours de silence. */
export const SILENCE_NUDGE_HOURS = 72;
/** Une remarque au plus tous les N messages des personnes. */
export const REMARK_EVERY_MESSAGES = 12;
/** Fenêtre lue par l'IA : derniers messages, chacun tronqué. */
export const AI_WINDOW_MESSAGES = 8;
export const AI_WINDOW_CHARS = 280;
/** Garde-fou : seuil du ton sur les 3 derniers messages d'une personne, et pause entre deux garde-fous. */
export const GUARD_THRESHOLD = 5;
export const GUARD_COOLDOWN_HOURS = 24;

/** Réponse à l'accord de lecture : null tant que la question n'a pas été posée. */
export type ChatConsent = boolean | null;

/** L'IA ne lit les messages que si les deux personnes ont dit oui. */
export const chatReadingAllowed = (a: ChatConsent, b: ChatConsent): boolean => a === true && b === true;

/** État des interventions d'un lien. */
export interface ChatPetState {
  /** Jour (Europe/Paris) auquel `interventions` se rapporte. */
  day: Day | null;
  interventions: number;
  /** Messages texte des personnes depuis la dernière remarque. */
  messagesSinceRemark: number;
  icebreakerDone: boolean;
  /** Dernier message d'une personne (ou création du lien) : base des silences (les répliques des minimoas n'y comptent pas). */
  lastUserAt: string | null;
  /** `lastUserAt` au moment de la dernière relance : une seule relance par silence. */
  lastNudgeFor: string | null;
  lastGuardAt: string | null;
}

export const EMPTY_CHAT_PET_STATE: ChatPetState = {
  day: null,
  interventions: 0,
  messagesSinceRemark: 0,
  icebreakerDone: false,
  lastUserAt: null,
  lastNudgeFor: null,
  lastGuardAt: null,
};

export const interventionsToday = (s: ChatPetState, today: Day): number => (s.day === today ? s.interventions : 0);
export const interventionsLeft = (s: ChatPetState, today: Day): number => Math.max(0, CHAT_MAX_INTERVENTIONS_PER_DAY - interventionsToday(s, today));

/** Enregistre une intervention comptée (rend un nouvel état). */
export function countIntervention(s: ChatPetState, today: Day): ChatPetState {
  return { ...s, day: today, interventions: interventionsToday(s, today) + 1 };
}

export interface RemarkInput {
  state: ChatPetState;
  today: Day;
  muted: boolean;
}
/** Vrai quand assez de messages sont passés depuis la dernière remarque et qu'il reste une intervention. */
export const remarkDue = ({ state, today, muted }: RemarkInput): boolean =>
  !muted && state.messagesSinceRemark >= REMARK_EVERY_MESSAGES && interventionsLeft(state, today) > 0;

export interface NudgeInput {
  state: ChatPetState;
  today: Day;
  muted: boolean;
  active: boolean;
  now: Date;
}
/** Relance : lien actif, silence des personnes d'au moins 72 h, pas déjà relancé pour ce silence. */
export function nudgeDue(i: NudgeInput): boolean {
  const last = i.state.lastUserAt;
  if (!i.active || i.muted || last === null || interventionsLeft(i.state, i.today) === 0) return false;
  if (i.state.lastNudgeFor === last) return false;
  return i.now.getTime() - new Date(last).getTime() >= SILENCE_NUDGE_HOURS * 3_600_000;
}

/** Heures entières de silence (pour « Ça fait 3 jours »). */
export const silenceDays = (lastMessageAt: string, now: Date): number => Math.floor((now.getTime() - new Date(lastMessageAt).getTime()) / 86_400_000);

// ── Ton (heuristique locale, avant tout appel au modèle) ───────────────────

const HOSTILE_WORDS = [
  'connard', 'connasse', 'conne', 'con', 'débile', 'debile', 'abruti', 'abrutie', 'idiot', 'idiote', 'crétin', 'cretin',
  'pétasse', 'salope', 'salaud', 'enfoiré', 'enfoire', 'ta gueule', 'tg', 'ferme-la', 'ferme la', 'dégage', 'degage',
  'nul', 'nulle', 'pathétique', 'pathetique', 'minable', 'menteur', 'menteuse', 'stupid', 'shut up', 'loser',
];
const HEATED_PHRASES = [
  "j'en ai marre", 'j’en ai marre', 'tu me saoules', 'tu me soûles', 'tu m’énerves', "tu m'énerves", 'laisse-moi tranquille',
  'laisse moi tranquille', "c'est toujours pareil", 'c’est toujours pareil', 'tu comprends rien', 'n’importe quoi', "n'importe quoi",
];

const normalizeText = (text: string): string => ` ${text.toLowerCase().replace(/[.,;:!?()"«»]/g, ' ').replace(/\s+/g, ' ')} `;

/** Score de tension d'un message (0 = calme). Ne quitte jamais le serveur ; rien n'est conservé. */
export function toneScore(text: string): number {
  const n = normalizeText(text);
  let score = 0;
  for (const w of HOSTILE_WORDS) if (n.includes(` ${w} `)) score += 3;
  for (const p of HEATED_PHRASES) if (n.includes(p)) score += 2;
  const letters = text.replace(/[^A-Za-zÀ-ÿ]/g, '');
  if (letters.length >= 8 && letters.replace(/[^A-ZÀ-Þ]/g, '').length / letters.length > 0.7) score += 2;
  if (/[!?]{3,}/.test(text)) score += 1;
  return score;
}

export interface GuardInput {
  /** Scores des derniers messages (au plus 3) de la même personne, du plus ancien au plus récent. */
  recentScores: readonly number[];
  lastGuardAt: string | null;
  now: Date;
}
/** Le ton monte : somme sur les 3 derniers messages au-dessus du seuil, et pas de garde-fou dans les 24 h. */
export function guardDue(i: GuardInput): boolean {
  const sum = i.recentScores.slice(-3).reduce((a, b) => a + b, 0);
  if (sum < GUARD_THRESHOLD) return false;
  return i.lastGuardAt === null || i.now.getTime() - new Date(i.lastGuardAt).getTime() >= GUARD_COOLDOWN_HOURS * 3_600_000;
}

// ── Caractère du minimoa dans le chat ──────────────────────────────────────

/** Façon de parler d'un minimoa, tirée du style de son humain (les 4 jauges). */
export const MINIMOA_VOICES = ['doux', 'sec', 'joueur', 'pose'] as const;
export type MinimoaVoice = (typeof MINIMOA_VOICES)[number];

export function minimoaVoiceOf(g: Gauges): MinimoaVoice {
  if (g.tender <= -25) return 'sec';
  if (g.play >= 25) return 'joueur';
  if (g.tender >= 25) return 'doux';
  return 'pose';
}

/** Une réponse du modèle qui veut dire « rien à dire ». */
export function isNothingToSay(text: string): boolean {
  const t = text.trim().toUpperCase();
  return t === '' || t.startsWith('RIEN') || t.startsWith('NOTHING') || t === '-';
}

/** Nettoie une réplique produite par le modèle : une ligne, sans guillemets, 160 caractères au plus. */
export function cleanMinimoaLine(text: string): string | null {
  const line = text.split('\n').map((l) => l.trim()).find((l) => l.length > 0) ?? '';
  const unquoted = line.replace(/^["«“\s]+|["»”\s]+$/g, '').trim();
  if (isNothingToSay(unquoted)) return null;
  if (unquoted.length > 160) return `${unquoted.slice(0, 159).trimEnd()}…`;
  return unquoted;
}

// ── Santé du lien (pour le bilan de la semaine) ────────────────────────────

export interface LinkWeekStats {
  /** Messages texte de la personne et de l'autre sur les 7 derniers jours. */
  mine: number;
  theirs: number;
  /** Jours où les deux ont posté leur photo du jour. */
  duoPhotoDays: number;
  streak: number;
  lives: number;
  /** Âge du lien en jours. */
  ageDays: number;
}

/** Ce qu'on dit d'un lien — toujours positif ou neutre, jamais un reproche. */
export const LINK_HEALTH_KEYS = ['new', 'quiet', 'photos', 'lively', 'one_sided', 'balanced'] as const;
export type LinkHealthKey = (typeof LINK_HEALTH_KEYS)[number];

export interface LinkHealth {
  /** De 0 à 100. Jamais montré seul. */
  score: number;
  key: LinkHealthKey;
}

export function linkHealthOf(s: LinkWeekStats): LinkHealth {
  const total = s.mine + s.theirs;
  const score = Math.round(
    Math.min(1, s.lives / 7) * 40 + (Math.min(total, 40) / 40) * 30 + (Math.min(s.duoPhotoDays, 7) / 7) * 20 + (Math.min(s.streak, 7) / 7) * 10,
  );
  let key: LinkHealthKey;
  if (s.ageDays < 7) key = 'new';
  else if (total === 0 && s.duoPhotoDays === 0) key = 'quiet';
  else if (s.duoPhotoDays >= 3) key = 'photos';
  else if (total >= 6 && Math.min(s.mine, s.theirs) / Math.max(s.mine, s.theirs) < 0.25) key = 'one_sided';
  else if (total >= 30) key = 'lively';
  else key = 'balanced';
  return { score: Math.max(0, Math.min(100, score)), key };
}
