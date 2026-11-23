# Viralité, rétention et contenus de Minimoa

17 novembre 2026. Analyse faite à partir du produit tel qu'il est (repo, landing, captures, audit
`/home/claude/work/audit/AUDIT-COMPREHENSION.md`) et de recherches publiques sur des apps comparables. Les chiffres
des autres apps viennent de sources publiques citées dans la réponse ; tout le reste est un raisonnement (INFÉRÉ),
à vérifier par les mesures de la section 6. L'étude de leurs comptes TikTok / Instagram avec treg n'a pas pu être
lancée (outil non installé, installation à autoriser) : voir la fin.

## 1. Le diagnostic en une phrase

Minimoa a trois actifs viraux rares (un personnage mignon qui donne envie de filmer, un lien « 3 mots » du même
type que NGL, des groupes qui ne fonctionnent qu'à plusieurs) et un frein majeur : **sans monde autour de soi, le
produit est vide**. La viralité n'est donc pas un bonus : c'est elle qui remplit la carte. Toute boucle doit amener
des gens **du même quartier ou du même cercle**, pas seulement des téléchargements.

## 2. Ce qui peut devenir viral (par ordre de potentiel)

| Atout | Pourquoi ça peut circuler | Modèle | Ce qui manque aujourd'hui |
|---|---|---|---|
| « Décris-moi en 3 mots » | Un lien en story, les potes votent **sans l'app**, le résultat donne envie de faire le sien | NGL : la boucle « je vois le lien d'un pote → je réponds → je crée le mien » | Après le vote, la page doit pousser à créer son propre lien en 2 taps ; le résultat doit se repartager en story (comme les réponses NGL) |
| Le minimoa lui-même | Mignon, expressif, garde-robe : les gens filment ce qu'ils trouvent mignon | Finch a grandi presque uniquement par des TikTok de ses utilisateurs | Un écran « photo / vidéo de mon minimoa » prêt pour TikTok (fond, pose, tenue, son) |
| Les groupes d'habitude | Un groupe ne vit qu'à 3 et plus : inviter fait partie du jeu | Les ligues et défis entre amis (Duolingo, Strava) | **Pas de lien d'invitation de groupe** (l'API n'a pas de code d'invitation) : c'est la première chose à construire |
| Le quartier qui s'ouvre | « Il manque 12 personnes pour ouvrir le 11e » crée une raison collective d'inviter | Listes d'attente par ville (Timeleft ouvre ville par ville) | Ouverture quartier par quartier avec compteur réel |
| Les rencontres IRL | Une sortie réussie se raconte | Timeleft (dîners entre inconnus) | Une carte souvenir de la sortie, partageable **sans visages ni lieu exact** |
| Les paliers (série, 100 jours, objets) | Les gens montrent leurs séries | Partage de série Duolingo | Cartes de palier jolies, au format story |

## 3. Les boucles de viralité à construire

### Boucle 1. « 3 mots » (la plus forte, à soigner en premier)
1. Toi : tu partages `minimoa.app/m/…` en story (l'image NGL-like existe déjà après l'inscription).
2. Tes potes votent sur le web, sans compte, en 10 secondes.
3. Fin du vote : « Et toi, tes potes te décriraient comment ? » → crée ton minimoa (App Store) ou, avant
   l'installation, ton propre lien de vote.
4. Toi : tu reçois les mots, ton minimoa change, et tu repartages **le résultat** en story (« Mes potes m'ont
   décrit : drôle, chaotique, solaire ») avec le lien pour voter encore.
