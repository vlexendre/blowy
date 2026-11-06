/**
 * V5.6 (E11) : lecture des temps de trajet — ligne ops `NeighborhoodTravelTime` d'abord, sinon estimation à partir des
 * centres de quartier de la même ville (`domain/travel.ts`). Aucune position de personne n'est lue.
 */
import type { Db, Tx } from '@blowy/database';
import { centerOf, estimateTravelMinutes, type Point } from '../domain/travel.js';

export interface TravelLookup {
  /** minutes (et si c'est une estimation) de `from` vers chaque quartier de la ville, `from` exclu. */
  from(fromId: string): Promise<Map<string, { minutes: number; estimated: boolean }>>;
}

export async function travelFrom(c: Tx | Db, fromId: string): Promise<Map<string, { minutes: number; estimated: boolean }>> {
  const out = new Map<string, { minutes: number; estimated: boolean }>();
  const home = await c.neighborhood.findUnique({ where: { id: fromId }, select: { cityZoneId: true } });
  if (!home) return out;
  const nbs = await c.neighborhood.findMany({
    where: { cityZoneId: home.cityZoneId, status: { notIn: ['CLOSED'] } },
    select: { id: true, centerLat: true, centerLng: true, venues: { where: { status: 'ACTIVE' }, select: { lat: true, lng: true } } },
  });
  const centers = new Map<string, Point | null>(nbs.map((n) => [n.id, centerOf(n, n.venues)]));
  const a = centers.get(fromId) ?? null;
  for (const n of nbs) {
    if (n.id === fromId) continue;
    const b = centers.get(n.id) ?? null;
    if (a && b) out.set(n.id, { minutes: estimateTravelMinutes(a, b), estimated: true });
  }
  // Les valeurs ops priment sur l'estimation.
  for (const r of await c.neighborhoodTravelTime.findMany({ where: { fromNeighborhoodId: fromId }, select: { toNeighborhoodId: true, minutes: true } })) {
    if (r.toNeighborhoodId !== fromId) out.set(r.toNeighborhoodId, { minutes: r.minutes, estimated: false });
  }
  return out;
}
