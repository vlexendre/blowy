/**
 * Œuf (§8) : timezone stable de relation ; séance à 21 h, réponses jusqu'à 21 h le lendemain.
 * Nuits logiques uniques ; au plus une séance courante + une de rattrapage ouvertes ; au plus
 * 2 validations par journée de relation sans compter deux fois une nuit. Chaque question donne
 * un seul gain de chaleur pour la paire (+15 identique / +8 différente), révélé quand les deux
 * ont répondu ; total plafonné à 180. Naissance après 3 nuits complètes (aucun seuil caché).
 */
import { HOUR_MS } from '@blowy/domain';
import type { Tuning } from '@blowy/tuning';
import type { EggSession, EggState, EngineContext, EffectSink } from '../model/index.js';
import { localDayKey } from '../time/index.js';
import { SIDES, type Side } from '../shared/index.js';

const emptySession = (night: number, dayKey: string, t: Tuning): EggSession => ({
  night,
  openedDayKey: dayKey,
  answers: Array.from({ length: t.egg.questionsPerNight }, () => [null, null] as [string | null, string | null]),
  heatAwarded: Array.from({ length: t.egg.questionsPerNight }, () => false),
  completedDayKey: null,
});

export const completedNights = (egg: EggState): number => egg.sessions.filter((s) => s.completedDayKey !== null).length;
const openSessions = (egg: EggState): EggSession[] => egg.sessions.filter((s) => s.completedDayKey === null);

/** Ouvre la séance du soir (job 21 h). Une séance incomplète précédente devient rattrapage. */
export function openSession(egg: EggState, ctx: EngineContext, out: EffectSink): boolean {
  const t = ctx.tuning;
  const dayKey = localDayKey(ctx.now - t.egg.sessionHour * HOUR_MS, egg.tz);
  if (egg.status !== 'INCUBATING') return false;
  if (egg.sessions.some((s) => s.openedDayKey === dayKey)) return false; // idempotent
  const open = openSessions(egg);
  // Jamais plus de nuits que nécessaire ; au plus une courante + une de rattrapage.
  if (completedNights(egg) + open.length >= t.egg.nights || open.length >= t.egg.maxOpenNights) return false;
  const night = egg.sessions.length + 1;
  egg.sessions.push(emptySession(night, dayKey, t));
  out.push({ type: 'EGG_SESSION_OPENED', eggId: egg.id, night, catchUp: open.length > 0 });
  return true;
}

export function answer(egg: EggState, night: number, question: number, side: Side, choice: string, ctx: EngineContext, out: EffectSink): boolean {
  const t = ctx.tuning;
  const session = egg.sessions.find((s) => s.night === night);
  if (!session || session.completedDayKey !== null || egg.status !== 'INCUBATING') return false;
  const pair = session.answers[question];
  if (!pair || pair[side] !== null) return false; // réponse unique, secrète
  const relDay = localDayKey(ctx.now - t.egg.sessionHour * HOUR_MS, egg.tz);
  const validatedToday = egg.sessions.filter((s) => s.completedDayKey === relDay).length;
  pair[side] = choice;
  if (pair[0] !== null && pair[1] !== null && !session.heatAwarded[question]) {
    session.heatAwarded[question] = true;
    const same = pair[0] === pair[1];
    egg.heat = Math.min(t.egg.heatCap, egg.heat + (same ? t.egg.heatSame : t.egg.heatDifferent));
    out.push({ type: 'EGG_ANSWERS_REVEALED', eggId: egg.id, night, question, same, heat: egg.heat });
  }
  if (session.heatAwarded.every(Boolean) && validatedToday < t.egg.maxValidationsPerRelationDay) {
    session.completedDayKey = relDay;
    out.push({ type: 'EGG_NIGHT_COMPLETED', eggId: egg.id, night });
    if (completedNights(egg) >= t.egg.nights) {
      egg.status = 'READY_TO_HATCH';
      out.push({ type: 'EGG_READY', eggId: egg.id });
    }
  }
  return true;
}

/** Tapotement final : les deux dans une fenêtre de 60 s, validée serveur. Naissance unique. */
export function tap(egg: EggState, side: Side, ctx: EngineContext, out: EffectSink): boolean {
  if (egg.status !== 'READY_TO_HATCH') return false;
  const windowMs = ctx.tuning.egg.hatchTapWindowSeconds * 1000;
  for (const s of SIDES) {
    const at = egg.taps[s];
    if (at !== null && ctx.now - at > windowMs) egg.taps[s] = null; // tapotement expiré
  }
  egg.taps[side] = ctx.now;
  if (egg.taps[0] !== null && egg.taps[1] !== null) {
    egg.status = 'HATCHED';
    egg.hatchedAtMs = ctx.now;
    out.push({ type: 'EGG_HATCHED', eggId: egg.id, atMs: ctx.now });
  }
  return true;
}
