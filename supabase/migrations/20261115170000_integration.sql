-- V7 — intégration des quatre chantiers : contraintes posées NOT VALID validées, conservation des données (comptes
-- inactifs, exclusions définitives), rencontres proposées (statistiques), défi du matin envoyé par la seule
-- plateforme, lectures de l'app réduites à la session et au temps réel, index des suppressions en cascade.
-- Comme pour le reste du schéma : l'API (clé service) est la seule à écrire ; RLS activée partout.
-- Sûre sur une base déjà peuplée : colonnes ajoutées avec une valeur par défaut constante (instantané), validations
-- sous verrou SHARE UPDATE EXCLUSIVE (lectures et écritures continuent). Les index sur des tables existantes sont en
-- `if not exists` : sur une grosse base, les créer avant avec `concurrently` (docs/DEPLOIEMENT-V7.md).

-- ── Contraintes posées NOT VALID par 20261115150000_plateforme et 20261115160000_facturation_admin ──────────
alter table public.messages validate constraint messages_pet_role_check;
alter table public.messages validate constraint messages_visible_to_fkey;
alter table public.reports validate constraint reports_message_id_fkey;

-- ── Comptes inactifs (supprimés après 2 ans sans connexion, après un e-mail de prévenance 30 jours avant) ───────
-- last_active_on : écrit au plus une fois par jour par la garde de compte. Les comptes existants partent du jour de
-- la migration (on ne connaît pas leur dernière connexion : on leur laisse 2 ans pleins).
alter table public.profiles
  add column last_active_on date not null default current_date,
  add column inactivity_noticed_on date;
create index if not exists profiles_last_active_idx on public.profiles (last_active_on);

-- ── Exclusion définitive : empreinte (SHA-256) de l'identifiant Apple ou Google, gardée 3 ans ──────────────────
-- Pas de clé étrangère : la ligne survit à la suppression du compte, c'est son rôle. Rien en clair.
create table public.banned_identities (
  hash text primary key check (hash ~ '^[0-9a-f]{64}$'),
  banned_at timestamptz not null default now(),
  until timestamptz not null
);
create index banned_identities_until_idx on public.banned_identities (until);
alter table public.banned_identities enable row level security;

-- Signalements clos purgés un an après (journal de modération : index `admin_audit_log_at_idx` existant).
create index if not exists reports_handled_idx on public.reports (handled_at) where handled_at is not null;

-- ── Rencontres proposées par jour et par personne (statistiques de l'administration, purgées après 30 jours) ────
create table public.encounter_proposals (
  day date not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  proposed smallint not null check (proposed >= 0),
  score_sum integer not null check (score_sum >= 0),
  primary key (day, user_id)
);
-- Suppression du compte (cascade).
create index encounter_proposals_user_idx on public.encounter_proposals (user_id);
alter table public.encounter_proposals enable row level security;

-- Garde le plus grand nombre de suggestions montrées dans la journée (une écriture quand il augmente).
create function public.encounter_proposals_record(p_day date, p_user uuid, p_proposed integer, p_score_sum integer)
returns void
language sql
set search_path = ''
as $$
  insert into public.encounter_proposals as e (day, user_id, proposed, score_sum)
  values (p_day, p_user, p_proposed, p_score_sum)
  on conflict (day, user_id) do update set proposed = excluded.proposed, score_sum = excluded.score_sum
    where excluded.proposed > e.proposed;
$$;

-- Total d'un jour (parcours de la clé primaire sur ce jour).
create function public.encounter_proposals_summary(p_day date)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object('proposed', coalesce(sum(proposed), 0), 'score_sum', coalesce(sum(score_sum), 0))
  from public.encounter_proposals where day = p_day;
$$;

revoke all on function public.encounter_proposals_record(date, uuid, integer, integer) from public, anon, authenticated;
revoke all on function public.encounter_proposals_summary(date) from public, anon, authenticated;
grant execute on function public.encounter_proposals_record(date, uuid, integer, integer) to service_role;
grant execute on function public.encounter_proposals_summary(date) to service_role;
-- Oubli de 20261115140000_rituels : la clé service doit pouvoir appeler le compteur d'habitudes.
grant execute on function public.ritual_add_habits_kept(uuid, integer) to service_role;

-- ── Défi du jour : un seul chemin d'envoi (la plateforme, à l'heure choisie) ──────────────────────────────────
alter table public.ritual_states drop column daily_notified_on;

