-- V7 §24 — Reprise des données de la série des liens, après `20261115190000_no_daily_photo.sql` (structure).
-- Une transaction à part : seulement des verrous de ligne sur `links` (une écriture de lien attend la fin de la
-- reprise, ≈ 5 s pour 30 000 liens et 600 000 messages en répétition locale), et la validation des contraintes
-- (SHARE UPDATE EXCLUSIVE : lectures et écritures passent). Bornée : `messages` n'est lue que sur 14 jours ;
-- `daily_photos` et `links` sont petites. Rejouable : chaque reprise recalcule depuis les données sources.

set local lock_timeout = '5s';

alter table public.links validate constraint links_best_streak_check;
alter table public.links validate constraint links_duo_days_check;
alter table public.links validate constraint links_recent_days_check;
alter table public.links validate constraint links_milestones_check;

-- Reprise 1 : les séries en cours continuent. Le dernier jour « à deux » est celui de la dernière photo à deux ; si
-- les deux s'écrivent le jour de la mise en production (ou le lendemain d'une photo à deux), la série avance.
update public.links set last_duo_day_on = last_duo_photo_on where last_duo_photo_on is not null and last_duo_day_on is null;

-- Reprise 2 : record et nombre de jours « à deux », d'après les photos du jour faites à deux (îlots de jours consécutifs).
with duo as (
  select link_id, day from public.daily_photos group by link_id, day having count(distinct user_id) = 2
),
islands as (
  select link_id, count(*) as len
  from (select link_id, day, day - (row_number() over (partition by link_id order by day))::int as grp from duo) r
  group by link_id, grp
),
agg as (select link_id, max(len)::int as best, sum(len)::int as total from islands group by link_id)
update public.links l set best_streak = greatest(l.streak, agg.best), duo_days = agg.total from agg where agg.link_id = l.id;
update public.links set best_streak = streak where best_streak < streak;

-- Reprise 3 : les 14 derniers jours (semaine affichée, « à toi d'écrire » du jour), d'après les messages des personnes
-- et les photos du jour (un jour de photo à deux comptait déjà pour la série).
with since as (select ((now() at time zone 'Europe/Paris')::date - 13) as d),
writes as (
  select m.link_id, (m.created_at at time zone 'Europe/Paris')::date as day, m.author_id as user_id
  from public.messages m, since s
  where m.author_kind = 'user' and m.kind = 'text' and m.created_at >= (s.d::timestamp at time zone 'Europe/Paris')
  union
  select p.link_id, p.day, p.user_id from public.daily_photos p, since s where p.day >= s.d
),
per_day as (
  select w.link_id, w.day, bool_or(w.user_id = l.user_a) as a, bool_or(w.user_id = l.user_b) as b
  from writes w join public.links l on l.id = w.link_id
  group by w.link_id, w.day
),
agg as (
  select link_id, jsonb_agg(jsonb_build_object('day', to_char(day, 'YYYY-MM-DD'), 'a', a, 'b', b) order by day) as days
  from per_day group by link_id
)
update public.links l set recent_days = agg.days from agg where agg.link_id = l.id;

-- Reprise 4 : étapes déjà franchies (niveaux 2 et plus, paliers de série du record), sans date connue.
update public.links l set milestones = (
  select coalesce(jsonb_agg(x.m order by x.ord), '[]'::jsonb)
  from (
    select jsonb_build_object('kind', 'level', 'value', v, 'on', null) as m, v as ord from generate_series(2, l.level) as v
    union all
    select jsonb_build_object('kind', 'streak', 'value', s, 'on', null), 100 + s from unnest(array[3, 7, 14, 30, 60, 100]) as s where s <= l.best_streak
  ) x
)
where l.level >= 2 or l.best_streak >= 3;
