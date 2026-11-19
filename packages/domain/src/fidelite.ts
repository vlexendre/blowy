/**
 * Fidélisation (docs/FIDELISATION.md) : quels messages partent, quand, et une seule fois. Pur : le jour, l'instant et
 * les messages déjà partis (clés du journal `lifecycle_messages`) sont passés en paramètre.
 *
 * Principes : jamais de fausse urgence ni de culpabilisation (le minimoa ne « meurt » pas, il t'attend), une seule
 * nouvelle de fidélisation par jour au plus (en plus du plafond général des notifications), rien la nuit, et chaque
 * message a sa clé : il ne part qu'une fois.
 */
import { type StoreEvent, type SubscriptionState, plusUntilOf, subscriptionView } from './billing';
import { type Day, addDays, daysBetween } from './days';

// ── Rétention de l'app ──────────────────────────────────────────────────────

/**
 * Les premiers pas, chacun mène à des gens, la promesse d'abord : J1 les personnes que le minimoa a pour toi (ou, sans
 * personne de compatible, ce qui l'aide : inviter), J2 le lien « 3 mots » (tes potes te décrivent), J3 la première
 * habitude, J5 rejoindre ou créer un groupe par son lien, J7 ta première semaine (le bilan et la carte à partager).
 *
 * `topic` dit de quoi parle le message ; sa clé dans le journal est `first_steps:<topic>`. Avant le 19 nov. 2026, l'ordre
 * était J1 « 3 mots », J2 habitude, J3 groupe, J5 les gens, avec des clés par jour (`first_steps:d1`…) : ces anciennes
 * clés comptent pour leur ancien sujet (`LEGACY_FIRST_STEP_TOPIC`), pour que personne ne reçoive deux fois le même.
 */
export const FIRST_STEPS = [
  { step: 'd1', day: 1, topic: 'people' },
  { step: 'd2', day: 2, topic: 'words' },
  { step: 'd3', day: 3, topic: 'habit' },
  { step: 'd5', day: 5, topic: 'group' },
  { step: 'd7', day: 7, topic: 'week' },
] as const;
export type FirstStep = (typeof FIRST_STEPS)[number]['step'];
export type FirstStepTopic = (typeof FIRST_STEPS)[number]['topic'];

/** Sujet de chaque ancienne clé du journal (ordre d'avant le 19 nov. 2026). */
export const LEGACY_FIRST_STEP_TOPIC: Record<FirstStep, FirstStepTopic> = { d1: 'words', d2: 'habit', d3: 'group', d5: 'people', d7: 'week' };

/** Clé du journal d'un premier pas. */
export const firstStepKey = (topic: FirstStepTopic): string => `first_steps:${topic}`;

/** Un premier pas déjà parti, sous sa clé ou sous l'ancienne clé du même sujet. */
export function firstStepSent(topic: FirstStepTopic, sent: ReadonlySet<string>): boolean {
  if (sent.has(firstStepKey(topic))) return true;
  return (Object.keys(LEGACY_FIRST_STEP_TOPIC) as FirstStep[]).some((d) => LEGACY_FIRST_STEP_TOPIC[d] === topic && sent.has(`first_steps:${d}`));
}

/**
 * Ce que dit le premier pas « les gens » (J1) : quelqu'un à présenter ou un signe reçu (`people`), sinon un texte
 * honnête qui pousse à inviter (`people_none`). Les autres sujets ne dépendent de rien.
 */
export type FirstStepVariant = FirstStepTopic | 'people_none';
export const firstStepVariant = (topic: FirstStepTopic, peopleWaiting: number): FirstStepVariant =>
  topic === 'people' && peopleWaiting <= 0 ? 'people_none' : topic;

/** Absences (jours sans ouvrir l'app) qui donnent des nouvelles du minimoa. La dernière part aussi par e-mail. */
export const ABSENCE_DAYS = [3, 7, 14] as const;
export type AbsenceDays = (typeof ABSENCE_DAYS)[number];
export const LONG_ABSENCE_DAYS: AbsenceDays = 14;

/** Au retour après cette absence, l'accueil de l'app montre ce qui s'est passé (« Te revoilà »). */
export const WELCOME_BACK_AFTER_DAYS = 14;

/** Rattrapage : un message manqué (heure locale hors de la fenêtre, minuteur arrêté) part encore ce nombre de jours après. */
export const FIDELITE_CATCH_UP_DAYS = 2;
/**
 * Rattrapage d'un premier pas : un jour, sauf si le suivant tombe le lendemain (J1, J2, J3 : chacun son jour), pour que
 * deux premiers pas ne se chevauchent jamais.
 */
const FIRST_STEPS_CATCH_UP_DAYS = 1;
const catchUpOf = (i: number): number => {
  const next = FIRST_STEPS[i + 1];
  const s = FIRST_STEPS[i];
  return next && s ? Math.min(FIRST_STEPS_CATCH_UP_DAYS, next.day - s.day - 1) : FIRST_STEPS_CATCH_UP_DAYS;
};
/**
 * Pendant les 10 premiers jours (la semaine d'accueil, son rattrapage et la fenêtre de l'absence de 7 jours), les premiers
 * pas remplacent les messages d'absence : une personne inscrite qui n'est pas revenue reçoit J1, J2, J3, J5, J7, puis rien
 * avant l'absence de 14 jours.
 */
