/**
 * Compatibilité du contrat (docs/VERSIONING.md) : compare deux formes JSON Schema (produites par `z.toJSONSchema`) et
 * dit ce qui casserait une app déjà installée.
 *
 * - Réponse (l'API écrit, l'app lit) : toute réponse de la nouvelle API doit être lisible par l'ancienne app, donc
 *   « nouveau ⊆ ancien ». Cassant : champ retiré ou devenu facultatif, type changé, contrainte relâchée, valeur d'enum
 *   ajoutée là où l'app ne sait pas l'écarter.
 * - Requête (l'app écrit, l'API lit) : tout ce qu'envoie l'ancienne app doit être accepté, donc « ancien ⊆ nouveau ».
 *   Cassant : champ devenu obligatoire, valeur d'enum retirée, type changé, contrainte resserrée.
 *
 * Valeur d'enum ajoutée dans une réponse : l'app (à partir du build qui lit avec `parseTolerant`) retire l'élément de
 * liste, le champ facultatif ou le champ qui peut être null qui la porte. Elle est donc « tolérée » à ces endroits, et
 * seulement quand tous les builds encore servis savent le faire (`clientsTolerant`).
 */

export type JsonSchema = { [key: string]: unknown };
export type Direction = 'response' | 'request';

export interface Problem {
  path: string;
  message: string;
  /** Valeur d'enum ajoutée qu'une app tolérante écarte sans casser. */
  tolerable?: boolean;
  kind?: 'enum-added';
}

interface Ctx {
  path: string;
  direction: Direction;
  /** Un ancêtre peut être écarté par l'app (élément de liste, champ facultatif ou qui peut être null). */
  removable: boolean;
}

const UNION_KEYS = ['anyOf', 'oneOf'] as const;
const LOWER_BOUNDS = ['minimum', 'exclusiveMinimum', 'minLength', 'minItems', 'minProperties'] as const;
const UPPER_BOUNDS = ['maximum', 'exclusiveMaximum', 'maxLength', 'maxItems', 'maxProperties'] as const;
const CONSTRAINING = new Set(['type', 'enum', 'const', 'anyOf', 'oneOf', 'allOf', 'properties', 'items', 'prefixItems', 'additionalProperties', 'propertyNames', 'not', '$ref', 'pattern', 'format', ...LOWER_BOUNDS, ...UPPER_BOUNDS]);

const isSchema = (v: unknown): v is JsonSchema => typeof v === 'object' && v !== null && !Array.isArray(v);
const list = (v: unknown): JsonSchema[] => (Array.isArray(v) ? v.filter(isSchema) : []);
const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const show = (v: unknown): string => JSON.stringify(v);
const at = (ctx: Ctx, key: string): Ctx => ({ ...ctx, path: ctx.path ? `${ctx.path}.${key}` : key });

function unionOf(s: JsonSchema): JsonSchema[] | null {
  for (const k of UNION_KEYS) if (Array.isArray(s[k])) return list(s[k]);
  return null;
}

function valuesOf(s: JsonSchema): unknown[] | null {
  if (Array.isArray(s.enum)) return s.enum;
  if ('const' in s) return [s.const];
  return null;
}

function typesOf(s: JsonSchema): Set<string> | null {
  if (typeof s.type === 'string') return new Set([s.type]);
  if (Array.isArray(s.type)) return new Set(strings(s.type));
  const values = valuesOf(s);
  if (values) return new Set(values.map((v) => (v === null ? 'null' : Number.isInteger(v) ? 'integer' : typeof v)));
  if (isSchema(s.properties) || 'additionalProperties' in s || 'propertyNames' in s) return new Set(['object']);
  if ('items' in s || 'prefixItems' in s) return new Set(['array']);
  return null;
}

/** Vrai si le schéma accepte null (l'app peut alors remplacer une valeur inconnue par null). */
export function allowsNull(s: JsonSchema): boolean {
  const u = unionOf(s);
  if (u) return u.some(allowsNull);
  return typesOf(s)?.has('null') ?? false;
}

