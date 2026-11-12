# Modèles d'e-mail Supabase

La connexion se fait par code à 6 chiffres, jamais par lien. Dans Supabase → Authentication → Emails → Templates,
coller `code.html` dans **les deux** modèles, avec le sujet `ton code blowy : {{ .Token }}` :

- **Confirm signup** : envoyé à la première connexion d'une adresse (création du compte) ;
- **Magic Link** : envoyé aux connexions suivantes.

Si un seul des deux est modifié, les nouveaux comptes reçoivent un lien de confirmation au lieu du code.
