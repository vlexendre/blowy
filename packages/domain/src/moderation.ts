/**
 * Filtre des contenus publiés (App Review 1.2) : couche de règles locale, rapide, multilingue, sans aucun appel
 * extérieur. Pur : pas d'horloge, pas d'aléa. Ce que l'API en fait dépend de la surface (`decideModeration`) :
 * - noms (prénom, nom du minimoa) : refusés au moindre doute, avec un message clair ;
 * - messages : bloqués pour les violations nettes, livrés mais signalés à la modération pour les cas limites, et
 *   « à confirmer » (IA si elle est permise, sinon livrés) quand la règle hésite ;
 * - notes de signalement : jamais refusées (c'est un canal de sécurité), seulement priorisées.
 *
 * Normalisation contre les contournements simples : minuscules, accents et signes combinants retirés, caractères
 * invisibles supprimés, homoglyphes cyrilliques ramenés au latin, chiffres et symboles « leet » (0→o, 1→i, 3→e, 4→a,
 * 5→s, 7→t, @→a, $→s…), lettres répétées réduites (« connnnard »), lettres isolées recollées (« c.o.n.n.a.r.d »,
 * « s e x e »).
 *
 * Ce que le filtre ne fait pas : comprendre le sens (ironie, citation), lire une image, connaître l'argot nouveau.
 * Les cas limites passent par la modération humaine (signalement automatique) et, si c'est permis, par l'IA.
 */
import type { Locale } from './vision';

// ── Catégories ───────────────────────────────────────────────────────────────

export const MODERATION_CATEGORIES = [
  /** Contenu sexuel impliquant un mineur (vocabulaire explicite, ou mineur + acte sexuel dans le même texte). */
  'minor_sexual',
  /** Menace de violence, de viol, incitation au suicide, « je sais où tu habites ». */
  'threat',
  /** Insulte visant un groupe (origine, religion, orientation, genre). */
  'hate',
  /** Sexe tarifé, escorte, plateforme payante. */
  'commercial_sex',
  /** Arnaque ou collecte de contacts : lien ou contact avec argent, crypto, cartes cadeaux. */
  'scam',
  /** Insulte personnelle. */
  'insult',
  /** Sexe explicite ou sollicitation sexuelle non tarifée. */
  'sexual',
  /** Lien, adresse e-mail, téléphone ou pseudo d'un autre réseau (refusé dans un nom seulement). */
  'contact',
] as const;
export type ModerationCategory = (typeof MODERATION_CATEGORIES)[number];

/** Gravité : `critical` bloque un message ; `low` le laisse passer mais le signale à la modération. */
export const CATEGORY_SEVERITY: Readonly<Record<ModerationCategory, 'critical' | 'low' | 'name_only'>> = {
  minor_sexual: 'critical',
  threat: 'critical',
  hate: 'critical',
  commercial_sex: 'critical',
  scam: 'critical',
  insult: 'low',
  sexual: 'low',
  contact: 'name_only',
};

export interface TextVerdict {
  /** Catégorie la plus grave trouvée (null : rien trouvé). */
  category: ModerationCategory | null;
  /** Toutes les catégories trouvées, de la plus grave à la moins grave. */
  categories: ModerationCategory[];
  /**
   * Vocabulaire explicitement pédocriminel (pas seulement « mineur + sexe ») : seul cas qui suspend le compte
   * automatiquement en attendant la modération.
   */
  explicitMinor: boolean;
  /** La règle hésite (lien nu) : à confirmer par l'IA si elle est permise. */
  unsure: boolean;
}

// ── Normalisation ────────────────────────────────────────────────────────────

const INVISIBLE = /[­͏؜ᅟᅠ឴឵᠎​-‏‪-‮⁠-⁤⁪-⁯﻿]/g;
const HOMOGLYPHS: Readonly<Record<string, string>> = {
  а: 'a', е: 'e', о: 'o', р: 'p', с: 'c', х: 'x', у: 'y', і: 'i', ј: 'j', ѕ: 's', к: 'k', м: 'm', т: 't', в: 'b', н: 'h',
  ı: 'i', ł: 'l', ø: 'o', đ: 'd', ß: 'ss', æ: 'ae', œ: 'oe',
};
const LEET: Readonly<Record<string, string>> = { '0': 'o', '1': 'i', '!': 'i', '|': 'i', '3': 'e', '€': 'e', '4': 'a', '@': 'a', '5': 's', $: 's', '7': 't', '8': 'b', '9': 'g', '+': 't' };

