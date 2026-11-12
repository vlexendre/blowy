-- Soins et garde-robe : le pet a trois besoins qui baissent avec le temps, une tenue et des objets.
alter table public.pets
  add column hunger smallint not null default 80 check (hunger between 0 and 100),
  add column energy smallint not null default 80 check (energy between 0 and 100),
  add column mood smallint not null default 80 check (mood between 0 and 100),
  add column needs_at timestamptz not null default now(),
  add column care_days integer not null default 0 check (care_days >= 0),
  add column last_care_on date,
  add column best_streak integer not null default 0 check (best_streak >= 0),
  add column outfit jsonb not null default '{}'::jsonb;

-- Objets possédés : gagnés par une étape (conservés même si le compteur redescend) ou achetés.
create table public.pet_items (
  pet_id uuid not null references public.pets (id) on delete cascade,
  item_id text not null,
  source text not null check (source in ('start', 'milestone', 'purchase')),
  acquired_at timestamptz not null default now(),
  primary key (pet_id, item_id)
);
alter table public.pet_items enable row level security;
