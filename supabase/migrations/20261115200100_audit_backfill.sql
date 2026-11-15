-- Reprise de l'audit App Store (après 20261115200000_audit.sql, transaction à part : verrous de ligne seulement).
-- Rejouable, sans effet la deuxième fois. Juste après le déploiement du code, relancer la partie 1 seule (l'API d'avant
-- a pu enregistrer des positions exactes entre la migration et le déploiement) ; ne pas relancer la partie 2 (elle
-- ferait taire des alertes que le nouveau code n'a pas encore envoyées).

set local lock_timeout = '5s';

-- 1. Positions déjà gardées : le dernier relevé est ramené au centre de sa maille de ~300 m, comme le fait désormais
--    l'API à l'écriture (`storedPoint` = `snapToGrid(p, 300)` du domaine). La zone du domicile et la zone « candidate »
--    l'étaient déjà. Un point déjà arrondi reste où il est.
with grid as (
  select user_id,
         (floor(last_lat / (300 / 111320.0)) + 0.5) * (300 / 111320.0) as lat
  from public.profile_places
),
snapped as (
  select g.user_id,
         round(g.lat::numeric, 6)::double precision as lat,
         round(((floor(p.last_lng / (300 / (111320.0 * greatest(0.01, cos(radians(g.lat)))))) + 0.5)
                * (300 / (111320.0 * greatest(0.01, cos(radians(g.lat))))))::numeric, 6)::double precision as lng
  from grid g join public.profile_places p on p.user_id = g.user_id
)
update public.profile_places p set last_lat = s.lat, last_lng = s.lng
from snapped s
where s.user_id = p.user_id and (p.last_lat <> s.lat or p.last_lng <> s.lng);

-- 2. Signalements créés avant le nouveau code : déjà visibles dans l'administration, on ne les renvoie pas comme
--    « nouveaux » à l'équipe. (Ceux restés ouverts plus de 24 h seront annoncés une fois comme « en retard ».)
--    Seulement ceux de plus de 10 minutes : un signalement fait pendant le déploiement part quand même.
update public.reports set alerted_at = created_at
where alerted_at is null and created_at < now() - interval '10 minutes';
