/**
 * Instantané du contrat publié (docs/VERSIONING.md) : la forme JSON des schémas que l'app lit et envoie, les routes et
 * leurs méthodes. Il est régénéré à chaque sortie de l'app (`pnpm contract:snapshot`) ; `pnpm contract:check` (dans
 * `pnpm test`) refuse tout changement qui casserait un build déjà installé.
 *
 * Ce qui est suivi :
 * - endpoints : chaque appel du client de l'app (`packages/api-client/src/index.ts`), méthode, route et schéma de
 *   réponse, lus dans le code du client ;
 * - routes : toutes les tables de routes du contrat, sauf l'administration (déployée avec l'API) ;
 * - requêtes : les schémas `…Body` et `…Query` exportés (hors administration) ;
 * - messages : ce que l'app lit hors du client (données des push, widgets, activités en direct, erreurs, santé).
 */
import ts from 'typescript';
import { z } from 'zod';
import * as contract from '../src/index';
import * as adminContract from '../src/v7/admin';
import { type JsonSchema, type Problem, compareSchemas } from './diff';

export const SNAPSHOT_VERSION = 1;

/** Lus par l'app hors du client HTTP. */
export const MESSAGE_SCHEMAS = ['PushDataZ', 'WidgetStateZ', 'LiveActivityAttributesZ', 'LiveActivityStateZ', 'ApiErrorZ', 'HealthZ'] as const;

/**
 * Messages dont toute valeur d'enum ajoutée est sans danger, même pour les builds sans tolérance : une erreur dont le
 * code (ou le champ) est inconnu est lue comme `internal` (« Une erreur est survenue »), sans planter.
 */
const OPEN_ENUM_MESSAGES = new Set(['ApiErrorZ']);

export interface Snapshot {
  version: number;
  routes: Record<string, string>;
  endpoints: Record<string, { path: string; response: string }>;
  responses: Record<string, JsonSchema>;
  requests: Record<string, JsonSchema>;
  messages: Record<string, JsonSchema>;
}

export interface Policy {
  /** Miroir de `APP_IOS_MIN_SUPPORTED_BUILD` de la production. */
  minSupportedBuild: number;
  /** Premier build publié qui lit les réponses avec `parseTolerant` (null : pas encore publié). */
  tolerantSinceBuild: number | null;
}

/** Vrai quand tous les builds encore servis savent écarter une valeur inconnue. */
export const clientsTolerant = (p: Policy): boolean => p.tolerantSinceBuild !== null && p.minSupportedBuild >= p.tolerantSinceBuild;

const exported = contract as unknown as Record<string, unknown>;
const adminNames = new Set(Object.keys(adminContract));
const isZod = (v: unknown): v is z.ZodType => typeof v === 'object' && v !== null && '_zod' in v;

function jsonOf(schema: z.ZodType): JsonSchema {
  const { $schema: _drop, ...rest } = z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any', reused: 'inline', cycles: 'ref' }) as JsonSchema;
  return stripDocs(rest) as JsonSchema;
}

/** Les descriptions n'entrent pas dans la comparaison. */
function stripDocs(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(stripDocs);
  if (typeof v !== 'object' || v === null) return v;
  const out: Record<string, unknown> = {};
  for (const [k, x] of Object.entries(v)) if (k !== 'description' && k !== 'title') out[k] = stripDocs(x);
  return out;
}

/** Chemin d'une route, paramètres remplacés par `{0}`, `{1}`… */
function pathOf(fn: (...args: string[]) => string): string {
  return fn(...Array.from({ length: fn.length }, (_, i) => `{${i}}`));
}

function routeTables(): Record<string, Record<string, (...args: string[]) => string>> {
  const out: Record<string, Record<string, (...args: string[]) => string>> = {};
  for (const [name, value] of Object.entries(exported)) {
    if (name === 'adminRoutes' || !(name === 'routes' || name.endsWith('Routes'))) continue;
    out[name] = value as Record<string, (...args: string[]) => string>;
  }
  return out;
}

interface ClientCall {
  method: string;
  table: string;
  route: string;
  schema: string;
}

