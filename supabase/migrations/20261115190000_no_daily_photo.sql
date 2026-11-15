-- V7 §24 — Plus de photo du jour : la série d'un lien vit avec la conversation (décision du 15 nov. 2026).
-- La série d'un lien compte les jours d'affilée où les deux se sont écrit (jour de Paris) ; l'API ne crée plus aucune
-- photo du jour. Comme pour le reste du schéma : l'API (clé service) est la seule à écrire.
--
-- Ordre de mise en production (docs/DEPLOIEMENT-V7.md, « Plus de photo du jour ») : CETTE MIGRATION D'ABORD, puis le
-- code. Tout ici est compatible avec l'API d'avant qui tourne encore : colonnes nouvelles à valeur par défaut, aucune
-- colonne retirée, `photo` et `daily_photo` encore acceptés, `admin_daily_metrics` garde son nom et sa signature. Le
-- nouveau code, lui, ne démarre pas sans ces colonnes. Juste après le déploiement du code : la reprise du jour
-- (même document) recompte les messages écrits entre les deux.
--
-- Sûre sur une base déjà peuplée, avec l'API d'avant qui écrit en même temps :
-- - ce fichier ne change que la structure (quelques millisecondes de verrou exclusif sur `live_activity_tokens` puis
--   `links`, dans cet ordre, celui des clés étrangères) ; les reprises de données et la validation des contraintes sont
--   dans `20261115190100_no_daily_photo_backfill.sql`, une transaction à part qui ne prend que des verrous de ligne.
--   Tout dans un seul fichier gardait `links` verrouillé en exclusif pendant toute la reprise (≈ 5 s pour 30 000
--   liens : toute lecture ou écriture d'un lien attendait) et s'interbloquait avec l'API qui écrit un jeton d'activité
--   (clé étrangère vers `links`) : constaté en répétition ;
-- - `lock_timeout` : si un verrou n'arrive pas en 5 s, la migration échoue proprement (rien n'est appliqué) ; la relancer ;
-- - colonnes ajoutées avec une valeur par défaut constante (instantané, sans réécriture de la table) ;
-- - contraintes CHECK posées NOT VALID ici, validées dans la reprise (verrou SHARE UPDATE EXCLUSIVE : lectures et
--   écritures passent) ;
-- - index `if not exists` (à créer avant, sans bloquer : docs/DEPLOIEMENT-V7.md, étape 3) ;
--
-- Ce qui est GARDÉ, volontairement (rien du contenu des personnes n'est effacé en silence) :
-- - la table `daily_photos` et ses fichiers (compartiment `media`, chemins `links/<lien>/<personne>/…`) : plus jamais
--   alimentés, ils restent visibles en lecture dans les souvenirs du lien (la tienne ; celle de l'autre si vous aviez
--   posté tous les deux, comme avant) et dans l'historique du chat ; ils partent avec le lien ou le compte (`DeleteMe`,
--   cascade) comme avant ;
-- - la colonne `links.last_duo_photo_on` : plus écrite, recopiée dans `last_duo_day_on` ; à supprimer plus tard, une
--   fois l'ancienne API éteinte ;
-- - les événements `pet_events.kind = 'photo_sent'` (historique du caractère).

set local lock_timeout = '5s';

-- ── Activités en direct : « Léa a posté, à toi » devient la série d'un lien (`link`) ────────────────────────────
-- `photo` reste permis tant que l'API d'avant tourne (elle range encore ces jetons) ; ces jetons finissent seuls à
-- minuit (minuteur). À retirer de la contrainte plus tard, avec `last_duo_photo_on`.
alter table public.live_activity_tokens drop constraint if exists live_activity_tokens_activity_check;
alter table public.live_activity_tokens
  add constraint live_activity_tokens_activity_check check (activity in ('challenge', 'photo', 'link', 'outing')) not valid;
alter table public.live_activity_tokens validate constraint live_activity_tokens_activity_check;

