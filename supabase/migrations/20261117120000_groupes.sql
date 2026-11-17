-- Habitudes partagées, rigueur et groupes (docs/V7-SPEC.md §25 et §26, docs/GROUPES.md).
--
-- Sûre sur une base peuplée, et à appliquer AVANT le nouveau code (l'API d'avant ignore tout ceci) :
-- - tables nouvelles (vides) ; colonnes ajoutées nullables, ou NOT NULL avec une valeur par défaut constante :
--   changement de catalogue seulement, sans réécriture de `profiles` ni de `reports` ;
-- - clés étrangères posées sur `reports` NOT VALID puis validées (la validation ne bloque pas les écritures) ;
-- - index sur des colonnes nées ici seulement (vides) ;
-- - `lock_timeout` : si un verrou n'arrive pas en 5 s, la migration échoue sans rien appliquer ; la relancer.
-- La rigueur se calcule à la lecture depuis `habit_checks` (rien à stocker) ; seuls les jokers posés pour une
-- habitude sont gardés (`habit_jokers`), pour qu'un jour couvert reste neutre sur 28 jours.

set local lock_timeout = '5s';

-- ── « Montrer mes habitudes » (Moi), activé par défaut ────────────────────────
alter table public.profiles add column if not exists show_habits boolean not null default true;
comment on column public.profiles.show_habits is
  'Nom des habitudes, série et rigueur montrés aux rencontres et aux liens (spéc §25) ; coupé : rien, et aucune suggestion « ensemble ».';

-- ── Jokers posés pour une habitude (groupe) ───────────────────────────────────
-- Même réserve que la série du défi (le jour est aussi ajouté à `ritual_states.joker_days`) ; gardé ici pour la
-- rigueur (jour neutre) et pour juger le jour des groupes.
create table if not exists public.habit_jokers (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- ── Groupes ───────────────────────────────────────────────────────────────────
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 30),
  kind text not null check (kind in ('habit', 'free')),
  habit_id text,
  status text not null default 'forming' check (status in ('forming', 'active', 'asleep', 'closed')),
  created_by uuid references public.profiles (id) on delete set null,
  lives smallint not null default 5 check (lives between 0 and 5),
  streak integer not null default 0 check (streak >= 0),
  best_streak integer not null default 0 check (best_streak >= 0),
  clean_days smallint not null default 0 check (clean_days >= 0),
  -- Jour (Paris) où le groupe a atteint 3 membres ; jugé à partir du lendemain.
  started_on date,
  -- Dernier jour jugé (le lendemain midi, par le minuteur).
  evaluated_through date,
  -- Né d'une suggestion « la tenir ensemble ».
  from_together boolean not null default false,
  closed_at timestamptz,
  closed_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint groups_habit_kind check ((kind = 'habit') = (habit_id is not null))
);
-- Minuteur : groupes d'habitude vivants à juger.
create index if not exists groups_to_settle_idx on public.groups (evaluated_through, id) where kind = 'habit' and status = 'active';

create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null check (status in ('invited', 'active', 'declined', 'left')),
  invited_by uuid references public.profiles (id) on delete set null,
  joined_at timestamptz,
  left_at timestamptz,
  last_read_at timestamptz,
  -- Dernier push « message de groupe » : un seul tant que la personne n'a pas lu.
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index if not exists group_members_user_idx on public.group_members (user_id, status);

create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  author_kind text not null check (author_kind in ('user', 'pet', 'system')),
  author_id uuid references public.profiles (id) on delete set null,
  kind text not null check (kind in ('text', 'event')),
  body text,
  -- Événement (arrivée, palier, vie perdue, groupe endormi…) : écrit dans la langue de celui qui lit.
  event text,
  event_vars jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint group_messages_body check ((kind = 'text') = (body is not null)),
  constraint group_messages_event check ((kind = 'event') = (event is not null))
);
create index if not exists group_messages_group_idx on public.group_messages (group_id, created_at desc);

-- Jours jugés d'un groupe d'habitude : issue et état de chaque membre (tenu, joker, manqué, pas dû).
create table if not exists public.group_days (
  group_id uuid not null references public.groups (id) on delete cascade,
  day date not null,
  outcome text not null check (outcome in ('kept', 'missed', 'skipped')),
  members jsonb not null default '{}'::jsonb,
  lives_after smallint not null,
  streak_after integer not null,
  created_at timestamptz not null default now(),
  primary key (group_id, day)
);

-- « La tenir ensemble » : propositions en attente, par habitude. Aucune position n'est gardée ici.
create table if not exists public.together_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  habit_id text not null,
  status text not null default 'waiting' check (status in ('waiting', 'matched', 'withdrawn')),
  group_id uuid references public.groups (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists together_proposals_waiting_uniq on public.together_proposals (user_id, habit_id) where status = 'waiting';
create index if not exists together_proposals_habit_idx on public.together_proposals (habit_id, created_at) where status = 'waiting';

-- ── Signalements dans un groupe ───────────────────────────────────────────────
alter table public.reports add column if not exists group_id uuid;
alter table public.reports add column if not exists group_message_id uuid;
alter table public.reports drop constraint if exists reports_group_id_fkey;
alter table public.reports add constraint reports_group_id_fkey foreign key (group_id) references public.groups (id) on delete set null not valid;
alter table public.reports validate constraint reports_group_id_fkey;
alter table public.reports drop constraint if exists reports_group_message_id_fkey;
alter table public.reports
  add constraint reports_group_message_id_fkey foreign key (group_message_id) references public.group_messages (id) on delete set null not valid;
alter table public.reports validate constraint reports_group_message_id_fkey;
create index if not exists reports_group_idx on public.reports (group_id) where group_id is not null;

-- ── RLS : l'API seule écrit ; l'app lit en temps réel les messages de ses groupes ──────────────────
-- Même modèle que les liens : la politique des messages s'appuie sur une lecture de ses propres adhésions.
alter table public.habit_jokers enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_messages enable row level security;
alter table public.group_days enable row level security;
alter table public.together_proposals enable row level security;

drop policy if exists "membres : lire leurs adhésions" on public.group_members;
create policy "membres : lire leurs adhésions" on public.group_members
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "membres : lire les messages de leurs groupes" on public.group_messages;
create policy "membres : lire les messages de leurs groupes" on public.group_messages
  for select to authenticated
  using (exists (
    select 1 from public.group_members m
    where m.group_id = group_messages.group_id and m.user_id = (select auth.uid()) and m.status = 'active'
  ));

-- Temps réel : l'app s'abonne aux nouveaux messages de ses groupes (pour rafraîchir ; tout s'affiche depuis l'API).
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'group_messages') then
    alter publication supabase_realtime add table public.group_messages;
  end if;
end $$;