export const FIRST_WEEK_DAYS = 10;

/** Fenêtre d'envoi, heure locale de la personne : en journée, loin des heures calmes et des rappels du soir. */
export const FIDELITE_HOURS = { from: 11, to: 20 } as const;
export const isFideliteHour = (hour: number): boolean => hour >= FIDELITE_HOURS.from && hour < FIDELITE_HOURS.to;

/** Le minuteur passe toutes les 5 minutes ; une passe par demi-heure suffit pour ces messages (fenêtre de 9 h). */
export const FIDELITE_EVERY_MINUTES = 30;
export const isFideliteSlot = (now: Date): boolean => now.getUTCMinutes() % FIDELITE_EVERY_MINUTES < 5;

/** Clé du jour : une seule nouvelle de fidélisation par jour local et par personne. */
export const fideliteDayKey = (localDay: Day): string => `day:${localDay}`;

export type FideliteMessage =
  | { kind: 'first_steps'; step: FirstStep; topic: FirstStepTopic; key: string; email: false }
  | { kind: 'minimoa_news'; step: 'absence'; days: AbsenceDays; key: string; email: boolean }
  | { kind: 'minimoa_news'; step: 'anniversary'; months: number; key: string; email: false };

/** Même jour du mois `n` mois plus tard ; un 31 devient le dernier jour d'un mois plus court (et un 29 février, le 28). */
export function addMonths(d: Day, n: number): Day {
  const y = Number(d.slice(0, 4));
  const m = Number(d.slice(5, 7)) - 1 + n;
  const year = y + Math.floor(m / 12);
  const month = ((m % 12) + 12) % 12;
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = Math.min(Number(d.slice(8, 10)), last);
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const within = (from: Day, today: Day, catchUp: number): boolean => {
  const n = daysBetween(from, today);
  return n >= 0 && n <= catchUp;
};

/** Anniversaire avec son minimoa dû aujourd'hui (1 mois, puis chaque année), en mois ; null sinon. */
export function anniversaryDue(createdOn: Day, today: Day): number | null {
  if (within(addMonths(createdOn, 1), today, FIDELITE_CATCH_UP_DAYS)) return 1;
  const years = Math.floor(daysBetween(createdOn, today) / 365);
  for (const y of [years, years - 1]) {
    if (y >= 1 && within(addMonths(createdOn, 12 * y), today, FIDELITE_CATCH_UP_DAYS)) return 12 * y;
  }
  return null;
}

/** Palier d'absence atteint aujourd'hui (3, 7 ou 14 jours sans ouvrir l'app, avec rattrapage) ; null sinon. */
export function absenceDue(lastActiveOn: Day, today: Day): AbsenceDays | null {
  const gap = daysBetween(lastActiveOn, today);
  for (const n of [...ABSENCE_DAYS].reverse()) if (gap >= n && gap <= n + FIDELITE_CATCH_UP_DAYS) return n;
  return null;
}

/** Premier pas dû aujourd'hui (J1, J2, J3, J5, J7 après l'inscription) ; null sinon. */
export function firstStepDue(createdOn: Day, today: Day): (typeof FIRST_STEPS)[number] | null {
  for (let i = FIRST_STEPS.length - 1; i >= 0; i--) {
    const s = FIRST_STEPS[i];
    if (s && within(addDays(createdOn, s.day), today, catchUpOf(i))) return s;
  }
  return null;
}

/**
 * La nouvelle de fidélisation à envoyer aujourd'hui à une personne, ou null : une seule par jour, dans l'ordre
 * anniversaire → absence → premiers pas, jamais deux fois la même (clé déjà dans `sent`).
 * Les absences attendent la fin de la semaine d'accueil (les premiers pas servent déjà de rappel).
 */
export function fideliteDue(i: { createdOn: Day; lastActiveOn: Day; today: Day; sent: ReadonlySet<string> }): FideliteMessage | null {
  if (i.sent.has(fideliteDayKey(i.today))) return null;
  const candidates: FideliteMessage[] = [];
  const months = anniversaryDue(i.createdOn, i.today);
  if (months !== null) candidates.push({ kind: 'minimoa_news', step: 'anniversary', months, key: `anniversary:${months}`, email: false });
  const absent = daysBetween(i.createdOn, i.today) >= FIRST_WEEK_DAYS ? absenceDue(i.lastActiveOn, i.today) : null;
  if (absent !== null) {
    candidates.push({ kind: 'minimoa_news', step: 'absence', days: absent, key: `absence:${absent}:${i.lastActiveOn}`, email: absent === LONG_ABSENCE_DAYS });
  }
  const step = firstStepDue(i.createdOn, i.today);
  if (step !== null && !firstStepSent(step.topic, i.sent)) {
    candidates.push({ kind: 'first_steps', step: step.step, topic: step.topic, key: firstStepKey(step.topic), email: false });
  }
  return candidates.find((c) => !i.sent.has(c.key)) ?? null;
}

// ── Minimoa+ ────────────────────────────────────────────────────────────────

/** Ce qu'un événement du magasin fait savoir à la personne, tout de suite. */
export type PlusNewsStep = 'welcome' | 'renewed' | 'recovered' | 'billing_grace' | 'billing_retry';

/** Un achat plus vieux que cela (restauration d'un ancien abonnement) ne vaut pas un message de bienvenue. */
export const PLUS_WELCOME_WITHIN_HOURS = 48;
/** Message d'au revoir : dans la semaine qui suit la fin de Minimoa+, une fois. */
export const PLUS_GOODBYE_WITHIN_DAYS = 7;
/** Relance « tu nous manques » : une seule, environ un mois après la fin (fenêtre d'une semaine). */
export const PLUS_WINBACK_AFTER_DAYS = 30;
export const PLUS_WINBACK_WINDOW_DAYS = 7;
/** Le journal des messages garde ses clés ce nombre de jours (puis la relance pourrait repartir, après un nouvel abonnement). */
export const LIFECYCLE_KEEP_DAYS = 400;

const DAY_MS = 86_400_000;
const ENDED = new Set(['expired', 'refunded', 'revoked']);
const PAYMENT_TROUBLE = new Set(['grace', 'billing_retry']);

/**
 * Messages dus après qu'un événement du magasin a fait passer l'abonnement de `prev` à `next` (clé de chacun : il ne
 * part qu'une fois, même si Apple renvoie la notification ou si l'app envoie le même achat).
 * - bienvenue : abonnement nouveau (ou repris après une fin), acheté il y a moins de 48 h ;
 * - renouvellement de l'annuel : merci (pas après un essai, pas après un paiement rattrapé) ;
 * - paiement rattrapé : c'est reparti ;
 * - paiement refusé : délai de grâce (accès gardé) ou nouvelle tentative (accès en pause), une fois par échéance.
 */
export function plusNewsAfter(prev: SubscriptionState | null, next: SubscriptionState, e: StoreEvent, now: Date): { step: PlusNewsStep; key: string }[] {
  const out: { step: PlusNewsStep; key: string }[] = [];
  const age = now.getTime() - Date.parse(e.purchasedAt);
  // Une heure de tolérance pour l'horloge du magasin ; au-delà, une date d'achat « dans le futur » n'est pas un achat frais.
  const fresh = age >= -3_600_000 && age <= PLUS_WELCOME_WITHIN_HOURS * 3_600_000;
  const live = next.status === 'trial' || next.status === 'active';
  if (live && fresh && (prev === null || ENDED.has(prev.status))) {
    out.push({ step: 'welcome', key: `plus_welcome:${next.store}:${next.originalTransactionId}:${e.transactionId}` });
  }
  if (e.kind === 'DID_RENEW' && next.status === 'active' && prev !== null) {
    if (e.subtype === 'BILLING_RECOVERY' || PAYMENT_TROUBLE.has(prev.status)) {
      if (PAYMENT_TROUBLE.has(prev.status)) out.push({ step: 'recovered', key: `plus_recovered:${e.transactionId}` });
    } else if (next.plan === 'yearly' && prev.status === 'active') {
      out.push({ step: 'renewed', key: `plus_renewed:${e.transactionId}` });
    }
  }
  if (PAYMENT_TROUBLE.has(next.status) && (prev === null || !PAYMENT_TROUBLE.has(prev.status))) {
    out.push({ step: next.status === 'grace' ? 'billing_grace' : 'billing_retry', key: `plus_billing:${next.originalTransactionId}:${next.expiresAt ?? ''}` });
  }
  return out;
}

/**
 * Fin de Minimoa+ (ISO) si l'abonnement s'est arrêté de lui-même (annulé ou paiement jamais rattrapé) ; null s'il
 * court encore, s'il cherche encore à être payé, ou s'il a été remboursé ou retiré (pas d'au revoir alors).
 */
export function plusEndedAt(s: SubscriptionState, now: Date): string | null {
  if (subscriptionView(s, now).phase !== 'expired') return null;
  return plusUntilOf(s);
}

/** Au revoir dû : Minimoa+ s'est arrêté il y a moins d'une semaine. */
export function plusGoodbyeDue(s: SubscriptionState, now: Date): boolean {
  const end = plusEndedAt(s, now);
  return end !== null && now.getTime() - Date.parse(end) <= PLUS_GOODBYE_WITHIN_DAYS * DAY_MS;
}

/** Relance unique due : Minimoa+ s'est arrêté il y a un mois (fenêtre d'une semaine). */
export function plusWinbackDue(s: SubscriptionState, now: Date): boolean {
  const end = plusEndedAt(s, now);
  if (end === null) return false;
  const since = now.getTime() - Date.parse(end);
  return since >= PLUS_WINBACK_AFTER_DAYS * DAY_MS && since <= (PLUS_WINBACK_AFTER_DAYS + PLUS_WINBACK_WINDOW_DAYS) * DAY_MS;
}
