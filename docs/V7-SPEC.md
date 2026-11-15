# Blowy V7 — le minimoa comme filtre

Spéc issue des retours du 15 novembre 2026. Statut : **à valider sur la maquette (rangée G) avant de coder.**
Ce qui est déjà en cours dans le code (corrections directes) n'est pas repris ici.

## 1. L'idée en une phrase

Ton **minimoa** te ressemble : il porte ta vision de la vie. Il ne te présente que des gens dont la vision est compatible avec la tienne, pour devenir potes ou plus, et il veille sur chaque lien.

Trois choses doivent se comprendre sans lire :
1. le minimoa, c'est moi en petit (ma vision, mes habitudes) ;
2. c'est lui qui choisit qui je rencontre ;
3. plus je m'en occupe (donc plus je sors et tiens mes habitudes), plus il me présente de monde.

## 2. Vocabulaire et ton

- « pet » disparaît. Le personnage est un **minimoa** (un minimoa, des minimoas ; « ton minimoa », « le minimoa de Léa »). L'app reste **Blowy**, l'abonnement **Blowy+**.
  - À vérifier avant lancement : proximité avec « Minimoys » (marque déposée, film *Arthur*).
- Majuscule en début de phrase, ponctuation française (espaces insécables avant ? ! : ;). Les grands titres restent en capitales.
- Public adulte (18+) : phrases courtes, tutoiement, humour sec plutôt que mignon. Pas d'emoji décoratif dans les titres.
- Onglets : **Mon minimoa · Chats · Rencontres · Moi**.

## 3. Le profil : la vision, pas la façon d'être

Deux couches, bien séparées à l'écran.

