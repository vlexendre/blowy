#!/usr/bin/env node
/**
 * Vérification du schéma (à relancer après chaque migration) :
 * 1. applique toutes les migrations (`supabase/migrations/*.sql`, dans l'ordre, une transaction par fichier, comme
 *    `supabase db push`) sur une base JETABLE d'un PostgreSQL LOCAL, après un socle qui imite Supabase (rôles anon,
 *    authenticated, service_role, schéma auth, auth.uid(), publication supabase_realtime, privilèges par défaut) ;
 * 2. compare chaque table et chaque colonne avec `src/persistence/database.types.ts` (présence, type, null,
 *    colonnes facultatives à l'insertion) et les fonctions appelées par l'API ;
 * 3. vérifie la RLS : activée sur chaque table, seules politiques permises (lecture des liens et des messages par
 *    leurs membres, des messages d'un groupe par ses membres, règle 1 de docs/ARCHITECTURE.md), temps réel limité à
 *    `messages`, `links` et `group_messages`, aucune fonction
 *    exécutable par anon / authenticated, et un essai réel de la politique des messages (garde-fou privé).
 *
 * Usage (depuis apps/api) : PGHOST=/chemin/socket PGPORT=5432 PGUSER=postgres node scripts/check-schema.mjs
 * Variables : PGHOST, PGPORT, PGUSER (psql), SCHEMA_CHECK_DB (défaut blowy_schema_check, recréée à chaque fois).
 * Refuse un hôte distant : ne jamais viser une vraie base. Demande `psql` dans le PATH.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const here = dirname(fileURLToPath(import.meta.url));
const root = process.env.SCHEMA_CHECK_ROOT ? resolve(process.env.SCHEMA_CHECK_ROOT) : resolve(here, '../../..');
const migrationsDir = join(root, 'supabase/migrations');
const typesFile = join(root, 'apps/api/src/persistence/database.types.ts');
const db = process.env.SCHEMA_CHECK_DB ?? 'blowy_schema_check';
const host = process.env.PGHOST ?? '';

if (!/check|scratch|test/i.test(db)) fail(`SCHEMA_CHECK_DB doit contenir « check », « scratch » ou « test » (base recréée) : ${db}`);
if (host && !host.startsWith('/') && !['localhost', '127.0.0.1', '::1'].includes(host)) fail(`hôte distant refusé (${host}) : ce script recrée une base, seulement en local`);

const errors = [];
const notes = [];
const psql = (args, input) =>
  execFileSync('psql', ['-X', '-q', '-v', 'ON_ERROR_STOP=1', ...args], { input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
const query = (sql) =>
  psql(['-d', db, '-At', '-F', '\t', '-c', sql])
    .split('\n')
    .filter((l) => l.length > 0)
    .map((l) => l.split('\t'));

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(2);
}

// ── 1. Base jetable, socle Supabase, migrations ─────────────────────────────
const STUB = `
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated;
set client_min_messages = error;
create publication supabase_realtime;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create schema extensions;
create extension if not exists pgcrypto with schema extensions;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`;
try {
  psql(['-d', 'postgres', '-c', `drop database if exists ${db}`, '-c', `create database ${db}`]);
  psql(['-d', db], STUB);
} catch (err) {
  fail(`base jetable impossible à créer : ${err.stderr || err.message}`);
}
const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
for (const f of files) {
  try {
    psql(['-d', db, '--single-transaction', '-f', join(migrationsDir, f)]);
  } catch (err) {
    fail(`migration ${f} : ${(err.stderr || err.message).trim()}`);
  }
}
notes.push(`${files.length} migrations appliquées dans l'ordre`);

// ── 2. Schéma réel ──────────────────────────────────────────────────────────
const columns = new Map(); // table → Map(col → { udt, nullable, hasDefault })
for (const [table, col, udt, nullable, def, identity] of query(`
  select c.table_name, c.column_name, c.udt_name, c.is_nullable, coalesce(c.column_default, ''), c.is_identity
  from information_schema.columns c join information_schema.tables t using (table_schema, table_name)
  where c.table_schema = 'public' and t.table_type = 'BASE TABLE' order by 1, c.ordinal_position`)) {
  if (!columns.has(table)) columns.set(table, new Map());
  columns.get(table).set(col, { udt, nullable: nullable === 'YES', hasDefault: def !== '' || identity === 'YES' });
}

// ── 3. Types TypeScript ─────────────────────────────────────────────────────
const source = ts.createSourceFile(typesFile, readFileSync(typesFile, 'utf8'), ts.ScriptTarget.Latest, true);
const typeTables = new Map(); // table → { row: Map(col → typeText), optional: Set }
const typeFunctions = new Map(); // fn → [args]
function findMember(node, name) {
  if (!node || !ts.isTypeLiteralNode(node)) return undefined;
  return node.members.find((m) => ts.isPropertySignature(m) && m.name.getText(source) === name);
}
ts.forEachChild(source, (node) => {
  if (!ts.isTypeAliasDeclaration(node) || node.name.text !== 'Database') return;
  const pub = findMember(node.type, 'public');
  const tables = findMember(pub?.type, 'Tables');
  for (const m of tables.type.members) {
    const name = m.name.getText(source);
    const ref = m.type;
    if (!ts.isTypeReferenceNode(ref) || ref.typeName.getText(source) !== 'Table') {
      errors.push(`types : ${name} n'est pas déclarée avec Table<…>`);
      continue;
    }
    const [rowNode, optNode] = ref.typeArguments;
    const row = new Map();
    for (const c of rowNode.members) row.set(c.name.getText(source), c.type.getText(source).replace(/\s+/g, ' '));
    const optional = new Set();
    const walk = (t) => {
      if (!t) return;
      if (ts.isUnionTypeNode(t)) t.types.forEach(walk);
      else if (ts.isLiteralTypeNode(t) && ts.isStringLiteral(t.literal)) optional.add(t.literal.text);
    };
    walk(optNode);
    typeTables.set(name, { row, optional });
  }
  const fns = findMember(pub?.type, 'Functions');
  for (const f of fns.type.members) {
    const args = findMember(f.type, 'Args');
    typeFunctions.set(f.name.getText(source), args ? args.type.members.map((a) => a.name.getText(source)) : []);
  }
});

const tsBase = (udt) => {
  if (udt.startsWith('_')) return `${tsBase(udt.slice(1))}[]`;
  if (['uuid', 'text', 'varchar', 'date', 'timestamptz', 'timestamp', 'bpchar'].includes(udt)) return 'string';
  if (['int2', 'int4', 'int8', 'float4', 'float8', 'numeric'].includes(udt)) return 'number';
  if (udt === 'bool') return 'boolean';
  if (udt === 'jsonb' || udt === 'json') return 'Json';
  return `?${udt}`;
};

for (const table of columns.keys()) if (!typeTables.has(table)) errors.push(`table « ${table} » absente de database.types.ts`);
for (const table of typeTables.keys()) if (!columns.has(table)) errors.push(`database.types.ts : table « ${table} » inexistante en base`);
let compared = 0;
for (const [table, cols] of columns) {
  const t = typeTables.get(table);
  if (!t) continue;
  for (const [col, info] of cols) {
    const declared = t.row.get(col);
    if (declared === undefined) {
      errors.push(`${table}.${col} : colonne absente des types`);
      continue;
    }
    compared += 1;
    const parts = declared.split('|').map((s) => s.trim());
    const nullable = parts.includes('null');
    const base = parts.filter((p) => p !== 'null').join(' | ');
    const expected = tsBase(info.udt);
    const okBase = base === expected || (expected === 'Json' && base === 'Json') || (expected === 'string' && /^'.*'( \| '.*')*$/.test(base));
    if (!okBase) errors.push(`${table}.${col} : type ${info.udt} en base, « ${declared} » dans les types (attendu ${expected})`);
    if (nullable !== info.nullable) errors.push(`${table}.${col} : ${info.nullable ? 'nullable' : 'non nulle'} en base, « ${declared} » dans les types`);
    const optional = t.optional.has(col);
    if (optional && !info.hasDefault && !info.nullable) errors.push(`${table}.${col} : facultative à l'insertion dans les types, mais obligatoire en base (ni défaut ni null)`);
    if (!optional && (info.hasDefault || info.nullable)) notes.push(`${table}.${col} : a un défaut ou accepte null, mais reste obligatoire à l'insertion dans les types (sans risque)`);
  }
  for (const col of t.row.keys()) if (!cols.has(col)) errors.push(`${table}.${col} : dans les types, absente en base`);
  for (const col of t.optional) if (!cols.has(col)) errors.push(`${table} : « ${col} » listée facultative mais absente en base`);
}

const dbFunctions = new Map(
  query(`select p.proname, coalesce(array_to_string(p.proargnames, ','), '') from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'`).map(
    ([n, a]) => [n, a.split(',').filter(Boolean)],
  ),
);
for (const [fn, args] of typeFunctions) {
  const real = dbFunctions.get(fn);
  if (!real) errors.push(`fonction ${fn} : dans les types, absente en base`);
  else if ([...args].sort().join() !== [...real].sort().join()) errors.push(`fonction ${fn} : arguments ${real.join(', ')} en base, ${args.join(', ')} dans les types`);
}

// ── 4. RLS, politiques, temps réel, privilèges ──────────────────────────────
for (const [table, rls] of query(`select c.relname, c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r'`)) {
  if (rls !== 't') errors.push(`RLS désactivée sur ${table}`);
}
const ALLOWED_POLICIES = new Map([
  ['links', 'membres : lire leurs liens'],
  ['messages', 'membres : lire les messages de leurs liens'],
  // Groupes (20261117120000_groupes) : même modèle que les liens.
  ['group_members', 'membres : lire leurs adhésions'],
  ['group_messages', 'membres : lire les messages de leurs groupes'],
]);
const policies = query(`select tablename, policyname, cmd, array_to_string(roles, ',') from pg_policies where schemaname = 'public'`);
for (const [table, name, cmd, roles] of policies) {
  if (ALLOWED_POLICIES.get(table) !== name) errors.push(`politique non prévue par l'architecture : ${table} « ${name} » (${cmd})`);
  else if (cmd !== 'SELECT' || roles !== 'authenticated') errors.push(`politique ${table} « ${name} » : lecture par authenticated seulement attendue (${cmd} ${roles})`);
}
for (const [table, name] of ALLOWED_POLICIES) if (!policies.some((p) => p[0] === table && p[1] === name)) errors.push(`politique attendue absente : ${table} « ${name} »`);
const realtime = query(`select tablename from pg_publication_tables where pubname = 'supabase_realtime' order by 1`).map((r) => r[0]);
if (realtime.join(',') !== 'group_messages,links,messages') errors.push(`temps réel : ${realtime.join(', ') || 'aucune table'} (attendu : group_messages, links, messages)`);
for (const [fn, role] of query(`
  select p.proname, r.rolname from pg_proc p join pg_namespace n on n.oid = p.pronamespace, (values ('anon'), ('authenticated')) as r(rolname)
  where n.nspname = 'public' and has_function_privilege(r.rolname, p.oid, 'EXECUTE') and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')`)) {
  errors.push(`fonction ${fn} exécutable par ${role}`);
}
for (const [fn] of query(`
  select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and not has_function_privilege('service_role', p.oid, 'EXECUTE') and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')`)) {
  errors.push(`fonction ${fn} non exécutable par service_role (l'API ne pourra pas l'appeler)`);
}

// Essai réel : deux membres d'un lien, une tierce personne ; un garde-fou visible par une seule personne.
const A = '00000000-0000-4000-8000-0000000000a1';
const B = '00000000-0000-4000-8000-0000000000b2';
const C = '00000000-0000-4000-8000-0000000000c3';
psql(['-d', db], `
insert into auth.users (id) values ('${A}'), ('${B}'), ('${C}');
insert into public.profiles (id, display_name, birthdate, invite_code, words_code) values
  ('${A}', 'A', '1990-01-01', 'CODEA001', 'MOTSA001'), ('${B}', 'B', '1990-01-01', 'CODEB001', 'MOTSB001'), ('${C}', 'C', '1990-01-01', 'CODEC001', 'MOTSC001');
insert into public.links (id, user_a, user_b, last_active_on, last_tick_on) values ('11111111-1111-4111-8111-111111111111', '${A}', '${B}', current_date, current_date);
insert into public.messages (link_id, author_kind, author_id, kind, body) values ('11111111-1111-4111-8111-111111111111', 'user', '${A}', 'text', 'salut');
insert into public.messages (link_id, author_kind, author_id, kind, body, pet_role, visible_to) values ('11111111-1111-4111-8111-111111111111', 'pet', '${B}', 'text', 'pause ?', 'guard', '${B}');
insert into public.profile_places (user_id, last_lat, last_lng, located_at, home_lat, home_lng, home_cell) values ('${A}', 48.8, 2.3, now(), 48.8, 2.3, '488:23');
insert into public.groups (id, name, kind) values ('22222222-2222-4222-8222-222222222222', 'G', 'free');
insert into public.group_members (group_id, user_id, status) values
  ('22222222-2222-4222-8222-222222222222', '${A}', 'active'), ('22222222-2222-4222-8222-222222222222', '${B}', 'left');
insert into public.group_messages (group_id, author_kind, author_id, kind, body) values ('22222222-2222-4222-8222-222222222222', 'user', '${A}', 'text', 'salut le groupe');
`);
const seen = (who, sql) => Number(psql(['-d', db, '-At', '-c', `begin; set local role authenticated; set local request.jwt.claim.sub = '${who}'; ${sql}; rollback;`]).trim().split('\n').filter(Boolean).at(-1));
const checks = [
  [A, 'select count(*) from public.messages', 1, 'A voit le message du lien mais pas le garde-fou de B'],
  [B, 'select count(*) from public.messages', 2, 'B voit le message et son garde-fou'],
  [C, 'select count(*) from public.messages', 0, 'C ne voit rien du lien'],
  [A, 'select count(*) from public.links', 1, 'A voit son lien'],
  [C, 'select count(*) from public.links', 0, 'C ne voit pas le lien'],
  [A, 'select count(*) from public.profiles', 0, 'A ne lit pas les profils en direct (API seulement)'],
  [A, 'select count(*) from public.profile_places', 0, 'A ne lit pas les positions en direct'],
  [A, 'select count(*) from public.group_messages', 1, 'A, membre, voit le message du groupe'],
  [B, 'select count(*) from public.group_messages', 0, 'B, parti du groupe, ne voit plus ses messages'],
  [C, 'select count(*) from public.group_messages', 0, 'C ne voit rien du groupe'],
  [C, 'select count(*) from public.group_members', 0, 'C ne voit pas qui est dans le groupe'],
  [A, 'select count(*) from public.group_members', 1, 'A ne voit que sa propre adhésion'],
  [A, 'select count(*) from public.groups', 0, 'A ne lit pas les groupes en direct (API seulement)'],
];
for (const [who, sql, expected, label] of checks) {
  const got = seen(who, sql);
  if (got !== expected) errors.push(`RLS en vrai : ${label} — ${got} au lieu de ${expected}`);
}

// ── Rapport ─────────────────────────────────────────────────────────────────
console.log(`Schéma : ${columns.size} tables, ${compared} colonnes comparées, ${typeFunctions.size} fonctions, ${policies.length} politiques.`);
for (const n of notes) if (!n.includes('sans risque')) console.log(`· ${n}`);
const soft = notes.filter((n) => n.includes('sans risque')).length;
if (soft > 0) console.log(`· ${soft} colonne(s) avec défaut gardée(s) obligatoire(s) à l'insertion dans les types (sans risque)`);
if (errors.length > 0) {
  for (const e of errors) console.error(`✗ ${e}`);
  console.error(`${errors.length} écart(s).`);
  process.exit(1);
}
console.log('✓ migrations, types, RLS et temps réel cohérents.');
psql(['-d', 'postgres', '-c', `drop database if exists ${db}`]);
