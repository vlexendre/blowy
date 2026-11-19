/**
 * Lecture tolérante d'une réponse de l'API (docs/VERSIONING.md) : une app installée peut avoir des semaines de retard
 * sur l'API. Quand l'API ajoute une valeur d'enum (un nouvel objet, un nouveau type d'événement, une nouvelle clé dans
 * un tableau indexé), l'ancien schéma la refuse ; plutôt que de rejeter toute la réponse (écran en erreur), on retire
 * le plus petit morceau qui contient l'inconnu :
 * - l'élément de liste qui le porte (un objet inconnu n'est pas montré) ;
 * - sinon le champ, s'il est facultatif (supprimé) ou peut valoir null ;
 * - une clé inconnue d'un tableau indexé par un enum est retirée.
 * Seules les erreurs « valeur inconnue » sont réparées ; un champ manquant ou d'un autre type reste une erreur (c'est
 * un changement cassant de l'API, que le garde-fou du contrat doit empêcher). L'interface ne voit donc jamais une
 * valeur qu'elle ne connaît pas.
 */
import type { z } from 'zod';

/** Ce qui a été retiré pour lire la réponse (chemins `items.3`, `pet.outfit.head`). */
export interface Tolerated {
  removed: string[];
}

type Issue = z.core.$ZodIssue;
type Path = readonly PropertyKey[];

const TOLERABLE = new Set<Issue['code']>(['invalid_value', 'invalid_union', 'unrecognized_keys', 'invalid_key']);
const MAX_PASSES = 50;

export function parseTolerant<S extends z.ZodType>(schema: S, json: unknown): { data: z.infer<S>; tolerated: Tolerated | null } {
  const first = schema.safeParse(json);
  if (first.success) return { data: first.data, tolerated: null };
  let current: unknown = json;
  let issues = first.error.issues;
  const removed: string[] = [];
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    if (issues.some((i) => !TOLERABLE.has(i.code))) throw first.error;
    // Le plus loin d'abord : retirer l'élément 1 d'une liste décale les suivants, qui doivent déjà être réglés.
    const issue = [...issues].sort((a, b) => comparePath(b.path, a.path))[0];
    if (!issue) break;
    const fixed = repair(schema, current, issue);
    if (!fixed) throw first.error;
    current = fixed.value;
    removed.push(...fixed.removed);
    const next = schema.safeParse(current);
    if (next.success) return { data: next.data, tolerated: { removed } };
    issues = next.error.issues;
  }
  throw first.error;
}

/** Essaie, du plus profond au moins profond, d'enlever ce qui porte l'inconnu ; garde le premier essai qui lève l'erreur. */
function repair(schema: z.ZodType, value: unknown, issue: Issue): { value: unknown; removed: string[] } | null {
  const path = issue.path;
  if (issue.code === 'unrecognized_keys') {
    // Tableau indexé par un enum (`z.record(Enum, …)`) qui reçoit une clé nouvelle : on retire ces clés.
    const next = clone(value);
    const target = at(next, path);
    if (!isObject(target)) return null;
    for (const k of issue.keys) delete target[k];
    if (!stillFails(schema, next, path)) return { value: next, removed: issue.keys.map((k) => show([...path, k])) };
    return null;
  }
  for (let depth = path.length; depth >= 1; depth--) {
    const prefix = path.slice(0, depth);
    const key = prefix[prefix.length - 1] as PropertyKey;
    const parentPath = prefix.slice(0, -1);
    const attempts: ((parent: unknown) => boolean)[] =
      typeof key === 'number'
        ? [(parent) => Array.isArray(parent) && (parent.splice(key, 1), true)]
        : [(parent) => isObject(parent) && delete parent[key as string], (parent) => isObject(parent) && ((parent[key as string] = null), true)];
    for (const attempt of attempts) {
      const next = clone(value);
      if (!attempt(at(next, parentPath))) continue;
      if (!stillFails(schema, next, prefix)) return { value: next, removed: [show(prefix)] };
    }
  }
  return null;
}

/** Vrai s'il reste une erreur à cet endroit ou en dessous (l'essai n'a rien réglé, ou a cassé autre chose ici). */
function stillFails(schema: z.ZodType, value: unknown, prefix: Path): boolean {
  const r = schema.safeParse(value);
  if (r.success) return false;
  return r.error.issues.some((i) => startsWith(i.path, prefix) || startsWith(prefix, i.path));
}

function comparePath(a: Path, b: Path): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const x = a[i];
    const y = b[i];
    if (x === y) continue;
    if (typeof x === 'number' && typeof y === 'number') return x - y;
    return String(x) < String(y) ? -1 : 1;
  }
  return a.length - b.length;
}

const startsWith = (path: Path, prefix: Path): boolean => prefix.every((k, i) => path[i] === k);
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const clone = (v: unknown): unknown => (v === undefined ? v : (JSON.parse(JSON.stringify(v)) as unknown));
const show = (path: Path): string => path.map(String).join('.');

function at(root: unknown, path: Path): unknown {
  let cur: unknown = root;
  for (const k of path) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<PropertyKey, unknown>)[k];
  }
  return cur;
}
