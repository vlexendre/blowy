/**
 * Migrations non destructives (docs/VERSIONING.md) : la production a de vraies données, et pendant un déploiement
 * l'ancienne API tourne déjà sur le nouveau schéma (les migrations passent avant le code). Une migration ne fait donc
 * qu'ajouter (« expand ») ; ce qui retire ou réécrit (« contract ») vient plus tard, quand plus aucun code déployé ni
 * aucun build servi n'en dépend, et se signale par une échappatoire visible juste au-dessus de l'instruction :
 *
 *   -- destructive-ok: colonne remplacée par display_name depuis la sortie 12 (contract, build ≥ 40)
 *   alter table profiles drop column pseudo;
 *
 * Refusé sans échappatoire : drop table / column / view / function / type… (pas les politiques RLS), rename, changement de type, set not null
 * sans contrainte `check (col is not null)` préalable, colonne `not null` sans `default` sur une table existante,
 * drop default, drop constraint (sauf remplacée dans le même fichier), contrainte validée d'emblée sur une table
 * existante (`not valid` puis `validate`), drop index non concurrent, index bloquant sur une table existante,
 * truncate, delete ou update sans where.
 */

export interface Finding {
  rule: string;
  message: string;
  line: number;
  statement: string;
  /** Raison donnée par `-- destructive-ok: …` (alors accepté). */
  escape?: string;
}

export interface MigrationContext {
  /** Tables créées par les nouvelles migrations (jusqu'au fichier analysé compris) : libres de tout changer. */
  newTables: Set<string>;
  /** Index créés par les nouvelles migrations. */
  newIndexes: Set<string>;
  /** Colonnes qui ont une contrainte `check (col is not null)` (préalable à `set not null`). */
  notNullChecks: Set<string>;
}

interface Statement {
  /** Texte sans commentaires ni contenu des chaînes, en minuscules, espaces réduits, sans `public.` ni guillemets. */
  text: string;
  comments: string[];
  line: number;
  /** Corps `$$ … $$` d'un bloc `do`, exécuté par la migration (analysé aussi). */
  doBodies: string[];
}

const ESCAPE = /destructive-ok\s*:\s*(.*)$/i;
const MIN_REASON = 10;

/** Découpe un fichier SQL en instructions, en mettant de côté commentaires, chaînes et corps de fonctions. */
export function splitStatements(sql: string): Statement[] {
  const out: Statement[] = [];
  let text = '';
  let comments: string[] = [];
  let doBodies: string[] = [];
  let line = 1;
  let startLine = 0;
  const flush = () => {
    const t = normalize(text);
    // Des commentaires sans instruction derrière (fin de fichier) sont ignorés.
    if (t) out.push({ text: t, comments, line: startLine || line, doBodies });
    text = '';
    comments = [];
    doBodies = [];
    startLine = 0;
  };
  let i = 0;
  const mark = () => {
    if (!startLine) startLine = line;
  };
  while (i < sql.length) {
    const c = sql[i] as string;
    const next = sql[i + 1];
    if (c === '\n') line++;
    if (c === '-' && next === '-') {
      const end = sql.indexOf('\n', i);
      const stop = end === -1 ? sql.length : end;
      comments.push(sql.slice(i + 2, stop).trim());
      i = stop;
      continue;
    }
    if (c === '/' && next === '*') {
      const end = sql.indexOf('*/', i + 2);
      const stop = end === -1 ? sql.length : end + 2;
      const body = sql.slice(i + 2, end === -1 ? sql.length : end);
      comments.push(body.trim());
      line += (body.match(/\n/g) ?? []).length;
      i = stop;
      continue;
    }
    if (c === "'") {
      mark();
      let j = i + 1;
      while (j < sql.length) {
        if (sql[j] === "'" && sql[j + 1] === "'") j += 2;
        else if (sql[j] === "'") break;
        else {
          if (sql[j] === '\n') line++;
          j++;
        }
      }
      text += " '' ";
      i = j + 1;
      continue;
    }
    if (c === '$') {
      const tag = /^\$[A-Za-z_]*\$/.exec(sql.slice(i));
      if (tag) {
        mark();
        const end = sql.indexOf(tag[0], i + tag[0].length);
        const stop = end === -1 ? sql.length : end;
        const body = sql.slice(i + tag[0].length, stop);
        line += (body.match(/\n/g) ?? []).length;
        if (/^\s*do\s*$/i.test(text)) doBodies.push(body);
        text += ' $body$ ';
        i = stop + tag[0].length;
        continue;
      }
    }
    if (c === ';') {
      flush();
      i++;
      continue;
    }
    if (!/\s/.test(c)) mark();
    text += c;
    i++;
  }
  flush();
  return out;
}

