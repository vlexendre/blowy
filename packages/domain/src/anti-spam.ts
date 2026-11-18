/**
 * Garde-fous contre les ajouts en masse (« on ne doit pas pouvoir faire signe à tout le monde ») : signes envoyés par
 * jour, signes en attente, e-mails de signe reçus, invitations, signalements, et repérage des comptes à regarder.
 * Pur : l'instant est un paramètre, les jours sont ceux de l'app (Europe/Paris, comme le quota des présentations).
 */
import { type Day, addDays, dayOf } from './days';
import type { EncounterStatus } from './encounters';

// ── Signes (coucous) ───────────────────────────────────────────────────────
/**
 * Coucous envoyés par jour, sans Minimoa+. Fixe dans la journée : le quota de présentations (`encounterQuota`, 3 à 20)
 * monte avec la sociabilité, qui monte elle-même à chaque coucou ; un plafond qui suivrait le quota bougerait à chaque
 * geste. 10 couvre une journée bien remplie (le quota moyen est de 8 présentations, plus quelques repères de la carte).
 */
export const WAVE_DAILY_FREE = 10;
/** Avec Minimoa+ (plus de présentations et toute la carte). */
export const WAVE_DAILY_PLUS = 20;
/** Plafond absolu par jour, quoi qu'il arrive (Minimoa+ compris, et toute évolution future des offres). */
export const WAVE_DAILY_ABSOLUTE = 25;
/** Signes sans réponse au plus : au-delà, il faut des réponses, ou que les plus anciens sortent de la fenêtre. */
export const WAVE_MAX_PENDING = 15;
/** Avec Minimoa+ : assez pour profiter de ses 20 signes du jour dès le premier jour. */
export const WAVE_MAX_PENDING_PLUS = 25;

/** Signes sans réponse au plus : 15 sans Minimoa+, 25 avec. */
export const maxPendingWaves = (i: { plus: boolean }): number => (i.plus ? WAVE_MAX_PENDING_PLUS : WAVE_MAX_PENDING);
/** Un signe sans réponse depuis plus longtemps ne compte plus dans l'attente (il reste visible chez l'autre). */
export const WAVE_PENDING_DAYS = 14;
/** E-mails « on t'a fait signe » reçus par jour au plus ; les suivants restent dans l'app (et le push a son plafond). */
export const WAVE_EMAILS_PER_RECIPIENT_PER_DAY = 3;

/** Plafond de coucous envoyés aujourd'hui : 10 sans Minimoa+, 20 avec, jamais plus de 25. */
export function dailyWaveCap(i: { plus: boolean }): number {
  return Math.min(WAVE_DAILY_ABSOLUTE, i.plus ? WAVE_DAILY_PLUS : WAVE_DAILY_FREE);
}

/** Un signe envoyé, tel que les règles le lisent. */
export interface SentWave {
  toUser: string;
  status: EncounterStatus;
  createdAt: string;
}

export type WaveBlock = 'daily' | 'pending';

export interface WaveAllowance {
  sentToday: number;
  dailyCap: number;
  pending: number;
  maxPending: number;
  /** Signes encore possibles maintenant (le plus petit des deux restes). */
  left: number;
  /** Pourquoi plus aucun signe n'est possible maintenant ; null s'il en reste. */
  blocked: WaveBlock | null;
}

/** Instants (ISO) tombant le jour `day` (jour de l'app). */
export const countOnDay = (instants: readonly string[], day: Day): number => instants.filter((at) => dayOf(new Date(at)) === day).length;

/** Signe encore sans réponse et assez récent pour compter dans l'attente. */
export const isPendingWave = (w: SentWave, now: Date): boolean =>
  w.status === 'waved' && now.getTime() - Date.parse(w.createdAt) < WAVE_PENDING_DAYS * 86_400_000;

/**
 * Où en est la personne : `sent` = ses signes des `WAVE_PENDING_DAYS` derniers jours au moins (tous statuts).
 * Le plafond du jour est vérifié avant l'attente : « reviens demain » est la réponse la plus utile.
 */
