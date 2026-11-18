/**
 * Croissance (docs/VIRALITE.md) : d'où vient chaque compte, les étapes de l'entonnoir, les moments à partager, le
 * résultat « 3 mots » et le tableau de l'administration. Pur : jours et instants en paramètre, aucun aléa.
 *
 * Vie privée : aucune empreinte d'appareil. La source d'un compte vient du lien ouvert (lien profond, lien universel)
 * ou d'un code tapé à la main ; les visites des pages de partage ne sont que des compteurs par jour (sans IP).
 */
import { type Day, addDays, daysBetween } from './days';
import { WORD_KEYS } from './gauges';
import { GROUP_MIN_MEMBERS } from './groups';
import type { VisionAxis, VisionProfile } from './vision';

// ── Sources d'arrivée ──────────────────────────────────────────────────────
/**
 * creator : code d'un créateur · words : lien « 3 mots » · group : lien de groupe · invite : invitation personnelle ·
 * quiz : résultat du quiz « Quel minimoa es-tu ? » · quartier : inscription « Ouvre ton quartier » · store : rien (App Store).
 */
export const ACQUISITION_SOURCES = ['creator', 'words', 'group', 'invite', 'quiz', 'quartier', 'store'] as const;
export type AcquisitionSource = (typeof ACQUISITION_SOURCES)[number];
/** Sources où une personne en a fait venir une autre (facteur K). */
export const REFERRAL_SOURCES: readonly AcquisitionSource[] = ['words', 'group', 'invite'];

/** Code de créateur : lettres et chiffres, 3 à 20, en capitales (« LEA », « NINO10 »). */
export const CREATOR_CODE_RE = /^[A-Z0-9]{3,20}$/;
/** Tout code tapé ou lu dans un lien : lettres, chiffres, tiret, 3 à 32. */
export const ANY_CODE_RE = /^[A-Za-z0-9_-]{3,32}$/;
export const normalizeCode = (raw: string): string => raw.trim().toUpperCase();
export const isCreatorCode = (raw: string): boolean => CREATOR_CODE_RE.test(normalizeCode(raw));

/** Ce qu'on sait au moment de l'inscription, déjà vérifié par l'API (codes valides seulement). */
export interface AttributionFacts {
  /** Ce que l'app a gardé du premier lien ouvert, ou du code tapé. */
  claimed: { source: AcquisitionSource; ref: string | null } | null;
  /** Invitation personnelle valide (`inviteCode`) : la personne qui invite. */
  inviterId: string | null;
  /** Code de créateur actif correspondant à `claimed.ref`. */
  creatorCode: string | null;
  /** Personne dont le lien « 3 mots » a été ouvert (`claimed.ref` = son code). */
  wordsOwnerId: string | null;
  /** Groupe dont le lien a été ouvert (`claimed.ref` = son code). */
  groupId: string | null;
  /** Résultat du quiz repris (`claimed.ref` = son code), s'il existe. */
  quizCode?: string | null;
  /** Inscription « Ouvre ton quartier » reprise (`claimed.ref` = son code), s'il existe. */
  signupCode?: string | null;
}

export interface Attribution {
  source: AcquisitionSource;
  /** Code du créateur, ou identifiant du groupe ; null sinon. */
  ref: string | null;
  /** Qui a fait venir la personne (invitation, lien « 3 mots ») : les deux gagnent l'objet « Parrain ». */
  referredBy: string | null;
}

/**
 * Source retenue : l'invitation personnelle d'abord (elle crée un lien), puis ce que le premier lien ouvert ou le code
 * tapé disait, s'il est encore valable ; sinon `store`. Jamais soi-même comme parrain.
 */
export function resolveAttribution(f: AttributionFacts, self: string): Attribution {
  if (f.inviterId && f.inviterId !== self) return { source: 'invite', ref: null, referredBy: f.inviterId };
  const c = f.claimed;
  if (c?.source === 'words' && f.wordsOwnerId && f.wordsOwnerId !== self) return { source: 'words', ref: null, referredBy: f.wordsOwnerId };
  if (c?.source === 'group' && f.groupId) return { source: 'group', ref: f.groupId, referredBy: null };
  if (c?.source === 'creator' && f.creatorCode) return { source: 'creator', ref: f.creatorCode, referredBy: null };
  if (c?.source === 'quiz' && f.quizCode) return { source: 'quiz', ref: f.quizCode, referredBy: null };
  if (c?.source === 'quartier' && f.signupCode) return { source: 'quartier', ref: f.signupCode, referredBy: null };
  return { source: 'store', ref: null, referredBy: null };
}

