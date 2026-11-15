-- Audit App Store (docs/AUDIT-APPLE.md, 15 nov. 2026) — côté serveur : compte de revue d'Apple (B1), filtre des
-- contenus (B6), alertes et escalade des signalements (M9), zone choisie sans localisation (M8), position enregistrée
-- arrondie (M6).
--
-- Sûre sur une base peuplée, et à appliquer AVANT le nouveau code (l'API d'avant ignore tout ceci) :
-- - colonnes nouvelles nullables, ou NOT NULL avec une valeur par défaut constante : changement de catalogue seulement,
--   sans réécriture des tables ; l'API d'avant continue d'insérer (valeurs par défaut) ;
-- - contraintes posées NOT VALID puis validées dans la même migration (la validation ne bloque pas les écritures) ;
-- - index partiels sur des colonnes nées ici (elles ne peuvent pas exister avant) : petits ou vides, construits en
--   quelques dizaines de millisecondes sur `profiles` et `reports` (mesures dans docs/DEPLOIEMENT-V7.md §10) ;
-- - `lock_timeout` : si un verrou n'arrive pas en 5 s, la migration échoue sans rien appliquer ; la relancer.
-- Les reprises de données (arrondi des positions déjà gardées, signalements déjà vus) sont dans
-- 20261115200100_audit_backfill.sql, dans une transaction à part (verrous de ligne seulement).

set local lock_timeout = '5s';

-- ── Compte de revue d'Apple : monde d'exemple ─────────────────────────────────
-- `review_world` = identifiant du compte de revue, sur ce compte et sur chacune de ses personnes fictives ; null pour
-- tout le monde. L'API ne montre une personne qu'à quelqu'un du même monde (`Audience`). Supprimer le compte de revue
-- emporte ses personnes fictives (cascade).
alter table public.profiles add column if not exists review_world uuid;
alter table public.profiles drop constraint if exists profiles_review_world_fkey;
alter table public.profiles
  add constraint profiles_review_world_fkey foreign key (review_world) references auth.users (id) on delete cascade not valid;
alter table public.profiles validate constraint profiles_review_world_fkey;
create index if not exists profiles_review_world_idx on public.profiles (review_world) where review_world is not null;
comment on column public.profiles.review_world is
  'Monde d''exemple du compte de revue d''Apple (audit B1) : visible de ce seul compte, hors statistiques, alertes et e-mails.';

-- ── Photo de profil vérifiée par le filtre ────────────────────────────────────
-- Null : pas encore vérifiée (IA indisponible à l'envoi, ou photo d'avant le filtre) ; le minuteur s'en charge.
alter table public.profiles add column if not exists avatar_checked_at timestamptz;
create index if not exists profiles_avatar_unchecked_idx on public.profiles (created_at)
  where avatar_path is not null and avatar_checked_at is null;

-- ── Zone choisie à la main, sans localisation (gratuit) ───────────────────────
alter table public.profile_places add column if not exists source text not null default 'gps';
alter table public.profile_places add column if not exists manual_label text;
alter table public.profile_places add column if not exists manual_set_on date;
alter table public.profile_places drop constraint if exists profile_places_source_check;
alter table public.profile_places add constraint profile_places_source_check check (source in ('gps', 'manual')) not valid;
alter table public.profile_places validate constraint profile_places_source_check;
comment on column public.profile_places.last_lat is
  'Dernier relevé arrondi au centre de sa maille de ~300 m (jamais le point exact ; audit M6).';
comment on column public.profile_places.source is 'gps : zone tirée de la position (arrondie) · manual : ville choisie sans localisation (audit M8).';

