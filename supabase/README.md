# Base Supabase

Projet : `blowy` (référence `sqxebllmatfflopqddaw`, région eu-west-3).

- `migrations/` : schéma, à appliquer dans l'ordre (`supabase db push` ou via le tableau de bord).
- L'API NestJS écrit avec la clé service ; l'app ne fait que lire messages et liens en temps réel (seules politiques RLS ; toutes les autres tables ont la RLS sans politique). Vérification après chaque migration : `pnpm --filter @blowy/api check:schema` sur un PostgreSQL local. Mise en production V7 : `docs/DEPLOIEMENT-V7.md`.
- Auth : connexion par code reçu par e-mail (OTP). Pour que les e-mails partent de ton domaine, renseigner Resend en SMTP dans Authentication → Emails → SMTP (hôte `smtp.resend.com`, port 465, utilisateur `resend`, mot de passe = clé API Resend) et coller `templates/code.html` dans les modèles « Confirm signup » et « Magic Link » (voir `templates/README.md`).
