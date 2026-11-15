-- V7 — chantier « facturation-admin » : Blowy+ vérifié auprès d'Apple, modération et administration.
-- Comme pour le reste du schéma : l'API (clé service) est la seule à écrire. Toutes les tables ajoutées ici ont
-- la RLS activée et AUCUNE politique : personne ne peut les lire ni les écrire depuis l'app (clé anon ou jeton
-- utilisateur) ; seule la clé service de l'API y accède.

-- ── Abonnements ───────────────────────────────────────────────────────────
-- Un abonnement = une série de transactions d'un magasin (même `original_transaction_id` chez Apple).
-- `profiles.plus_until` reste la seule source de « a Blowy+ » ; l'API le recalcule à chaque événement.
create table public.subscriptions (
  store text not null check (store in ('apple', 'google')),
  original_transaction_id text not null,
  user_id uuid references public.profiles (id) on delete set null,
  product_id text not null,
  plan text not null check (plan in ('yearly', 'monthly')),
  status text not null check (status in ('trial', 'active', 'grace', 'billing_retry', 'expired', 'refunded', 'revoked')),
  expires_at timestamptz,
  grace_until timestamptz,
  trial_ends_at timestamptz,
  trial_used boolean not null default false,
  auto_renew boolean not null default true,
  revoked_at timestamptz,
  latest_transaction_id text not null,
  environment text not null default 'Production',
  started_at timestamptz not null,
  -- Date de signature (par le magasin) du dernier événement appliqué : ordonne les événements.
  updated_at timestamptz not null,
  -- Fin d'essai pour laquelle le rappel du jour 5 est parti (un seul rappel par essai).
  trial_reminder_for timestamptz,
  created_at timestamptz not null default now(),
  primary key (store, original_transaction_id)
);
create index subscriptions_user_idx on public.subscriptions (user_id);
create index subscriptions_status_idx on public.subscriptions (status);
create index subscriptions_trial_idx on public.subscriptions (trial_ends_at) where status = 'trial' and auto_renew;

-- Notifications reçues des magasins : idempotence (Apple renvoie jusqu'à 5 fois) et trace des 30 derniers jours
-- (journal technique ; purge par la tâche BillingJobs).
create table public.store_notifications (
  store text not null check (store in ('apple', 'google')),
  notification_id text not null,
  type text not null,
  subtype text,
  original_transaction_id text,
  environment text,
  signed_at timestamptz not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  outcome text,
  primary key (store, notification_id)
);
create index store_notifications_received_idx on public.store_notifications (received_at);

-- ── Modération ────────────────────────────────────────────────────────────
-- Signalement d'un message précis (contexte vu par la modération) et suivi du traitement.
-- Clé étrangère vers `messages` posée NOT VALID (validée par 20261115170000_integration).
alter table public.reports
  add column message_id uuid,
  add column handled_at timestamptz,
  add column handled_by text,
  add column resolution text check (resolution is null or resolution in ('warn', 'suspend', 'delete', 'dismiss', 'lift'));
alter table public.reports
  add constraint reports_message_id_fkey foreign key (message_id) references public.messages (id) on delete set null not valid;
create index if not exists reports_open_idx on public.reports (created_at) where handled_at is null;
create index if not exists reports_created_idx on public.reports (created_at desc);

-- Suspension en cours : l'API refuse toute requête du compte (sauf supprimer son compte) tant qu'elle court.
create table public.account_suspensions (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  since timestamptz not null default now(),
  until timestamptz,
  reason text not null,
  by_email text not null
);

-- Journal des actions de modération : jamais modifié ; effacé un an après l'action (politique de confidentialité,
-- tâche RetentionJobs). Pas de clé étrangère vers le compte, pour garder la trace après une suppression ; le prénom
-- est recopié au moment de l'action.
create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  admin_email text not null,
  action text not null check (action in ('warn', 'suspend', 'delete', 'dismiss', 'lift')),
  target_user_id uuid,
  target_name text,
  report_id bigint,
  reason text not null,
  until timestamptz
);
create index admin_audit_log_at_idx on public.admin_audit_log (at desc, id desc);
create index admin_audit_log_target_idx on public.admin_audit_log (target_user_id, at desc);

-- ── Statistiques ──────────────────────────────────────────────────────────
-- Jours d'activité (une ligne par personne et par jour où elle a utilisé l'app) : actifs jour / semaine / mois
-- et rétention J1 / J7 / J30. L'API écrit au plus une ligne par personne et par jour ; la tâche quotidienne
-- efface ce qui a plus de 40 jours.
create table public.user_activity_days (
  day date not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (day, user_id)
);
create index user_activity_days_user_idx on public.user_activity_days (user_id);

-- Un jour = une ligne de chiffres, calculée une fois par la tâche quotidienne : l'administration ne parcourt
-- jamais les grandes tables à l'affichage.
create table public.admin_daily_stats (
  day date primary key,
  metrics jsonb not null,
  computed_at timestamptz not null default now()
);

-- Index des requêtes de la tâche quotidienne (tables existantes : à créer avant avec `concurrently` sur une base
-- déjà peuplée, docs/DEPLOIEMENT-V7.md ; ces lignes ne font alors plus rien).
create index if not exists profiles_created_idx on public.profiles (created_at);
create index if not exists messages_pet_created_idx on public.messages (created_at) where author_kind = 'pet';
create index if not exists encounters_created_idx on public.encounters (created_at);
create index if not exists encounters_accepted_idx on public.encounters (status_at) where status = 'accepted';

