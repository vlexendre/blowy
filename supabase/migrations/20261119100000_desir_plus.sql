-- Désir de Minimoa+ sans rien inventer (docs/DESIR.md).
--
-- 1. `growth_counters` : trois compteurs de plus, par déclencheur de la feuille Minimoa+ (`source` = le déclencheur,
--    20 caractères au plus) : `plus_open` (feuille ouverte), `plus_trial` (essai commencé), `plus_paid` (premier
--    paiement). Aucune personne derrière : des nombres par jour.
-- 2. `pet_items.source` accepte `collection` : objet d'une collection saisonnière reçu avec Minimoa+ pendant la
--    collection, gardé après sa date de fin (la rareté est réelle : après la fin, personne d'autre ne peut l'avoir).
--
-- Les moments clés (proposition forte, une par moment, jamais deux en moins de 3 jours) n'ont pas de table : ils
-- réservent leurs clés dans `lifecycle_messages` (`plus_moment:<moment>`, `plus_strong:<jour>`), purgées après 400 jours.
--
-- Sûre sur une base peuplée : aucune colonne ajoutée ; chaque contrainte est remplacée en NOT VALID puis validée
-- (verrou SHARE UPDATE EXCLUSIVE seulement : lectures et écritures continuent) ; toutes les valeurs déjà admises
-- le restent, aucune ligne ne peut échouer. Rejouable.

alter table public.growth_counters drop constraint if exists growth_counters_metric_check;
alter table public.growth_counters
  add constraint growth_counters_metric_check
  check (metric ~ '^(visit_(m|g|i|c)|first_open|signup|words_vote|share_(invite|words|group|moment)|quiz_(start|done|share)|quartier_(join|confirm)|plus_(open|trial|paid))$') not valid;
alter table public.growth_counters validate constraint growth_counters_metric_check;

alter table public.pet_items drop constraint if exists pet_items_source_check;
alter table public.pet_items
  add constraint pet_items_source_check check (source in ('start', 'milestone', 'purchase', 'collection')) not valid;
alter table public.pet_items validate constraint pet_items_source_check;
