/**
 * Règles des notifications (spéc §12, docs/NOTIFICATIONS.md) : types, priorités, catégories, heures calmes et report au
 * matin, regroupement des rafales, plafonds (global et par priorité), premier plan, décroissance quand la personne
 * n'ouvre plus l'app, canal (push d'abord, e-mail en repli), accord explicite pour le marketing (App Review 4.5.4).
 * Pur : l'instant, le fuseau, l'historique et la présence sont passés en paramètre (Intl sert seulement à convertir).
 */
import type { Day } from '../days';

export const NOTIFICATION_KINDS = [
  'daily_challenge',
  'needs_out',
  'new_encounter',
  'waved',
  'message',
  /** « Série avec Léa : à toi d'écrire avant minuit » (le soir, l'autre a écrit aujourd'hui, pas toi ; un envoi pour tous tes liens). */
  'your_turn',
  'link_in_danger',
  'streak_in_danger',
  'habit_proof',
  'weekly_review',
  'item_unlocked',
  'words_received',
  'trial_reminder',
  /** Groupes (spéc §26) : invitation, proposition « la tenir ensemble » (ou groupe démarré), message de groupe, vie perdue, groupe endormi. */
  'group_invite',
  'together_proposal',
  'group_message',
  'group_life_lost',
  'group_asleep',
  /** Quelqu'un rejoint ton groupe par son lien d'invitation (docs/VIRALITE.md). */
  'group_joined',
  /** Fidélisation (docs/FIDELISATION.md) : les 7 premiers jours (J1, J3, J7). */
  'first_steps',
  /** Nouvelles du minimoa : absence de 3, 7 ou 14 jours, anniversaire d'un mois ou d'un an. */
  'minimoa_news',
  /** Ton abonnement Minimoa+ : bienvenue, renouvellement annuel, paiement refusé, fin, relance unique un mois après. */
  'plus_account',
] as const;
export type NotificationKindKey = (typeof NOTIFICATION_KINDS)[number];

// ── Priorités ─────────────────────────────────────────────────────────────────
/**
 * Priorités, de la plus haute à la plus basse :
 * - `direct` : quelqu'un t'écrit, ou répond à ton signe (lien créé) ; jamais plafonné ;
 * - `urgent` : une échéance qui te concerne (fin d'essai, paiement refusé) ; jamais plafonné, jamais coupé par le report ;
 * - `social` : des gens font un geste vers toi (signe, 3 mots, invitation, arrivée, série d'un lien) ;
 * - `ritual` : rappels de tes rituels (défi, série, preuve, besoin de sortir, objets, vie d'un groupe) ;
 * - `news` : comptes rendus et nouvelles (bilan de la semaine, nouvelles du minimoa, premiers pas, vie de l'abonnement) ;
 * - `marketing` : une offre (relance Minimoa+) ; seulement avec l'accord explicite de la personne.
 */
export const NOTIFICATION_TIERS = ['direct', 'urgent', 'social', 'ritual', 'news', 'marketing'] as const;
export type NotificationTier = (typeof NOTIFICATION_TIERS)[number];

/** Priorité d'une notification (`step` : variante de `plus_account`). */
export function notificationTierOf(kind: NotificationKindKey, step?: string | null): NotificationTier {
  switch (kind) {
    case 'message':
    case 'group_message':
    case 'new_encounter':
      return 'direct';
    case 'trial_reminder':
      return 'urgent';
    case 'plus_account':
      return step === 'billing_grace' || step === 'billing_retry' ? 'urgent' : step === 'winback' ? 'marketing' : 'news';
    case 'waved':
    case 'words_received':
    case 'group_invite':
    case 'group_joined':
    case 'together_proposal':
    case 'link_in_danger':
    case 'your_turn':
      return 'social';
    case 'daily_challenge':
    case 'needs_out':
    case 'streak_in_danger':
    case 'habit_proof':
    case 'item_unlocked':
    case 'group_life_lost':
    case 'group_asleep':
      return 'ritual';
    case 'weekly_review':
    case 'first_steps':
    case 'minimoa_news':
      return 'news';
  }
}

/** Obligatoires : on ne peut pas les couper (la frise du paywall promet le rappel de fin d'essai). */
export const MANDATORY_KINDS: readonly NotificationKindKey[] = ['trial_reminder'];
export const isMandatory = (kind: NotificationKindKey): boolean => MANDATORY_KINDS.includes(kind);

