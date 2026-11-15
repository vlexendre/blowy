-- Blowy V7 — chantier « vision » : qui est la personne, ce qu'elle cherche, sa vision de la vie, sa zone.
-- Comme pour le reste du schéma : l'API (clé service) est la seule à écrire. RLS activée partout ;
-- aucune nouvelle politique : ces tables ne sont lues que par l'API (le profil reste lisible par son
-- propriétaire via « soi : lire son profil »).
--
-- Données sensibles : `whom` (qui la personne veut rencontrer) et, avec le sexe, ce qu'il peut révéler de
-- l'orientation sexuelle ; la position. Chacun a son accord horodaté. `whom` n'est jamais renvoyé aux autres.

-- ── Profil : qui tu es, ce que tu cherches ──────────────────────────────────
alter table public.profiles
  add column gender text not null default 'non_dit' check (gender in ('femme', 'homme', 'non_binaire', 'non_dit')),
  add column seeking text not null default 'potes' check (seeking in ('potes', 'plus', 'les_deux')),
  add column whom text check (whom in ('femmes', 'hommes', 'tout_le_monde')),
  add column locale text not null default 'fr' check (locale in ('fr', 'en', 'es', 'pt', 'nl')),
  add column discreet boolean not null default false,
  add column sensitive_consent_at timestamptz,
  add column location_consent_at timestamptz,
  -- « plus » demande de dire qui ; « potes » n'en a pas ; « qui » demande l'accord.
  add constraint profiles_whom_matches_seeking check ((seeking = 'potes') = (whom is null)),
  add constraint profiles_whom_needs_consent check (whom is null or sensitive_consent_at is not null);

-- La ville n'est plus demandée (la zone vient de la position) : on ne garde pas une donnée inutile.
alter table public.profiles drop column city;

-- ── Position : une ligne par personne qui a donné son accord ────────────────
-- last_* : dernier relevé exact (app ouverte), jamais montré à personne, sert à confirmer une sortie.
-- home_* : zone du domicile, arrondie à ~300 m ; ne déménage qu'après 72 h ailleurs (candidate_*).
-- home_cell : maille de 0,1° de l'index géographique (la recherche ne lit que les mailles autour du centre).
-- city_* : ville choisie avec Blowy+ (déplace le centre des rencontres, pas la zone montrée aux autres).
create table public.profile_places (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  last_lat double precision not null check (last_lat between -90 and 90),
  last_lng double precision not null check (last_lng between -180 and 180),
  located_at timestamptz not null,
  last_away_at timestamptz,
  home_lat double precision not null check (home_lat between -90 and 90),
  home_lng double precision not null check (home_lng between -180 and 180),
  home_cell text not null,
  candidate_lat double precision,
  candidate_lng double precision,
  candidate_since timestamptz,
  city_label text check (char_length(city_label) between 1 and 60),
  city_lat double precision check (city_lat between -90 and 90),
  city_lng double precision check (city_lng between -180 and 180),
  check ((city_label is null) = (city_lat is null) and (city_lat is null) = (city_lng is null))
);
-- Candidats d'une zone, les plus récemment actifs d'abord (la recherche est plafonnée).
create index profile_places_cell_idx on public.profile_places (home_cell, located_at desc);

-- ── Vision : observations et profil calculé ─────────────────────────────────
-- Les autres chantiers n'écrivent jamais ici : ils passent par le port VisionSignals de l'API.
create table public.vision_signals (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  axis text not null check (axis in ('foyer', 'ancrage', 'elan', 'rythme', 'cap')),
  value smallint not null check (value between -100 and 100),
  source text not null check (source in ('test', 'daily', 'habit', 'care', 'words')),
  at timestamptz not null
);
create index vision_signals_user_idx on public.vision_signals (user_id, at desc);
create index vision_signals_user_source_idx on public.vision_signals (user_id, source);

-- Profil recalculé à chaque observation (lecture rapide pour l'appariement) : { axe: { value, confidence } }.
create table public.vision_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  axes jsonb not null,
  test_done boolean not null default false,
  computed_at timestamptz not null default now()
);

-- Personnes compatibles autour du centre, calculées une fois par jour et par personne (vidé quand la
-- personne change sa vision, ce qu'elle cherche, sa zone ou sa ville).
create table public.match_cache (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  day date not null,
  center_key text not null,
  entries jsonb not null,
  computed_at timestamptz not null default now()
);

alter table public.profile_places enable row level security;
alter table public.vision_signals enable row level security;
alter table public.vision_profiles enable row level security;
alter table public.match_cache enable row level security;
