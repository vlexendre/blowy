-- Objets retirés du jeu (20 nov. 2026) : quatre vêtements pensés pour un corps humain, qui ne vont pas à un minimoa.
-- L'API les ignore déjà (catalogue `packages/domain/src/items.ts` : tenue relue sans eux, `pet_items` inconnus ignorés) ;
-- ce nettoyage ne fait que ranger la base. Aucune ligne ne les possédait en production au moment du retrait.
--
-- Sûre sur une base peuplée : suppressions et mises à jour ciblées (lignes concernées seulement), aucune colonne ni
-- contrainte. Rejouable : une seconde passe ne trouve plus rien.

set local lock_timeout = '5s';

delete from public.pet_items
where item_id in ('sweat', 'teddy', 'tablier', 'tutu');

-- Tenues : retire l'emplacement qui porte un de ces objets (quel que soit l'emplacement, par prudence).
update public.pets
set outfit = outfit - 'head' - 'face' - 'body' - 'toy'
  || jsonb_strip_nulls(jsonb_build_object(
    'head', case when outfit->>'head' in ('sweat', 'teddy', 'tablier', 'tutu') then null else outfit->'head' end,
    'face', case when outfit->>'face' in ('sweat', 'teddy', 'tablier', 'tutu') then null else outfit->'face' end,
    'body', case when outfit->>'body' in ('sweat', 'teddy', 'tablier', 'tutu') then null else outfit->'body' end,
    'toy', case when outfit->>'toy' in ('sweat', 'teddy', 'tablier', 'tutu') then null else outfit->'toy' end
  ))
where outfit->>'head' in ('sweat', 'teddy', 'tablier', 'tutu')
   or outfit->>'face' in ('sweat', 'teddy', 'tablier', 'tutu')
   or outfit->>'body' in ('sweat', 'teddy', 'tablier', 'tutu')
   or outfit->>'toy' in ('sweat', 'teddy', 'tablier', 'tutu');