/** Appels `call('GET', table.route(…), Schéma, …)` du client de l'app, et ses schémas locaux `const X = z.array(Y)`. */
export function readClientCalls(source: string): { calls: ClientCall[]; locals: Record<string, string> } {
  const file = ts.createSourceFile('client.ts', source, ts.ScriptTarget.Latest, true);
  const calls: ClientCall[] = [];
  const locals: Record<string, string> = {};
  const findRoute = (node: ts.Node): { table: string; route: string } | null => {
    let found: { table: string; route: string } | null = null;
    const visit = (n: ts.Node): void => {
      if (found) return;
      if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && ts.isIdentifier(n.expression.expression)) {
        const table = n.expression.expression.text;
        if (table === 'routes' || table.endsWith('Routes')) {
          found = { table, route: n.expression.name.text };
          return;
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(node);
    return found;
  };
  const visit = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && ts.isCallExpression(node.initializer)) {
      const init = node.initializer;
      const arg = init.arguments[0];
      if (ts.isPropertyAccessExpression(init.expression) && init.expression.getText(file) === 'z.array' && arg && ts.isIdentifier(arg)) locals[node.name.text] = arg.text;
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'call') {
      const [method, route, schema] = node.arguments;
      if (method && ts.isStringLiteral(method) && route && schema && ts.isIdentifier(schema)) {
        const r = findRoute(route);
        if (!r) throw new Error(`appel sans route du contrat : ${node.getText(file).slice(0, 120)}`);
        calls.push({ method: method.text, ...r, schema: schema.text });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return { calls, locals };
}

export function buildSnapshot(clientSource: string): Snapshot {
  const tables = routeTables();
  const routes: Record<string, string> = {};
  for (const [table, fns] of Object.entries(tables)) for (const [name, fn] of Object.entries(fns)) routes[`${table}.${name}`] = pathOf(fn);

  const { calls, locals } = readClientCalls(clientSource);
  const endpoints: Snapshot['endpoints'] = {};
  const responses: Snapshot['responses'] = {};
  for (const c of calls) {
    const fn = tables[c.table]?.[c.route];
    if (!fn) throw new Error(`route inconnue du contrat : ${c.table}.${c.route}`);
    const item = locals[c.schema];
    const name = item ? `${item}[]` : c.schema;
    const base = exported[item ?? c.schema];
    if (!isZod(base)) throw new Error(`schéma de réponse inconnu du contrat : ${item ?? c.schema}`);
    responses[name] ??= jsonOf(item ? z.array(base) : base);
    endpoints[`${c.method} ${c.table}.${c.route}`] = { path: pathOf(fn), response: name };
  }

  const requests: Snapshot['requests'] = {};
  for (const [name, value] of Object.entries(exported)) {
    if (!isZod(value) || adminNames.has(name) || name.startsWith('Admin')) continue;
    if (name.endsWith('Body') || name.endsWith('Query')) requests[name] = jsonOf(value);
  }
  const messages: Snapshot['messages'] = {};
  for (const name of MESSAGE_SCHEMAS) {
    const value = exported[name];
    if (!isZod(value)) throw new Error(`schéma inconnu du contrat : ${name}`);
    messages[name] = jsonOf(value);
  }
  return { version: SNAPSHOT_VERSION, routes: sortKeys(routes), endpoints: sortKeys(endpoints), responses: sortKeys(responses), requests: sortKeys(requests), messages };
}

function sortKeys<T>(o: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
}

export interface Report {
  /** Changements cassants : `pnpm contract:check` échoue. */
  breaking: string[];
  /** Valeurs d'enum ajoutées qu'une app tolérante écarte (cassant tant que de vieux builds sans tolérance sont servis). */
  tolerable: string[];
  /** Ajouts (sans risque). */
  added: string[];
}

export function compareSnapshots(old: Snapshot, next: Snapshot, policy: Policy): Report {
  const breaking: string[] = [];
  const tolerable: string[] = [];
  const added: string[] = [];
  const tolerant = clientsTolerant(policy);
  const push = (where: string, problems: Problem[], openEnums = false) => {
    for (const p of problems) {
      const line = `${where}${p.path ? ` › ${p.path}` : ''} : ${p.message}`;
      if (openEnums && p.kind === 'enum-added') tolerable.push(line);
      else if (p.tolerable && tolerant) tolerable.push(line);
      else breaking.push(p.tolerable ? `${line} (des builds sans tolérance sont encore servis)` : line);
    }
  };

  for (const [name, path] of Object.entries(old.routes)) {
    const now = next.routes[name];
    if (now === undefined) breaking.push(`route retirée : ${name} (${path})`);
    else if (now !== path) breaking.push(`chemin changé : ${name} ${path} → ${now}`);
  }
  for (const name of Object.keys(next.routes)) if (!(name in old.routes)) added.push(`route : ${name} (${next.routes[name]})`);

  for (const [key, e] of Object.entries(old.endpoints)) {
    const now = next.endpoints[key];
    if (!now) {
      breaking.push(`appel retiré du client : ${key} (${e.path}) — l'ancienne app l'appelle toujours, l'API doit le servir`);
      continue;
    }
    const before = old.responses[e.response];
    const after = next.responses[now.response];
    if (before && after) push(`réponse de ${key}`, compareSchemas(before, after, 'response'));
  }
  for (const key of Object.keys(next.endpoints)) if (!(key in old.endpoints)) added.push(`appel : ${key}`);

  for (const [name, before] of Object.entries(old.requests)) {
    const after = next.requests[name];
    if (!after) breaking.push(`schéma de requête retiré : ${name} (renommé ? la route doit accepter la même forme)`);
    else push(`requête ${name}`, compareSchemas(before, after, 'request'));
  }
  for (const name of Object.keys(next.requests)) if (!(name in old.requests)) added.push(`requête : ${name}`);

  for (const [name, before] of Object.entries(old.messages)) {
    const after = next.messages[name];
    if (!after) breaking.push(`message retiré : ${name}`);
    else push(`message ${name}`, compareSchemas(before, after, 'response'), OPEN_ENUM_MESSAGES.has(name));
  }
  return { breaking, tolerable, added };
}
