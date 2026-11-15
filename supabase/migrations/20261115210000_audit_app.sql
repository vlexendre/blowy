-- Audit App Store (docs/AUDIT-APPLE.md, B5 ; App Review 5.1.2(i)) — accord explicite avant d'envoyer une photo de
-- preuve d'habitude à l'IA tierce. Sans accord (null : jamais demandé ; false : refusé ou retiré), l'API n'envoie
-- aucune image au prestataire d'IA : la preuve compte comme « pas sûr » (on fait confiance), ou l'habitude se valide
-- sans photo. Comme pour le reste du schéma : l'API (clé service) est la seule à écrire.
--
-- Sûre sur une base peuplée, et à appliquer AVANT le code (l'API d'avant ignore ces colonnes) :
-- - deux colonnes nullables sans valeur par défaut : changement de catalogue seulement, sans réécriture ni parcours
--   de `profiles` (verrou exclusif de quelques millisecondes) ;
-- - `lock_timeout` : si le verrou n'arrive pas en 5 s, la migration échoue proprement (rien n'est appliqué) ; la relancer ;
-- - aucune donnée reprise : tout le monde part de « jamais demandé », l'app pose la question avant la première preuve.
-- Les objets premium de Blowy+ (audit B3) ne demandent rien en base : la garde-robe les calcule depuis `plus_until`.

set local lock_timeout = '5s';

alter table public.profiles add column if not exists ai_proofs_consent boolean;
alter table public.profiles add column if not exists ai_proofs_consent_at timestamptz;

comment on column public.profiles.ai_proofs_consent is
  'Vérification des preuves d''habitude par l''IA tierce : null jamais demandé, true accepté, false refusé ou retiré (audit B5).';
comment on column public.profiles.ai_proofs_consent_at is 'Date de la dernière réponse (accord ou retrait).';