// ── Entonnoir ──────────────────────────────────────────────────────────────
/** Étapes propres à un compte (une fois chacune), datées par rapport à l'inscription (`cohortOn`). */
export const GROWTH_EVENT_KINDS = ['onboarded', 'first_link', 'active_d1', 'active_d7', 'active_d30', 'trial', 'paid'] as const;
export type GrowthEventKind = (typeof GROWTH_EVENT_KINDS)[number];

/** Pages de partage comptées (visites, sans IP) : /m, /g, /i, /c. */
export const SHARE_PAGES = ['m', 'g', 'i', 'c'] as const;
export type SharePage = (typeof SHARE_PAGES)[number];
const PAGE_SOURCE: Record<SharePage, AcquisitionSource> = { m: 'words', g: 'group', i: 'invite', c: 'creator' };
export const sourceOfPage = (page: SharePage): AcquisitionSource => PAGE_SOURCE[page];

/** Partages faits depuis l'app (feuille de partage, story) : le numérateur des invitations envoyées. */
export const SHARE_KINDS = ['invite', 'words', 'group', 'moment'] as const;
export type ShareKind = (typeof SHARE_KINDS)[number];

/**
 * Étapes du site, sans compte (docs/VIRALITE.md) : quiz commencé (`source` = `ref` s'il vient d'un « Défie tes potes »),
 * terminé, partagé ; inscription au quartier envoyée, confirmée.
 */
export const WEB_STEPS = ['quiz_start', 'quiz_done', 'quiz_share', 'quartier_join', 'quartier_confirm'] as const;
export type WebStep = (typeof WEB_STEPS)[number];
/** Partages du résultat du quiz : en story (image), lien copié, défi envoyé aux potes. */
export const QUIZ_SHARE_KINDS = ['story', 'link', 'challenge'] as const;
export type QuizShareKind = (typeof QUIZ_SHARE_KINDS)[number];

/** Compteurs agrégés par jour (aucune personne derrière) : visites, premiers lancements, inscriptions, votes, partages. */
export type GrowthCounterMetric = `visit_${SharePage}` | 'first_open' | 'signup' | 'words_vote' | `share_${ShareKind}` | WebStep;
export const GROWTH_COUNTER_METRICS: readonly GrowthCounterMetric[] = [
  ...SHARE_PAGES.map((p) => `visit_${p}` as const),
  'first_open',
  'signup',
  'words_vote',
  ...SHARE_KINDS.map((k) => `share_${k}` as const),
  ...WEB_STEPS,
];

/** J1 / J7 / J30 : actif ce jour-là exactement (jour 0 = l'inscription). */
export function activeMilestone(cohortOn: Day, day: Day): GrowthEventKind | null {
  const n = daysBetween(cohortOn, day);
  return n === 1 ? 'active_d1' : n === 7 ? 'active_d7' : n === 30 ? 'active_d30' : null;
}

/** Lundi de la semaine d'un jour. */
export function mondayOf(day: Day): Day {
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
  return addDays(day, -((weekday + 6) % 7));
}

/** Les `n` dernières semaines (lundis), de la plus ancienne à celle de `today`. */
export function lastWeeks(today: Day, n: number): Day[] {
  const last = mondayOf(today);
  return Array.from({ length: n }, (_, i) => addDays(last, -7 * (n - 1 - i)));
}

/** Étapes de l'entonnoir, dans l'ordre. */
export const FUNNEL_STEPS = ['visit', 'first_open', 'signup', ...GROWTH_EVENT_KINDS] as const;
export type FunnelStep = (typeof FUNNEL_STEPS)[number];
export type FunnelCounts = Record<FunnelStep, number>;
const zeroCounts = (): FunnelCounts => Object.fromEntries(FUNNEL_STEPS.map((s) => [s, 0])) as FunnelCounts;

export interface CounterRow {
  day: Day;
  metric: string;
  source: string;
  ref: string;
  count: number;
}
export interface EventRow {
  kind: GrowthEventKind;
  source: AcquisitionSource;
  cohortOn: Day;
}
export interface GroupGrowthRow {
  createdOn: Day;
  /** Membres actifs 7 jours après la création (`membersAt`). */
  membersAtD7: number;
}
export interface MemberSpan {
  joinedAt: string | null;
  leftAt: string | null;
  status: 'invited' | 'active' | 'declined' | 'left';
}

/** Membres d'un groupe présents à un instant (arrivés avant, pas encore partis). */
export function membersAt(members: readonly MemberSpan[], at: string): number {
  return members.filter((m) => (m.status === 'active' || m.status === 'left') && m.joinedAt !== null && m.joinedAt <= at && (m.leftAt === null || m.leftAt > at)).length;
}

