/**
 * Avance du temps (ticks 15 min ou rattrapage paresseux) — idempotente et convergente.
 *  - Chaque entité porte `advancedToMs` : un tick vers un instant déjà atteint est sans effet.
 *  - Les jauges sont intégrées exactement en entiers (gauges/integrate) ; les accumulateurs
 *    relationnels avancent en ms admissibles et déclenchent leurs seuils à l'instant exact du
 *    franchissement. Le monde avance de franchissement en franchissement, donc découper
 *    [a, c) en ticks ou l'intégrer d'un coup donne le même état.
 *  - Les notifications produites pendant un rattrapage sont dédupliquées : seul l'état utile
 *    récent est conservé (fenêtre `catchUpCoalesceAfterMinutes`).
 */
import { MINUTE_MS } from '@blowy/domain';
import type { EngineContext, EffectSink, EngineEffect, PetState, RelationshipState, World } from '../model/index.js';
import { integrateGauges, isSick } from '../gauges/index.js';
import { relationshipPauses } from '../relationship/index.js';
import { admissibleMs, pruneIntervals, realTimeAfter, type Interval } from '../time/index.js';
import type { Tuning } from '@blowy/tuning';
import { cloneJson } from '../shared/index.js';
import { ACCUMULATORS } from './accumulators.js';

function advancePetTo(pet: PetState, toMs: number, t: Tuning, out: EffectSink): void {
  if (toMs <= pet.advancedToMs) return;
  const wasSick = isSick(pet, t);
  integrateGauges(pet, pet.advancedToMs, toMs, pet.tz, pet.pauses, t);
  pet.advancedToMs = toMs;
  const sick = isSick(pet, t);
  if (sick && !wasSick) out.push({ type: 'PET_FELL_SICK', petId: pet.id });
  if (!sick && wasSick) out.push({ type: 'PET_RECOVERED', petId: pet.id });
}

function nextCrossing(world: World, rel: RelationshipState, toMs: number, t: Tuning, pauses: readonly Interval[]): number {
  let best = toMs;
  for (const acc of ACCUMULATORS) {
    if (!acc.active(rel, world)) continue;
    const d = acc.untilNext(rel, t);
    if (d === null) continue;
    const at = realTimeAfter(rel.advancedToMs, d, toMs, pauses);
    if (at !== null && at < best) best = at;
  }
  return best;
}

function advanceRelTo(world: World, rel: RelationshipState, atMs: number, pauses: readonly Interval[], ctx: EngineContext, out: EffectSink): void {
  if (atMs <= rel.advancedToMs) return;
  const dt = admissibleMs(rel.advancedToMs, atMs, pauses);
  const active = ACCUMULATORS.filter((a) => a.active(rel, world));
  for (const a of active) a.add(rel, dt);
  rel.advancedToMs = atMs;
  for (const a of active) a.fire(rel, world, atMs, ctx, out);
}

/** Retire de l'état les pauses et contextes de mission périmés (bornage de la taille). */
function prune(world: World, nowMs: number, t: Tuning): void {
  const horizon = nowMs - t.actions.mission.contextRetentionDays * 86_400_000;
  for (const pet of Object.values(world.pets)) if (pet.pauses.length) pet.pauses = pruneIntervals(pet.pauses, nowMs);
  for (const rel of Object.values(world.relationships)) {
    if (rel.pauses.length) rel.pauses = pruneIntervals(rel.pauses, nowMs);
    for (const k in rel.missionContexts) if (rel.missionContexts[k]!.createdAtMs < horizon) delete rel.missionContexts[k];
  }
}

/** Garde seulement les notifications récentes, une par clé (la plus récente). */
export function coalesceNotifications(effects: readonly EngineEffect[], toMs: number, t: Tuning): EngineEffect[] {
  const horizon = toMs - t.time.catchUpCoalesceAfterMinutes * MINUTE_MS;
  const lastByKey = new Map<string, number>();
  effects.forEach((e, i) => {
    if (e.type === 'NOTIFY') lastByKey.set(e.key, i);
  });
  return effects.filter((e, i) => e.type !== 'NOTIFY' || (e.atMs >= horizon && lastByKey.get(e.key) === i));
}

/** Avance le monde (muté) jusqu'à `toMs`. */
export function advanceWorldMut(world: World, toMs: number, ctx: EngineContext, out: EffectSink): void {
  const t = ctx.tuning;
  const raw: EngineEffect[] = [];
  const rels = Object.values(world.relationships).filter((r) => r.status !== 'ENDED');
  const pausesOf = new Map(rels.map((r) => [r.id, relationshipPauses(world, r)]));
  for (let guard = 0; guard < 100_000; guard++) {
    let at = toMs;
    for (const r of rels) if (r.advancedToMs < toMs) at = Math.min(at, nextCrossing(world, r, toMs, t, pausesOf.get(r.id) ?? []));
    for (const pet of Object.values(world.pets)) advancePetTo(pet, at, t, raw);
    for (const r of rels) advanceRelTo(world, r, at, pausesOf.get(r.id) ?? [], ctx, raw);
    if (at >= toMs) break;
  }
  for (const r of Object.values(world.relationships)) if (r.advancedToMs < toMs) r.advancedToMs = toMs;
  prune(world, toMs, t);
  out.push(...coalesceNotifications(raw, toMs, t));
}

/** Version pure : renvoie un nouveau monde. */
export function advanceWorld(world: World, toMs: number, ctx: EngineContext): { state: World; effects: EngineEffect[] } {
  const next = cloneJson(world);
  const effects: EngineEffect[] = [];
  advanceWorldMut(next, toMs, ctx, effects);
  return { state: next, effects };
}

/**
 * API demandée par le plan : avance un pet seul sur [fromMs, toMs) en heure locale `tz`,
 * hors `pauses` (union, chevauchements acceptés). Pure.
 */
export function advanceTime(state: PetState, fromMs: number, toMs: number, tz: string, pauses: readonly Interval[], tuning: Tuning): PetState {
  const pet = cloneJson(state);
  if (toMs > fromMs) integrateGauges(pet, fromMs, toMs, tz, pauses, tuning);
  pet.advancedToMs = Math.max(pet.advancedToMs, toMs);
  return pet;
}