// ── Catégories (un interrupteur, une désinscription en un geste) ──────────────
/**
 * Catégories de réglage : une ligne de « Moi › Notifications », et ce que coupe le geste « Ne plus recevoir » sur la
 * notification elle-même. Chaque type a une catégorie, sauf les obligatoires.
 */
export const NOTIFICATION_CATEGORIES = {
  challenge: ['daily_challenge'],
  out: ['needs_out'],
  streak: ['streak_in_danger'],
  proof: ['habit_proof'],
  review: ['weekly_review'],
  unlocked: ['item_unlocked', 'words_received'],
  first_steps: ['first_steps'],
  news: ['minimoa_news'],
  encounters: ['new_encounter', 'waved'],
  messages: ['message'],
  turn: ['your_turn'],
  danger: ['link_in_danger'],
  group_invite: ['group_invite'],
  together: ['together_proposal'],
  group_message: ['group_message'],
  group_joined: ['group_joined'],
  group_lives: ['group_life_lost', 'group_asleep'],
  plus_account: ['plus_account'],
} as const satisfies Record<string, readonly NotificationKindKey[]>;
export type NotificationCategory = keyof typeof NOTIFICATION_CATEGORIES;

/** Catégorie d'un type (null : obligatoire, rien à couper). */
export function categoryOf(kind: NotificationKindKey): NotificationCategory | null {
  for (const [cat, kinds] of Object.entries(NOTIFICATION_CATEGORIES) as [NotificationCategory, readonly NotificationKindKey[]][]) {
    if (kinds.includes(kind)) return cat;
  }
  return null;
}

// ── Heures calmes, plafonds, délais ──────────────────────────────────────────
/** Heures calmes : de 22 h à 8 h, heure locale de la personne. */
export const QUIET_START_HOUR = 22;
export const QUIET_END_HOUR = 8;
export const isQuietHour = (hour: number): boolean => hour >= QUIET_START_HOUR || hour < QUIET_END_HOUR;

/** Plafond global du jour (local) pour tout ce qui n'est ni direct ni urgent. */
export const NOTIFICATION_DAILY_CAP = 3;
/** Plafond par priorité (dans le plafond global). */
export const TIER_DAILY_CAPS: Readonly<Partial<Record<NotificationTier, number>>> = { social: 3, ritual: 2, news: 1, marketing: 1 };
/** Place gardée pour les gens : rappels de rituels et marketing ne prennent jamais la dernière place du jour. */
export const PEOPLE_RESERVE = 1;
export const isCappedTier = (tier: NotificationTier): boolean => TIER_DAILY_CAPS[tier] !== undefined;
/** Hors plafond : messages directs, réponses à ton signe, échéances. */
export const capExempt = (kind: NotificationKindKey, step?: string | null): boolean => !isCappedTier(notificationTierOf(kind, step));

/** Un push par conversation (lien ou groupe) toutes les 5 minutes au plus. */
export const MESSAGE_PUSH_COOLDOWN_MINUTES = 5;
/**
 * Conversation animée : après tant de pushs de la même conversation dans la journée (locale), le délai s'allonge
 * (`BUSY_CONVERSATION_COOLDOWN_MINUTES`). Une conversation vive ne sonne plus toutes les 5 minutes.
 */
export const BUSY_CONVERSATION_PUSHES = 4;
export const BUSY_CONVERSATION_COOLDOWN_MINUTES = 30;
const COOLDOWN_KINDS: readonly NotificationKindKey[] = ['message', 'group_message'];

/** Délai (minutes) avant le prochain push d'une conversation, d'après le nombre déjà envoyés aujourd'hui pour elle. */
export const conversationCooldownMinutes = (sentTodayForConversation: number): number =>
  sentTodayForConversation >= BUSY_CONVERSATION_PUSHES ? BUSY_CONVERSATION_COOLDOWN_MINUTES : MESSAGE_PUSH_COOLDOWN_MINUTES;

/**
 * Pendant les heures calmes : ces types sont reportés au matin (8 h) et regroupés (un seul envoi par type et par
 * conversation, « Léa et 2 autres t'ont écrit cette nuit ») ; les autres sont abandonnés (un rappel du soir n'a plus de
 * sens le lendemain, comme « à toi d'écrire avant minuit »).
 */
export const DEFERRABLE_KINDS: readonly NotificationKindKey[] = [
  'message',
  'group_message',
  'new_encounter',
  'waved',
  'words_received',
  'item_unlocked',
  'link_in_danger',
  'trial_reminder',
  'group_invite',
  'together_proposal',
  'group_life_lost',
  'group_asleep',
  'group_joined',
  'plus_account',
];
export const isDeferrable = (kind: NotificationKindKey): boolean => DEFERRABLE_KINDS.includes(kind);

