/** Copie profonde des structures JSON du moteur (états : objets/tableaux/primitives uniquement). */
export function cloneJson<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(cloneJson) as T;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) out[k] = cloneJson(v);
  return out as T;
}
