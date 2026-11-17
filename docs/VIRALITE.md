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
4. **Ne jamais bloquer les rencontres par les soins** (aujourd'hui un minimoa qui boude ne présente personne).
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

## Étude des comptes avec treg (à faire)
treg sert à analyser, chiffres à l'appui, les publications de Bump, Finch, Locket, NGL et Timeleft (titres,
couvertures, accroches qui marchent, rythme, style) et à en tirer des modèles prêts à remplir pour Minimoa. Il
n'est pas installé dans cet environnement ; l'installation (https://treg.to/llms.txt) et la connexion demandent
ton accord, et chaque appel de données est payant (plafond à fixer).
