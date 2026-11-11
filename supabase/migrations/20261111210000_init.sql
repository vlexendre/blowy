-- Blowy V6 — schéma initial.
-- Règle d'accès : l'API NestJS (clé service) est le seul écrivain.
-- L'app lit en direct uniquement ce que le temps réel exige ; les politiques RLS ci-dessous
-- n'ouvrent donc que des lectures, limitées aux membres concernés.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 24),
  birthdate date not null,
  city text,
  avatar_path text,
  invite_code text not null unique,
  words_code text not null unique,
  plus_until timestamptz,
  welcome_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 14),
  species text not null check (species in ('nino', 'suzie', 'gaston', 'pia')),
  social smallint not null default 0 check (social between -100 and 100),
  play smallint not null default 0 check (play between -100 and 100),
  tender smallint not null default 0 check (tender between -100 and 100),
  talk smallint not null default 0 check (talk between -100 and 100),
  decayed_on date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.pet_events (
  id bigint generated always as identity primary key,
  pet_id uuid not null references public.pets (id) on delete cascade,
  kind text not null,
  delta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index pet_events_pet_idx on public.pet_events (pet_id, created_at desc);

create table public.links (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'ghost', 'archived')),
  lives smallint not null default 7 check (lives between 0 and 7),
  xp integer not null default 0 check (xp >= 0),
  level smallint not null default 1 check (level between 1 and 7),
  streak integer not null default 0 check (streak >= 0),
  last_active_on date not null,
  last_tick_on date not null,
  last_duo_photo_on date,
  revived boolean not null default false,
  message_xp_on date,
  message_xp integer not null default 0,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (user_a < user_b),
  unique (user_a, user_b)
);
create index links_user_b_idx on public.links (user_b);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.links (id) on delete cascade,
  author_kind text not null check (author_kind in ('user', 'pet', 'system')),
  author_id uuid references public.profiles (id) on delete set null,
  kind text not null check (kind in ('text', 'photo', 'event')),
  body text check (body is null or char_length(body) <= 2000),
  media_path text,
  created_at timestamptz not null default now()
);
create index messages_link_idx on public.messages (link_id, created_at desc);
create index messages_author_idx on public.messages (author_id);

create table public.link_reads (
  link_id uuid not null references public.links (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (link_id, user_id)
);
create index link_reads_user_idx on public.link_reads (user_id);

create table public.daily_photos (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.links (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  media_path text not null,
  created_at timestamptz not null default now(),
  unique (link_id, user_id, day)
);
create index daily_photos_user_idx on public.daily_photos (user_id);

create table public.encounters (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references public.profiles (id) on delete cascade,
  to_user uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'waved' check (status in ('waved', 'accepted', 'declined')),
  intro text,
  created_at timestamptz not null default now(),
  check (from_user <> to_user),
  unique (from_user, to_user)
);
create index encounters_to_idx on public.encounters (to_user, status);

create table public.word_votes (
  id bigint generated always as identity primary key,
  target_user uuid not null references public.profiles (id) on delete cascade,
  words text[] not null check (cardinality(words) = 3),
  voter_hash text not null,
  created_at timestamptz not null default now(),
  unique (target_user, voter_hash)
);

create table public.blocks (
  blocker uuid not null references public.profiles (id) on delete cascade,
  blocked uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked)
);
create index blocks_blocked_idx on public.blocks (blocked);

create table public.reports (
  id bigint generated always as identity primary key,
  reporter uuid references public.profiles (id) on delete set null,
  target_user uuid references public.profiles (id) on delete set null,
  link_id uuid references public.links (id) on delete set null,
  reason text not null,
  details text,
  created_at timestamptz not null default now()
);
create index reports_reporter_idx on public.reports (reporter);
create index reports_target_idx on public.reports (target_user);
create index reports_link_idx on public.reports (link_id);

-- RLS partout ; aucune politique d'écriture (l'API écrit avec la clé service).
alter table public.profiles enable row level security;
alter table public.pets enable row level security;
alter table public.pet_events enable row level security;
alter table public.links enable row level security;
alter table public.messages enable row level security;
alter table public.link_reads enable row level security;
alter table public.daily_photos enable row level security;
alter table public.encounters enable row level security;
alter table public.word_votes enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;

create policy "membres : lire leurs liens" on public.links
  for select to authenticated
  using ((select auth.uid()) in (user_a, user_b));

create policy "membres : lire les messages de leurs liens" on public.messages
  for select to authenticated
  using (exists (
    select 1 from public.links l
    where l.id = messages.link_id and (select auth.uid()) in (l.user_a, l.user_b)
  ));

create policy "soi : lire son profil" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "soi : lire son pet" on public.pets
  for select to authenticated
  using ((select auth.uid()) = owner_id);

-- Temps réel : l'app s'abonne aux nouveaux messages et aux changements de ses liens.
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.links;

-- Photos : compartiment privé, accès uniquement par URL signée émise par l'API.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', false, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;