export interface GrowthReport {
  weeks: Day[];
  /** Comptes par semaine et par source (et `all`). */
  funnel: { week: Day; source: AcquisitionSource | 'all'; counts: FunnelCounts }[];
  k: { week: Day; shares: number; activeUsers: number | null; referred: number; sharesPerUser: number | null; conversion: number | null; k: number | null }[];
  words: { week: Day; votes: number; joined: number; loopRate: number | null }[];
  groups: { week: Day; created: number; eligible: number; viable: number; rate: number | null }[];
  /**
   * Quiz du site : commencés (dont venus d'un défi), terminés, partagés, comptes venus d'un résultat. Facteur K du quiz =
   * (partages / terminés) × (commencés depuis un défi / partages).
   */
  quiz: { week: Day; started: number; challenged: number; done: number; shared: number; joined: number; k: number | null }[];
  /** Quartiers : inscriptions envoyées, confirmées, comptes venus d'une inscription. */
  quartiers: { week: Day; joins: number; confirmed: number; joined: number }[];
}

const ratio = (a: number, b: number | null): number | null => (b && b > 0 ? a / b : null);

/**
 * Le tableau de croissance : visites, premiers lancements et inscriptions par jour de l'événement ; les étapes d'un compte
 * par semaine d'inscription. Facteur K = (partages / actifs de la semaine) × (comptes venus d'une personne / partages).
 * Taux de boucle « 3 mots » = comptes venus d'un lien « 3 mots » / votes. Groupe viable : 3 membres ou plus 7 jours après
 * sa création (seuls les groupes créés il y a 7 jours ou plus comptent).
 */
export function growthReport(input: {
  today: Day;
  weeks: readonly Day[];
  counters: readonly CounterRow[];
  events: readonly EventRow[];
  /** Personnes actives de la semaine (dernier chiffre de la semaine), null si inconnu. */
  activeUsers: ReadonlyMap<Day, number | null>;
  groups: readonly GroupGrowthRow[];
}): GrowthReport {
  const weeks = [...input.weeks];
  const weekSet = new Set(weeks);
  const cells = new Map<string, FunnelCounts>();
  const cell = (week: Day, source: string): FunnelCounts => {
    const key = `${week}|${source}`;
    let c = cells.get(key);
    if (!c) {
      c = zeroCounts();
      cells.set(key, c);
    }
    return c;
  };
  const add = (week: Day, source: string, step: FunnelStep, n: number) => {
    if (!weekSet.has(week)) return;
    cell(week, source)[step] += n;
    cell(week, 'all')[step] += n;
  };
  const shares = new Map<Day, number>();
  const votes = new Map<Day, number>();
  const web = new Map<string, number>();
  const webAdd = (week: Day, key: string, n: number) => web.set(`${week}|${key}`, (web.get(`${week}|${key}`) ?? 0) + n);
  const webGet = (week: Day, key: string) => web.get(`${week}|${key}`) ?? 0;
  for (const c of input.counters) {
    const week = mondayOf(c.day);
    const visit = /^visit_(m|g|i|c)$/.exec(c.metric);
    if (visit) add(week, sourceOfPage(visit[1] as SharePage), 'visit', c.count);
    else if (c.metric === 'first_open') add(week, asSource(c.source), 'first_open', c.count);
    else if (c.metric === 'signup') add(week, asSource(c.source), 'signup', c.count);
    else if (c.metric === 'words_vote') votes.set(week, (votes.get(week) ?? 0) + c.count);
    else if (c.metric.startsWith('share_')) shares.set(week, (shares.get(week) ?? 0) + c.count);
    else if ((WEB_STEPS as readonly string[]).includes(c.metric)) {
      webAdd(week, c.metric, c.count);
      if (c.metric === 'quiz_start' && c.source === 'ref') webAdd(week, 'challenged', c.count);
    }
  }
  const referred = new Map<Day, number>();
  const wordsJoined = new Map<Day, number>();
  for (const e of input.events) {
    const week = mondayOf(e.cohortOn);
    add(week, e.source, e.kind, 1);
    if (e.kind !== 'onboarded') continue;
    if (REFERRAL_SOURCES.includes(e.source)) referred.set(week, (referred.get(week) ?? 0) + 1);
    if (e.source === 'words') wordsJoined.set(week, (wordsJoined.get(week) ?? 0) + 1);
    if (e.source === 'quiz' || e.source === 'quartier') webAdd(week, `joined_${e.source}`, 1);
  }
  const funnel: GrowthReport['funnel'] = [];
  for (const week of weeks) for (const source of ['all', ...ACQUISITION_SOURCES] as const) funnel.push({ week, source, counts: cells.get(`${week}|${source}`) ?? zeroCounts() });

  const k = weeks.map((week) => {
    const s = shares.get(week) ?? 0;
    const active = input.activeUsers.get(week) ?? null;
    const r = referred.get(week) ?? 0;
    const perUser = ratio(s, active);
    const conversion = ratio(r, s);
    return { week, shares: s, activeUsers: active, referred: r, sharesPerUser: perUser, conversion, k: perUser !== null && conversion !== null ? perUser * conversion : null };
  });
  const words = weeks.map((week) => {
    const v = votes.get(week) ?? 0;
    const j = wordsJoined.get(week) ?? 0;
    return { week, votes: v, joined: j, loopRate: ratio(j, v) };
  });
  const groups = weeks.map((week) => {
    const rows = input.groups.filter((g) => mondayOf(g.createdOn) === week);
    const eligible = rows.filter((g) => daysBetween(g.createdOn, input.today) >= 7);
    const viable = eligible.filter((g) => g.membersAtD7 >= GROUP_MIN_MEMBERS).length;
    return { week, created: rows.length, eligible: eligible.length, viable, rate: ratio(viable, eligible.length) };
  });
  const quiz = weeks.map((week) => {
    const done = webGet(week, 'quiz_done');
    const shared = webGet(week, 'quiz_share');
    const challenged = webGet(week, 'challenged');
    const perDone = ratio(shared, done);
    const conv = ratio(challenged, shared);
    return { week, started: webGet(week, 'quiz_start'), challenged, done, shared, joined: webGet(week, 'joined_quiz'), k: perDone !== null && conv !== null ? perDone * conv : null };
  });
  const quartiers = weeks.map((week) => ({ week, joins: webGet(week, 'quartier_join'), confirmed: webGet(week, 'quartier_confirm'), joined: webGet(week, 'joined_quartier') }));
  return { weeks, funnel, k, words, groups, quiz, quartiers };
}

