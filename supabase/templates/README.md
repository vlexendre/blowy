# Modèles d'e-mail Supabase

Générés par `pnpm emails:preview --supabase` avec la mise en page des e-mails de l'API (`packages/content/src/email`) :
ne pas les retoucher à la main, modifier `scripts/email-previews.mts` puis régénérer. Images et police servies par le
site (`https://minimoa.app/email/…`) : déployer le site avant de coller les modèles. Supabase n'envoie qu'une langue :
français, avec une ligne en anglais.

La connexion se fait par code à 6 chiffres, jamais par lien. Dans Supabase → Authentication → Emails → Templates :

| Modèle Supabase | Fichier | Sujet | Envoyé quand |
|---|---|---|---|
| **Confirm signup** | `code.html` | `Ton code Minimoa : {{ .Token }}` | première connexion d'une adresse (création du compte, `signInWithOtp` avec `shouldCreateUser: true` : app en connexion par e-mail) |
| **Magic Link** | `code.html` | `Ton code Minimoa : {{ .Token }}` | connexions suivantes, et chaque connexion à l'administration (`signInWithOtp`, `shouldCreateUser: false`) |
| **Invite user** | `invite.html` | `Ton accès à Minimoa` | « Invite » dans Authentication › Users (accès à l'administration, apps/admin/README.md) |

Si un seul des deux premiers est modifié, les nouveaux comptes reçoivent un lien de confirmation au lieu du code.
Les autres modèles (Change email address, Reset password, Reauthentication) ne servent pas : pas de mot de passe, pas
de changement d'adresse dans l'app. Le compte de revue d'Apple passe par `generateLink`, qui n'envoie rien.

Par l'API de gestion (`PATCH /v1/projects/{ref}/config/auth`) : `mailer_subjects_confirmation`,
`mailer_templates_confirmation_content`, `mailer_subjects_magic_link`, `mailer_templates_magic_link_content` (contenu
de `code.html`), `mailer_subjects_invite`, `mailer_templates_invite_content` (contenu de `invite.html`).
