# Écrans de l'app (expo-router)

Chaque écran est fin : un template de `@blowy/ui`, des organismes, un hook de `src/features/*`. Aucun `StyleSheet` de
présentation dans `app/**` (uniquement de la mise en page triviale passée par les props des templates). Textes dans
`src/locales/<zone>.ts`. Navigation par `expo-router` (`router.push`, `Redirect`, `Link`).

| Route | Maquette | Données |
|---|---|---|
| `app/index.tsx` | — | `useGate()` → redirige vers `/(onboarding)/welcome`, la reprise de l'inscription (`resumeOnboarding()` : préparation si le brouillon est complet, sinon création du pet) ou l'accueil `/(tabs)/pet` (l'app s'ouvre sur le pet) |
| `app/(onboarding)/welcome.tsx` | V6-Welcome | — (« créer mon pet » → entrée en scène ; « j'ai déjà un compte » → compte en mode `login`) |
| `app/(onboarding)/entree.tsx` | — | entrée en scène : `useSceneSteps` (4 lignes, une par pet, ≈ 4,6 s, tap = ligne suivante, « passer ») ; se termine par `router.replace` vers craft (revenir du choix ramène à la bienvenue) |
| `app/(onboarding)/craft.tsx` | V6-Craft | `useDraft` (espèce + nom) ; à partir d'ici, ce pet est l'hôte |
| `app/(onboarding)/caractere.tsx` | V6-Caractere | `QUIZ`, `useDraft.quiz` : une question par écran posée par l'hôte (`OnboardingTemplate host`), choisir passe à la suivante ; puis le temps fort (`StageTemplate` + `PetRise`, verdict mot à mot, deux traits en puces, tap pour continuer) |
| `app/(onboarding)/prenom.tsx` | — | `useDraft.displayName` (grand champ centré) |
| `app/(onboarding)/naissance.tsx` | V6-TropJeune | `useDraft.birthdate` (18+ vérifié sur place : `AgeGate`, brouillon vidé) |
| `app/(onboarding)/ville.tsx` | — | `useDraft.city` (facultatif, « passer ») et `inviteCode` (repris de `usePendingInvite`, champ replié sinon) |
| `app/(onboarding)/promesse.tsx` | — | la promesse : `HoldButton` (maintenir ou toucher), rien n'est enregistré ; → compte, ou préparation si déjà connecté |
| `app/(onboarding)/compte.tsx` | V6-Compte | `useSendCode`, `useVerifyCode` (e-mail puis code à 6 chiffres) ; inscription : hôte + barre continue ; `mode=login` : panneau « content de te revoir », sans barre ; suite décidée par `useAfterSignIn` |
| `app/(onboarding)/preparation.tsx` | — | `useOnboard` (la vraie création du compte et du pet) + `usePrepTicker` (barre honnête : 100 % seulement après la réussite) ; erreur → bannière « réessayer » ; `too_young` → `AgeGate` ; `already_onboarded` → accueil |
| `app/(onboarding)/pret.tsx` | — | `useMe` : « tout est prêt, <prénom> ! », un bouton → invitations |
| `app/(onboarding)/invite.tsx` | V6-Invite | `useMe` : lien d'invitation + lien « 3 mots » à partager |
| `app/(onboarding)/paywall.tsx` | V6-Paywall | `usePorts().purchases` (non branché : offre présentée, « continuer gratuitement ») ; sortie → `/(tabs)/pet` |
| `app/(tabs)/_layout.tsx` | barre du bas | `BottomTabBar` : **Mon pet · Chats · Rencontres · Moi** (onglet de départ : `pet`) ; pastilles = `totalUnread`, rencontres reçues |
| `app/(tabs)/pet.tsx` | V6-Accueil, V6-Boude, V6-Debloque | accueil : `useLivePet` (relu au retour sur l'onglet et toutes les 3 min), `useCare`, `useWardrobe`, `useUnlocks` ; `PetStage` (tenue, forme, bulle), `NeedsPanel`, `CareBar` (`canCare`, `careHot`), carte garde-robe (`nextItem`), carte caractère, carte « il ne sort plus » quand il boude ; `UnlockCelebration` fête les `newItems` |
| `app/(tabs)/chats.tsx` | V6-Chats | `useLinks`, `useEncounters` (bandeau « X t'a salué ») |
| `app/(tabs)/rencontres.tsx` | V6-Rencontres | `useEncounters`, `useWave`, `useAcceptEncounter`, `useDeclineEncounter` ; `petShape` `boude` → état dédié (`shapeLabel.boude`, « m'occuper de lui » → accueil), `bof` → bandeau ; salut refusé (`forbidden`) → bandeau vers l'accueil |
| `app/(tabs)/moi.tsx` | V6-Moi | `useMe`, `useSignOut` |
| `app/link/[id]/index.tsx` | V6-Aujourdhui, V6-Chat, V6-Souvenirs, V6-Fantome | `useLink`, `useMessages`, `useSendMessage`, `useSendPhoto`, `useMemories`, `useRevive`, `useMarkRead` |
| `app/link/[id]/niveaux.tsx` | V6-Lien | `useLink` |
| `app/link/[id]/options.tsx` | — | `useReport`, `useBlock`, `useArchiveLink` |
| `app/pet/caractere.tsx` | V6-Pet | son caractère (ancien onglet Mon pet) : `usePet`, `useAnswerChallenge`, `useRenamePet` ; ouvert depuis l'accueil |
| `app/pet/garde-robe.tsx` | V6-GardeRobe, V6-Objet | `useWardrobe`, `useSetOutfit` + `withItem` (porter / retirer, optimiste) ; fiche d'un objet à gagner (étape, avancement, raccourci) ou premium (« bientôt disponible », pas d'achat) |
| `app/pet/evolution.tsx` | V6-Evolution | `usePet` |
| `app/rencontre/[userId].tsx` | V6-Rencontre | `useEncounters` (cache) |
| `app/carte.tsx` | V6-Carte | `useLinks`, `useEncounters` : carte stylisée du voisinage du pet (pas de géolocalisation en V1) |
| `app/moi/compte.tsx` | — | `useMe`, `useUpdateMe`, `useSetAvatar` |
| `app/moi/bloques.tsx` | — | `useBlocks`, `useUnblock` |
| `app/moi/supprimer.tsx` | — | `useDeleteAccount` |
| `app/moi/blowy-plus.tsx` | V6-Paywall | même contenu que le paywall |
| `app/i/[code].tsx` | — | lien d'invitation : `useInvite`, `useAcceptInvite`, `usePendingInvite` |
| `app/+not-found.tsx` | — | — |

## Inscription (ordre et règles)
Bienvenue → entrée en scène → créer son pet → caractère (4 questions + temps fort) → prénom → date de naissance →
ville → promesse → compte (e-mail, code) → préparation (création réelle) → tout est prêt → invitations → Blowy+ → accueil.
- Le pet choisi est l'**hôte** : petit en haut à gauche, il pose chaque question dans sa bulle (`OnboardingTemplate host`).
  Une seule barre d'avancement continue de la création au code (`progressAt(step)` dans `features/onboarding`, liste `FLOW`).
- Le compte vient tard ; la création (`useOnboard`) n'a lieu qu'à la préparation, une fois connecté. Déjà connecté sans pet
  (connexion d'un compte sans pet) : la promesse saute l'e-mail.
- Retour arrière à chaque étape, sans perdre la saisie (brouillon zustand). Rechargé en plein milieu (web), le brouillon
  est vide : chaque écran après la création renvoie à l'aiguillage (`hasDraftPet` / `isDraftComplete`, lus une fois).
- Connexion (« j'ai déjà un compte ») : compte → accueil, sans aucune des étapes ci-dessus (sauf compte sans pet → création).

## Soins et garde-robe
- L'app s'ouvre sur **Mon pet** (après l'aiguillage, l'inscription, la connexion, l'invitation « plus tard »). Les retours
  qui veulent vraiment dire « les chats » (lien archivé, signalement, lien disparu) restent sur `/(tabs)/chats`.
- Bulle du pet : son besoin le plus urgent (`urgentNeed`), sinon une phrase joyeuse ; choix stable d'après l'état
  (`pickLine`, 3 phrases par cas dans `locales/pet.ts`). Après un soin : `careLabel[action].done` ; geste refusé
  (`canCare` faux, ou `already_done` de l'API) : la raison, dans la bulle.
- Objets gagnés : chaque `PetView` d'une action (soin, défi) pousse ses `newItems` dans `useUnlocks` ; `UnlockCelebration`
  (accueil et caractère) les fête un par un, et l'étiquette « nouveau » reste dans la garde-robe jusqu'à sa visite.
- Les autres voient la tenue : `Avatar` montre le médaillon habillé dès que `pet.outfit` n'est pas vide (rangées des chats,
  en-tête du lien, bulles des pets, rencontres, carte) ; `EncounterStage` et `InvitationPanel` montrent le pet habillé.