/** Une fois par jour local au plus (par conversation pour `link_in_danger`). */
export const ONCE_A_DAY_KINDS: readonly NotificationKindKey[] = ['daily_challenge', 'needs_out', 'streak_in_danger', 'link_in_danger', 'your_turn', 'weekly_review', 'trial_reminder', 'together_proposal', 'first_steps', 'minimoa_news'];
export const isOnceADay = (kind: NotificationKindKey): boolean => ONCE_A_DAY_KINDS.includes(kind);

/**
 * Rafales regroupées : après un envoi, les suivants du même type (et de la même conversation) pendant une heure
 * attendent la fin de l'heure et partent en un seul push (« Léa et 4 autres t'ont fait signe »).
 */
export const GROUPED_KINDS: readonly NotificationKindKey[] = ['waved', 'words_received', 'new_encounter', 'group_joined', 'item_unlocked'];
export const GROUP_WINDOW_MINUTES = 60;
export const isGrouped = (kind: NotificationKindKey): boolean => GROUPED_KINDS.includes(kind);
/** Clé du report des messages de la nuit : un seul push le matin pour toutes les conversations. */
export const NIGHT_BUCKET = 'night';

/**
 * Fenêtres locales : ces rappels n'ont de sens qu'à ce moment de la journée, dans le fuseau de la personne (le minuteur
 * qui les prépare tourne à l'heure de Paris). Hors fenêtre : rien (« à toi d'écrire avant minuit » à 13 h, non).
 */
export const LOCAL_WINDOWS: Readonly<Partial<Record<NotificationKindKey, readonly [number, number]>>> = {
  your_turn: [17, 22],
  streak_in_danger: [17, 22],
  needs_out: [10, 21],
};

/**
 * Décroissance : quand la personne n'ouvre plus l'app, les rappels de rituels ralentissent (un par jour après 2 jours)
 * puis s'arrêtent (après 3 jours) ; les nouvelles du minimoa (3, 7, 14 jours) prennent le relais, une fois chacune.
 * Le marketing s'arrête aussi.
 */
export const DECAY_SLOW_DAYS = 2;
export const DECAY_STOP_DAYS = 3;

/** Un report attend au plus 24 h ; au-delà il est abandonné. */
export const DEFERRED_MAX_HOURS = 24;

/** Heure du défi du jour par défaut (modifiable par la personne, entre 8 h et 21 h). */
export const DEFAULT_MORNING_HOUR = 9;
export const MORNING_HOUR_MIN = QUIET_END_HOUR;
export const MORNING_HOUR_MAX = QUIET_START_HOUR - 1;
export const DEFAULT_NOTIFICATION_TIMEZONE = 'Europe/Paris';

/** Réglages par défaut : tout activé (la personne coupe ce qu'elle veut). */
export const defaultNotificationKinds = (): Record<NotificationKindKey, boolean> =>
  Object.fromEntries(NOTIFICATION_KINDS.map((k) => [k, true])) as Record<NotificationKindKey, boolean>;

/** Vrai si le fuseau IANA est connu de l'environnement. */
export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export interface LocalTime {
  day: Day;
  hour: number;
  minute: number;
}