function normalize(sql: string): string {
  return sql
    // Identifiant entre guillemets (« "soi : lire son profil" ») : un seul mot, pour le retrouver d'une instruction à l'autre.
    .replace(/"([^"]*)"/g, (_, id: string) => id.trim().replace(/\s+/g, '_'))
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\bpublic\./g, '');
}

/** Ce que les migrations disent d'elles-mêmes, pour le contexte. */
export function collectContext(sql: string, ctx: MigrationContext, isNew: boolean): void {
  for (const s of splitStatements(sql)) {
    for (const m of s.text.matchAll(/check \( ?(\w+) is not null ?\)/g)) if (m[1]) ctx.notNullChecks.add(m[1]);
    if (!isNew) continue;
    const t = /^create (?:unlogged )?table (?:if not exists )?([\w.]+)/.exec(s.text);
    if (t?.[1]) ctx.newTables.add(t[1]);
    const ix = /^create (?:unique )?index (?:concurrently )?(?:if not exists )?(\w+)/.exec(s.text);
    if (ix?.[1]) ctx.newIndexes.add(ix[1]);
  }
}

export function analyzeMigration(sql: string, ctx: MigrationContext): Finding[] {
  const statements = splitStatements(sql);
  const all = statements.map((s) => s.text).join(';\n');
  const findings: Finding[] = [];
  for (const s of statements) {
    const escape = s.comments.map((c) => ESCAPE.exec(c)?.[1]?.trim()).find((r) => r !== undefined);
    const raw = [...check(s.text, ctx, all), ...s.doBodies.flatMap((b) => splitStatements(b).flatMap((inner) => check(inner.text.replace(/^(?:(?:begin|then|else|loop)\s+)+/, ''), ctx, all)))];
    for (const f of raw) {
      const finding: Finding = { ...f, line: s.line, statement: s.text.slice(0, 160) };
      if (escape !== undefined) {
        if (escape.replace(/\s/g, '').length < MIN_REASON) {
          findings.push({ ...finding, message: `${f.message} — l'échappatoire « destructive-ok » doit donner une raison (${MIN_REASON} caractères au moins)` });
        } else findings.push({ ...finding, escape });
      } else findings.push(finding);
    }
  }
  return findings;
}

type Raw = { rule: string; message: string };

function check(text: string, ctx: MigrationContext, file: string): Raw[] {
  const out: Raw[] = [];
  const add = (rule: string, message: string) => out.push({ rule, message });

  if (/^truncate\b/.test(text)) add('truncate', 'truncate efface toutes les lignes');
  if (/^delete\b/.test(text) && !/\bwhere\b/.test(text)) add('delete-all', 'delete sans where efface toutes les lignes');
  if (/^update\b/.test(text) && !/\bwhere\b/.test(text)) add('update-all', 'update sans where réécrit toutes les lignes');

  const drop = /^drop (table|view|materialized view|function|procedure|type|trigger|schema|sequence|policy|extension|domain) (?:if exists )?([\w.]+)/.exec(text);
  if (drop) {
    const [, kind, name] = drop as unknown as [string, string, string];
    const recreated = new RegExp(`\\bcreate (?:or replace )?${kind} (?:if not exists )?${escapeRe(name)}\\b`).test(file);
    if (kind === 'table') add('drop-table', `drop table ${name} : données perdues, l'API encore déployée la lit peut-être`);
    // Politiques RLS : l'API passe par la clé de service, en retirer une ne casse aucun code déployé (règle 1).
    else if (kind !== 'policy' && !recreated) add('drop-object', `drop ${kind} ${name} : l'API encore déployée s'en sert peut-être`);
  }
  const dropIndex = /^drop index (concurrently )?(?:if exists )?([\w.]+)/.exec(text);
  if (dropIndex && !dropIndex[1] && !ctx.newIndexes.has(dropIndex[2] ?? '')) add('drop-index', `drop index ${dropIndex[2]} sans concurrently : verrouille la table`);

  const createIndex = /^create (?:unique )?index (concurrently )?(if not exists )?(?:\w+ )?on (?:only )?([\w.]+)/.exec(text);
  if (createIndex && !createIndex[1] && !createIndex[2] && !ctx.newTables.has(createIndex[3] ?? '')) {
    add('create-index', `index sur ${createIndex[3]}, table existante : le créer d'abord en concurrently, puis « create index if not exists » dans la migration`);
  }

  if (/^alter (type|view|materialized view|function|sequence|index|schema) .*\brename\b/.test(text)) add('rename', 'renommage : le code déployé utilise encore l’ancien nom');

  const alter = /^alter table (?:if exists )?(?:only )?([\w.]+) (.*)$/.exec(text);
  if (alter) {
    const [, table, rest] = alter as unknown as [string, string, string];
    const isNew = ctx.newTables.has(table);
    for (const action of splitTopLevel(rest)) checkAction(table, isNew, action.trim(), ctx, file, add);
  }
  return out;
}