-- ── Ce que l'app lit en direct : la session et le temps réel des liens et des messages, rien d'autre ───────────
-- (docs/ARCHITECTURE.md, règle 1). Le profil et le minimoa passent par l'API : leurs politiques de lecture n'ont
-- plus d'usage et exposaient des champs sensibles (« qui tu veux rencontrer », accords, abonnement).
drop policy if exists "soi : lire son profil" on public.profiles;
drop policy if exists "soi : lire son pet" on public.pets;

-- ── Index des suppressions en cascade (sans eux : un parcours complet de la table par compte supprimé) ─────────
-- Garde-fous (visibles par une seule personne) : on delete cascade depuis profiles.
create index if not exists messages_visible_to_idx on public.messages (visible_to) where visible_to is not null;
-- Message signalé : on delete set null depuis messages.
create index if not exists reports_message_idx on public.reports (message_id) where message_id is not null;
-- Habitudes d'une personne (l'index unique est partiel : il ne sert pas la cascade).
create index if not exists habits_user_idx on public.habits (user_id);
-- Photos privées d'une personne, supprimées ou non.
create index if not exists ritual_photos_owner_idx on public.ritual_photos (user_id);
-- Photos privées : on delete set null depuis ritual_photos.
create index if not exists daily_challenges_photo_idx on public.daily_challenges (photo_id) where photo_id is not null;
create index if not exists habit_checks_photo_idx on public.habit_checks (photo_id) where photo_id is not null;
-- Appareils d'une personne (l'index existant ne couvre que les actifs).
create index if not exists push_devices_owner_idx on public.push_devices (user_id);
-- Journal des notifications d'un lien supprimé.
create index if not exists notification_log_link_idx on public.notification_log (link_id) where link_id is not null;

-- ── Activités en direct iOS : jetons APNs rangés à part des jetons Expo (docs/WIDGETS.md) ────────────────────
-- use = start : jeton « push-to-start » de l'app (un par appareil, peut changer) ; use = update : jeton d'une activité
-- en cours (un par activité ; un nouveau remplace l'ancien ; oublié quand l'activité se termine, ends_at).
-- disabled_at : refusé par APNs (410, BadDeviceToken) ; purgé après 30 jours.
create table public.live_activity_tokens (
  token text primary key check (token ~ '^[0-9a-fA-F]{16,200}$'),
  user_id uuid not null references public.profiles (id) on delete cascade,
  use text not null check (use in ('start', 'update')),
  activity text check (activity in ('challenge', 'photo', 'outing')),
  activity_id text check (char_length(activity_id) <= 80),
  link_id uuid references public.links (id) on delete cascade,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  disabled_at timestamptz,
  check (use = 'start' or activity is not null)
);
-- Jetons d'une personne pour un usage (démarrage de la photo, mise à jour ou fin du défi).
create index live_activity_tokens_user_idx on public.live_activity_tokens (user_id, use) where disabled_at is null;
-- Minuteur : activités finies (minuit local) à terminer.
create index live_activity_tokens_ends_idx on public.live_activity_tokens (ends_at) where use = 'update' and disabled_at is null;
-- Purge des jetons refusés ; suppression d'un lien (cascade).
create index live_activity_tokens_disabled_idx on public.live_activity_tokens (disabled_at) where disabled_at is not null;
create index live_activity_tokens_link_idx on public.live_activity_tokens (link_id) where link_id is not null;
alter table public.live_activity_tokens enable row level security;

-- ── Candidats d'une zone : au plus p_limit par maille via l'index (home_cell, located_at desc), puis les plus
-- récents. Remplace `home_cell in (…) order by located_at desc limit …`, qui parcourait toutes les positions des
-- mailles (parcours séquentiel dès qu'une ville est dense).
create function public.places_in_cells(p_cells text[], p_limit integer, p_exclude uuid)
returns setof public.profile_places
language sql
stable
set search_path = ''
as $$
  select p.* from unnest(p_cells) as c(cell)
  cross join lateral (
    select * from public.profile_places pp where pp.home_cell = c.cell and pp.user_id <> p_exclude
    order by pp.located_at desc limit p_limit
  ) p
  order by p.located_at desc
  limit p_limit;
$$;
revoke all on function public.places_in_cells(text[], integer, uuid) from public, anon, authenticated;
grant execute on function public.places_in_cells(text[], integer, uuid) to service_role;