-- ── Liens : série de la conversation ─────────────────────────────────────────────────────────────────────────────
alter table public.links add column best_streak integer not null default 0;
alter table public.links add column duo_days integer not null default 0;
alter table public.links add column last_duo_day_on date;
-- Qui a écrit, jour par jour, sur les 14 derniers jours : [{ "day": "AAAA-MM-JJ", "a": bool, "b": bool }] (a = user_a).
alter table public.links add column recent_days jsonb not null default '[]'::jsonb;
-- Étapes du lien : [{ "kind": "level" | "streak", "value": n, "on": "AAAA-MM-JJ" | null }].
alter table public.links add column milestones jsonb not null default '[]'::jsonb;
-- Dernier jour où le lien est passé au rappel « à toi d'écrire » (idempotence du minuteur).
alter table public.links add column write_reminder_on date;

alter table public.links add constraint links_best_streak_check check (best_streak >= 0) not valid;
alter table public.links add constraint links_duo_days_check check (duo_days >= 0) not valid;
alter table public.links add constraint links_recent_days_check check (jsonb_typeof(recent_days) = 'array') not valid;
alter table public.links add constraint links_milestones_check check (jsonb_typeof(milestones) = 'array') not valid;

-- Rappel du soir : liens actifs où quelqu'un a écrit aujourd'hui, parcourus par identifiant.
create index if not exists links_write_reminder_idx on public.links (last_active_on, id) where status = 'active';

-- ── Anciennes photos du jour : gardées, en lecture seule ────────────────────────────────────────────────────────
comment on table public.daily_photos is
  'Anciennes photos du jour (V6). Plus alimentée depuis 20261115190000 (spéc V7 §24) ; lue pour les souvenirs des liens, effacée avec le lien ou le compte.';
comment on column public.links.last_duo_photo_on is 'V6, plus écrite depuis 20261115190000 (voir last_duo_day_on). À supprimer plus tard.';

-- ── Notifications : `daily_photo` disparaît, `your_turn` (« à toi d'écrire ») le remplace ─────────────────────────
-- Qui avait coupé la photo du jour de l'autre ne reçoit pas non plus son remplaçant (même place dans les réglages).
-- `daily_photo` reste dans la liste tant que l'API d'avant tourne (la nouvelle ignore les types qu'elle ne connaît pas).
update public.notification_settings
set disabled_kinds = array_append(disabled_kinds, 'your_turn')
where 'daily_photo' = any (disabled_kinds) and not ('your_turn' = any (disabled_kinds));
-- Le journal des envois (`notification_log`) garde ses lignes `daily_photo` : purgées sous 3 jours par le minuteur.

-- ── Administration : liens où les deux ont écrit, par jour ───────────────────────────────────────────────────────
-- La fonction existante devient le socle ; la nouvelle ajoute `linksWroteTogether` (d'après `recent_days`, exact pour
-- les 14 derniers jours : la tâche quotidienne calcule la veille).
alter function public.admin_daily_metrics(date) rename to admin_daily_metrics_base;
revoke all on function public.admin_daily_metrics_base(date) from public, anon, authenticated;
grant execute on function public.admin_daily_metrics_base(date) to service_role;

create or replace function public.admin_daily_metrics(p_day date)
returns jsonb
language sql
stable
set search_path = public
as $$
  select public.admin_daily_metrics_base(p_day) || jsonb_build_object(
    'linksWroteTogether', (
      select count(*) from public.links l
      where l.status = 'active'
        and exists (
          select 1 from jsonb_array_elements(l.recent_days) as d
          where d ->> 'day' = to_char(p_day, 'YYYY-MM-DD') and (d ->> 'a')::boolean and (d ->> 'b')::boolean
        )
    )
  );
$$;

revoke all on function public.admin_daily_metrics(date) from public, anon, authenticated;
grant execute on function public.admin_daily_metrics(date) to service_role;
