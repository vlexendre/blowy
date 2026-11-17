-- V7 §27 — Des relations, pas un site de rencontre : on ne demande plus ce que les gens cherchent.
-- Les réponses déjà enregistrées (« ce que tu cherches », « qui tu veux rencontrer ») et l'accord sur cette donnée
-- sensible sont effacés. Les colonnes restent (valeur neutre : `seeking` = 'potes', `whom` et l'accord à null) le temps
-- d'un nettoyage ultérieur ; l'API ne les lit ni ne les écrit plus.
--
-- Sûre sur une base peuplée : aucune structure ne change (pas de verrou de table au-delà de ROW EXCLUSIVE), seules les
-- lignes qui portent encore une réponse sont touchées, par paquets de 5 000 (la contrainte
-- `profiles_whom_matches_seeking` est respectée ligne par ligne : `seeking` et `whom` changent dans la même mise à jour).
-- Rejouable : une seconde exécution ne trouve plus rien à effacer.

set local lock_timeout = '5s';

do $$
declare
  touched integer;
begin
  loop
    update public.profiles p
       set seeking = 'potes', whom = null, sensitive_consent_at = null
     where p.id in (
       select id from public.profiles
        where seeking <> 'potes' or whom is not null or sensitive_consent_at is not null
        limit 5000
     );
    get diagnostics touched = row_count;
    exit when touched = 0;
  end loop;
end
$$;

comment on column public.profiles.seeking is 'Plus utilisée (V7 §27, 17 nov.) : toujours ''potes''. À supprimer lors d''un nettoyage.';
comment on column public.profiles.whom is 'Plus utilisée (V7 §27, 17 nov.) : toujours null. À supprimer lors d''un nettoyage.';
comment on column public.profiles.sensitive_consent_at is 'Plus utilisée (V7 §27, 17 nov.) : toujours null. À supprimer lors d''un nettoyage.';