-- ── Signalements : source, priorité, alertes, escalade ────────────────────────
alter table public.reports add column if not exists source text not null default 'person';
alter table public.reports add column if not exists priority smallint not null default 0;
alter table public.reports add column if not exists category text;
alter table public.reports add column if not exists review boolean not null default false;
alter table public.reports add column if not exists alerted_at timestamptz;
alter table public.reports add column if not exists escalated_at timestamptz;
alter table public.reports drop constraint if exists reports_source_check;
alter table public.reports add constraint reports_source_check check (source in ('person', 'filter')) not valid;
alter table public.reports validate constraint reports_source_check;
alter table public.reports drop constraint if exists reports_priority_check;
alter table public.reports add constraint reports_priority_check check (priority between 0 and 2) not valid;
alter table public.reports validate constraint reports_priority_check;
-- File des ouverts (priorité, puis le plus ancien) ; signalements pas encore annoncés à l'équipe.
create index if not exists reports_open_priority_idx on public.reports (priority desc, created_at, id) where handled_at is null;
create index if not exists reports_unalerted_idx on public.reports (created_at) where alerted_at is null and not review;
comment on column public.reports.source is 'person : signalé par quelqu''un · filter : filtre automatique (audit B6).';
comment on column public.reports.priority is '0 normal · 1 haut · 2 urgent (mineur, menace) ; voir reportPriority du domaine.';

