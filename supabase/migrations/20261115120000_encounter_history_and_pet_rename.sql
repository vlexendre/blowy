-- Historique des rencontres et changement de nom du pet limité.
-- Comme pour le reste du schéma : l'API (clé service) est la seule à écrire ; aucune politique RLS ajoutée
-- (les rencontres ne sont lues que par l'API ; le pet reste lisible par son propriétaire via « soi : lire son pet »).

-- Rencontres : moment du dernier changement de statut (le coucou, puis la réponse).
-- Il date chaque ligne de l'historique et sert à le trier et à le paginer.
alter table public.encounters add column status_at timestamptz;
update public.encounters set status_at = created_at where status_at is null;
alter table public.encounters
  alter column status_at set not null,
  alter column status_at set default now();

-- Historique d'une personne : ses coucous envoyés et ceux reçus, du plus récent au plus ancien.
create index encounters_from_status_at_idx on public.encounters (from_user, status_at desc);
create index encounters_to_status_at_idx on public.encounters (to_user, status_at desc);

-- Pets : dernier changement de nom (null tant qu'il garde le nom donné à sa création).
-- Sans Blowy+, le suivant n'est possible que 60 jours plus tard (règle dans packages/domain, appliquée par l'API).
alter table public.pets add column renamed_at timestamptz;