function checkAction(table: string, isNew: boolean, a: string, ctx: MigrationContext, file: string, add: (rule: string, message: string) => void): void {
  if (/^rename to\b/.test(a)) return add('rename', `table ${table} renommée : le code déployé utilise encore l’ancien nom`);
  if (/^rename (column |constraint )?\w+ to\b/.test(a)) {
    if (/^rename constraint\b/.test(a)) return;
    return add('rename', `colonne de ${table} renommée : ajouter la nouvelle, copier, puis retirer l'ancienne plus tard`);
  }
  if (isNew) return;
  const dropCol = /^drop (?!constraint\b|default\b|not null\b|identity\b|expression\b)(?:column )?(?:if exists )?(\w+)/.exec(a);
  if (dropCol) return add('drop-column', `drop column ${table}.${dropCol[1]} : données perdues, le code déployé la lit peut-être`);
  const col = /^alter (?:column )?(\w+) (.*)$/.exec(a);
  if (col) {
    const [, name, what] = col as unknown as [string, string, string];
    if (/^(set data )?type\b/.test(what)) add('alter-type', `type de ${table}.${name} changé : réécrit la table et casse le code qui lit l'ancien type`);
    if (/^set not null\b/.test(what) && !ctx.notNullChecks.has(name)) {
      add('set-not-null', `set not null sur ${table}.${name} sans contrainte « check (${name} is not null) not valid » validée avant`);
    }
    if (/^drop default\b/.test(what)) add('drop-default', `drop default sur ${table}.${name} : l'API déployée insère peut-être sans cette colonne`);
    return;
  }
  const addCol = /^add (?:column )?(?:if not exists )?(\w+) (.*)$/.exec(a);
  if (addCol && !/^add (constraint|primary key|unique|check|foreign key)\b/.test(a)) {
    const def = addCol[2] ?? '';
    if (/\bnot null\b/.test(def) && !/\bdefault\b/.test(def) && !/\bgenerated\b/.test(def)) {
      add('not-null-without-default', `colonne ${table}.${addCol[1]} not null sans default : échoue sur une table peuplée, et l'API déployée n'écrit pas cette colonne`);
    }
    return;
  }
  const addConstraint = /^add constraint (\w+) (check|foreign key)\b/.exec(a);
  if (addConstraint && !/\bnot valid\b/.test(a)) {
    add('constraint-validated', `contrainte ${addConstraint[1]} validée d'emblée sur ${table} : « not valid » puis « validate constraint » à part`);
  }
  const dropConstraint = /^drop constraint (?:if exists )?(\w+)/.exec(a);
  if (dropConstraint) {
    const name = dropConstraint[1] as string;
    // Remplacer une contrainte (nouvelle liste de valeurs permises) : drop puis add du même nom, dans le même fichier.
    if (!new RegExp(`\\badd constraint ${escapeRe(name)}\\b`).test(file)) add('drop-constraint', `drop constraint ${name} sur ${table} sans la remplacer`);
  }
}

function splitTopLevel(s: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = '';
  for (const c of s) {
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (c === ',' && depth === 0) {
      parts.push(cur);
      cur = '';
    } else cur += c;
  }
  parts.push(cur);
  return parts;
}

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