/** Jour et heure locaux d'un instant dans un fuseau (repli sur Europe/Paris si le fuseau est inconnu). */
export function localTimeOf(now: Date, timeZone: string): LocalTime {
  const tz = isValidTimeZone(timeZone) ? timeZone : DEFAULT_NOTIFICATION_TIMEZONE;
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? '00';
  return { day: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')) % 24, minute: Number(get('minute')) };
}

/** Décalage (ms) du fuseau à un instant : heure murale locale lue comme UTC, moins l'instant. */
function offsetMs(at: Date, tz: string): number {
  const l = localTimeOf(at, tz);
  const wall = Date.UTC(Number(l.day.slice(0, 4)), Number(l.day.slice(5, 7)) - 1, Number(l.day.slice(8, 10)), l.hour, l.minute);
  return wall - Math.floor(at.getTime() / 60_000) * 60_000;
}

/** Prochain instant (strictement après `now`) où il est `hour` h 00 à l'heure locale. */
export function nextLocalHour(now: Date, timeZone: string, hour: number): Date {
  const tz = isValidTimeZone(timeZone) ? timeZone : DEFAULT_NOTIFICATION_TIMEZONE;
  const l = localTimeOf(now, tz);
  for (let addDay = 0; addDay <= 2; addDay++) {
    const wall = Date.UTC(Number(l.day.slice(0, 4)), Number(l.day.slice(5, 7)) - 1, Number(l.day.slice(8, 10)) + addDay, hour, 0);
    // Deux passes pour tomber juste autour d'un changement d'heure.
    let guess = wall - offsetMs(now, tz);
    guess = wall - offsetMs(new Date(guess), tz);
    if (guess > now.getTime()) return new Date(guess);
  }
  return new Date(now.getTime() + 86_400_000);
}

// ── Décision ──────────────────────────────────────────────────────────────────
/** Une ligne du journal des envois, telle que la décision la lit (3 derniers jours locaux). */
export interface NotificationHistoryEntry {
  id: string;
  kind: NotificationKindKey;
  /** Conversation (lien, groupe) ou paquet regroupé ; null sinon. */
  key: string | null;
  localDay: Day;
  status: 'sent' | 'deferred' | 'dropped';
  /** Envoi (ou mise en attente) : ISO. */
  at: string;
  /** Report : départ prévu, ISO. */
  sendAfter: string | null;
  /** Lien concerné (message, lien en danger, nouveau lien), même quand `key` est un paquet ; null sinon. */
  link?: string | null;
}

export interface NotificationInput {
  kind: NotificationKindKey;
  /** Variante (`plus_account`). */
  step?: string | null;
  /** Conversation (lien, groupe) concernée, ou null. */
  key: string | null;
  /** Réglage du type (ignoré pour un type obligatoire). */
  enabled: boolean;
  /** Accord explicite pour les offres (App Review 4.5.4). */
  marketingOptIn: boolean;
  now: Date;
  timeZone: string;
  /** Journal des 3 derniers jours locaux au moins. */
  history: readonly NotificationHistoryEntry[];
  /** Dernière ouverture de l'app (ISO), null si inconnue. */
  lastOpenAt: string | null;
  /** App au premier plan (signal récent), avec la conversation ouverte ; null : en arrière-plan ou inconnu. */
  foreground: { key: string | null } | null;
  /** Après cet instant, la notification n'a plus de sens (fin d'essai) ; ISO. */
  expiresAt?: string | null;
  /** Vrai quand on envoie un report (heures calmes ou rafale) dont l'heure est venue. */
  fromQueue?: boolean;
  /** Lien concerné (`vars.linkId`), pour ne pas sonner deux fois pour la même personne (« t'a répondu » puis « t'a écrit »). */
  link?: string | null;
}

export type NotificationSkipReason = 'disabled' | 'not_opted_in' | 'expired' | 'foreground' | 'window' | 'once_a_day' | 'quiet' | 'decay' | 'cap' | 'cooldown';

export type NotificationDecision =
  | { action: 'send' }
  /** Mettre en attente jusqu'à `until` sous la clé `bucket` : heures calmes ou rafale. */
  | { action: 'defer'; until: Date; bucket: string | null; reason: 'quiet' | 'group' }
  /** Ajouter à un report déjà en attente (regroupement). */
  | { action: 'merge'; into: string }
  | { action: 'skip'; reason: NotificationSkipReason };

const MINUTE = 60_000;
const DAY_MS = 86_400_000;

/**
 * Décide d'un envoi, dans l'ordre : réglage (sauf obligatoire) → accord marketing → échéance passée → premier plan →
 * fenêtre locale → une fois par jour → regroupement dans un report en attente → heures calmes (report au matin, ou
 * envoi si l'échéance tombe avant) → rafale (report d'une heure) → décroissance → plafonds → délai par conversation.
 */
export function decideNotification(i: NotificationInput): NotificationDecision {
  const tier = notificationTierOf(i.kind, i.step);
  const now = i.now.getTime();
  if (!i.enabled && !isMandatory(i.kind)) return { action: 'skip', reason: 'disabled' };
  if (tier === 'marketing' && !i.marketingOptIn) return { action: 'skip', reason: 'not_opted_in' };
  if (i.expiresAt && Date.parse(i.expiresAt) <= now) return { action: 'skip', reason: 'expired' };

  // Premier plan : la personne est dans l'app. Rien sur la conversation ouverte ; seuls les messages d'une autre
  // conversation et les échéances passent (l'app les montre en bandeau discret, sans son).
  if (i.foreground) {
    if (tier === 'direct' && i.key !== null && i.foreground.key === i.key) return { action: 'skip', reason: 'foreground' };
    if (tier !== 'direct' && tier !== 'urgent') return { action: 'skip', reason: 'foreground' };
  }

  const local = localTimeOf(i.now, i.timeZone);
  const window = LOCAL_WINDOWS[i.kind];
  if (window && !i.fromQueue && (local.hour < window[0] || local.hour >= window[1])) return { action: 'skip', reason: 'window' };

  const sent = i.history.filter((h) => h.status === 'sent');
  const sentToday = sent.filter((h) => h.localDay === local.day);
  if (isOnceADay(i.kind) && sentToday.some((h) => h.kind === i.kind && h.key === i.key)) return { action: 'skip', reason: 'once_a_day' };

  const quiet = isQuietHour(local.hour);
  if (!i.fromQueue) {
    // Un report du même type (même conversation) attend déjà : on s'y ajoute. La nuit, tous les messages vont dans un
    // seul paquet.
    const bucket = i.kind === 'message' ? (quiet ? NIGHT_BUCKET : null) : i.key;
    if (isDeferrable(i.kind) || isGrouped(i.kind)) {
      const pending = i.history.find((h) => h.status === 'deferred' && h.kind === i.kind && h.key === bucket);
      if (pending && (quiet || i.kind !== 'message')) return { action: 'merge', into: pending.id };
    }
    if (quiet) {
      const morning = nextLocalHour(i.now, i.timeZone, QUIET_END_HOUR);
      // Échéance avant le matin : on prévient tout de suite (seul cas où les heures calmes cèdent).
      if (tier === 'urgent' && i.expiresAt && Date.parse(i.expiresAt) <= morning.getTime()) return { action: 'send' };
      if (isDeferrable(i.kind)) return { action: 'defer', until: morning, bucket, reason: 'quiet' };
      return { action: 'skip', reason: 'quiet' };
    }
    if (isGrouped(i.kind)) {
      const last = latest(sent.filter((h) => h.kind === i.kind && h.key === i.key));
      if (last !== null && now - last < GROUP_WINDOW_MINUTES * MINUTE) {
        return { action: 'defer', until: new Date(last + GROUP_WINDOW_MINUTES * MINUTE), bucket: i.key, reason: 'group' };
      }
    }
  } else if (quiet && tier !== 'urgent') {
    return { action: 'skip', reason: 'quiet' };
  }

  // Décroissance : la personne n'ouvre plus l'app.
  if (i.lastOpenAt && (tier === 'ritual' || tier === 'marketing')) {
    const away = (now - Date.parse(i.lastOpenAt)) / DAY_MS;
    if (away >= DECAY_STOP_DAYS) return { action: 'skip', reason: 'decay' };
    if (away >= DECAY_SLOW_DAYS) {
      const lastRitual = latest(sent.filter((h) => notificationTierOf(h.kind) === 'ritual'));
      if (lastRitual !== null && now - lastRitual < DAY_MS) return { action: 'skip', reason: 'decay' };
    }
  }

  if (isCappedTier(tier)) {
    const counted = sentToday.filter((h) => isCappedTier(notificationTierOf(h.kind)));
    if (counted.length >= NOTIFICATION_DAILY_CAP) return { action: 'skip', reason: 'cap' };
    if (counted.filter((h) => notificationTierOf(h.kind) === tier).length >= (TIER_DAILY_CAPS[tier] ?? NOTIFICATION_DAILY_CAP)) return { action: 'skip', reason: 'cap' };
    if ((tier === 'ritual' || tier === 'marketing') && counted.length >= NOTIFICATION_DAILY_CAP - PEOPLE_RESERVE) return { action: 'skip', reason: 'cap' };
  }

  if (COOLDOWN_KINDS.includes(i.kind) && !i.fromQueue) {
    const same = sent.filter((h) => h.kind === i.kind && h.key === i.key);
    const todayCount = same.filter((h) => h.localDay === local.day).length;
    const last = latest(same);
    if (last !== null && now - last < conversationCooldownMinutes(todayCount) * MINUTE) return { action: 'skip', reason: 'cooldown' };
    // « Léa t'a répondu » vient de partir pour ce lien : son premier message ne sonne pas une seconde fois.
    if (i.kind === 'message' && i.link) {
      const created = latest(sent.filter((h) => h.kind === 'new_encounter' && h.link === i.link));
      if (created !== null && now - created < MESSAGE_PUSH_COOLDOWN_MINUTES * MINUTE) return { action: 'skip', reason: 'cooldown' };
    }
  }
  return { action: 'send' };
}

function latest(entries: readonly NotificationHistoryEntry[]): number | null {
  let max: number | null = null;
  for (const e of entries) {
    const t = Date.parse(e.at);
    if (max === null || t > max) max = t;
  }
  return max;
}

// ── Paquet du matin ───────────────────────────────────────────────────────────
/**
 * Plusieurs reports d'une même personne partent au même moment (fin des heures calmes, fin d'une rafale) : un seul push.
 * On montre le plus important (priorité, puis le plus ancien) et on compte les autres (« Et 2 autres nouvelles »).
 * Rend l'indice du report à montrer, ou -1 pour une liste vide.
 */
export function pickDigestLead(entries: readonly { kind: NotificationKindKey; step?: string | null; at: string }[]): number {
  let best = -1;
  entries.forEach((e, idx) => {
    if (best < 0) {
      best = idx;
      return;
    }
    const b = entries[best]!;
    const rank = NOTIFICATION_TIERS.indexOf(notificationTierOf(e.kind, e.step));
    const bestRank = NOTIFICATION_TIERS.indexOf(notificationTierOf(b.kind, b.step));
    if (rank < bestRank || (rank === bestRank && e.at < b.at)) best = idx;
  });
  return best;
}

// ── Regroupement ──────────────────────────────────────────────────────────────
/** Au plus tant de personnes retenues dans un paquet (pour compter « et N autres »). */
const MAX_GROUPED_PEOPLE = 50;

/**
 * Ajoute un événement à un report en attente : garde le premier prénom (celui qu'on affiche), compte les événements
 * (`n`) et les autres personnes (`others`, d'après `about`, l'identifiant de la personne concernée ; à défaut, les
 * événements). Exemple : 5 signes de 4 personnes → « Léa et 3 autres t'ont fait signe ».
 */
export function mergeNotificationVars(prev: Readonly<Record<string, string>>, next: Readonly<Record<string, string>>): Record<string, string> {
  const people = new Set((prev.people ?? prev.about ?? '').split(',').filter(Boolean));
  if (next.about) people.add(next.about);
  const n = (Number(prev.n) || 1) + 1;
  const others = people.size > 0 ? people.size - 1 : n - 1;
  const out: Record<string, string> = { ...prev, n: String(n), others: String(others), ...(next.count ? { count: next.count } : {}) };
  if (people.size > 0) out.people = [...people].slice(0, MAX_GROUPED_PEOPLE).join(',');
  // Plusieurs conversations dans le paquet : le lien profond mène à la liste.
  if (next.linkId && prev.linkId && next.linkId !== prev.linkId) out.multi = '1';
  return out;
}

// ── Canal : push d'abord, e-mail en repli ou pour les comptes rendus ──────────
/** E-mails envoyés aux personnes (hors équipe et hors inscrits « quartiers »). */
export type PersonEmailKind =
  | 'welcome'
  | 'wave_received'
  | 'link_created'
  | 'long_absence'
  | 'trial_reminder'
  | 'plus_account'
  | 'plus_winback'
  | 'moderation_warning'
  | 'inactivity';

/**
 * Pour chaque e-mail : `always` (transactionnel, compte rendu, échéance), ou `fallback` avec le type de push qu'il
 * double : l'e-mail ne part que si la personne n'a aucun appareil qui reçoit les push (une seule notification par
 * événement et par personne).
 */
export const EMAIL_CHANNEL: Readonly<Record<PersonEmailKind, { mode: 'always' } | { mode: 'fallback'; push: NotificationKindKey }>> = {
  welcome: { mode: 'always' },
  wave_received: { mode: 'fallback', push: 'waved' },
  link_created: { mode: 'fallback', push: 'new_encounter' },
  long_absence: { mode: 'always' },
  trial_reminder: { mode: 'always' },
  plus_account: { mode: 'always' },
  plus_winback: { mode: 'always' },
  moderation_warning: { mode: 'always' },
  inactivity: { mode: 'always' },
};

/** L'e-mail doit-il partir ? Un e-mail de repli respecte aussi le réglage du push qu'il remplace. */
export function emailAllowed(kind: PersonEmailKind, ctx: { hasActivePush: boolean; disabledKinds: readonly NotificationKindKey[] }): boolean {
  const rule = EMAIL_CHANNEL[kind];
  if (rule.mode === 'always') return true;
  return !ctx.hasActivePush && !ctx.disabledKinds.includes(rule.push);
}

