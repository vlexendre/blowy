/**
 * Mises à jour optimistes du cache (TanStack Query) : l'écran change à l'appui, l'API confirme derrière.
 *
 *   onMutate: (v) => optimistic(qc, [patch<Groups>(keys.groups, (g) => …)]),
 *   onError: (_e, _v, snap) => rollback(qc, snap),
 *   onSettled: () => qc.invalidateQueries({ queryKey: …, exact: true }),
 *
 * `optimistic` annule les lectures en vol de ces clés (une réponse plus ancienne n'écrase pas le changement), garde
 * l'état d'avant et applique chaque changement aux données déjà en cache (une clé absente du cache est laissée telle
 * quelle). `rollback` remet l'état d'avant si l'API refuse. Jamais pour ce qui engage de l'argent ou ne se défait pas
 * (achat, suppression du compte, signalement) : là, l'écran attend la réponse.
 */
import type { QueryClient, QueryKey } from '@tanstack/react-query';

export interface Patch {
  key: QueryKey;
  update: (old: unknown) => unknown;
}

/** Un changement typé d'une clé du cache (appelé seulement si la donnée est là). */
export const patch = <T>(key: QueryKey, update: (old: T) => T): Patch => ({ key, update: (old) => update(old as T) });

export interface Snapshot {
  before: [QueryKey, unknown][];
}

export async function optimistic(qc: QueryClient, patches: readonly Patch[]): Promise<Snapshot> {
  await Promise.all(patches.map((p) => qc.cancelQueries({ queryKey: p.key, exact: true })));
  const before: [QueryKey, unknown][] = [];
  for (const p of patches) {
    const old = qc.getQueryData(p.key);
    if (old === undefined) continue;
    before.push([p.key, old]);
    qc.setQueryData(p.key, p.update(old));
  }
  return { before };
}

export function rollback(qc: QueryClient, snapshot: Snapshot | undefined): void {
  for (const [key, old] of snapshot?.before ?? []) qc.setQueryData(key, old);
}
