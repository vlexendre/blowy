-- V7 — chantier « plateforme » : compteur et budgets de l'IA, minimoas dans le chat (accord de lecture, rôles,
-- plafonds), notifications push (appareils, réglages, journal, reçus) et minuteur.
-- Comme pour le reste du schéma : l'API (clé service) est la seule à écrire. Les tables ajoutées ici ont la RLS
-- activée et AUCUNE politique (l'app ne les lit pas). Seule la politique de lecture de `messages` change, pour que
-- les garde-fous (visibles par une seule personne) ne fuient pas par le temps réel.

-- ── IA : compteur et budgets ──────────────────────────────────────────────
-- Agrégats par jour (Europe/Paris), fonction et palier. Coûts en micro-dollars (estimation au prix public).
create table public.ai_usage_daily (
  day date not null,
  feature text not null,
  tier text not null check (tier in ('small', 'medium')),
  calls integer not null default 0,
  declined integer not null default 0,
  errors integer not null default 0,
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  cache_write_tokens bigint not null default 0,
  cache_read_tokens bigint not null default 0,
  cost_micros bigint not null default 0,
  primary key (day, feature, tier)
);

-- Appels par personne, par jour et par fonction (budget personnel). Purgé après 2 jours par le minuteur.
create table public.ai_user_calls (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  feature text not null,
  calls integer not null default 0,
  primary key (user_id, day, feature)
);
create index ai_user_calls_day_idx on public.ai_user_calls (day);

-- Prend un appel sur le budget de la personne, de façon atomique ; faux si le budget du jour est épuisé.
create function public.ai_take_user_call(p_user uuid, p_day date, p_feature text, p_max integer)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  taken integer;
begin
  insert into public.ai_user_calls as c (user_id, day, feature, calls)
  values (p_user, p_day, p_feature, 1)
  on conflict (user_id, day, feature) do update set calls = c.calls + 1
    where c.calls < p_max
  returning c.calls into taken;
  return taken is not null and taken <= p_max;
end;
$$;

-- Ajoute un appel (ou un refus) aux agrégats du jour.
create function public.ai_record_usage(
  p_day date, p_feature text, p_tier text, p_calls integer, p_declined integer, p_errors integer,
  p_input bigint, p_output bigint, p_cache_write bigint, p_cache_read bigint, p_cost_micros bigint
)
returns void
language sql
set search_path = ''
as $$
  insert into public.ai_usage_daily as u
    (day, feature, tier, calls, declined, errors, input_tokens, output_tokens, cache_write_tokens, cache_read_tokens, cost_micros)
  values (p_day, p_feature, p_tier, p_calls, p_declined, p_errors, p_input, p_output, p_cache_write, p_cache_read, p_cost_micros)
  on conflict (day, feature, tier) do update set
    calls = u.calls + excluded.calls,
    declined = u.declined + excluded.declined,
    errors = u.errors + excluded.errors,
    input_tokens = u.input_tokens + excluded.input_tokens,
    output_tokens = u.output_tokens + excluded.output_tokens,
    cache_write_tokens = u.cache_write_tokens + excluded.cache_write_tokens,
    cache_read_tokens = u.cache_read_tokens + excluded.cache_read_tokens,
    cost_micros = u.cost_micros + excluded.cost_micros;
$$;

revoke all on function public.ai_take_user_call(uuid, date, text, integer) from public, anon, authenticated;
revoke all on function public.ai_record_usage(date, text, text, integer, integer, integer, bigint, bigint, bigint, bigint, bigint) from public, anon, authenticated;
grant execute on function public.ai_take_user_call(uuid, date, text, integer) to service_role;
grant execute on function public.ai_record_usage(date, text, text, integer, integer, integer, bigint, bigint, bigint, bigint, bigint) to service_role;

-- ── Minimoas dans le chat ─────────────────────────────────────────────────
-- Accord de lecture par l'IA et coupure, par personne et par lien. consent null = question pas encore posée.
create table public.chat_link_settings (
  link_id uuid not null references public.links (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  consent boolean,
  consent_at timestamptz,
  muted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (link_id, user_id)
);
-- « Moi » : mes réglages par lien, par pages.
create index chat_link_settings_user_idx on public.chat_link_settings (user_id, link_id);

-- Compteurs d'interventions d'un lien. Rien du texte analysé n'est conservé : seulement des compteurs et des dates.
create table public.chat_pet_state (
  link_id uuid primary key references public.links (id) on delete cascade,
  day date,
  interventions smallint not null default 0 check (interventions >= 0),
  messages_since_remark integer not null default 0,
  icebreaker_done boolean not null default false,
  last_nudge_for timestamptz,
  last_guard_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Rôle des répliques de minimoa et destinataire unique (garde-fou).
alter table public.messages
  add column pet_role text check (pet_role is null or pet_role in ('icebreaker', 'nudge', 'remark', 'guard', 'event')),
  add column visible_to uuid references public.profiles (id) on delete cascade;
-- Santé du lien : messages des personnes sur 7 jours.
create index messages_link_user_idx on public.messages (link_id, created_at desc) where author_kind = 'user';

-- Le temps réel applique la RLS : un garde-fou n'est livré qu'à la personne concernée.
drop policy "membres : lire les messages de leurs liens" on public.messages;
create policy "membres : lire les messages de leurs liens" on public.messages
  for select to authenticated
  using (
    (visible_to is null or visible_to = (select auth.uid()))
    and exists (
      select 1 from public.links l
      where l.id = messages.link_id and (select auth.uid()) in (l.user_a, l.user_b)
    )
  );

-- Minuteur : liens à rattraper (vies perdues) et silences à relancer, sans parcourir toute la table.
create index links_due_tick_idx on public.links (last_tick_on) where status = 'active';
create index links_silence_idx on public.links (last_message_at) where status = 'active';

-- ── Notifications ─────────────────────────────────────────────────────────
-- Jetons des appareils. kind 'expo' : push Expo ; 'apns_live_activity' : réservé aux activités en direct (à venir).
create table public.push_devices (
  token text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  kind text not null default 'expo' check (kind in ('expo', 'apns_live_activity')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  disabled_at timestamptz
);
create index push_devices_user_idx on public.push_devices (user_id) where disabled_at is null;

-- Réglages par personne. next_morning_at : prochain envoi du défi du jour (minuteur, par lots).
create table public.notification_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  time_zone text not null default 'Europe/Paris',
  morning_hour smallint not null default 9 check (morning_hour between 8 and 21),
  disabled_kinds text[] not null default '{}',
  next_morning_at timestamptz,
  updated_at timestamptz not null default now()
);
create index notification_settings_morning_idx on public.notification_settings (next_morning_at) where next_morning_at is not null;

-- Journal des envois (plafond du jour, une fois par jour, délai entre messages) et file des reports (heures calmes).
-- vars n'est rempli que pour un report (prénoms) et vidé à l'envoi ; jamais de contenu de message.
create table public.notification_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  link_id uuid references public.links (id) on delete cascade,
  local_day date not null,
  status text not null check (status in ('sent', 'deferred', 'dropped')),
  send_after timestamptz,
  vars jsonb,
  created_at timestamptz not null default now()
);
create index notification_log_user_day_idx on public.notification_log (user_id, local_day);
create index notification_log_deferred_idx on public.notification_log (send_after) where status = 'deferred';
create index notification_log_created_idx on public.notification_log (created_at);

-- Tickets Expo à vérifier ~15 min après l'envoi (jetons invalides → appareil désactivé).
create table public.push_receipts (
  ticket_id text primary key,
  token text not null,
  created_at timestamptz not null default now()
);
create index push_receipts_created_idx on public.push_receipts (created_at);

-- ── Minuteur ──────────────────────────────────────────────────────────────
-- Un créneau (minute) traité une seule fois par travail : un tick répété ne refait rien.
create table public.tick_runs (
  job text not null,
  slot timestamptz not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  done integer,
  primary key (job, slot)
);
create index tick_runs_started_idx on public.tick_runs (started_at);

alter table public.ai_usage_daily enable row level security;
alter table public.ai_user_calls enable row level security;
alter table public.chat_link_settings enable row level security;
alter table public.chat_pet_state enable row level security;
alter table public.push_devices enable row level security;
alter table public.notification_settings enable row level security;
alter table public.notification_log enable row level security;
alter table public.push_receipts enable row level security;
alter table public.tick_runs enable row level security;
