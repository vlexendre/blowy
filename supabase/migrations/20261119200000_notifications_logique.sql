-- Logique des notifications (19 nov. 2026 ; docs/NOTIFICATIONS.md).
--
-- `notification_settings.marketing_opt_in_at` : accord explicite pour les offres en push (relance Minimoa+), donné dans
-- Moi › Notifications, retiré au même endroit (App Review 4.5.4). Null : pas d'accord (défaut pour tout le monde).
-- Le reste (priorités, regroupement des rafales, premier plan, décroissance) n'a besoin d'aucune colonne : la clé d'une
-- conversation ou d'un paquet et les compteurs d'un report vivent dans `notification_log.vars` (jamais de contenu de
-- message).
--
-- Sûre sur une base peuplée : colonne nullable sans défaut (aucune réécriture de la table). Rejouable.

set local lock_timeout = '5s';

alter table public.notification_settings add column if not exists marketing_opt_in_at timestamptz;

comment on column public.notification_settings.marketing_opt_in_at is
  'Accord explicite pour les offres en push (App Review 4.5.4) ; null : pas d''accord.';
