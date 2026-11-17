-- Croissance (18 nov. 2026 ; docs/VIRALITE.md, docs/DEEPLINKS.md, docs/GROUPES.md).
--
-- 1. `groups.invite_code` : le code court du lien d'invitation d'un groupe (`minimoa.app/g/<code>`), créé à la première
--    demande d'un membre, changé par le créateur. Nul tant que personne ne l'a demandé.
-- 2. `creators` : les codes des créateurs (`minimoa.app/c/<code>`), gérés dans l'administration.
-- 3. `acquisitions` : d'où vient chaque compte (créateur, « 3 mots », groupe, invitation, App Store) et qui l'a fait
--    venir (objet « Parrain »). Rempli à l'inscription ; effacé avec le compte. La source vient du lien ouvert ou d'un
--    code tapé : aucune empreinte d'appareil.
-- 4. `growth_events` : les étapes d'un compte (inscription finie, premier lien, actif à J1, J7, J30, essai, payant),
--    une fois chacune, avec la source et le jour d'inscription. À la suppression du compte, la ligne perd son lien
--    avec la personne (`user_id` à null) : il ne reste qu'un compte anonyme pour les statistiques.
-- 5. `growth_counters` : compteurs agrégés par jour (visites des pages de partage, premiers lancements, inscriptions,
--    votes « 3 mots », partages) ; aucune personne, aucune IP. Incrémentés par `growth_bump` (sans course).
--
-- Sûre sur une base peuplée :
-- - la colonne ajoutée à `groups` est nulle par défaut (aucune réécriture de la table) ; sa contrainte est posée NOT
--   VALID puis validée (verrou SHARE UPDATE EXCLUSIVE seulement) ;
-- - l'index unique de `groups.invite_code` est partiel (`where invite_code is not null`) et `if not exists` : sur une
--   grosse table, le créer avant avec `create unique index concurrently` (docs/DEPLOIEMENT-V7.md) ;
-- - les nouvelles tables sont vides, sans défaut à recopier.
-- Rejouable : chaque instruction est idempotente.

set local lock_timeout = '5s';

-- ── 1. Lien d'invitation d'un groupe ────────────────────────────────────────
alter table public.groups add column if not exists invite_code text;
alter table public.groups drop constraint if exists groups_invite_code_check;
alter table public.groups
  add constraint groups_invite_code_check check (invite_code is null or invite_code ~ '^[A-Z0-9]{6,16}$') not valid;
alter table public.groups validate constraint groups_invite_code_check;
create unique index if not exists groups_invite_code_idx on public.groups (invite_code) where invite_code is not null;

-- ── 2. Créateurs ────────────────────────────────────────────────────────────
create table if not exists public.creators (
  code text primary key check (code ~ '^[A-Z0-9]{3,20}$'),
  name text not null check (char_length(name) between 1 and 60),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── 3. Source d'arrivée de chaque compte ────────────────────────────────────
create table if not exists public.acquisitions (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  source text not null check (source in ('creator', 'words', 'group', 'invite', 'store')),
  -- Code du créateur, ou identifiant du groupe rejoint par son lien ; null sinon.
  ref text check (ref is null or char_length(ref) between 1 and 64),
  -- Qui a fait venir la personne (invitation, lien « 3 mots ») : les deux gagnent l'objet « Parrain ».
  referred_by uuid references public.profiles (id) on delete set null,
  cohort_on date not null,
  created_at timestamptz not null default now()
);
create index if not exists acquisitions_referred_by_idx on public.acquisitions (referred_by) where referred_by is not null;
create index if not exists acquisitions_creator_idx on public.acquisitions (ref) where source = 'creator';

-- ── 4. Étapes de l'entonnoir ────────────────────────────────────────────────
create table if not exists public.growth_events (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles (id) on delete set null,
  kind text not null check (kind in ('onboarded', 'first_link', 'active_d1', 'active_d7', 'active_d30', 'trial', 'paid')),
  source text not null check (source in ('creator', 'words', 'group', 'invite', 'store')),
  cohort_on date not null,
  created_at timestamptz not null default now()
);
-- Une étape par compte (les lignes anonymisées, user_id null, ne se gênent pas : null est distinct).
create unique index if not exists growth_events_user_kind_idx on public.growth_events (user_id, kind);
create index if not exists growth_events_cohort_idx on public.growth_events (cohort_on);

-- ── 5. Compteurs agrégés ────────────────────────────────────────────────────
create table if not exists public.growth_counters (
  day date not null,
  metric text not null check (metric ~ '^(visit_(m|g|i|c)|first_open|signup|words_vote|share_(invite|words|group|moment))$'),
  source text not null default '' check (char_length(source) <= 20),
  ref text not null default '' check (char_length(ref) <= 32),
  count integer not null default 0 check (count >= 0),
  primary key (day, metric, source, ref)
);

create or replace function public.growth_bump(p_day date, p_metric text, p_source text, p_ref text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.growth_counters (day, metric, source, ref, count) values (p_day, p_metric, coalesce(p_source, ''), coalesce(p_ref, ''), 1)
  on conflict (day, metric, source, ref) do update set count = public.growth_counters.count + 1;
$$;
revoke all on function public.growth_bump(date, text, text, text) from public, anon, authenticated;

-- Écrites et lues par l'API seule (clé service) : RLS sans politique.
alter table public.creators enable row level security;
alter table public.acquisitions enable row level security;
alter table public.growth_events enable row level security;
alter table public.growth_counters enable row level security;
