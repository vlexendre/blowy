-- V7 — manques signalés par l'app : réglage par défaut de la lecture des chats par une IA, accord « par défaut »
-- d'un lien, mouvement des axes dans le bilan de la semaine, jetons d'Apple pour la révocation à la suppression.
-- Comme pour le reste du schéma : l'API (clé service) est la seule à écrire ; RLS activée partout, sans politique.
-- Sûre sur une base déjà peuplée : colonnes ajoutées avec une valeur par défaut constante (instantané, sans
-- réécriture), contraintes CHECK posées NOT VALID puis validées (verrou SHARE UPDATE EXCLUSIVE), nouvelle table vide.

-- ── Lecture des chats par une IA : réglage par défaut des nouveaux liens ─────────────────────────────────────────
-- ask : la question est posée à la première ouverture du chat (comportement d'avant, valeur de tous les comptes
-- existants) · on / off : l'accord du nouveau lien est écrit d'office (chat_link_settings.by_default = true).
alter table public.profiles add column chat_reading_default text not null default 'ask';
alter table public.profiles
  add constraint profiles_chat_reading_default_check check (chat_reading_default in ('ask', 'on', 'off')) not valid;
alter table public.profiles validate constraint profiles_chat_reading_default_check;

-- L'accord vient du réglage par défaut (et non d'une réponse dans ce chat) : le chat le dit en une ligne.
alter table public.chat_link_settings add column by_default boolean not null default false;

-- ── Bilan de la semaine : mouvement de chaque axe (direction et taille, jamais de chiffre) ───────────────────────
-- [{ "axis": "foyer", "direction": "up" | "down" | "steady", "size": "small" | "medium" | "large" | null }]
alter table public.weekly_reviews add column axis_moves jsonb not null default '[]'::jsonb;

-- ── Sign in with Apple : jeton de rafraîchissement, pour révoquer l'accès quand le compte est supprimé ───────────
-- Obtenu par l'API en échangeant le code d'autorisation envoyé par l'app à la connexion (POST /v1/me/apple-authorization).
-- Rattaché au compte d'authentification (la connexion précède l'inscription) : supprimé avec lui. L'API le lit
-- avant de supprimer le compte, appelle https://appleid.apple.com/auth/revoke, puis supprime le compte.
-- Jamais lisible par l'app (RLS sans politique), jamais journalisé.
create table public.apple_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  refresh_token text not null check (length(refresh_token) between 1 and 4000),
  client_id text not null check (length(client_id) between 1 and 255),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.apple_tokens enable row level security;
revoke all on table public.apple_tokens from anon, authenticated;