/** Minuscules, accents retirés, invisibles supprimés, homoglyphes ramenés au latin. Les chiffres restent. */
export function foldText(raw: string): string {
  const lower = raw.normalize('NFKD').replace(/\p{M}+/gu, '').replace(INVISIBLE, '').toLowerCase();
  let out = '';
  for (const ch of lower) out += HOMOGLYPHS[ch] ?? ch;
  return out.replace(/[’‘`´]/g, "'");
}

/** Lettres répétées réduites à une seule (« connnard » → « conard ») : même transformation pour le texte et la liste. */
const squeeze = (word: string): string => word.replace(/(.)\1+/g, '$1');

/**
 * Mots comparables : leet → lettres (dans un mot qui contient au moins une lettre, ou tout symbole leet), tout ce qui
 * n'est pas une lettre devient espace, les suites de lettres isolées (≥ 3) sont recollées, les répétitions réduites.
 */
export function wordsOf(raw: string): string[] {
  const folded = foldText(raw);
  const leeted = folded
    .split(/\s+/)
    .map((w) => (/[a-z]/.test(w) || /^[@$€!|+]+$/.test(w) ? [...w].map((c) => LEET[c] ?? c).join('') : w))
    .join(' ');
  const tokens = leeted.replace(/[^a-z]+/g, ' ').trim().split(' ').filter(Boolean);
  const out: string[] = [];
  let run: string[] = [];
  const flush = (): void => {
    if (run.length >= 3) out.push(run.join(''));
    else out.push(...run);
    run = [];
  };
  for (const t of tokens) {
    if (t.length === 1) run.push(t);
    else {
      flush();
      out.push(t);
    }
  }
  flush();
  return out.map(squeeze);
}

/** Forme d'un terme de la liste : même normalisation que le texte, mots séparés par une espace. */
const term = (t: string): string => wordsOf(t).join(' ');

// ── Listes (cinq langues) ────────────────────────────────────────────────────

interface Entry {
  /** Terme (un ou plusieurs mots), écrit naturellement : normalisé au chargement. */
  t: string;
  /** Seulement dans cette langue (mot courant et anodin ailleurs : « con » en espagnol, « kind » en anglais). */
  lang?: Locale;
}
const e = (t: string, lang?: Locale): Entry => ({ t, lang });
const all = (...terms: string[]): Entry[] => terms.map((t) => e(t));

/** Vocabulaire explicitement pédocriminel : bloque, signale en urgence et suspend en attendant la modération. */
const EXPLICIT_MINOR: readonly Entry[] = all(
  'pedophile', 'pedophilie', 'pedopornographie', 'pedoporno', 'pedoporn', 'pedo porn', 'child porn', 'childporn', 'kiddie porn',
  'kiddy porn', 'jailbait', 'pthc', 'hussyfan', 'preteen sex', 'lolicon nude', 'pornographie infantile', 'pornografia infantil',
  'kinderporno', 'kinderporn', 'pedofilo', 'pedofila', 'pedofiel', 'cp trade', 'cp link', 'pedo link',
);
/** Mineurs : ne déclenche qu'avec un terme sexuel fort dans le même texte. */
const MINOR_TERMS: readonly Entry[] = [
  ...all(
    'enfant', 'enfants', 'gamine', 'gamin', 'fillette', 'petite fille', 'petit garcon', 'mineur', 'mineure', 'mineurs', 'collegienne',
    'collegien', 'child', 'children', 'kid', 'kids', 'underage', 'under age', 'preteen', 'schoolgirl', 'ninos', 'ninas', 'menor de edad',
    'menores', 'crianca', 'criancas', 'novinha', 'minderjarig', 'minderjarige', 'kinderen', 'kindje', 'loli', 'lolita',
  ),
  e('ado', 'fr'),
  e('ados', 'fr'),
  e('teen'),
  e('teens'),
];
/** Âge mineur écrit en chiffres : « 14 ans », « 15yo », « 16 years old », « 13 años », « 12 anos », « 15 jaar ». */
const MINOR_AGE = /(?:^|[^\d])(?:[1-9]|1[0-7])\s?(?:ans|an|yo|y\/o|years?\s?old|anos|años|jaar)\b/;
/** Termes sexuels forts (pas « sexe » seul, trop courant dans une conversation anodine). */
const STRONG_SEXUAL: readonly Entry[] = all(
  'nude', 'nudes', 'porn', 'porno', 'sextape', 'sexting', 'blowjob', 'fellation', 'baiser avec', 'photo nue', 'photos nues', 'have sex',
  'sex with', 'horny', 'follar', 'transar', 'foder', 'neuken', 'pijpen', 'seks met', 'sexo con', 'sexo com', 'hot pics',
);
const THREATS: readonly Entry[] = all(
  'je vais te tuer', 'je vais te buter', 'je vais te crever', 'je vais te defoncer', 'je vais te frapper', 'je vais te violer',
  'je vais te retrouver', 'je sais ou tu habites', 'je sais ou tu vis', 'suicide toi', 'va te pendre', 'tue toi', 'i will kill you', 'i ll kill you', 'im going to kill you',
  'i am going to kill you', 'gonna kill you', 'i know where you live', 'i will find you', 'i will rape you', 'kill yourself', 'kys',
  'you re dead', 'go die', 'te voy a matar', 'te mato', 'se donde vives', 'te voy a violar', 'matate', 'vou te matar', 'sei onde voce mora',
  'vou te estuprar', 'ik vermoord je', 'ik maak je af', 'ik weet waar je woont', 'ik ga je verkrachten', 'ik sla je dood',
);
const HATE: readonly Entry[] = all(
  'bougnoule', 'bougnoul', 'youpin', 'youtre', 'bicot', 'negre', 'negresse', 'tarlouze', 'sale arabe', 'sale noir', 'sale juif',
  'sale pede', 'sale gouine', 'sale musulman', 'nigger', 'niggers', 'nigga', 'faggot', 'faggots', 'kike', 'spic', 'chink', 'tranny',
  'maricon', 'sudaca', 'panchito', 'viado', 'sapatao', 'flikker', 'kankerjood', 'kankermarokkaan', 'heil hitler', 'sieg heil',
);
const INSULTS: readonly Entry[] = [
  ...all(
    'connard', 'connasse', 'salope', 'salaud', 'encule', 'enculee', 'fils de pute', 'pute', 'ta gueule', 'ferme ta gueule',
    'nique ta mere', 'ntm', 'batard', 'petasse', 'enfoire', 'pd', 'pede', 'gouine', 'abruti', 'abrutie', 'debile', 'bitch', 'slut', 'whore',
    'cunt', 'asshole', 'motherfucker', 'dickhead', 'fuck you', 'retarded', 'puta', 'zorra', 'gilipollas', 'cabron', 'hijo de puta',
    'pendejo', 'imbecil', 'vadia', 'vagabunda', 'filho da puta', 'otario', 'arrombado', 'hoer', 'klootzak', 'kankerlijer', 'tering', 'eikel',
    'mongool', 'kanker',
  ),
  e('con', 'fr'),
  e('conne', 'fr'),
  e('retard', 'en'),
  e('kut', 'nl'),
  e('lul', 'nl'),
];
const SEXUAL: readonly Entry[] = [
  ...STRONG_SEXUAL,
  ...all(
    'envoie des nudes', 'send nudes', 'plan cul', 'plan q', 'suce moi', 'suce ma', 'branle', 'branler', 'sodomie', 'sodomise', 'dick pic',
    'dickpic', 'pussy', 'jouir', 'chaudasse', 'chupame', 'buceta', 'piroca', 'punheta', 'lekker neuken', 'pijpbeurt', 'sexcam', 'cam sex',
    'webcam sex', 'fuck me',
  ),
  e('cock', 'en'),
  e('cum', 'en'),
  e('bander', 'fr'),
  e('polla', 'es'),
  e('verga', 'es'),
  e('rola', 'pt'),
  e('pik', 'nl'),
  e('bite', 'fr'),
  e('chatte', 'fr'),
  e('cul', 'fr'),
  e('pipe', 'fr'),
  e('pau', 'pt'),
];
const COMMERCIAL_SEX: readonly Entry[] = all(
  'escort', 'escorting', 'call girl', 'massage erotique', 'massage naturiste', 'services sexuels', 'sexe tarife', 'pay for sex',
  'paid sex', 'sugar daddy', 'sugar baby', 'onlyfans', 'only fans', 'mym fans', 'fansly', 'acompanhante', 'puta de lujo', 'sexo pagado',
  'prostituee', 'prostitute', 'hooker',
);
/** Argent et plateformes : avec un lien ou un contact, c'est de la collecte ou une arnaque. */
const MONEY: readonly Entry[] = all(
  'crypto', 'bitcoin', 'btc', 'usdt', 'ethereum', 'trading', 'forex', 'investissement', 'investir', 'invest', 'investment', 'gagner de l argent',
  'argent facile', 'earn money', 'make money', 'cashapp', 'cash app', 'western union', 'moneygram', 'gift card', 'carte cadeau', 'coupon pcs',
  'transcash', 'neosurf', 'paysafecard', 'pret d argent', 'loan', 'inversion', 'ganar dinero', 'ganhar dinheiro', 'investimento', 'geld verdienen',
  'beleggen', 'onlyfans', 'fansly', 'premium snap', 'snap premium', 'mym',
);
const URL = /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]{2,}\.(?:com|net|org|io|ly|gg|fr|br|xyz|app|link|info|biz|club|site|online|top|live|vip|ru)\b(?:\/\S*)?|\bt\.me\/|\bwa\.me\/|\bbit\.ly\//;
const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/;
const PHONE = /(?:\+|00)?\d(?:[\s.-]?\d){8,}/;
const HANDLE = /(?:^|\s)@[a-z0-9_.]{3,}/;
const PLATFORM_HINT: readonly Entry[] = all('insta', 'instagram', 'snap', 'snapchat', 'telegram', 'whatsapp', 'kik', 'tiktok', 'discord', 'onlyfans');

// ── Recherche ────────────────────────────────────────────────────────────────

interface Compiled {
  phrase: string;
  lang?: Locale;
}
const compile = (entries: readonly Entry[]): Compiled[] => entries.map((x) => ({ phrase: term(x.t), lang: x.lang })).filter((c) => c.phrase.length > 0);
const LISTS = {
  explicitMinor: compile(EXPLICIT_MINOR),
  minor: compile(MINOR_TERMS),
  strongSexual: compile(STRONG_SEXUAL),
  threat: compile(THREATS),
  hate: compile(HATE),
  insult: compile(INSULTS),
  sexual: compile(SEXUAL),
  commercialSex: compile(COMMERCIAL_SEX),
  money: compile(MONEY),
  platform: compile(PLATFORM_HINT),
};

/** Le texte (mots normalisés) contient-il un des termes, pour cette langue ? Comparaison mot à mot, jamais au milieu d'un mot. */
function hits(words: readonly string[], list: readonly Compiled[], locale: Locale): boolean {
  const hay = ` ${words.join(' ')} `;
  // Version sans espaces pour les termes de plusieurs mots écrits collés (« filsdepute », « sendnudes »).
  const glued = words.join('');
  return list.some((c) => {
    if (c.lang && c.lang !== locale) return false;
    if (hay.includes(` ${c.phrase} `)) return true;
    return c.phrase.includes(' ') && c.phrase.length >= 8 && glued.includes(c.phrase.replace(/ /g, ''));
  });
}

const ORDER: readonly ModerationCategory[] = MODERATION_CATEGORIES;

/** Analyse un texte. `locale` : langue de la personne qui écrit (active les mots ambigus de cette langue seulement). */
export function classifyText(raw: string, locale: Locale = 'fr'): TextVerdict {
  const text = raw.slice(0, 4000);
  const words = wordsOf(text);
  const folded = foldText(text);
  const found = new Set<ModerationCategory>();
  const explicitMinor = hits(words, LISTS.explicitMinor, locale);
  const minor = hits(words, LISTS.minor, locale) || MINOR_AGE.test(folded);
  if (explicitMinor || (minor && hits(words, LISTS.strongSexual, locale))) found.add('minor_sexual');
  if (hits(words, LISTS.threat, locale)) found.add('threat');
  if (hits(words, LISTS.hate, locale)) found.add('hate');
  if (hits(words, LISTS.commercialSex, locale)) found.add('commercial_sex');
  const link = URL.test(folded);
  const contact = link || EMAIL.test(folded) || PHONE.test(folded) || HANDLE.test(folded) || hits(words, LISTS.platform, locale);
  if (contact) found.add('contact');
  if (contact && hits(words, LISTS.money, locale)) found.add('scam');
  if (hits(words, LISTS.insult, locale)) found.add('insult');
  if (hits(words, LISTS.sexual, locale)) found.add('sexual');
  const categories = ORDER.filter((c) => found.has(c));
  // Hésitation : un lien sans rien d'autre de net (le ton qui monte, lui, relève du garde-fou du minimoa).
  const unsure = link && categories.every((c) => c === 'contact');
  return { category: categories[0] ?? null, categories, explicitMinor, unsure };
}

// ── Décision par surface ─────────────────────────────────────────────────────

export const MODERATION_SURFACES = ['message', 'display_name', 'pet_name', 'report_note'] as const;
export type ModerationSurface = (typeof MODERATION_SURFACES)[number];

/**
 * allow : publié · flag : publié et signalé à la modération · block : refusé (message non livré, nom refusé) ·
 * review : publié, à confirmer par l'IA si elle est permise (sinon reste publié) — aujourd'hui, un lien nu.
 */
export type ModerationOutcome = 'allow' | 'flag' | 'block' | 'review';

export interface ModerationDecision {
  outcome: ModerationOutcome;
  category: ModerationCategory | null;
}

/** Ce que l'API fait d'un texte selon l'endroit où il est publié. */
export function decideModeration(surface: ModerationSurface, v: TextVerdict): ModerationDecision {
  const category = v.category;
  switch (surface) {
    case 'display_name':
    case 'pet_name':
      // Vu par des inconnus, sans contexte : le moindre terme listé, lien ou contact est refusé.
      return category ? { outcome: 'block', category } : { outcome: 'allow', category: null };
    case 'report_note':
      // Un signalement n'est jamais refusé : la note sert seulement à prioriser.
      return { outcome: 'allow', category: v.categories.find((c) => CATEGORY_SEVERITY[c] === 'critical') ?? null };
    case 'message': {
      const serious = v.categories.find((c) => CATEGORY_SEVERITY[c] === 'critical');
      if (serious) return { outcome: 'block', category: serious };
      const low = v.categories.find((c) => CATEGORY_SEVERITY[c] === 'low');
      if (low) return { outcome: 'flag', category: low };
      return v.unsure ? { outcome: 'review', category: null } : { outcome: 'allow', category: null };
    }
  }
}

// ── Réponse de l'IA (confirmation des cas limites, photos de profil) ─────────

export const AI_MODERATION_LABELS = ['OK', 'INSULT', 'SEXUAL', 'MINOR', 'THREAT', 'HATE', 'SPAM'] as const;
export type AiModerationLabel = (typeof AI_MODERATION_LABELS)[number];

const LABEL_CATEGORY: Readonly<Record<Exclude<AiModerationLabel, 'OK'>, ModerationCategory>> = {
  INSULT: 'insult',
  SEXUAL: 'sexual',
  MINOR: 'minor_sexual',
  THREAT: 'threat',
  HATE: 'hate',
  SPAM: 'scam',
};

/** Lit le premier mot rendu par le modèle ; tout ce qui n'est pas un libellé connu vaut null (on garde la règle). */
export function parseAiModeration(text: string): { label: AiModerationLabel; category: ModerationCategory | null } | null {
  const word = text.trim().split(/\s+/)[0]?.replace(/[^a-z_]/gi, '').toUpperCase() ?? '';
  if (!(AI_MODERATION_LABELS as readonly string[]).includes(word)) return null;
  const label = word as AiModerationLabel;
  return { label, category: label === 'OK' ? null : LABEL_CATEGORY[label] };
}

/**
 * Photo de profil : refusée pour nudité ou sexe, mineur, violence ou haine ; une photo « SPAM » (texte, contact,
 * code QR) aussi. Une insulte écrite sur la photo aussi. Seul OK passe.
 */
export const photoRejected = (label: AiModerationLabel): boolean => label !== 'OK';

// ── Signalements : priorité et escalade ──────────────────────────────────────

export const REPORT_PRIORITIES = ['normal', 'high', 'urgent'] as const;
export type ReportPriority = (typeof REPORT_PRIORITIES)[number];
export const priorityRank = (p: ReportPriority): 0 | 1 | 2 => (p === 'urgent' ? 2 : p === 'high' ? 1 : 0);
export const priorityOfRank = (n: number): ReportPriority => (n >= 2 ? 'urgent' : n === 1 ? 'high' : 'normal');

/** Personnes différentes qui ont signalé le même compte (signalements ouverts) au-delà desquelles la file le remonte. */
export const REPORTS_FOR_HIGH_PRIORITY = 3;
/** Signalements « personne mineure » de personnes différentes qui suspendent le compte en attendant la modération. */
export const MINOR_REPORTS_FOR_SUSPENSION = 2;
/** Durée d'une suspension automatique (la modération la lève ou la confirme, délai cible 24 h). */
export const AUTO_SUSPENSION_HOURS = 72;
/** Délai cible de traitement d'un signalement ; au-delà, le minuteur le remonte et prévient l'équipe. */
export const REPORT_TARGET_HOURS = 24;
/** Au plus un e-mail de récapitulatif à l'équipe par fenêtre (un signalement urgent part tout de suite). */
export const REPORT_ALERT_MIN_GAP_MINUTES = 15;

export interface ReportContext {
  /** Motif choisi par la personne (`REPORT_REASONS`), ou celui du filtre. */
  reason: string;
  /** Catégorie trouvée par le filtre (message bloqué ou signalé, note du signalement). */
  category: ModerationCategory | null;
  /** Personnes différentes (y compris celle-ci) qui ont un signalement ouvert sur ce compte. */
  distinctReporters: number;
  /** Parmi elles, celles qui ont choisi « personne mineure ». */
  distinctMinorReporters: number;
}

/** Priorité d'un signalement : urgente pour un mineur ou une menace, haute pour la haine, l'arnaque ou un compte signalé par plusieurs personnes. */
export function reportPriority(c: ReportContext): ReportPriority {
  if (c.reason === 'mineur' || c.category === 'minor_sexual' || c.category === 'threat') return 'urgent';
  if (c.category === 'hate' || c.category === 'commercial_sex' || c.category === 'scam' || c.distinctReporters >= REPORTS_FOR_HIGH_PRIORITY) return 'high';
  return 'normal';
}

/**
 * Suspension automatique en attendant la modération (heures), ou null. Deux cas seulement, choisis pour qu'une seule
 * personne malveillante ne puisse pas faire suspendre quelqu'un : vocabulaire pédocriminel explicite repéré par le
 * filtre, ou au moins deux personnes différentes qui signalent un compte comme mineur (une app 18+ doit l'écarter vite).
 */
export function autoSuspensionHours(c: { explicitMinor: boolean; distinctMinorReporters: number }): number | null {
  if (c.explicitMinor) return AUTO_SUSPENSION_HOURS;
  if (c.distinctMinorReporters >= MINOR_REPORTS_FOR_SUSPENSION) return AUTO_SUSPENSION_HOURS;
  return null;
}

/** Signalement ouvert depuis plus que le délai cible. */
export const reportOverdue = (createdAt: string, now: Date): boolean => now.getTime() - Date.parse(createdAt) > REPORT_TARGET_HOURS * 3_600_000;

/** Un récapitulatif peut partir : jamais envoyé, ou le dernier date d'au moins la fenêtre ; un urgent n'attend pas. */
export function reportAlertDue(i: { lastAlertAt: string | null; now: Date; urgent: boolean }): boolean {
  if (i.urgent || i.lastAlertAt === null) return true;
  return i.now.getTime() - Date.parse(i.lastAlertAt) >= REPORT_ALERT_MIN_GAP_MINUTES * 60_000;
}