const asSource = (s: string): AcquisitionSource => ((ACQUISITION_SOURCES as readonly string[]).includes(s) ? (s as AcquisitionSource) : 'store');

// ── Groupes : il manque du monde ───────────────────────────────────────────
/** Personnes qu'il manque pour lancer la série d'un groupe (0 dès 3 membres). */
export const missingMembers = (active: number): number => Math.max(0, GROUP_MIN_MEMBERS - active);

// ── Moments à partager ─────────────────────────────────────────────────────
/** Paliers de la série du défi du jour proposés au partage. */
export const STREAK_MOMENTS = [7, 30, 100] as const;
/** Paliers de la série d'un groupe d'habitude proposés au partage. */
export const GROUP_MOMENTS = [7, 30] as const;

/**
 * Palier à proposer maintenant : le plus haut atteint que la personne n'a pas encore vu proposé ; null sinon. Une série
 * de 35 jours vue pour la première fois propose 30 (pas 7 puis 30). L'app range ensuite tous les paliers atteints.
 */
export function momentToOffer(value: number, steps: readonly number[], offered: ReadonlySet<number>): number | null {
  const reached = steps.filter((s) => value >= s);
  const top = reached.at(-1);
  return top !== undefined && !offered.has(top) ? top : null;
}

/** Résultat du test de vision à partager : deux traits au plus, jamais l'axe « foyer » (projets de famille). */
export const SHAREABLE_AXES: readonly VisionAxis[] = ['ancrage', 'elan', 'rythme', 'cap'];
export interface VisionTrait {
  axis: VisionAxis;
  side: 'low' | 'high';
}
export function visionTraits(profile: VisionProfile, max = 2): VisionTrait[] {
  return SHAREABLE_AXES.map((axis) => ({ axis, r: profile[axis] }))
    .filter(({ r }) => Math.abs(r.value) >= 20)
    .sort((a, b) => Math.abs(b.r.value) * (b.r.confidence || 1) - Math.abs(a.r.value) * (a.r.confidence || 1))
    .slice(0, max)
    .map(({ axis, r }) => ({ axis, side: r.value < 0 ? 'low' : 'high' }));
}

// ── « 3 mots » ─────────────────────────────────────────────────────────────
/** Votes avant de montrer un résultat (trois votes : les mots ne trahissent personne). */
export const WORDS_RESULT_MIN_VOTES = 3;

/** Les 3 mots les plus choisis (égalité : ordre de la liste). */
export function topWords(votes: readonly (readonly string[])[], n = 3): string[] {
  const counts = new Map<string, number>();
  for (const v of votes) for (const w of v) counts.set(w, (counts.get(w) ?? 0) + 1);
  const order = new Map(WORD_KEYS.map((k, i) => [k, i]));
  return [...counts.entries()]
    .filter(([w]) => order.has(w))
    .sort((a, b) => b[1] - a[1] || (order.get(a[0]) ?? 0) - (order.get(b[0]) ?? 0))
    .slice(0, n)
    .map(([w]) => w);
}