const constrains = (s: JsonSchema): boolean => Object.keys(s).some((k) => CONSTRAINING.has(k));

/**
 * Problèmes qui empêchent « toute valeur de `narrow` est valide pour `wide` ». Réponse : narrow = nouveau, wide =
 * ancien ; requête : narrow = ancien, wide = nouveau.
 */
export function covers(narrow: JsonSchema, wide: JsonSchema, ctx: Ctx): Problem[] {
  if (!constrains(wide)) return [];
  const nu = unionOf(narrow);
  if (nu) return nu.flatMap((branch) => covers(branch, wide, ctx));
  if (Array.isArray(narrow.allOf)) {
    // Une intersection est contenue dans chacune de ses parties : il suffit qu'une partie soit contenue.
    const parts = list(narrow.allOf).map((p) => covers({ ...narrow, allOf: undefined, ...p }, wide, ctx));
    return parts.find((p) => p.length === 0) ?? parts[0] ?? [];
  }
  if (Array.isArray(wide.allOf)) return list(wide.allOf).flatMap((p) => covers(narrow, p, ctx));
  const wu = unionOf(wide);
  if (wu) {
    const nullable = wu.some(allowsNull);
    const inner = nullable && ctx.direction === 'response' ? { ...ctx, removable: true } : ctx;
    let best: { problems: Problem[]; score: number } | null = null;
    for (const branch of wu) {
      const problems = covers(narrow, branch, inner);
      if (problems.length === 0) return [];
      const s = score(problems, narrow, branch);
      if (best === null || s < best.score) best = { problems, score: s };
    }
    return best?.problems ?? [{ path: ctx.path, message: 'type changé' }];
  }
  if ('$ref' in narrow || '$ref' in wide) {
    return narrow.$ref === wide.$ref ? [] : [{ path: ctx.path, message: `référence changée : ${show(wide.$ref)} → ${show(narrow.$ref)}` }];
  }

  const problems: Problem[] = [];
  const tn = typesOf(narrow);
  const tw = typesOf(wide);
  if (tw) {
    if (!tn) return [{ path: ctx.path, message: `type élargi (n'importe quelle valeur) là où ${[...tw].join('|')} était attendu` }];
    const bad = [...tn].filter((t) => !tw.has(t) && !(t === 'integer' && tw.has('number')));
    if (bad.length > 0) {
      const [from, to] = ctx.direction === 'response' ? [tw, tn] : [tn, tw];
      return [{ path: ctx.path, message: `type changé : ${[...from].join('|')} → ${[...to].join('|')}` }];
    }
  }

  const vw = valuesOf(wide);
  if (vw) {
    const vn = valuesOf(narrow);
    if (!vn) {
      problems.push({ path: ctx.path, message: ctx.direction === 'response' ? `valeur libre là où une liste était attendue (${vw.map(show).join(', ')})` : 'liste de valeurs imposée là où la valeur était libre' });
    } else {
      const extra = vn.filter((v) => !vw.some((w) => w === v));
      if (extra.length > 0) {
        problems.push(
          ctx.direction === 'response'
            ? { path: ctx.path, message: `valeur d'enum ajoutée : ${extra.map(show).join(', ')}`, tolerable: ctx.removable, kind: 'enum-added' }
            : { path: ctx.path, message: `valeur d'enum retirée : ${extra.map(show).join(', ')}` },
        );
      }
    }
  }

  for (const k of LOWER_BOUNDS) {
    const w = wide[k];
    const n = narrow[k];
    if (typeof w === 'number' && !(typeof n === 'number' && n >= w)) problems.push({ path: ctx.path, message: bound(k, n, w, ctx) });
  }
  for (const k of UPPER_BOUNDS) {
    const w = wide[k];
    const n = narrow[k];
    if (typeof w === 'number' && !(typeof n === 'number' && n <= w)) problems.push({ path: ctx.path, message: bound(k, n, w, ctx) });
  }
  for (const k of ['pattern', 'format'] as const) {
    if (wide[k] !== undefined && narrow[k] !== wide[k]) problems.push({ path: ctx.path, message: bound(k, narrow[k], wide[k], ctx) });
  }

  if (isSchema(wide.properties) || isSchema(narrow.properties) || tw?.has('object')) problems.push(...objects(narrow, wide, ctx));
  if (isSchema(wide.items) && isSchema(narrow.items)) {
    problems.push(...covers(narrow.items, wide.items, { ...at(ctx, '[]'), removable: ctx.removable || ctx.direction === 'response' }));
  }
  const pw = list(wide.prefixItems);
  const pn = list(narrow.prefixItems);
  pw.forEach((w, i) => {
    const n = pn[i];
    if (n) problems.push(...covers(n, w, at(ctx, `[${i}]`)));
  });
  return problems;
}