alter table public.subscriptions enable row level security;
alter table public.store_notifications enable row level security;
alter table public.account_suspensions enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.user_activity_days enable row level security;
alter table public.admin_daily_stats enable row level security;

-- Chiffres d'un jour civil (Europe/Paris), en une seule requête. Appelée par la tâche quotidienne de l'API.
create or replace function public.admin_daily_metrics(p_day date)
returns jsonb
language sql
stable
set search_path = public
as $$
  with bounds as (
    select (p_day::timestamp at time zone 'Europe/Paris') as d0,
           ((p_day + 1)::timestamp at time zone 'Europe/Paris') as d1
  ),
  pet_msgs as (
    select m.id, m.link_id, m.created_at
    from public.messages m, bounds b
    where m.author_kind = 'pet' and m.created_at >= b.d0 and m.created_at < b.d1
  ),
  cohort as (
    select n, (select count(*) from public.profiles p, bounds b
               where p.created_at >= (b.d0 - make_interval(days => n)) and p.created_at < (b.d1 - make_interval(days => n))) as size,
           (select count(*) from public.profiles p
              join public.user_activity_days a on a.user_id = p.id and a.day = p_day, bounds b
               where p.created_at >= (b.d0 - make_interval(days => n)) and p.created_at < (b.d1 - make_interval(days => n))) as retained
    from unnest(array[1, 7, 30]) as n
  ),
  top as (
    select p.id as user_id, p.display_name as owner_name, pe.name as pet_name, pe.species,
           count(l.id) as active_links
    from public.profiles p
    join public.pets pe on pe.owner_id = p.id
    join public.links l on (l.user_a = p.id or l.user_b = p.id) and l.status = 'active'
      and greatest(0, (p_day - l.last_active_on) - 1) - greatest(0, (l.last_tick_on - l.last_active_on) - 1) < l.lives
    group by p.id, p.display_name, pe.name, pe.species
    order by active_links desc, p.created_at
    limit 100
  )
  select jsonb_build_object(
    'accountsTotal', (select count(*) from public.profiles p, bounds b where p.created_at < b.d1),
    'accountsNew', (select count(*) from public.profiles p, bounds b where p.created_at >= b.d0 and p.created_at < b.d1),
    'dau', (select count(*) from public.user_activity_days where day = p_day),
    'wau', (select count(distinct user_id) from public.user_activity_days where day between p_day - 6 and p_day),
    'mau', (select count(distinct user_id) from public.user_activity_days where day between p_day - 29 and p_day),
    'd1Cohort', (select size from cohort where n = 1), 'd1Retained', (select retained from cohort where n = 1),
    'd7Cohort', (select size from cohort where n = 7), 'd7Retained', (select retained from cohort where n = 7),
    'd30Cohort', (select size from cohort where n = 30), 'd30Retained', (select retained from cohort where n = 30),
    'subscribers', (select count(*) from public.subscriptions where status in ('active', 'grace') and user_id is not null),
    'trials', (select count(*) from public.subscriptions where status = 'trial' and user_id is not null),
    'newTrials', (select count(*) from public.subscriptions s, bounds b where s.trial_used and s.started_at >= b.d0 and s.started_at < b.d1),
    'petMessages', (select count(*) from pet_msgs),
    'petMessagesAnswered', (select count(*) from pet_msgs pm where exists (
        select 1 from public.messages r
        where r.link_id = pm.link_id and r.author_kind = 'user'
          and r.created_at > pm.created_at and r.created_at <= pm.created_at + interval '24 hours')),
    'encountersWaved', (select count(*) from public.encounters e, bounds b where e.created_at >= b.d0 and e.created_at < b.d1),
    'encountersAccepted', (select count(*) from public.encounters e, bounds b where e.status = 'accepted' and e.status_at >= b.d0 and e.status_at < b.d1),
    -- Un lien « actif » en base peut être fantôme à la lecture (les vies se perdent à la lecture, `tickLink`).
    'linksActive', (select count(*) from public.links where status = 'active'
        and greatest(0, (p_day - last_active_on) - 1) - greatest(0, (last_tick_on - last_active_on) - 1) < lives),
    'linksGhost', (select count(*) from public.links where status = 'ghost' or (status = 'active'
        and greatest(0, (p_day - last_active_on) - 1) - greatest(0, (last_tick_on - last_active_on) - 1) >= lives)),
    'linksArchived', (select count(*) from public.links where status = 'archived'),
    'reportsOpened', (select count(*) from public.reports r, bounds b where r.created_at >= b.d0 and r.created_at < b.d1),
    'reportsHandled', (select count(*) from public.reports r, bounds b where r.handled_at >= b.d0 and r.handled_at < b.d1),
    'reportsOpen', (select count(*) from public.reports where handled_at is null),
    'top', coalesce((select jsonb_agg(jsonb_build_object('userId', user_id, 'ownerName', owner_name, 'petName', pet_name,
        'species', species, 'activeLinks', active_links)) from top), '[]'::jsonb)
  );
$$;

revoke all on function public.admin_daily_metrics(date) from public, anon, authenticated;
grant execute on function public.admin_daily_metrics(date) to service_role;
