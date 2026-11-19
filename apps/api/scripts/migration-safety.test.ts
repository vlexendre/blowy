import { describe, expect, it } from 'vitest';
import { type MigrationContext, analyzeMigration, collectContext } from './migration-safety';

const ctx = (): MigrationContext => ({ newTables: new Set(), newIndexes: new Set(), notNullChecks: new Set() });
const rules = (sql: string, c = ctx()) => {
  collectContext(sql, c, true);
  return analyzeMigration(sql, c).map((f) => (f.escape !== undefined ? `${f.rule} (accepté)` : f.rule));
};

describe('migrations non destructives', () => {
  it('ajouter : table, colonne facultative ou avec défaut, index sûr, contrainte « not valid »', () => {
    expect(
      rules(`
        create table public.badges (id uuid primary key, name text not null);
        create index badges_name_idx on public.badges (name);
        alter table public.profiles add column nickname text, add column score int not null default 0;
        create index if not exists profiles_nickname_idx on public.profiles (nickname);
        alter table public.profiles add constraint profiles_score_pos check (score >= 0) not valid;
        alter table public.profiles validate constraint profiles_score_pos;
        update public.profiles set score = 1 where score is null;
        delete from public.badges where name = 'x';
      `),
    ).toEqual([]);
  });

  it('refuse ce qui détruit ou casse le code déployé', () => {
    expect(rules('drop table public.words;')).toEqual(['drop-table']);
    expect(rules('drop table if exists words;')).toEqual(['drop-table']);
    expect(rules('alter table profiles drop column city;')).toEqual(['drop-column']);
    expect(rules('alter table profiles drop city;')).toEqual(['drop-column']);
    expect(rules('alter table profiles rename column pseudo to display_name;')).toEqual(['rename']);
    expect(rules('alter table profiles rename to people;')).toEqual(['rename']);
    expect(rules('alter table profiles alter column score type bigint;')).toEqual(['alter-type']);
    expect(rules('alter table profiles alter column score drop default;')).toEqual(['drop-default']);
    expect(rules('truncate public.messages;')).toEqual(['truncate']);
    expect(rules('delete from public.messages;')).toEqual(['delete-all']);
    expect(rules('update public.pets set outfit = \'{}\';')).toEqual(['update-all']);
    expect(rules('drop function public.admin_metrics(date);')).toEqual(['drop-object']);
    expect(rules('alter function admin_metrics(date) rename to admin_metrics_old;')).toEqual(['rename']);
  });

  it('colonne not null : refusée sans défaut sur une table existante, permise sur une table nouvelle', () => {
    expect(rules('alter table profiles add column level int not null;')).toEqual(['not-null-without-default']);
    expect(rules('create table t (id int); alter table t add column level int not null;')).toEqual([]);
  });

  it('set not null : seulement après une contrainte « check (col is not null) »', () => {
    expect(rules('alter table encounters alter column status_at set not null;')).toEqual(['set-not-null']);
    const c = ctx();
    collectContext('alter table encounters add constraint enc_status_nn check (status_at is not null) not valid;', c, false);
    expect(rules('alter table encounters alter column status_at set not null;', c)).toEqual([]);
  });

  it('contraintes : validée d’emblée ou retirée sans remplaçante, refusée ; remplacée dans le même fichier, permise', () => {
    expect(rules('alter table profiles add constraint p_chk check (score > 0);')).toEqual(['constraint-validated']);
    expect(rules('alter table profiles drop constraint p_chk;')).toEqual(['drop-constraint']);
    expect(
      rules(`
        alter table pet_items drop constraint pet_items_source_check;
        alter table pet_items add constraint pet_items_source_check check (source in ('a', 'b', 'c')) not valid;
        alter table pet_items validate constraint pet_items_source_check;
      `),
    ).toEqual([]);
  });

  it('index : bloquant sur une table existante, refusé ; drop index non concurrent, refusé', () => {
    expect(rules('create index p_idx on profiles (score);')).toEqual(['create-index']);
    expect(rules('drop index public.p_idx;')).toEqual(['drop-index']);
    expect(rules('drop index concurrently p_idx;')).toEqual([]);
  });

  it('ce qui est dans le corps d’une fonction n’est pas exécuté par la migration ; un bloc do, si', () => {
    expect(rules(`create or replace function purge() returns void language sql as $$ delete from public.tmp; $$;`)).toEqual([]);
    expect(rules(`do $$ begin truncate public.tmp; end $$;`)).toEqual(['truncate']);
  });

  it('les chaînes et les commentaires ne déclenchent rien', () => {
    expect(rules(`-- drop table words;\ninsert into notes (body) values ('drop table words; truncate x');`)).toEqual([]);
  });

  it('échappatoire visible : « destructive-ok » avec une raison, juste au-dessus', () => {
    const sql = `
      -- destructive-ok: pseudo remplacé par display_name depuis la sortie 12 (contract, build ≥ 40)
      alter table profiles drop column pseudo;
      alter table profiles drop column city;
    `;
    expect(rules(sql)).toEqual(['drop-column (accepté)', 'drop-column']);
    const f = analyzeMigration(sql, ctx());
    expect(f[0]).toMatchObject({ escape: 'pseudo remplacé par display_name depuis la sortie 12 (contract, build ≥ 40)', line: 3 });
    expect(rules('-- destructive-ok: ok\nalter table profiles drop column city;')).toEqual(['drop-column']);
  });

  it('identifiants entre guillemets et préfixe public', () => {
    expect(rules('alter table "public"."profiles" drop column "city";')).toEqual(['drop-column']);
  });
});