-- ── Statistiques : le monde de revue n'y entre pas ────────────────────────────
-- Mêmes chiffres qu'avant (20261115160000_facturation_admin, renommée en _base par 20261115190000_no_daily_photo),
-- sans le compte de revue ni ses personnes fictives, leurs liens, messages, rencontres, abonnements et signalements.
-- (Leur activité n'est jamais notée dans `user_activity_days` : la garde de compte l'ignore.)
create or replace function public.admin_daily_metrics_base(p_day date)
returns jsonb
language sql
stable
set search_path = public
as $$
  with bounds as (
    select (p_day::timestamp at time zone 'Europe/Paris') as d0,
           ((p_day + 1)::timestamp at time zone 'Europe/Paris') as d1
  ),
  rv as (
    select coalesce(array_agg(id), '{}'::uuid[]) as ids from public.profiles where review_world is not null
  ),
  rl as (
    select coalesce(array_agg(l.id), '{}'::uuid[]) as ids from public.links l, rv where l.user_a = any(rv.ids) or l.user_b = any(rv.ids)
  ),
  pet_msgs as (
    select m.id, m.link_id, m.created_at
    from public.messages m, bounds b, rl
    where m.author_kind = 'pet' and m.created_at >= b.d0 and m.created_at < b.d1 and m.link_id <> all (rl.ids)
  ),
  cohort as (
    select n, (select count(*) from public.profiles p, bounds b
               where p.review_world is null
                 and p.created_at >= (b.d0 - make_interval(days => n)) and p.created_at < (b.d1 - make_interval(days => n))) as size,
           (select count(*) from public.profiles p
              join public.user_activity_days a on a.user_id = p.id and a.day = p_day, bounds b
               where p.review_world is null
                 and p.created_at >= (b.d0 - make_interval(days => n)) and p.created_at < (b.d1 - make_interval(days => n))) as retained
    from unnest(array[1, 7, 30]) as n
  ),
  top as (
    select p.id as user_id, p.display_name as owner_name, pe.name as pet_name, pe.species,
           count(l.id) as active_links
    from public.profiles p
    join public.pets pe on pe.owner_id = p.id
    join public.links l on (l.user_a = p.id or l.user_b = p.id) and l.status = 'active'
      and greatest(0, (p_day - l.last_active_on) - 1) - greatest(0, (l.last_tick_on - l.last_active_on) - 1) < l.lives
    where p.review_world is null
    group by p.id, p.display_name, pe.name, pe.species
    order by active_links desc, p.created_at
    limit 100
  )
  select jsonb_build_object(
    'accountsTotal', (select count(*) from public.profiles p, bounds b where p.created_at < b.d1 and p.review_world is null),
    'accountsNew', (select count(*) from public.profiles p, bounds b where p.created_at >= b.d0 and p.created_at < b.d1 and p.review_world is null),
    'dau', (select count(*) from public.user_activity_days a, rv where a.day = p_day and a.user_id <> all (rv.ids)),
    'wau', (select count(distinct a.user_id) from public.user_activity_days a, rv where a.day between p_day - 6 and p_day and a.user_id <> all (rv.ids)),
    'mau', (select count(distinct a.user_id) from public.user_activity_days a, rv where a.day between p_day - 29 and p_day and a.user_id <> all (rv.ids)),
    'd1Cohort', (select size from cohort where n = 1), 'd1Retained', (select retained from cohort where n = 1),
    'd7Cohort', (select size from cohort where n = 7), 'd7Retained', (select retained from cohort where n = 7),
    'd30Cohort', (select size from cohort where n = 30), 'd30Retained', (select retained from cohort where n = 30),
    'subscribers', (select count(*) from public.subscriptions s, rv where s.status in ('active', 'grace') and s.user_id is not null and s.user_id <> all (rv.ids)),
    'trials', (select count(*) from public.subscriptions s, rv where s.status = 'trial' and s.user_id is not null and s.user_id <> all (rv.ids)),
    'newTrials', (select count(*) from public.subscriptions s, bounds b, rv where s.trial_used and s.started_at >= b.d0 and s.started_at < b.d1
        and (s.user_id is null or s.user_id <> all (rv.ids))),
    'petMessages', (select count(*) from pet_msgs),
    'petMessagesAnswered', (select count(*) from pet_msgs pm where exists (
        select 1 from public.messages r
        where r.link_id = pm.link_id and r.author_kind = 'user'
          and r.created_at > pm.created_at and r.created_at <= pm.created_at + interval '24 hours')),
    'encountersWaved', (select count(*) from public.encounters e, bounds b, rv where e.created_at >= b.d0 and e.created_at < b.d1 and e.from_user <> all (rv.ids)),
    'encountersAccepted', (select count(*) from public.encounters e, bounds b, rv where e.status = 'accepted' and e.status_at >= b.d0 and e.status_at < b.d1
        and e.from_user <> all (rv.ids)),
    -- Un lien « actif » en base peut être fantôme à la lecture (les vies se perdent à la lecture, `tickLink`).
    'linksActive', (select count(*) from public.links l, rl where l.status = 'active' and l.id <> all (rl.ids)
        and greatest(0, (p_day - l.last_active_on) - 1) - greatest(0, (l.last_tick_on - l.last_active_on) - 1) < l.lives),
    'linksGhost', (select count(*) from public.links l, rl where l.id <> all (rl.ids) and (l.status = 'ghost' or (l.status = 'active'
        and greatest(0, (p_day - l.last_active_on) - 1) - greatest(0, (l.last_tick_on - l.last_active_on) - 1) >= l.lives))),
    'linksArchived', (select count(*) from public.links l, rl where l.status = 'archived' and l.id <> all (rl.ids)),
    'reportsOpened', (select count(*) from public.reports r, bounds b where r.created_at >= b.d0 and r.created_at < b.d1 and not r.review),
    'reportsHandled', (select count(*) from public.reports r, bounds b where r.handled_at >= b.d0 and r.handled_at < b.d1 and not r.review),
    'reportsOpen', (select count(*) from public.reports where handled_at is null and not review),
    'top', coalesce((select jsonb_agg(jsonb_build_object('userId', user_id, 'ownerName', owner_name, 'petName', pet_name,
        'species', species, 'activeLinks', active_links)) from top), '[]'::jsonb)
  );
$$;

revoke all on function public.admin_daily_metrics_base(date) from public, anon, authenticated;
grant execute on function public.admin_daily_metrics_base(date) to service_role;

-- Liens où les deux ont écrit ce jour-là (20261115190000_no_daily_photo), sans ceux du monde de revue.
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
        and not exists (select 1 from public.profiles p where p.id in (l.user_a, l.user_b) and p.review_world is not null)
        and exists (
          select 1 from jsonb_array_elements(l.recent_days) as d
          where d ->> 'day' = to_char(p_day, 'YYYY-MM-DD') and (d ->> 'a')::boolean and (d ->> 'b')::boolean
        )
    )
  );
$$;

revoke all on function public.admin_daily_metrics(date) from public, anon, authenticated;
grant execute on function public.admin_daily_metrics(date) to service_role;
