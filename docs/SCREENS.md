# Écrans de l'app (expo-router)

Chaque écran est fin : un template de `@blowy/ui`, des organismes, un hook de `src/features/*`. Aucun `StyleSheet` de
présentation dans `app/**` (uniquement de la mise en page triviale passée par les props des templates). Textes dans
`src/locales/<zone>.ts`. Navigation par `expo-router` (`router.push`, `Redirect`, `Link`).

| Route | Maquette | Données |
|---|---|---|
| `app/index.tsx` | — | `useGate()` → redirige vers `/(onboarding)/welcome`, `/(onboarding)/profil` ou `/(tabs)` |
| `app/(onboarding)/welcome.tsx` | V6-Welcome | — (« j'ai déjà un compte » → compte) |
| `app/(onboarding)/craft.tsx` | V6-Craft | `useDraft` (espèce + nom) |
| `app/(onboarding)/caractere.tsx` | V6-Caractere | `QUIZ`, `useDraft.answer`, résultat = jauges |
| `app/(onboarding)/compte.tsx` | V6-Compte | `useSendCode`, `useVerifyCode` (e-mail puis code à 6 chiffres) |
| `app/(onboarding)/profil.tsx` | (suite de Compte) | prénom, date de naissance (18+), ville, code d'invitation → `useOnboard` |
| `app/(onboarding)/invite.tsx` | V6-Invite | `useMe` : lien d'invitation + lien « 3 mots » à partager |
| `app/(onboarding)/paywall.tsx` | V6-Paywall | `usePorts().purchases` (non branché : offre présentée, « continuer gratuitement ») |
| `app/(tabs)/_layout.tsx` | barre du bas | `BottomTabBar`, pastille = `totalUnread` + rencontres reçues |
| `app/(tabs)/index.tsx` | V6-Chats | `useLinks`, `useEncounters` (bandeau « X t'a salué ») |
| `app/(tabs)/pet.tsx` | V6-Pet | `usePet`, `useAnswerChallenge`, `useRenamePet` |
| `app/(tabs)/rencontres.tsx` | V6-Rencontres | `useEncounters`, `useWave`, `useAcceptEncounter`, `useDeclineEncounter` |
| `app/(tabs)/moi.tsx` | V6-Moi | `useMe`, `useSignOut` |
| `app/link/[id]/index.tsx` | V6-Aujourdhui, V6-Chat, V6-Souvenirs, V6-Fantome | `useLink`, `useMessages`, `useSendMessage`, `useSendPhoto`, `useMemories`, `useRevive`, `useMarkRead` |
| `app/link/[id]/niveaux.tsx` | V6-Lien | `useLink` |
| `app/link/[id]/options.tsx` | — | `useReport`, `useBlock`, `useArchiveLink` |
| `app/pet/evolution.tsx` | V6-Evolution | `usePet` |
| `app/rencontre/[userId].tsx` | V6-Rencontre | `useEncounters` (cache) |
| `app/carte.tsx` | V6-Carte | `useLinks`, `useEncounters` : carte stylisée du voisinage du pet (pas de géolocalisation en V1) |
| `app/moi/compte.tsx` | — | `useMe`, `useUpdateMe`, `useSetAvatar` |
| `app/moi/bloques.tsx` | — | `useBlocks`, `useUnblock` |
| `app/moi/supprimer.tsx` | — | `useDeleteAccount` |
| `app/moi/blowy-plus.tsx` | V6-Paywall | même contenu que le paywall |
| `app/i/[code].tsx` | — | lien d'invitation : `useInvite`, `useAcceptInvite`, `usePendingInvite` |
| `app/+not-found.tsx` | — | — |
