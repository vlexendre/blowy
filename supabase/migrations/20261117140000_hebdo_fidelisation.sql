-- Minimoa+ hebdomadaire et messages de fidélisation (17 nov. 2026 ; docs/BLOWY-PLUS.md, docs/FIDELISATION.md).
--
-- 1. L'offre hebdomadaire `app.blowy.plus.weekly` : la contrainte du plan d'un abonnement accepte `weekly`.
-- 2. `lifecycle_messages` : le journal des messages de fidélisation déjà partis (bienvenue dans Minimoa+, paiement
--    refusé, au revoir, relance unique, premiers pas, absences, anniversaires). Une ligne par (personne, clé) : un message
--    ne part qu'une fois, même si le minuteur repasse. Aucun contenu, seulement la clé et l'heure ; effacé avec le
--    compte (cascade) et purgé après 400 jours par la tâche du minuteur.
--
-- Sûre sur une base peuplée :
-- - la nouvelle contrainte est posée NOT VALID puis validée (la validation ne prend qu'un verrou SHARE UPDATE
--   EXCLUSIVE : lectures et écritures continuent) ; l'ancienne valeur admise reste admise, aucune ligne ne peut échouer ;
-- - `subscriptions` est une petite table : son index partiel est créé ici (`if not exists` : rien à faire s'il a été
--   créé avant avec `concurrently`, docs/DEPLOIEMENT-V7.md) ;
-- - la nouvelle table est vide, sans défaut à recopier.
-- Rejouable : chaque instruction est idempotente.

set local lock_timeout = '5s';

-- ── 1. Offre hebdomadaire ───────────────────────────────────────────────────
alter table public.subscriptions drop constraint if exists subscriptions_plan_check;
alter table public.subscriptions
  add constraint subscriptions_plan_check check (plan in ('yearly', 'monthly', 'weekly')) not valid;
alter table public.subscriptions validate constraint subscriptions_plan_check;

-- Au revoir et relance (tâche BillingJobs) : abonnements dont l'échéance est passée depuis moins de 60 jours.
create index if not exists subscriptions_expires_idx on public.subscriptions (expires_at)
  where status not in ('refunded', 'revoked');

-- ── 2. Journal des messages de fidélisation ─────────────────────────────────
create table if not exists public.lifecycle_messages (
  user_id uuid not null references public.profiles (id) on delete cascade,
  key text not null check (char_length(key) between 1 and 200),
  sent_at timestamptz not null default now(),
  primary key (user_id, key)
);
create index if not exists lifecycle_messages_sent_idx on public.lifecycle_messages (sent_at);

-- Écrit et lu par l'API seule (clé service) : RLS sans politique.
alter table public.lifecycle_messages enable row level security;