- Indicateur nord : votes par lien partagé, et part des votants qui créent leur lien (NGL suivait le taux de
  réponse : la boucle n'est bouclée que si la personne reçoit et répond).
- Sécurité : garder les mots **choisis dans une liste** (jamais de texte libre anonyme) : c'est ce qui a coûté
  cher aux apps anonymes.

### Boucle 2. Groupes d'habitude
1. Tu crées « Marche du matin ».
2. Le groupe a besoin de 3 personnes pour démarrer → lien `minimoa.app/g/<code>` à envoyer (WhatsApp, story).
3. Chaque membre qui arrive voit les vies du groupe dépendre de lui : il revient chaque jour, et il invite quand
   quelqu'un part.
- À construire : code d'invitation de groupe, page web de groupe avec le nombre de jours tenus, « rejoindre ».

### Boucle 3. Ouvrir son quartier
- Au lancement, chaque quartier a un compteur réel (« 38 / 50 pour ouvrir le 11e »). Inviter fait avancer **ton**
  quartier ; à l'ouverture, les premiers reçoivent un objet de garde-robe « Fondateur du 11e ».
- Résout en même temps le démarrage à vide (audit, recommandation 4) et donne un sujet de contenu local.

### Boucle 4. Contenu fait par les utilisateurs
- Un bouton « Filmer mon minimoa » : 6 secondes de son minimoa qui danse avec sa tenue, fond prairie, filigrane
  minimoa.app, format vertical. Chaque vidéo postée est une pub.
- Cartes à partager aux bons moments : 7 jours de série, premier objet rare, première sortie, groupe à 30 jours.

### Boucle 5. Passive
- Le widget (déjà prévu, `docs/WIDGETS.md`) : un minimoa vivant sur l'écran d'accueil se voit par les amis.
  Finch annonce 54 % / 37 % de rétention à J1 / J7 et attribue une part de sa rétention à ses widgets.

## 4. Rétention

Ce que disent les apps comparables :
- Les 7 premiers jours décident de tout (Duolingo) ; au-delà d'une série de 7 jours, la peur de la perdre fait
  revenir.
- Un joker de série réduit l'abandon des gens sur le point de casser leur série.
- Un personnage dont on prend soin crée un attachement qui fait revenir (Finch).

Ce qu'il faut faire chez Minimoa :
1. **Mettre des gens dans la boucle quotidienne** : l'accueil commence par « Nino a 2 personnes à te présenter »
   ou « Ton groupe : 2/3 ont tenu ». Prendre soin du minimoa reste le rituel, les gens sont la récompense.
2. **Une seule série visible** (aujourd'hui il y en a 4 et 2 systèmes de vies, audit) : la série de la semaine,
   avec les jokers.
3. **Les 7 premiers jours scénarisés** : J1 créer + 3 mots ; J2 première habitude ; J3 rejoindre ou créer un
   groupe ; J5 première personne présentée ; J7 bilan + palier « 7 jours » partageable. Les messages de
   fidélisation (`docs/FIDELISATION.md`) suivent déjà ce calendrier : vérifier qu'ils pointent vers ces actions.
4. **Ne jamais bloquer les rencontres par les soins** (fait : `encounterQuota`, sociabilité seule, au moins une présentation par jour).
5. **Le dimanche** : le bilan de la semaine comme rendez-vous (« Ta semaine avec Nino »), partageable.
6. **Mesurer** J1 / J7 / J30 par canal d'arrivée (3 mots, groupe, App Store, TikTok).

## 5. Contenus viraux à produire

Méthode (Locket) : des comptes de l'équipe et de petits créateurs postent **le même format** chaque jour, on coupe
ce qui ne marche pas, on garde et décline ce qui marche ; un son original reconnaissable. Locket est passé n°1 de
l'App Store avec une vidéo tutoriel, puis des milliers de reprises du même son.

Formats proposés (FR, vertical, 7 à 20 s) :

| # | Format | Accroche (texte à l'écran, 1re seconde) | Pourquoi |
|---|---|---|---|
| 1 | Réaction « 3 mots » | « J'ai demandé à mes potes de me décrire en 3 mots… » puis la révélation | Curiosité + identification ; pousse à faire son lien |
| 2 | POV minimoa | « POV : ton minimoa trouve que tu sors pas assez » (sa voix, ton taquin, jamais culpabilisant) | Mascotte à personnalité, comme la chouette de Duolingo |
| 3 | Série « Jour X » | « Jour 1 où je laisse mon minimoa me présenter des gens à Paris » | Feuilleton : on revient voir la suite ; preuve que ça marche IRL |
| 4 | ASMR soins / garde-robe | « Je l'habille pour l'hiver » (bruitages doux, sans parole) | Format mignon qui marche pour Finch ; fort taux de revisionnage |
| 5 | Nouvelle ville | « Arrivée à Lyon sans connaître personne. Semaine 1. » | Le vrai problème (la solitude) raconté par une personne |
| 6 | Défi de groupe | « 30 jours de marche avec 4 inconnus du 11e » | Montre les groupes + l'IRL ; appelle à rejoindre |
| 7 | Micro-trottoir | « Tu connais le prénom de tes voisins ? » | Facile à tourner, sujet universel, finit sur l'app |
| 8 | Quel minimoa es-tu ? | Les 4 minimoas + « commente ton signe / ta ville, je te dis lequel » | Commentaires → algorithme ; à décliner en filtre |
| 9 | Avant / après d'un lien | « Il y a 3 semaines on se connaissait pas » (deux personnes, d'accord pour être filmées) | Preuve sociale la plus forte |
| 10 | Tutoriel | « Comment j'ai mis mon lien 3 mots en story » | C'est le format qui a lancé Locket |

Règles de ton : tutoiement, pas de romance (§27), pas de fausse urgence, jamais de vrais utilisateurs filmés sans
accord écrit, aucune position réelle visible à l'écran.

Plan de 14 jours (TikTok + Reels, mêmes vidéos) :
- J1-J2 : ouvrir les comptes, son original « minimoa » (10 s), 3 vidéos du format 10 et 1.
- J3-J7 : 2 vidéos par jour, formats 1, 2, 4 (les moins chers à produire), même structure, accroches différentes.
- J8 : garder les 2 formats au-dessus de la médiane des vues ; arrêter les autres.
- J8-J14 : décliner les gagnants ×5 ; lancer la série 3 (« Jour X ») avec une vraie personne.
- J14 : un seul chiffre à regarder : **liens « 3 mots » créés par jour** (la conversion réelle, pas les vues).

## 6. Les chiffres à suivre

| Mesure | Définition | Où |
|---|---|---|
| Facteur K | invitations envoyées par utilisateur × taux de conversion d'une invitation | `/i`, `/m`, `/g` |
| Taux de boucle 3 mots | votants qui créent leur lien / votants | page `/m` |
| Groupes viables | groupes à 3 membres ou plus après 7 jours | API |
| Quartiers ouverts | quartiers au-dessus du seuil | API |
| Rétention | J1 / J7 / J30 par canal d'arrivée | API (événements) |
| Première personne | délai entre l'inscription et la première présentation acceptée | API |

## 7. Ce qu'il ne faut pas faire
- Des messages anonymes en texte libre (harcèlement, la fin des apps anonymes).
- Pousser l'achat de contenu viral (fausses notes, faux chiffres, faux avis).
- Promettre des rencontres là où le quartier est vide : ouvrir quartier par quartier.

## Fait (18 novembre 2026)

Le playbook « une boucle simple, un moment capture d'écran, des codes créateurs, chaque étape mesurée », construit de
bout en bout (API, app, site, administration). Migration : `supabase/migrations/20261118100000_croissance.sql`.

### 1. Lien d'invitation de groupe (boucle 2)
- Code court par groupe (`groups.invite_code`, 8 caractères), créé à la première demande d'un membre
  (`POST /v1/groups/:id/link`), changé par le créateur seul (`…/link/reset` : l'ancien lien ne marche plus).
- `minimoa.app/g/<code>` : page publique (`apps/web/src/pages/g`, 5 langues) avec le nom, l'habitude, les jours tenus,
  le nombre de membres et l'espèce de leurs minimoas, **jamais un prénom ni une position** ; « Rejoindre dans l'app »
  (`minimoa://g/<code>`), stores, et le code à taper à l'inscription. `/g/<identifiant>` reste « Ouvre Minimoa ».
- App : « Inviter avec un lien » dans « Le groupe » (feuille de partage avec un texte prêt), « Changer le lien »
  (créateur), et sous 3 membres le bandeau « Il manque N personnes pour lancer la série » + « Inviter ». Page
  « rejoindre » `app/g/[code]`. Un groupe peut maintenant se créer sans inviter personne.
- Rejoindre (`POST /v1/groups/code/:code/join`) : mêmes règles qu'une invitation (8 au plus, limite de groupes, habitude
  ajoutée, bloqué avec un membre ou compte suspendu : introuvable), message « X arrive » dans le chat et notification
  `group_joined` aux autres membres (réglable dans Moi › Notifications).

### 2. Boucle « 3 mots » complète (boucle 1)
- Page `/m` après le vote : « Et toi, tes potes te décriraient comment ? », boutons des stores (« Bientôt » tant que
  l'URL du store est vide) et « J'ai déjà Minimoa : mon lien » (`minimoa://mots`) ; le code du lien pour dire qui t'a
  fait venir.
- App `app/mots` (et « Voir mon résultat » sur Moi) : votes, et dès **3 votes** la carte résultat au format story
  1080 × 1920 (le minimoa dans sa tenue, les 3 mots les plus votés en gros, `minimoa.app/m/<code>` pour voter encore),
  « Partager en story » (Instagram) ou « Autre app ». `GET /v1/me/words` ; les mots restent ceux de la liste.

### 3. Moments capture d'écran
- `ShareCard` (`packages/ui`, même capture que `StoryCard`, docs/PARTAGE-STORY.md) et `MomentSheet`
  (`apps/mobile/src/features/moments`).
- Résultat du test à l'inscription (« Mon minimoa est spontané et voyageur ») : bouton facultatif sur « Ta vision » ;
  jamais l'axe « foyer », deux traits nets au plus (`visionTraits`). Seulement à la demande, jamais bloquant (« Plus
  tard »). Les cartes proposées d'office sur l'accueil (série 7 / 30 / 100 jours, première semaine) et leur réglage
  « Proposer de partager mes moments » sont supprimés (ADA-2027 item 6 : une seule action sur l'accueil ; les paliers
  se fêtent en fin de séance).

### 4. Codes créateurs, parrainage, attribution
- `minimoa.app/c/<code>` (page `apps/web/src/pages/c`, visite comptée) et `?ref=<code>` sur n'importe quel lien. Le
  code arrive dans l'app **par le lien ouvert** (lien universel ou `minimoa://c/<code>`), ou **tapé à la main** à l'étape
  du prénom (« Un code ? », qui reconnaît aussi une invitation, un groupe ou un lien « 3 mots »). Aucune empreinte.
- Table `creators` gérée dans l'administration (« Créateurs » : ajouter, désactiver ; visites et comptes sur 12
  semaines). Chaque compte garde sa source (`acquisitions` : creator, words, group, invite, store).