**La vision** (sert à l'appariement) : ce que la personne **projette pour sa vie**. Deux personnes dont les projets de vie vont dans le même sens sont compatibles ; la compatibilité est le moteur de tout l'appariement. 5 axes, chacun de −100 à +100 avec un indice de confiance :

| Axe | Pôle − | Pôle + | Le projet de vie mesuré |
|---|---|---|---|
| Foyer | libre, en solo | fonder un foyer | couple durable, enfants, vie de famille |
| Ancrage | rester ici | partir | où vivre : même ville, ailleurs, à l'étranger |
| Élan | du temps pour soi | de grands projets | place du travail, de l'ambition |
| Rythme | calme, chez soi | intense, dehors | le quotidien voulu |
| Cap | au jour le jour | tout prévoir | long terme, argent, planification |

Pour « potes », l'axe Foyer pèse peu ; pour « plus », il pèse double. On ne demande ni religion, ni opinions politiques, ni santé.

**Le style** (donne sa personnalité au minimoa, ne filtre pas) — les 4 jauges actuelles : sociable, joueur, tendre, bavard.

**D'où viennent les données** (poids de départ, la confiance monte avec le temps) :

| Source | Poids | Détail |
|---|---|---|
| Test d'inscription | 40 % puis décroît | 12 situations à deux choix, ~2 min, une par écran |
| Question du jour | 20 % | 1 par jour, dans le défi du jour |
| Habitudes | 25 % | celles choisies et surtout celles tenues |
| Façon de s'en occuper | 10 % | régularité, heures, sorties |
| Les 3 mots des potes | 5 % | agit surtout sur le style |

On ne montre jamais de diagnostic. Formulation : « ta vision, pour l'instant ». Pas de vocabulaire clinique ; la mention « indicatif, il s'affine avec toi » est visible sur l'écran du profil.

## 4. L'appariement

- **Filtres durs** : ce que chacun cherche (potes / plus / les deux), et pour « plus » qui il veut rencontrer ; 18+ ; zone ; personnes bloquées.
- **Score de compatibilité** : proximité sur les 5 axes de vision, pondérée par la confiance de chaque axe. Le style ne compte pas dans le score ; il sert aux sujets de conversation.
- **Seuil** : un minimoa ne présente que des personnes au-dessus de 70 %. En dessous, personne n'est proposé, quitte à en montrer moins.
- **L'audit** : chaque rencontre explique pourquoi. « 3 points communs » (les axes les plus proches) et « 1 différence à explorer ». Jamais de chiffre seul.
- Quota de rencontres inchangé dans son principe : il dépend de la forme du minimoa (section 5).

## 5. S'occuper de son minimoa : sortir d'abord

- **Sociabilité** devient la jauge principale (grande, en haut). Elle monte quand tu sors, vois du monde, salues, écris (et plus encore les jours où vous vous écrivez tous les deux, §24), tiens une habitude tournée vers les autres. Elle descend seule.
- Faim, énergie, humeur restent, en petit, avec les quatre gestes (nourrir, jouer, sieste, câlin).
- **Forme** = 60 % sociabilité + 40 % des trois autres. En forme : il rencontre plus. Il boude : il ne rencontre personne. Il ne meurt jamais.
- Le minimoa demande : « Tu es sorti aujourd'hui ? ». Réponses : « oui, j'ai vu du monde », « oui, un tour », « pas encore ». La localisation (app ouverte seulement) confirme un déplacement hors de la zone du domicile ; sinon c'est déclaratif, avec photo possible.

## 6. Les habitudes

- La personne choisit ses habitudes dans un catalogue relié aux axes (marcher, sport, lire, cuisiner, voir un ami, créer, apprendre, se coucher tôt…) et un rythme (tous les jours / 3 fois par semaine).
- Gratuit : 2 habitudes. Blowy+ : 6.
- Le minimoa **demande une preuve en photo** au bon moment (« Montre-moi tes baskets. »). Photo prise dans l'app, pas depuis la galerie.
- **Une IA valide** : oui / non / pas sûr, avec une phrase gentille. En cas de « pas sûr », on fait confiance. La photo n'est vue par personne, sert à la validation et est supprimée sous 24 h, sauf si la personne la garde dans ses souvenirs privés.
- **Accord explicite avant la première photo** (audit App Store B5, App Review 5.1.2(i)) : une feuille dit ce qui part (la photo réduite et le nom de l'habitude), à qui (le prestataire d'IA, nommé par la configuration), pourquoi, et la suppression sous 24 h ; deux choix, « Oui, vérifier par une IA » ou « Sans vérification par IA ». Sans accord, l'API n'envoie aucune image : l'habitude se valide sans photo (compte comme « pas sûr »). Accord retirable dans Moi › L'IA et toi.
- Effets : le minimoa **évolue** (formes et objets liés à l'habitude tenue), la série avance, l'axe de vision correspondant gagne en confiance.
- Port `HabitVerifier` : adaptateur réel (IA de vision, clé dans `apps/api/.env`), adaptateur mémoire pour les tests.

## 7. Le défi du jour et la série

- **Un défi par jour et par personne, choisi par le serveur** (déterministe par jour + personne, pris dans un catalogue ; il vise l'axe de vision le moins sûr, donc il sert aussi de question du jour).
- À la **première ouverture du jour**, une carte monte en plein écran, présentée par le minimoa. On l'accepte ou on la range ; elle reste en tête de l'accueil jusqu'à minuit.
- Types : répondre à une question, prendre une photo, écrire à un lien, sortir.
- **La série** : chaque jour avec défi réussi = +1. Identité forte : la **mèche** du minimoa s'allume et grandit avec la série ; paliers 3, 7, 14, 30, 60, 100 jours qui débloquent des objets.
- **Joker** : 1 par semaine offert (protège la série un jour manqué), davantage avec Blowy+. Pas de culpabilisation : un jour manqué sans joker remet la série à zéro, mais le record reste affiché.

## 8. Le bilan de la semaine

- Chaque dimanche soir, le minimoa donne son bilan : ce que tu as fait (sorties, habitudes, série), ce qu'il a remarqué (comment ta vision bouge), un conseil pour la semaine, et un mot par lien actif (« Avec Léa : vous vous répondez vite. »).
- **Toujours positif** : on nomme ce qui a marché, et le conseil est une proposition, jamais un reproche. Contrôlé par des modèles de phrases et un garde-fou côté serveur.
- Blowy+ : bilan détaillé (évolution des axes sur 4 semaines, audit de chaque lien).
- Port `Coach` (texte par IA) avec adaptateur mémoire à base de modèles.

## 9. Les minimoas dans la conversation

À quoi ils servent, pour que ce soit clair dès la première ouverture d'un chat :

| Rôle | Quand | Exemple |
|---|---|---|
| Brise-glace | au début d'un lien | une question tirée de vos points communs |
| Relance | après un long silence | « Ça fait 3 jours. Vous en étiez à ce resto. » |
| Remarque | de temps en temps | « Vous êtes d'accord sur plus de choses que vous ne croyez. » |
| Garde-fou | si le ton monte | propose une pause, à la personne concernée seulement |
| Audit | une fois par semaine | la santé du lien, dans le bilan |

- Chaque minimoa parle avec le caractère de son humain. Au plus 3 interventions par jour et par lien ; on peut les couper pour un lien.
- **Confidentialité** (décision du 15 nov. : une IA lit les messages) :
  - Texte exact (audit App Store B5, 15 nov. : nommer l'IA tierce, servi par l'API depuis `packages/content`, prestataire lu dans la configuration) : « Aucun humain ne lit tes conversations. Si vous l’activez l’un et l’autre, une IA lit vos derniers messages pour que vos minimoas puissent y réagir. Cette IA est fournie par {prestataire} ({pays}), notre prestataire, qui reçoit ces messages pour nous. Tu peux retirer ton accord quand tu veux. »
  - Accord demandé à **chacun**, à la première ouverture du chat. Si l'un refuse, les minimoas ne réagissent qu'au rythme (silences, séries, défis), sans lire.
  - Réglage par défaut dans « Moi » (demander à chaque fois · toujours activer · ne jamais activer), appliqué à chaque nouveau chat : la question n'est alors pas posée, mais le chat affiche l'état en une ligne avec « Changer ». « Pour tous mes chats » s'applique en une fois aux chats existants.
  - Ce qu'on dit de l'autre (décision du 15 nov., 2e passe) : seulement « il l'a activé » ou « pas encore activé de son côté ». Un refus explicite et une question pas encore vue donnent la même réponse : on ne montre jamais « a refusé », pour ne mettre aucune pression et ne pas transformer un réglage de confidentialité en signal social (`consent.theirs` : `agreed` · `not_yet`).
  - Réglage visible et réversible dans les options du lien et dans « Moi ».
  - On n'écrit nulle part « personne ne lit » sans préciser l'IA.

## 10. La carte

- **Vraie carte**, au style Blowy (sombre, peu de détails, accents de la marque).
- Gratuit : tu vois **ta zone seulement** (rayon ~1,5 km), sans pouvoir déplacer la carte. Les minimoas compatibles y apparaissent ; au-delà, des silhouettes floues et un compteur (« 12 minimoas plus loin »).
- Blowy+ : toute la carte, et **changer de ville** sans bouger.
- Sécurité : une position n'est jamais exacte (arrondie à ~300 m et décalée), jamais en temps réel, et un « mode discret » retire la personne de la carte.
- La ville n'est plus demandée : on demande la localisation (app ouverte seulement). Sans elle, pas de carte ni de rencontres proches, et on le dit clairement.

## 11. Inscription et connexion

Ordre : Bienvenue → entrée en scène → créer son minimoa → **test de vision (12)** → « On t'appelle comment ? » → **sexe** → **ce que tu cherches** → **date de naissance (sélecteur à roues), avant la connexion** → localisation → notifications → la promesse → **connexion** → il s'installe → tout est prêt → invitation → Blowy+ (feuille).

- **Connexion : Apple sur iPhone, Google sur Android.** Plus de code par e-mail (gardé seulement pour le mode local de développement).
- Sexe : femme / homme / non-binaire / je préfère ne pas dire. Ce que tu cherches : des potes / plus / les deux ; si « plus » : des femmes / des hommes / tout le monde.
- Moins de 18 ans : arrêt avant la connexion, rien n'est créé.
- Chaque étape : une question, posée par le minimoa, réponse en grand, animée.

## 12. Notifications

Toutes passent par un port `Pusher` (push Expo ; adaptateur mémoire) et un réglage par type. Heures calmes 22 h – 8 h. Hors messages : 3 par jour au plus.

| Type | Quand |
|---|---|
| Défi du jour | le matin, à l'heure choisie |
| Ton minimoa a besoin de sortir | sociabilité basse, 1 par jour au plus |
| Nouvelle rencontre · on t'a salué | à l'événement |
| Message | à l'événement |
| À toi d'écrire (série d'un lien, §24) | le soir (19 h – 22 h), seulement si l'autre a écrit aujourd'hui et pas toi ; 1 par jour au plus, un envoi pour tous tes liens |
| Lien en danger | quand il reste 2 vies |
| Série en danger | le soir, seulement si le défi n'est pas fait |
| Preuve d'habitude demandée | au moment choisi pour l'habitude |
| Bilan de la semaine | dimanche soir |
| Objet débloqué · 3 mots reçus | à l'événement |

Un minuteur côté serveur (tâche planifiée qui appelle l'API) déclenche les envois programmés.

## 13. Blowy+

- Offres : **59,88 € par an** ou **14,99 € par mois**.
- Contenu : toute la carte et changer de ville · plus de rencontres · jokers de série · 6 habitudes · bilan détaillé · renommer son minimoa librement · objets premium.
- Objets premium (audit B3) : tous possédés et portables tant que Blowy+ dure ; à la fin de l'abonnement, le minimoa les range (verrouillés, de retour avec un nouvel abonnement).
- Achat intégré Apple, vérifié côté serveur (port `Billing`), qui met à jour `plus` sur le profil.
- **Conformité Apple (3.1.2)** — le paywall actuel n'est pas conforme sur un point : il affiche « 4,99 €/mois » en grand et « facturé 59,88 €/an » en petit. Apple exige que **le montant réellement facturé soit le prix le plus visible**. À faire :
  - « 59,88 € par an » en grand, « soit 4,99 € par mois » en petit ;
  - nom de l'abonnement, durée, prix, renouvellement automatique et comment annuler, lisibles sans défiler ;
  - liens fonctionnels vers les conditions d'utilisation et la politique de confidentialité ;
  - « Restaurer mes achats » ;
  - bouton de fermeture visible tout de suite ;
  - la remise affichée doit être exacte (59,88 € contre 179,88 € = −67 %, c'est le cas).
- Le paywall monte du bas, hors navigation.

## 14. Rétention : ce qu'on fait, ce qu'on ne fait pas

On fait : série avec la mèche, défi du jour, évolution visible du minimoa, bilan du dimanche, objets à paliers, vies des liens, aperçu flouté de ce que Blowy+ ouvre, surprise rare (le minimoa qui passe la tête).

On ne fait pas : fausse urgence ou faux compte à rebours, culpabilisation (« tu abandonnes ton minimoa ? »), désabonnement caché, notifications trompeuses, prix barré inventé. Apple les refuse et le droit européen les sanctionne.

## 15. Page « Son caractère », rééquilibrée

De haut en bas : le minimoa et sa forme · **sa vision** (5 axes, barres simples, « pour l'instant ») · son style (4 jauges, plus petites) · ses habitudes et leur série · son évolution. Le nom : modifiable une fois tous les 60 jours (libre avec Blowy+).

## 16. Passe d'interface

- Corps de texte 17 pt, secondaire 15 pt, jamais sous 13 pt ; titres en capitales réservés à un par écran.
- Grille de 8 pt ; marges latérales 20 pt ; 24 pt entre les blocs ; cibles tactiles de 44 pt.
- Une action principale par écran, un seul accent de couleur par écran ; moins de dégradés, fond nuit, cartes calmes.
- Contraste AA partout ; rien n'est supprimé, tout est rangé : l'essentiel d'abord, le reste derrière une ligne « Voir plus ».

## 17. À fournir ou décider de ton côté

- Apple : activer « Sign in with Apple », créer les deux abonnements dans App Store Connect, clé de notifications push.
- Supabase : activer les fournisseurs Apple et Google.
- Clés (dans `apps/api/.env` uniquement) : IA (photos, bilans, chat), service d'achats, fond de carte.
- Données sensibles : sexe, « qui tu veux rencontrer », photos de preuve et lecture des messages par une IA demandent un accord explicite et une mise à jour de la politique de confidentialité. À faire relire par un juriste.

---

# Compléments du 15 novembre (2e message) — décisions prises, à coder sans nouvelle validation

## 18. Essai gratuit et inscription pensée pour convertir

- **7 jours gratuits sur l'offre annuelle**, puis 59,88 € par an. L'offre mensuelle (14,99 €) n'a pas d'essai.
- Affichage conforme Apple : « 7 jours gratuits, puis 59,88 € par an » ; le montant facturé reste le prix le plus visible.
- Ce qui donne envie, sans tromper :
  1. **L'investissement** : la personne a créé son minimoa et passé le test avant de voir une offre.
  2. **Le résultat personnalisé** : « ta vision » juste avant.
  3. **La preuve concrète** : le nombre réel de personnes compatibles dans sa zone, en silhouettes floues (chiffre venu du serveur ; s'il vaut zéro on ne montre pas ce bloc).
  4. **La frise de l'essai** : aujourd'hui (tout est ouvert) → jour 5 (rappel envoyé) → jour 7 (premier paiement). Le rappel est réellement envoyé.
  5. **La sortie visible** : « Continuer gratuitement » toujours présent, sans texte culpabilisant.
- Pas de témoignages ni de chiffres d'utilisateurs tant qu'ils ne sont pas réels.

## 19. Widget et Dynamic Island (iOS)

- **Widget d'écran d'accueil** (petit et moyen) et **d'écran verrouillé** : le minimoa dans son état du moment, sa sociabilité, la série, et le défi du jour s'il n'est pas fait. Toucher ouvre le défi.
- **Activité en direct / Dynamic Island** pour ce qui a un début et une fin :
  - le défi du jour accepté (temps restant jusqu'à minuit, série en jeu) ;
  - la série d'un lien, le soir (« Léa t'a écrit, à toi avant minuit », §24) ;
  - une sortie en cours déclarée (« Nino est de sortie »).
- Données partagées par un groupe d'apps ; mises à jour par push. Pas d'activité permanente : Apple les limite à des événements bornés dans le temps.

## 20. Administration

Une appli web séparée (`apps/admin`), réservée aux adresses autorisées (liste dans `apps/api/.env`), lecture seule sauf modération.

- **Vue d'ensemble** : comptes (total, nouveaux, actifs jour / semaine / mois), rétention J1 / J7 / J30, abonnés et essais, série moyenne.
- **Minimoas** : nombre de messages de minimoas, taux de réaction, ceux « qui vont le mieux » (forme, série, liens actifs), répartition des visions.
- **Liens et rencontres** : rencontres proposées, saluées, acceptées ; compatibilité moyenne ; liens vivants ou fantômes.
- **Modération** : signalements à traiter (motif, contexte), blocages, actions (avertir, suspendre, supprimer), journal des actions. Délai cible affiché : 24 h.
- **Coûts** : appels et dépense IA par jour et par fonction, plafond et interrupteur.
- Aucune lecture des conversations depuis l'admin, sauf le message signalé et son contexte immédiat.

## 21. Pages légales

Éditeur : **Avec Trois E** (forme juridique, capital, SIREN, adresse, directeur de la publication : à compléter, laissés en champs de configuration).
Pages, sur le site et liées depuis l'app : mentions légales · conditions d'utilisation · politique de confidentialité · conditions de l'abonnement Blowy+ · règles de la communauté · cookies · sécurité et signalement · supprimer son compte et ses données · assistance. En français (version qui fait foi) et traduites en ES, EN, PT, NL.

## 22. Coûts et montée en charge (objectif : 1 M de téléchargements, presque rien tant qu'il n'y a personne)

- **IA** : toujours la règle avant le modèle ; le plus petit modèle qui suffit ; une seule porte d'entrée (`AiGateway`) qui compte chaque appel, applique un budget par personne et par jour, un plafond global et un interrupteur.
  - Chat : pas d'appel par message. Analyse au déclencheur (silence, tous les N messages), sur une fenêtre courte, 3 interventions par jour et par lien au plus.
  - Photos de preuve : image réduite (512 px), petit modèle de vision, réponse courte.
  - Bilan : modèles de phrases pour tous ; texte par IA seulement pour les comptes actifs de la semaine.
  - Cache des consignes, traitement par lots quand rien ne presse.
- **API** : sans état, derrière un cache pour les lectures fréquentes, limites de débit par personne, pagination partout, tâches planifiées par lots.
- **Base** : index sur chaque requête de liste, messages rangés par mois quand le volume le demandera, temps réel limité aux chats ouverts.
- **Fichiers** : photos compressées sur le téléphone, preuves supprimées sous 24 h.
- **Services gratuits ou à l'usage** : carte Apple (sans clé ni coût), push Expo, achats vérifiés directement auprès d'Apple (pas d'intermédiaire payant).
- Un tableau des coûts estimés par palier (1 k, 10 k, 100 k, 1 M) est tenu dans `docs/COUTS.md`.

## 23. Langues

FR, EN, ES, PT, NL, selon la langue du téléphone (repli : anglais ; français si la langue est le français). Tout texte passe par des clés : app, textes venant de l'API (voix du minimoa, défis, bilans, notifications, e-mails), pages légales. Les prix et les dates suivent la région.

## 24. Plus de photo du jour : la série d'un lien vit avec la conversation (décision du 15 nov., 13 h 35)

- **La photo du jour disparaît** : plus de photo quotidienne à poster dans un lien, plus d'onglet ni de carte qui la demande, plus de notification ni d'activité en direct « X a posté, à toi ».
- **La série d'un lien** compte les jours d'affilée où **les deux se sont écrit** (au moins un message de chacun dans la journée, heure de Paris). Un jour où un seul a écrit ne casse pas les vies, mais n'allonge pas la série.
- **Les vies** ne changent pas : un jour entier sans aucun échange en coûte une ; à zéro le lien devient fantôme.
- **L'expérience et les niveaux** : les points que rapportait la photo du jour sont reportés sur la conversation régulière (un bonus le jour où les deux se sont écrit), pour que les 7 niveaux restent atteignables au même rythme qu'avant.
- **Dans le lien**, l'onglet « Aujourd'hui » devient l'état du lien du jour : la série, « à toi d'écrire » ou « vous vous êtes écrit aujourd'hui », la semaine, les vies, le niveau et ce qu'il débloque. « Souvenirs » garde les étapes du lien (rencontre, niveaux passés, records de série) et les photos que les deux se sont envoyées dans le chat si le chat en permet.
- **Rappels** : « lien en danger » reste ; « série avec X : à toi d'écrire avant minuit » remplace le rappel de photo, une fois par jour au plus et seulement si l'autre a déjà écrit. L'activité en direct correspondante remplace celle de la photo.
- Ne sont **pas** concernés : la photo de profil (floue pour l'autre jusqu'au niveau 5), les photos de preuve d'habitude, le défi du jour de type photo, ni la série personnelle (celle de la mèche), qui reste liée au défi du jour.