function objects(narrow: JsonSchema, wide: JsonSchema, ctx: Ctx): Problem[] {
  const problems: Problem[] = [];
  const pw = isSchema(wide.properties) ? (wide.properties as Record<string, JsonSchema>) : {};
  const pn = isSchema(narrow.properties) ? (narrow.properties as Record<string, JsonSchema>) : {};
  const rw = new Set(strings(wide.required));
  const rn = new Set(strings(narrow.required));
  const response = ctx.direction === 'response';
  for (const key of rw) {
    if (!rn.has(key)) {
      problems.push({ path: at(ctx, key).path, message: response ? (key in pn ? 'champ de réponse devenu facultatif' : 'champ de réponse retiré') : 'champ de requête devenu obligatoire' });
    }
  }
  for (const [key, w] of Object.entries(pw)) {
    const n = pn[key];
    if (!n) continue;
    // Réponse : wide = ancien schéma de l'app ; un champ qu'elle n'exige pas, ou qui peut être null, peut être écarté.
    const removable = ctx.removable || (response && (!rw.has(key) || allowsNull(w)));
    problems.push(...covers(n, w, { ...at(ctx, key), removable }));
  }
  for (const [key, n] of Object.entries(pn)) {
    if (key in pw) continue;
    if (wide.additionalProperties === false) problems.push({ path: at(ctx, key).path, message: 'champ inconnu de l’autre côté (objet strict)' });
    else if (isSchema(wide.additionalProperties)) problems.push(...covers(n, wide.additionalProperties, at(ctx, key)));
  }
  if (isSchema(narrow.additionalProperties) && isSchema(wide.additionalProperties)) {
    problems.push(...covers(narrow.additionalProperties, wide.additionalProperties, { ...at(ctx, '[valeur]'), removable: ctx.removable || response }));
  }
  if (isSchema(wide.propertyNames)) {
    const names = isSchema(narrow.propertyNames) ? narrow.propertyNames : {};
    problems.push(...covers(names, wide.propertyNames, { ...at(ctx, '[clé]'), removable: ctx.removable || response }));
  }
  return problems;
}

function bound(k: string, n: unknown, w: unknown, ctx: Ctx): string {
  const [before, after] = ctx.direction === 'response' ? [w, n] : [n, w];
  return `contrainte ${k} changée : ${before === undefined ? 'aucune' : show(before)} → ${after === undefined ? 'aucune' : show(after)}`;
}

/** Branche la plus proche (pour le message) : celle du même type, puis celle qui a le moins de problèmes. */
function score(problems: Problem[], narrow: JsonSchema, branch: JsonSchema): number {
  const tn = typesOf(narrow);
  const tb = typesOf(branch);
  const sameType = tn && tb && [...tn].some((t) => tb.has(t));
  return (sameType ? 0 : 1000) + problems.filter((p) => !p.tolerable).length * 10 + problems.length;
}

export function compareSchemas(oldSchema: JsonSchema, newSchema: JsonSchema, direction: Direction, path = ''): Problem[] {
  const ctx: Ctx = { path, direction, removable: false };
  return direction === 'response' ? covers(newSchema, oldSchema, ctx) : covers(oldSchema, newSchema, ctx);
}
