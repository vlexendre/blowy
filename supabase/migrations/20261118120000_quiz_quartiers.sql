-- Quiz « Quel minimoa es-tu ? » et « Ouvre ton quartier » (18 nov. 2026 ; docs/VIRALITE.md).
--
-- 1. `quiz_results` : le résultat d'un quiz fait sur le site, sans compte, sous un code court (`Q…`) que l'app reprend à
--    l'inscription pour pré-remplir le minimoa. Aucune donnée sur la personne (ni IP, ni réponse détaillée) ; `ref` : le
--    code du résultat de la personne qui a lancé le défi (facteur K). Effacé au bout d'un an par le minuteur.
-- 2. `quartier_settings` : le seuil d'ouverture (une ligne, 50 par défaut, réglé dans l'administration).
-- 3. `quartiers` : les quartiers qui ont au moins une inscription, et leur ouverture (seuil atteint ou à la main).
-- 4. `quartier_signups` : « Préviens-moi quand mon quartier ouvre » : quartier, adresse e-mail (double opt-in), langue,
--    code pour inviter (`N…`), qui a invité. Une adresse est dans un seul quartier. Non confirmée : effacée sous 7 jours ;
--    30 jours après l'e-mail d'ouverture, l'adresse est effacée (la ligne reste, anonyme, pour le compteur et le code).
-- 5. `quartier_founders` : les 3 premiers inviteurs d'un quartier à son ouverture (objet « Fondateur »).
-- 6. Sources d'arrivée `quiz` et `quartier` (acquisitions, growth_events) ; nouveaux compteurs du site (growth_counters).
--
-- Sûre sur une base peuplée : nouvelles tables vides ; les contraintes changées des tables de croissance sont reposées
-- NOT VALID puis validées (verrou SHARE UPDATE EXCLUSIVE seulement). Rejouable : chaque instruction est idempotente.

set local lock_timeout = '5s';

-- ── 1. Résultats du quiz ────────────────────────────────────────────────────
create table if not exists public.quiz_results (
  code text primary key check (code ~ '^Q[2-9A-HJ-NP-Z]{6}$'),
  species text not null check (species in ('nino', 'suzie', 'gaston', 'pia')),
  trait text not null check (trait in ('casanier', 'sociable', 'pose', 'joueur', 'piquant', 'tendre', 'discret', 'bavard')),
  second_trait text check (second_trait is null or second_trait in ('casanier', 'sociable', 'pose', 'joueur', 'piquant', 'tendre', 'discret', 'bavard')),
  gauges jsonb not null,
  ref text check (ref is null or char_length(ref) between 3 and 32),
  locale text not null default 'fr' check (locale in ('fr', 'en', 'es', 'pt', 'nl')),
  created_at timestamptz not null default now()
);
create index if not exists quiz_results_created_idx on public.quiz_results (created_at);

-- ── 2. Seuil d'ouverture ────────────────────────────────────────────────────
create table if not exists public.quartier_settings (
  id boolean primary key default true check (id),
  threshold integer not null default 50 check (threshold between 1 and 100000),
  updated_at timestamptz not null default now()
);
insert into public.quartier_settings (id) values (true) on conflict (id) do nothing;

-- ── 3. Quartiers ────────────────────────────────────────────────────────────
create table if not exists public.quartiers (
  zone text primary key check (zone ~ '^([a-z]+(-[0-9]{1,2})?|cp-[0-9]{5})$'),
  opened_at timestamptz,
  opened_by text check (opened_by is null or opened_by in ('threshold', 'admin')),
  created_at timestamptz not null default now()
);

-- ── 4. Inscriptions ─────────────────────────────────────────────────────────
create table if not exists public.quartier_signups (
  id uuid primary key default gen_random_uuid(),
  zone text not null references public.quartiers (zone) on delete cascade,
  -- En minuscules ; null une fois effacée (30 jours après l'e-mail d'ouverture, ou désinscription).
  email text check (email is null or char_length(email) between 3 and 254),
  locale text not null default 'fr' check (locale in ('fr', 'en', 'es', 'pt', 'nl')),
  code text not null unique check (code ~ '^N[2-9A-HJ-NP-Z]{7}$'),
  -- Jeton des liens de confirmation et de désinscription ; null une fois l'adresse effacée.
  token text unique check (token is null or char_length(token) between 20 and 64),
  invited_by_user uuid references public.profiles (id) on delete set null,
  invited_by_signup uuid references public.quartier_signups (id) on delete set null,
  consent_at timestamptz not null,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  open_mail_sent_at timestamptz,
  -- Le compte qui a repris ce code à son inscription (« Un code ? ») : son objet de fondateur le suit.
  user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index if not exists quartier_signups_email_idx on public.quartier_signups (email) where email is not null;
create index if not exists quartier_signups_zone_idx on public.quartier_signups (zone) where confirmed_at is not null and unsubscribed_at is null;
create index if not exists quartier_signups_user_idx on public.quartier_signups (user_id) where user_id is not null;

-- ── 5. Fondateurs ───────────────────────────────────────────────────────────
create table if not exists public.quartier_founders (
  zone text not null references public.quartiers (zone) on delete cascade,
  rank smallint not null check (rank between 1 and 3),
  user_id uuid references public.profiles (id) on delete cascade,
  signup_id uuid references public.quartier_signups (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (zone, rank),
  check ((user_id is null) <> (signup_id is null))
);
create index if not exists quartier_founders_user_idx on public.quartier_founders (user_id) where user_id is not null;
create index if not exists quartier_founders_signup_idx on public.quartier_founders (signup_id) where signup_id is not null;

-- ── 6. Sources et compteurs de la croissance ────────────────────────────────
alter table public.acquisitions drop constraint if exists acquisitions_source_check;
alter table public.acquisitions
  add constraint acquisitions_source_check check (source in ('creator', 'words', 'group', 'invite', 'quiz', 'quartier', 'store')) not valid;
alter table public.acquisitions validate constraint acquisitions_source_check;

alter table public.growth_events drop constraint if exists growth_events_source_check;
alter table public.growth_events
  add constraint growth_events_source_check check (source in ('creator', 'words', 'group', 'invite', 'quiz', 'quartier', 'store')) not valid;
alter table public.growth_events validate constraint growth_events_source_check;

alter table public.growth_counters drop constraint if exists growth_counters_metric_check;
alter table public.growth_counters
  add constraint growth_counters_metric_check
  check (metric ~ '^(visit_(m|g|i|c)|first_open|signup|words_vote|share_(invite|words|group|moment)|quiz_(start|done|share)|quartier_(join|confirm))$') not valid;
alter table public.growth_counters validate constraint growth_counters_metric_check;

-- Écrites et lues par l'API seule (clé service) : RLS sans politique.
alter table public.quiz_results enable row level security;
alter table public.quartier_settings enable row level security;
alter table public.quartiers enable row level security;
alter table public.quartier_signups enable row level security;
alter table public.quartier_founders enable row level security;
