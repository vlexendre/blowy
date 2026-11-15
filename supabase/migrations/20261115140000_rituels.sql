-- Blowy V7 — chantier « rituels » : sociabilité, sortie du jour, défi du jour, série, habitudes et preuves,
-- photos privées, bilan de la semaine.
-- Comme pour le reste du schéma : l'API (clé service) est la seule à écrire. RLS activée partout ;
-- aucune politique : ces tables ne sont lues que par l'API.

-- ── Sociabilité : besoin principal du minimoa (60 % de sa forme) ────────────
-- Même horloge d'usure que les trois autres besoins (`needs_at`) ; elle baisse de 1,5 point par heure.
alter table public.pets
  add column sociability smallint not null default 80 check (sociability between 0 and 100);

-- ── État des rituels : une ligne par personne ───────────────────────────────
-- streak_* : la série (rattrapée à la lecture : jours manqués → joker de la semaine ou remise à zéro).
-- joker_days : jours protégés récemment (deux semaines au plus), pour compter les jokers de la semaine.
-- last_seen_on : dernière ouverture de l'app (écrit une fois par jour) ; les tâches planifiées ne lisent que les
-- personnes vues récemment, par lots, en suivant user_id.
-- *_notified_on, review_week : marqueurs qui rendent les tâches planifiées idempotentes.
create table public.ritual_states (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  streak_current integer not null default 0 check (streak_current >= 0),
  streak_best integer not null default 0 check (streak_best >= 0),
  streak_last_done_on date,
  joker_days date[] not null default '{}',
  last_seen_on date,
  outing_on date,
  outing_answer text check (outing_answer in ('saw_people', 'walk', 'not_yet')),
  outing_confirmed boolean not null default false,
  habits_kept integer not null default 0 check (habits_kept >= 0),
  daily_notified_on date,
  danger_notified_on date,
  needs_out_notified_on date,
  review_week date,
  updated_at timestamptz not null default now()
);
-- Les tâches parcourent la clé primaire dans l'ordre (curseur user_id > …, limit) en filtrant last_seen_on et le
-- marqueur : la plupart des lignes lues sont des personnes actives, aucun autre index n'est nécessaire.

-- Compteur d'habitudes tenues, incrémenté sans course (deux preuves en même temps comptent deux fois).
create function public.ritual_add_habits_kept(p_user uuid, p_n integer)
returns integer
language sql
security definer
set search_path = public
as $$
  insert into public.ritual_states (user_id, habits_kept) values (p_user, greatest(p_n, 0))
  on conflict (user_id) do update set habits_kept = public.ritual_states.habits_kept + greatest(p_n, 0), updated_at = now()
  returning habits_kept;
$$;
revoke all on function public.ritual_add_habits_kept(uuid, integer) from public, anon, authenticated;

-- ── Photos privées : preuves d'habitude et défis photo ──────────────────────
-- Personne d'autre ne les voit. Supprimées du stockage sous 24 h (tâche planifiée), sauf si la personne les garde
-- dans ses souvenirs privés (keep). La ligne reste (deleted_at) pour l'historique des preuves.
create table public.ritual_photos (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  source text not null check (source in ('habit', 'daily')),
  day date not null,
  path text not null,
  caption text not null default '',
  keep boolean not null default false,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
-- Purge : seulement les photos encore là et non gardées, des plus anciennes aux plus récentes.
create index ritual_photos_purge_idx on public.ritual_photos (created_at) where keep = false and deleted_at is null;
-- Souvenirs privés d'une personne, du plus récent au plus ancien.
create index ritual_photos_kept_idx on public.ritual_photos (user_id, created_at desc) where keep = true and deleted_at is null;
-- Suppression du compte : toutes les photos encore stockées d'une personne.
create index ritual_photos_user_idx on public.ritual_photos (user_id) where deleted_at is null;

-- ── Défi du jour : un par personne et par jour (jour de Paris) ──────────────
create table public.daily_challenges (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  challenge_id text not null,
  kind text not null check (kind in ('question', 'photo', 'write', 'go_out')),
  axis text check (axis in ('foyer', 'ancrage', 'elan', 'rythme', 'cap')),
  status text not null default 'offered' check (status in ('offered', 'seen', 'accepted', 'done')),
  answer smallint check (answer in (0, 1)),
  photo_id uuid references public.ritual_photos (id) on delete set null,
  seen_at timestamptz,
  accepted_at timestamptz,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- ── Habitudes ───────────────────────────────────────────────────────────────
-- habit_id : clé du catalogue (packages/content, v7/rituels). Une habitude arrêtée garde son historique (archived_at).
create table public.habits (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  habit_id text not null check (char_length(habit_id) between 1 and 40),
  rhythm text not null check (rhythm in ('daily', 'three_per_week')),
  proof_hour smallint not null check (proof_hour between 0 and 23),
  asked_on date,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);
-- Une même habitude suivie une seule fois à la fois ; liste des habitudes suivies d'une personne.
create unique index habits_active_unique_idx on public.habits (user_id, habit_id) where archived_at is null;
-- Demande de preuve : habitudes actives dont l'heure est passée, par lots suivant l'id.
create index habits_to_ask_idx on public.habits (proof_hour, id) where archived_at is null;

-- Une preuve par habitude et par jour (une nouvelle, après un « non », remplace la précédente).
create table public.habit_checks (
  id uuid primary key,
  habit_ref uuid not null references public.habits (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  verdict text not null check (verdict in ('yes', 'no', 'unsure')),
  line text not null,
  photo_id uuid references public.ritual_photos (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (habit_ref, day)
);
-- Bilan de la semaine : preuves d'une personne sur une période.
create index habit_checks_user_day_idx on public.habit_checks (user_id, day);

-- ── Bilans de la semaine ────────────────────────────────────────────────────
create table public.weekly_reviews (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  facts jsonb not null,
  did text[] not null default '{}',
  noticed text not null,
  tip text not null,
  link_lines text[] not null default '{}',
  body text not null,
  coached boolean not null default false,
  detailed jsonb,
  vision jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);
-- L'unicité (user_id, week_start) sert aussi d'index pour la liste paginée d'une personne.

alter table public.ritual_states enable row level security;
alter table public.ritual_photos enable row level security;
alter table public.daily_challenges enable row level security;
alter table public.habits enable row level security;
alter table public.habit_checks enable row level security;
alter table public.weekly_reviews enable row level security;