export function waveAllowance(i: { sent: readonly SentWave[]; now: Date; plus: boolean }): WaveAllowance {
  const sentToday = countOnDay(
    i.sent.map((w) => w.createdAt),
    dayOf(i.now),
  );
  const dailyCap = dailyWaveCap(i);
  const pending = i.sent.filter((w) => isPendingWave(w, i.now)).length;
  const maxPending = maxPendingWaves(i);
  const left = Math.max(0, Math.min(dailyCap - sentToday, maxPending - pending));
  const blocked: WaveBlock | null = sentToday >= dailyCap ? 'daily' : pending >= maxPending ? 'pending' : null;
  return { sentToday, dailyCap, pending, maxPending, left, blocked };
}

/** Un e-mail de signe peut-il partir ? `receivedToday` compte les signes reçus aujourd'hui, celui-ci compris. */
export const waveEmailAllowed = (receivedToday: number): boolean => receivedToday <= WAVE_EMAILS_PER_RECIPIENT_PER_DAY;

// ── Repérage pour la modération (jamais de suspension automatique) ─────────
/** Fenêtre regardée. */
export const WAVE_ABUSE_WINDOW_DAYS = 14;
/** Jour « en masse » : au moins 15 signes envoyés… */
export const WAVE_ABUSE_HEAVY_DAY = 15;
/** …tant de jours de suite. */
export const WAVE_ABUSE_STREAK_DAYS = 3;
/** Refus ou blocages après ses signes, au moins… */
export const WAVE_ABUSE_MIN_REFUSALS = 8;
/** …et au moins cette part des réponses. */
export const WAVE_ABUSE_REFUSAL_SHARE = 0.5;

export type WaveAbuse = { kind: 'mass'; days: number } | { kind: 'refusals'; refused: number; answered: number };

/**
 * Compte à montrer à la modération, ou null :
 * - `mass` : au moins `WAVE_ABUSE_STREAK_DAYS` jours de suite à `WAVE_ABUSE_HEAVY_DAY` signes ou plus ;
 * - `refusals` : sur la fenêtre, au moins `WAVE_ABUSE_MIN_REFUSALS` signes refusés (ou suivis d'un blocage par la
 *   personne saluée), et au moins la moitié des réponses.
 * `blockedBy` : personnes qui ont bloqué l'expéditeur (un signe resté sans réponse puis bloqué compte comme un refus).
 */
export function waveAbuse(i: { sent: readonly SentWave[]; blockedBy: ReadonlySet<string>; now: Date }): WaveAbuse | null {
  const since = i.now.getTime() - WAVE_ABUSE_WINDOW_DAYS * 86_400_000;
  const recent = i.sent.filter((w) => Date.parse(w.createdAt) >= since);

  const perDay = new Map<Day, number>();
  for (const w of recent) {
    const day = dayOf(new Date(w.createdAt));
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
  }
  let best = 0;
  for (const day of perDay.keys()) {
    let run = 0;
    while ((perDay.get(addDays(day, run)) ?? 0) >= WAVE_ABUSE_HEAVY_DAY) run += 1;
    best = Math.max(best, run);
  }
  if (best >= WAVE_ABUSE_STREAK_DAYS) return { kind: 'mass', days: best };

  const refused = recent.filter((w) => w.status === 'declined' || (w.status === 'waved' && i.blockedBy.has(w.toUser))).length;
  const answered = refused + recent.filter((w) => w.status === 'accepted').length;
  if (refused >= WAVE_ABUSE_MIN_REFUSALS && refused >= answered * WAVE_ABUSE_REFUSAL_SHARE) return { kind: 'refusals', refused, answered };
  return null;
}

// ── Autres ajouts ──────────────────────────────────────────────────────────
/** Invitations à un groupe envoyées par jour (création comprise ; seulement vers ses liens). */
export const GROUP_INVITES_PER_DAY = 30;
/** Invitations par lien (`/i/CODE`) acceptées par jour. */
export const INVITE_ACCEPTS_PER_DAY = 20;
/** Signalements faits par jour (personnes et groupes) : bloquer reste toujours possible. */
export const REPORTS_PER_DAY = 10;

/** Reste-t-il de la place aujourd'hui ? `instants` : ce qui a déjà été fait (ISO), `adding` : ce qu'on veut ajouter. */
export const withinDaily = (instants: readonly string[], now: Date, cap: number, adding = 1): boolean => countOnDay(instants, dayOf(now)) + adding <= cap;
