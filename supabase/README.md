# Base Supabase

Projet : `blowy` (référence `sqxebllmatfflopqddaw`, région eu-west-3).

- `migrations/` : schéma, à appliquer dans l'ordre (`supabase db push` ou via le tableau de bord).
- L'API NestJS écrit avec la clé service ; l'app ne fait que lire (messages et liens en temps réel) grâce aux politiques RLS.
- Auth : connexion par code reçu par e-mail (OTP). Pour que les e-mails partent de ton domaine, renseigner Resend en SMTP dans Authentication → Emails → SMTP (hôte `smtp.resend.com`, port 465, utilisateur `resend`, mot de passe = clé API Resend) et mettre `{{ .Token }}` dans le modèle « Magic Link ».
