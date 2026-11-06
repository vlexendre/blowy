# Inventaire des écrans V4 → app

Source : page « V4 — Finale (39 écrans) » de `design/v4-reference/project/canvas.json` (ordre et titres),
code lu dans `apps/mobile` et `apps/web` le 2026-11-06. Correspondance machine-lisible utilisée par
le banc : `tooling/qa/visual/routes.v4.json`.

**Statut** — *présent* : l'écran existe avec le contenu principal de la maquette (le style peut
différer) · *partiel* : route existante mais structure réduite (gabarit générique, sections
manquantes) ou état « indisponible » à la place du contenu faute d'endpoint · *absent* : aucune route.

**États** — lus dans la maquette (variables et blocs alternatifs du `.dc.html`) et dans le code.
Le rendu de référence ne montre que l'état par défaut de la maquette.

**Données de démo** — comptes du seed (`docs/runbooks/local-ios.md` §4 bis). Le banc injecte la
session (localStorage) et, pour les écrans pré-compte, un brouillon d'onboarding « Nino / NINO ».

| # | Maquette | Route expo-router (fichier `app/`) | Implémentation | États maquette / code | Données de démo | Statut |
|---|---|---|---|---|---|---|
| 01 | V4-Welcome | `/welcome` — `(onboarding)/welcome.tsx` | `features/onboarding/ui/WelcomeScreen.tsx` | maquette : compteur « en ligne » animé, orbite de pets ; code : lien « comptes de démo » si auth locale | aucune (déconnecté) | partiel (pas de logo, compteur, orbite, titre en 3 couleurs, « J'ai déjà un compte ») |
| 02 | V4-Invite | `/invite/[code]` — `(onboarding)/invite/[code].tsx` | `onboarding/ui/InviteScreen.tsx` | maquette : parrain nommé, maisons, bonus 100 pièces ; code : code invalide / parrain non vérifié (`GET /v1/referrals/:code` non livré) | code `demo-alex` | partiel (parrain jamais affiché : endpoint absent → titre générique + bandeau) |
| 03 | V4-Craft | `/species` — `(onboarding)/species.tsx` | `onboarding/ui/SpeciesScreen.tsx` | espèce premium (PLUS) ; 4 curseurs ; nom invalide | brouillon (NINO, « Nino », axes) | présent (carte 3D/dégradé absente, sélecteur en carrousel) |
| 04 | V4-Vie | `/vision/[step]` (school, sunday, passions, limit) — `(onboarding)/vision/[step].tsx` | `onboarding/ui/VisionStepScreen.tsx` | 4 questions, carte de vision qui se remplit (%), réponse sélectionnée | brouillon | présent (style à reprendre) |
| 05 | V4-Intention | `/intention` — `(onboarding)/intention.tsx` | `onboarding/ui/IntentionScreen.tsx` | option sélectionnée ; mention « secret » | brouillon | partiel (4 options texte au lieu de 3 cartes illustrées ; fourchette âge/distance absente) |
| 06 | V4-Eclosion | `/hatch` — `(onboarding)/hatch.tsx` | `onboarding/ui/HatchScreen.tsx` | étapes : couve → bouge (3 touches) → éclot ; réduire animations | brouillon | partiel (fond sombre uni vs dégradé violet + anneaux, bouton en bas) |
| 07 | V4-Compte | `/account` — `(onboarding)/account.tsx` | `onboarding/ui/AccountScreen.tsx` | maquette : feuille Apple « Masquer mon adresse » ; code : fournisseur indisponible, mineur, consentements, erreur | brouillon, déconnecté | présent (capture en `EXPO_PUBLIC_AUTH_MODE=firebase` : Google seul sur web) |
| 08 | V4-Verif | `/verify` — `(onboarding)/verify.tsx` | `onboarding/ui/VerifyScreen.tsx` | avant selfie / vérifié ; caméra refusée ; démo locale | compte `test.b` (non vérifié) | partiel (pas de cadre selfie ni vignettes photos) |
| 09 | V4-Paywall | `/paywall-step` (+ modale `/paywall`) — `(onboarding)/paywall-step.tsx`, `paywall.tsx` | `onboarding/ui/PaywallStepScreen.tsx`, `subscription/ui/PaywallPanel.tsx` | maquette : compte à rebours, 3 offres, 2e étape « offre −60 % » ; code : achats indisponibles, pas d'offres, espèce premium refusée | `alex` (adaptateur LOCAL_DEMO) | partiel (coupé en V5) |
| 10 | V4-Match | `/matches` — `(onboarding)/matches.tsx` | `onboarding/ui/MatchesScreen.tsx`, `matching/ui/ProposalCard.tsx` | 3 propositions, 2e/3e verrouillées (Blowy+) ; attente honnête ; indisponible | `alex` (pas de nouvelle proposition → attente) ; `test.a` pour une proposition | partiel (capture = état « attente ») |
| 11 | V4-Notifs | `/notifications` — `(onboarding)/notifications.tsx` | `onboarding/ui/NotificationsScreen.tsx` | aperçu des notifs ; invite système iOS | `alex` | partiel (pas d'aperçu des notifications) |
| 12 | V4-Nid | `/nest` — `(tabs)/nest/index.tsx` | `nest/ui/NestScreen.tsx` | sélecteur de rendez-vous, scène (chez l'autre / lieu de rdv), bulle, actions verrouillées, lien, mission, chat ; hors ligne / indisponible | `alex` (Suzie, niv. 2) | présent (jauges en plus, scène différente) |
| 13 | V4-Preuve | `/nest/mission` — `(tabs)/nest/mission.tsx` | `nest/ui/NestDetailScreens.tsx` (`MissionScreen`) | caméra plein écran, « Nino vérifie » ; code : indisponible (endpoint mission absent) | `alex` | partiel (état indisponible) |
| 14 | V4-Bravo | — | — | célébration +XP, série | — | **absent** |
| 15 | V4-Serie | `/nest/streak` — `(tabs)/nest/streak.tsx` | `NestDetailScreens.tsx` (`StreakScreen`) | calendrier du mois, paliers, gel en stock | `alex` (0 gel au seed) | partiel (pas de calendrier ni paliers ; coupé en V5) |
| 16 | V4-Fiche | `/nest/fiche` — `(tabs)/nest/fiche.tsx` | `NestDetailScreens.tsx` (`FicheScreen`) | traits, évolution, garde-robe, aime/déteste ; garde-robe vide | `alex` | présent (structure liste vs cartes) |
| 17 | V4-Boutique | `/nest/shop` — `(tabs)/nest/shop.tsx` | `NestDetailScreens.tsx` (`ShopScreen`) | onglets, encart Blowy+, solde ; solde insuffisant, hors ligne, indisponible | `alex` (solde 0 au seed vs 340) | partiel (pas d'onglets ni encart Blowy+) |
| 18 | V4-Chats | `/chats` — `(tabs)/chats/index.tsx` | `chats/ui/ChatsScreen.tsx` | « Où est Nino », quota 3/3, bande, réponses anonymes, modale de déplacement ; vide / indisponible | `alex` | présent (sections simples) |
| 19 | V4-Chat | `/chats/[id]` — `(tabs)/chats/[id].tsx` | `chats/ui/ConversationScreen.tsx` (+ `SafetyMenu`) | en-tête Lien + XP, souvenir partagé, suggestion du pet, menu sécurité ; message averti, envoi bloqué, conversation fermée | `alex`, conversation DATE avec L. | présent (en-tête simplifié, suggestion absente : `/suggestions` 404) |
| 20 | V4-Lien | `/chats/link/[id]` — `(tabs)/chats/link/[id].tsx` | `chats/ui/RelationScreens.tsx` (`LinkTreeScreen`) | branches Ami/Plus, niveaux atteint/verrouillé, week-end XP ×2 (Blowy+) | `alex`, relation Suzie | présent |
| 21 | V4-Emmenager | `/chats/relation/[id]/move-in` — `(tabs)/chats/relation/[id]/[screen].tsx` | `RelationScreens.tsx` (`MoveIn`) | proposition, L. a dit oui, attente, fait (+200 XP) ; pas encore éligible | `alex` (niv. 2 → « pas encore ») | partiel (coupé en V5) |
| 22 | V4-Revelation | `/chats/relation/[id]/reveal` | `RelationScreens.tsx` (`Reveal`) | L. a accepté / à toi ; jamais de photo ; verrouillé | `alex` (pas d'offre → verrouillé) | partiel (état verrouillé ; maquette niv. 5) |
| 23 | V4-RdvIRL | `/chats/relation/[id]/irl` | `RelationScreens.tsx` (`Irl`) | lieu choisi, ange gardien, check-in, position 3 h, en cours, sortie de secours | `alex` (niv. 2) | partiel (liste statique, endpoint sécurité absent) |
| 24 | V4-Oeuf | `/chats/relation/[id]/egg` | `RelationScreens.tsx` (`Unavailable`) | nuit 2/3, questions simultanées, chaleur | — | partiel (état indisponible) |
| 25 | V4-Bebe | `/chats/relation/[id]/birth` | `RelationScreens.tsx` (`Unavailable`) | tapoter l'œuf à deux, vote du prénom, garde alternée | — | partiel (état indisponible) |
| 26 | V4-Rupture | `/chats/relation/[id]/leave` | `RelationScreens.tsx` (`Leave`) | choix du dernier mot, envoyé (« C'est classe ») | `alex` | présent (champ libre au lieu des mots proposés) |
| 27 | V4-Vide | `/chats/no-dates` — `(tabs)/chats/no-dates.tsx` | `RelationScreens.tsx` (`NoDatesScreen`) | offre gratuite 0/1, départ de L., accélérer, quartier, mission | `alex` | partiel (gabarit vide générique) |
| 28 | V4-Story | `/neighborhood/share` — `(tabs)/neighborhood/share.tsx` | `social/ui/SocialScreens.tsx` (`ShareScreen`) | onglets Question/Vision/Naissance/Révélation, carte story, réseaux | `alex` | partiel (bouton de partage système + indisponible) |
| 29 | W-Repondre | **web** `/[slug]` — `apps/web/src/app/[slug]/page.tsx` (+ `[slug]/envoye`) | `@blowy/ui-web` | choix 0..3 mots, envoyé, limite, expiré | slug `demo-alex` | présent |
| 30 | V4-Quartier | `/neighborhood` — `(tabs)/neighborhood/index.tsx` | `SocialScreens.tsx` (`NeighborhoodScreen`) | voisins, défi, rue vide (invite) | `alex` (endpoints social absents) | partiel |
| 31 | V4-Ami | `/neighborhood/friend/[id]` | `SocialScreens.tsx` (`FriendHomeScreen`) | visite, ange gardien, messages | — | partiel (indisponible) |
| 32 | V4-Carte | `/map` — `(tabs)/map/index.tsx` | `SocialScreens.tsx` (`MapScreen`), `subscription/ui/PlusGate.tsx` | verrou Blowy+, pet sélectionné, quota 3/3 ; consentement, permission refusée | `alex` (non Plus) | partiel (coupé en V5) |
| 33 | V4-Classement | `/nest/league` — `(tabs)/nest/league.tsx` | `NestDetailScreens.tsx` (`LeagueScreen`) | onglets pets/amis/quartiers, podium | — | partiel (indisponible ; coupé en V5) |
| 34 | V4-Profil | `/profile` — `(tabs)/profile/index.tsx` | `profile/ui/ProfileScreens.tsx` (`ProfileHomeScreen`) | en-tête, compteurs, vision card, parrains | `alex` | partiel (liste de réglages au lieu des cartes) |
| 35 | V4-Reglages | `/profile/settings` — `(tabs)/profile/[screen].tsx` | `ProfileScreens.tsx` (`SettingsScreen`) | sections Compte / Notifications / Sécurité, déconnexion, suppression | `alex` | partiel (contenu différent : animations, langue, pause) |
| 36 | V4-Abonnement | `/profile/subscription` | `subscription/ui/SubscriptionScreen.tsx` | statut, avantages, annulation + contre-offre −50 %, annulé | `alex` (pas d'abonnement) | partiel |
| 37 | V4-Confidentialite | `/profile/privacy` | `ProfileScreens.tsx` (`PrivacyScreen`) | photos, âge, carte, comptes bloqués, données | `alex` | présent (sans section Sécurité / Données) |
| 38 | V4-Signaler | `/profile/report?relationshipId=…` | `ProfileScreens.tsx` (`ReportScreen`) | catégories, bloquer aussi, envoyé | `alex`, relation Suzie | présent |
| 39 | V4-Supprimer | `/profile/delete` | `ProfileScreens.tsx` (`DeleteScreen`) | ce qui disparaît, raison, pause, en pause, au revoir ; hors ligne | `alex` | présent (pas de raison ni d'alternative pause) |

Écrans de l'app sans maquette V4 : `/dev-login` (dev), `/preferences` (onboarding), `/profile/notifications`,
`/profile/preferences`, `/chats/relation/[id]/{vote,custody,pause}`, modale `/paywall`.

Bilan : 38 / 39 écrans ont une route (seule V4-Bravo manque) ; 13 présents, 25 partiels, 1 absent.
États non capturés par le banc (non exposés par une route sans interaction) : feuilles et modales
(Apple, contre-offre, déplacement de Nino), états « envoyé / fait », hors ligne.
