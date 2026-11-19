-- Ton chemin (docs/CHEMIN.md) : contenu piloté par le back (unités, étapes, questions, options, habillages), et
-- avancement de chaque personne (séances, réponses, quota du jour). Une seule série : `ritual_states` garde la série
-- et gagne `streak_rules` (règles de gel de Ton chemin pour qui l'a ouvert).
--
-- Seulement des ajouts : nouvelles tables (vides), une colonne à défaut constant, une contrainte `not valid`.
-- Sûre sur une base peuplée et rejouable (if not exists). RLS activée sans politique (seule l'API lit et écrit).
-- Contenu de départ : `pnpm --filter @blowy/api chemin:seed` (idempotent), après cette migration.

set local lock_timeout = '5s';

-- ── Contenu ─────────────────────────────────────────────────────────────────
create table if not exists public.chemin_units (
  id text primary key check (id ~ '^[a-z0-9_]{2,60}$'),
  position integer not null default 0,
  icon text not null default '',
  min_build integer not null default 0 check (min_build >= 0),
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'live')),
  -- { "fr": { "title": …, "subtitle": … }, "en": … }
  texts jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chemin_steps (
  id text primary key check (id ~ '^[a-z0-9_]{2,60}$'),
  unit_id text not null references public.chemin_units (id) on delete cascade,
  position integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'live')),
  -- { "fr": { "title": … } }
  texts jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists chemin_steps_unit_idx on public.chemin_steps (unit_id, position);

create table if not exists public.chemin_questions (
  id text primary key check (id ~ '^[a-z0-9_]{2,60}$'),
  step_id text references public.chemin_steps (id) on delete set null,
  position integer not null default 0,
  format text not null check (format in ('choice', 'slider', 'this_or_that', 'ranking', 'photo_choice')),
  axis text not null check (axis in ('foyer', 'ancrage', 'elan', 'rythme', 'cap')),
  direction smallint not null default 1 check (direction in (-1, 1)),
  min_build integer not null default 0 check (min_build >= 0),
  legacy_test_id text,
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'live')),
  -- { "fr": { "text": …, "opener": …, "mid": … } }
  texts jsonb not null default '{}'::jsonb,
  -- [{ "id", "position", "icon", "weight", "tag", "animation", "reactionMinBuild", "texts": { "fr": { "label", "reaction" } } }]
  options jsonb not null default '[]'::jsonb,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists chemin_questions_step_idx on public.chemin_questions (step_id, position);

create table if not exists public.chemin_scenes (
  id text primary key check (id ~ '^[a-z0-9_]{2,60}$'),
  kind text not null check (kind in ('transition', 'end')),
  animation text not null,
  min_build integer not null default 0 check (min_build >= 0),
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'live')),
  created_at timestamptz not null default now()
);

-- ── Avancement ──────────────────────────────────────────────────────────────
create table if not exists public.chemin_progress (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  completed_steps text[] not null default '{}',
  sessions_done integer not null default 0 check (sessions_done >= 0),
  answers_count integer not null default 0 check (answers_count >= 0),
  bonus_on date,
  bonus_reason text check (bonus_reason in ('invite_signup', 'wave_answered')),
  referrals_seen integer not null default 0 check (referrals_seen >= 0),
  last_build integer,
  last_platform text,
  last_session_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chemin_sessions (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  slot smallint not null check (slot in (0, 1)),
  kind text not null check (kind in ('step', 'review')),
  step_id text,
  -- [{ "questionId", "format", "review" }]
  questions jsonb not null,
  status text not null default 'open' check (status in ('open', 'done')),
  result jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, day, slot)
);
create index if not exists chemin_sessions_day_idx on public.chemin_sessions (day, status);

create table if not exists public.chemin_answers (
  user_id uuid not null references public.profiles (id) on delete cascade,
  session_id uuid not null references public.chemin_sessions (id) on delete cascade,
  question_id text not null,
  option_id text,
  value smallint check (value between 0 and 100),
  axis text not null check (axis in ('foyer', 'ancrage', 'elan', 'rythme', 'cap')),
  signal smallint not null check (signal between -100 and 100),
  day date not null,
  answered_at timestamptz not null default now(),
  primary key (user_id, question_id, session_id)
);
-- Personne du jour : les réponses de quelques personnes à quelques questions (clé primaire, par personne d'abord).

-- ── Une seule série ─────────────────────────────────────────────────────────
-- weekly : jokers par semaine (app d'avant) · chemin : gels de Ton chemin (1 par mois, 1 par semaine avec Minimoa+).
alter table public.ritual_states add column if not exists streak_rules text not null default 'weekly';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'ritual_states_streak_rules_check') then
    alter table public.ritual_states add constraint ritual_states_streak_rules_check check (streak_rules in ('weekly', 'chemin')) not valid;
  end if;
end $$;

alter table public.chemin_units enable row level security;
alter table public.chemin_steps enable row level security;
alter table public.chemin_questions enable row level security;
alter table public.chemin_scenes enable row level security;
alter table public.chemin_progress enable row level security;
alter table public.chemin_sessions enable row level security;
alter table public.chemin_answers enable row level security;
