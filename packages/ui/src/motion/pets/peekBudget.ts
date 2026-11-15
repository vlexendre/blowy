import { currentMinute, hashString, makeSeed } from '../seed';

/**
 * Budget des apparitions « surprise » du pet au-dessus des onglets (`BottomTabBar` → `TabPeek`, `HelloPeek`).
 * Elles doivent rester rares : une bonne surprise, pas une habitude. Règles (docs/MOTION.md) :
 * - environ un changement d'onglet sur dix (tirage déterministe : graine = id du pet + n° du changement + minute) ;
 * - jamais deux apparitions (onglet ou retour dans l'app) à moins de 3 minutes d'écart ;
 * - jamais dans les 20 premières secondes d'une session (lancement de l'app) ;
 * - le salut du retour dans l'app : au plus une fois par session, après au moins une minute d'absence ;
 * - seulement sur un écran à onglets (l'appelant le vérifie : barre visible, aucune feuille ouverte).
 */
export const PEEK_RULES = {
  /** Probabilité d'apparaître à un changement d'onglet. */
  tabChance: 0.1,
  /** Probabilité de saluer au retour dans l'app (au plus une fois par session). */
  helloChance: 0.5,
  /** Écart minimal entre deux apparitions (ms). */
  cooldown: 180_000,
  /** Rien pendant les premières secondes d'une session (ms). */
  warmup: 20_000,
  /** Absence minimale avant un salut de retour (ms). */
  away: 60_000,
} as const;

export interface PeekBudget {
  /** Début de la session (ms). */
  start: number;
  /** Dernière apparition (ms), `null` si aucune. */
  last: number | null;
  /** Nombre de changements d'onglet vus (sert au tirage). */
  changes: number;
  /** Le salut de retour a déjà eu lieu dans cette session. */
  helloDone: boolean;
}

export function newPeekBudget(now: number): PeekBudget {
  return { start: now, last: null, changes: 0, helloDone: false };
}

const rested = (b: PeekBudget, now: number) => now - b.start >= PEEK_RULES.warmup && (b.last === null || now - b.last >= PEEK_RULES.cooldown);

/** Tirage déterministe : même pet, même changement, même minute → même réponse. */
function draw(seedId: string, salt: string, n: number, now: number, p: number): boolean {
  return makeSeed(hashString(`${seedId}:${salt}:${n}`) ^ currentMinute(now)).chance(p);
}

/**
 * Un changement d'onglet : le pet passe-t-il la tête ? Pure : rend la décision et le nouveau budget
 * (le compteur avance à chaque changement, même refusé).
 */
export function decideTabPeek(b: PeekBudget, seedId: string, now: number): { show: boolean; budget: PeekBudget } {
  const changes = b.changes + 1;
  const show = rested(b, now) && draw(seedId, 'tab', changes, now, PEEK_RULES.tabChance);
  return { show, budget: { ...b, changes, last: show ? now : b.last } };
}

/** Retour dans l'app après `awayMs` d'absence : le pet salue-t-il ? Pure. */
export function decideHelloPeek(b: PeekBudget, seedId: string, awayMs: number, now: number): { show: boolean; budget: PeekBudget } {
  if (b.helloDone || awayMs < PEEK_RULES.away || !rested(b, now)) return { show: false, budget: b };
  const show = draw(seedId, 'hello', 0, now, PEEK_RULES.helloChance);
  // Un seul tirage par session : refusé une fois, il ne retente pas au prochain retour.
  return { show, budget: { ...b, helloDone: true, last: show ? now : b.last } };
}

// — Budget de la session en cours (le processus de l'app) : partagé par la barre d'onglets et le salut.
let session: PeekBudget = newPeekBudget(Date.now());

/** Réclame une apparition au changement d'onglet (vrai : jouer). */
export function claimTabPeek(seedId: string, now: number = Date.now()): boolean {
  const r = decideTabPeek(session, seedId, now);
  session = r.budget;
  return r.show;
}

/** Réclame le salut du retour dans l'app (vrai : jouer). */
export function claimHelloPeek(seedId: string, awayMs: number, now: number = Date.now()): boolean {
  const r = decideHelloPeek(session, seedId, awayMs, now);
  session = r.budget;
  return r.show;
}

/** Tests et banc d'essai : repart d'une session neuve (au temps `now`). */
export function resetPeekBudget(now: number = Date.now()): void {
  session = newPeekBudget(now);
}