- Objet de garde-robe « Parrain » (cadeau vert et corail) pour l'invité et la personne qui l'a fait venir (invitation ou
  lien « 3 mots ») : cosmétique, sans achat, jamais lié à un avis.

### 5. Entonnoir mesuré (sans SDK tiers)
- Compteurs par jour sans IP ni identifiant (`growth_counters`) : visites de `/m`, `/g`, `/i`, `/c`, premier lancement
  (une fois par installation), inscription terminée, votes, partages. Étapes de chaque compte, une fois chacune
  (`growth_events`) : minimoa créé, premier lien, actif J1 / J7 / J30, essai, payant.
- Administration › « Croissance » : par source et par semaine, chaque étape et le passage depuis la précédente ; facteur
  K (partages / actifs de la semaine × comptes venus d'une personne / partages) ; boucle « 3 mots » (comptes venus d'un
  lien / votes) ; groupes viables (3 membres ou plus à J7).
- Politique de confidentialité (5 langues, « D'où tu viens, et les étapes de ton parcours ») et
  `docs/APP-STORE-CONNECT.md` §3 à jour.

### Limites connues
- Sans empreinte, un code n'arrive pas tout seul à travers une installation depuis l'App Store : il faut ouvrir le lien
  une fois l'app installée, ou taper le code. C'est voulu.
- Le facteur K se lit à la semaine (partages et comptes venus d'une personne de la même semaine), pas par cohorte.
- Les actifs de la semaine viennent des statistiques quotidiennes (`admin_daily_stats.wau`) : vides tant que la tâche
  du minuteur ne les a pas calculées.

## Fait (18 novembre 2026, 2) : passer le mur du téléchargement et le démarrage à vide

Migration : `supabase/migrations/20261118120000_quiz_quartiers.sql` (tables `quiz_results`, `quartier_settings`,
`quartiers`, `quartier_signups`, `quartier_founders` ; sources `quiz` et `quartier` ; compteurs `quiz_*`, `quartier_*`).

### « Quel minimoa es-tu ? » (`minimoa.app/quiz`)
- 7 situations neutres (amitié, quotidien, sorties), 3 réponses, sans compte (`packages/domain/src/quiz.ts`, textes
  `packages/content/src/v7/quiz.ts`, 5 langues). Le résultat est un vrai caractère de l'app (pôle dominant des 4 jauges)
  et l'espèce qui le porte (sociable, joueur : Nino ; tendre, bavard : Suzie ; posé, casanier : Gaston ; piquant,
  discret : Pia), une phrase de profil, un second trait s'il est net.
- L'API garde seulement le résultat sous un code `Q…` (1 an) ; aucune donnée sur la personne. `/quiz/<code>` montre
  le résultat (le sien) ou « Et toi ? » (celui d'un autre, qui lance le quiz compté comme un défi).
- Carte story 1080 × 1920 dessinée dans le navigateur (`apps/web/src/lib/story-card.ts`, composition de `ShareCard`,
  police Allo), « Partager en story » (fichier via la feuille de partage, sinon téléchargement), « Copier le lien »
  (`/quiz/<code>`), « Défie tes potes » (`/quiz?ref=<code>`).
- Reprise dans l'app : `minimoa://quiz/<code>` (« J'ai déjà Minimoa ») ou le code tapé dans « Un code ? » : espèce,
  nom par défaut et jauges de départ pré-remplis ; source d'arrivée `quiz`.
- Entonnoir (`growth_counters`) : `quiz_start` (source `ref` si défi), `quiz_done`, `quiz_share` (story, lien, défi).
  Administration › Croissance : tableau du quiz avec son facteur K (partages / terminés × défis commencés / partages).

### Ouvre ton quartier (`minimoa.app/quartier`)
- Quartier choisi dans une liste (arrondissements de Paris, Lyon, Marseille ; grandes villes) ou par code postal ;
  jamais de position. Vrai compteur : adresses confirmées (double opt-in Resend), désinscriptions déduites.
- Lien pour inviter (`/quartier/<zone>?ref=<code>`, après confirmation ; depuis l'app, le code d'invitation du compte) :
  l'invité fait avancer le quartier ; les 3 premiers inviteurs reçoivent l'objet « Fondateur » à l'ouverture.
- `QuartierJobs` (minuteur) : ouvre au seuil (50, réglable dans Administration › Quartiers, ouverture à la main
  possible), pose les fondateurs, envoie « Ton quartier est ouvert » une fois, efface les inscriptions non confirmées
  (7 j) et les adresses prévenues (30 j).
- App : Rencontres vide montre le compteur réel du quartier de ta zone et « Invite 3 personnes de ton quartier »
  (`GET /v1/me/quartier`). Hors quartier connu : l'état vide d'avant.
- Page (`QuartierExpedition`, `scripts/quartier-xp.ts`) : intro de Nino (une fois par visite, passable, jamais avec
  « réduire les animations »), carte maison (Natural Earth via `world-atlas`, `public/geo/quartiers.json` généré par
  `scripts/quartier-map.mts`, chargé à la demande, aucune tuile externe), vol vers le quartier, jauge réelle, pass de
  fondateur·rice à partager, classement. Classement et lumières : `GET /v1/quartiers` (public, compteurs confirmés
  seulement, gardé 60 s, limité comme les autres routes publiques) ; sans données, rien n'est affiché.

### Landing
- Haut de page « Des potes près de chez toi. », action principale « Quel minimoa es-tu ? », secondaire « Ouvre ton
  quartier » ; « Comment ça marche » en 3 étapes juste après. Bulle « Je lui ai déjà dit oui 😈 » retirée.
- Police : Allo partout (titres en 800), Anton retirée du site ; images Open Graph régénérées en Allo
  (`scripts/site-images/build.py`), nouvelles `og/quiz.jpg` et `og/quartier.jpg`.

## Étude des comptes avec treg (à faire)
treg sert à analyser, chiffres à l'appui, les publications de Bump, Finch, Locket, NGL et Timeleft (titres,
couvertures, accroches qui marchent, rythme, style) et à en tirer des modèles prêts à remplir pour Minimoa. Il
n'est pas installé dans cet environnement ; l'installation (https://treg.to/llms.txt) et la connexion demandent
ton accord, et chaque appel de données est payant (plafond à fixer).
