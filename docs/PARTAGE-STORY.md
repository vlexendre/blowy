# Partager l'invitation en story Instagram

Après l'inscription, « Partager en story » (écran `app/(onboarding)/invite.tsx`) envoie une **image** dans l'éditeur de
story d'Instagram, comme NGL : le minimoa de la personne, « Mon minimoa cherche le tien » et son lien d'invitation.

## Comment ça marche
1. L'image est le composant `StoryCard` (`packages/ui`, 360 × 640), rendu hors de l'écran et capturé en PNG
   1080 × 1920 (`react-native-view-shot`, `captureStory`).
2. `shareStoryImage` (`apps/mobile/src/core/adapters/story-share.ts`, via `react-native-share`) suit « Sharing to
   Stories » de Meta : l'image est posée dans le presse-papiers sous la clé d'Instagram, puis
   `instagram-stories://share?source_application=<identifiant Meta>` ouvre l'éditeur avec l'image en fond.
3. Sans identifiant Meta, sans Instagram, ou si Instagram refuse : la feuille de partage d'iOS s'ouvre avec la même
   image (Instagram, Snapchat, Messages…). Sur le web : partage du lien en texte, comme avant.

## Ce que le propriétaire doit régler
1. Créer une app sur developers.facebook.com (type « Consumer » ou « Business », aucun produit à ajouter) et noter son
   **App ID**. Meta l'exige depuis janvier 2023 pour le partage en story.
2. Mettre cet identifiant (public) dans `EXPO_PUBLIC_FACEBOOK_APP_ID` : bloc `env` des profils de `apps/mobile/eas.json`
   (ou variable d'environnement EAS), puis refaire un build.
3. Rien d'autre : `LSApplicationQueriesSchemes: ['instagram-stories']` est déjà dans `app.config.ts`.

## Limites à connaître
- Instagram ne laisse pas une app poser un **lien cliquable** : la personne ajoute elle-même l'autocollant « Lien »
  si elle le veut. Le lien est donc écrit en clair sur l'image.
- Jamais essayé sur un iPhone depuis cet environnement : l'ouverture d'Instagram, la capture hors écran et le retour
  dans l'app sont à vérifier sur TestFlight.
