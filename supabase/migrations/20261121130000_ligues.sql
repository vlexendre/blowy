-- Ligues façon Duolingo (21 nov. 2026) : chaque personne garde sa ligue d'une semaine à l'autre. En fin de semaine,
-- les premiers de leur groupe montent, les derniers (et ceux qui n'ont rien fait) descendent.
--
-- Une ligne par personne, écrite par l'API seule (service role) à la première lecture de la semaine.
-- Sûre sur une base peuplée : une nouvelle table, rien d'autre. Rejouable (`if not exists`).

set local lock_timeout = '5s';

create table if not exists public.league_standings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  tier text not null default 'plume' check (tier in ('plume', 'pompon', 'houppette', 'couronne', 'etoile')),
  -- Lundi (jour de Paris) de la semaine où cette ligue s'applique.
  week date not null,
  -- Résultat de la semaine d'avant, montré au début de celle-ci.
  result text check (result in ('up', 'stay', 'down')),
  result_rank integer check (result_rank is null or result_rank > 0),
  result_from text check (result_from in ('plume', 'pompon', 'houppette', 'couronne', 'etoile')),
  updated_at timestamptz not null default now()
);
create index if not exists league_standings_tier_idx on public.league_standings (tier, week);

alter table public.league_standings enable row level security;
