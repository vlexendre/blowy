# Jury V5 · tour 1 · Designer UX, charge cognitive et accessibilité

**Verdict.** La V5 a fait le gros du travail (une action principale par écran, frise « Ta semaine », vocabulaire listé), mais les chiffres se contredisent d'un écran à l'autre, 17 concepts sont à apprendre, aucun état d'erreur n'existe et plusieurs textes blancs sur dégradé échouent au contraste WCAG.

**Note globale : 5/10**

| Critère | Note | Pourquoi |
|---|---|---|
| Compréhension (5 s) | 7 | Le Welcome se lit en 5 s ; le mot « pet » + « bande » + « sortie » forme une promesse compréhensible. |
| Charge cognitive | 5 | Sortie, groupe, bande, duo, voie Duo, rendez-vous à deux, accord, vision, vision card, souvenir, fiabilité, ange gardien, check-in, visages, place, Blowy+, œuf : 17 concepts. Miller dit 7 ± 2 à la fois, pas 17 sur un parcours de 2 semaines sans glossaire. |
| Envie (J+1/J+7/J+30) | 6 | La frise datée crée l'attente sans compte à rebours : bon. |
| Vraie rencontre (2 semaines) | 6 | Le parcours jusqu'à la sortie est lisible ; aucun écran ne gère l'échec (check-in refusé, paiement refusé, selfie raté). |
| Sécurité et confiance | 6 | Alerte, faux appel, ange gardien : bien. Mais « Alerte discrète » est un lien texte rouge sur fond violet sombre en bas de Check-in, sans cible de 44 pt garantie. |
| Viralité / distribution | 5 | Partage présent mais toujours en 2e niveau (lien texte). |
| Argent | 6 | Prix clairs ; Blowy+ dit ce qu'il ne fait pas. Contradiction souvenirs/accessoires (mêmes icônes). |
| Finition visuelle | 5 | Hiérarchie forte ; mais textes blancs sur rose/orange (ratio estimé ~2,5–3:1), libellés gris clairs, titre « PROUVE QUE T'ES TOI » collé au bord droit. |

## Lecture d'ensemble

Méthode : chaque écran rendu (390×844) ouvert, textes vérifiés dans les `.dc.html`. Incohérences de données repérées qui coûtent de la mémoire de travail à l'utilisateur (il doit réconcilier) :

- **Taille du groupe** : « 5 personnes » (Welcome), « 3 autres personnes… vous » (Invite), « 4 + toi » (Groupe, Chats), 4 personnes affichées (Trouvée, Sortie, Révélation, Check-in), « Les 6 places sont prises » (Complète), « On était 5 » (story), « sorties à 5 » (W-Ange).
- **Souvenirs** : 3 (Accueil), 4 (Profil, Fiche), « Les 3 souvenirs » (Supprimer).
- **Duos** : « 1 en cours · 2 libres » (Accueil) contre 1 en cours + 1 proposée + 1 libre (Duo).
- **Badges** : 3 + 1 non lus dans Chats, onglet Chats = 3.
- **Bande** : « 5 personnes », 4 pets dans la rue (Tom manque).
- **Dates** : RDV Jade sam. 15 nov. 18 h, visages « samedi 20 h » ; échéance « avant le 20 nov. » (Chat Léa) contre « avant le 22 nov. » (Lien).
- **Progression d'onboarding** : 01 (Craft), rien (Vie, barre 1/4 séparée), 03, 04 (+ 3 points), 05.
- **Point médian** : « arrivé·e », « ami·e », « inscrit·es » sont lus « arrivé point e » par VoiceOver/TalkBack ; aucune alternative accessible prévue.

## Reproches du tour V4 (panel personas) : statut

- Accueil à 8 compteurs (Sarah) : **réduit** à 4, toujours pas « aucun compteur » comme promis.
- Paywall à l'étape 1 : **retiré**.
- Puce « Tous genres » sans écran de genre (Yanis) : **réglé** par V5-Toi (une question, 3 choix).
- Arbre du Lien en 7 niveaux (Camille) : **réglé** (3 étapes, V5-Lien exemplaire).

## Écran par écran

Format : note · problème → correction attendue. `BLOQUANT` = suffit à me faire refuser.

- **V5-Welcome** · 7/10 · Une action principale ; mais 5 étiquettes flottantes (jeudi 19 h 30, un café du 11e, 5 personnes, Paris 11e · Lyon 4e, Ami·e ou plus) + 4 pets = trop de points d'ancrage ; « PETS & POTES » gris clair sur crème (contraste insuffisant). → Garder titre + 1 légende + CTA ; regrouper les 3 chips d'orbite en une ligne « Jeudi 19 h 30 · un café du 11e · 5 personnes » ; tagline ≥ 4,5:1.
- **V5-Invite** · 6/10 · Sous-titre blanc 15 pt sur dégradé orange (« Jeudi 19 h 30, Paris 11e… ») ~2,8:1 ; CTA « Créer mon pet » ne correspond pas au titre (« t'emmène à sa sortie ») : modèle mental cassé. → Texte sur aplat ou ombre portée ≥ 4,5:1 ; CTA qui reprend le verbe du titre (« Venir avec Alex »).
- **V5-Craft** · 5/10 · 8 décisions (4 espèces, 4 curseurs) sur un écran ; libellés non sélectionnés « Espiègle », « Contemplatif », « Scientifique », « Casanier » en gris ~#B8AFA5 sur crème (≈ 2:1) ; curseurs sans valeur textuelle pour VoiceOver. → Une décision par écran (Hick) ; libellés ≥ 4,5:1 ; curseurs à 3 crans avec valeur annoncée (« plutôt gentil »).
- **V5-Vie** · 6/10 · Une question, 4 tuiles : bien. Mais barre 1/4 + « 0 % » + 6 bulles « ? » : trois indicateurs de progrès différents ; « 6 ? » pour 4 questions. → Un seul indicateur (« 1 sur 4 ») ; retirer 0 % et les bulles.
- **V5-Intention** · 6/10 · Cases à cocher en haut à droite des cartes (cible ~32 pt visible), les deux cochées par défaut ; texte blanc sur rose (« Seulement si c'est réciproque ») ~3:1. → Toute la carte = cible ; rien de coché ; texte foncé sur rose ou rose plus sombre.
- **V5-Toi** · 7/10 · 3 choix + « Autre mot ? Je l'écris » : conforme. Double progression (barre 04 + points). → Retirer les points ; annoncer « question 1 sur 3 » à VoiceOver.
- **V5-Toi-plus** · 7/10 · Clair ; « Secret. En amitié, c'est tout le monde. » demande une relecture. → « Personne ne le voit. Pour l'amitié, tu rencontres tout le monde. »
- **V5-Toi-quartier** · 6/10 · « Paris 11e · ouvert · près de toi » contredit la ligne au-dessus « Jamais ta position » : l'utilisateur se demande s'il a été géolocalisé. → Retirer « près de toi ».
- **V5-Eclosion** · 6/10 · Écran sans action ni durée annoncée ; « Ton œuf » réutilise le mot « œuf » qui désigne plus tard un clin d'œil de duo (un mot = deux concepts). → « Nino arrive… » ; réserver « œuf » au clin d'œil ou l'inverse ; respecter « Réduire les animations ».
- **V5-Eclosion-ne** · 6/10 · « Garder Nino pour de vrai » ne dit pas qu'on va créer un compte ; badge « Né » en haut droit sans fonction. → CTA « Créer mon compte » ; supprimer le badge.
- **V5-Compte** · 7/10 · Hiérarchie Apple > Google > téléphone claire ; « 18 ans minimum » 11 pt gris clair. → Mention d'âge ≥ 13 pt contrastée.
- **V5-Trouvee** · 6/10 · Bonne carte ; mais « 19 H 30 » en capitales condensées (lecture dyslexie), chip « jamais ghoster » rose sur noir ~3:1, ligne « Ta 1re sortie est offerte » blanche sur orange (~2,3:1) ; carré « +1 » sans libellé d'action. → Heure en casse normale ; contrastes ≥ 4,5:1 ; « + Emmener un·e ami·e » comme libellé.
- **V5-Sortie** · 7/10 · Une action, informations groupées ; « Ange gardien · n'importe quel contact » ressemble à une ligne tappable sans l'être (pas de chevron). → Chevron + action, ou style non interactif.
- **V5-Sortie-inscrit** · 6/10 · Identique à 95 % à Sortie : l'état changé est un pill vert en haut à droite, facile à rater (cécité au changement). → Bandeau d'état pleine largeur « Tu y vas » sous le titre.
- **V5-Sortie-complete** · 4/10 · **BLOQUANT** · « Les 6 places sont prises » + un groupe de 4 dont je fais partie : l'utilisateur ne peut pas comprendre s'il y va ou non. → Ne montrer que la sortie de jeudi 20 et la raison exacte ; retirer la carte grisée du 13.
- **V5-Sortie-annulee** · 6/10 · Heure barrée : bon signal ; mais « Lieu exact mercredi à 18 h » et « visages jeudi à 9 h » restent affichés sur une sortie annulée. → Masquer toute échéance d'une sortie annulée.
- **V5-Verif** · 6/10 · Titre « PROUVE QUE T'ES TOI » touche presque le bord droit (~10 px) : risque de coupe en grande taille de police ; aucun état d'échec du selfie (lumière, visage non détecté). → Titre sur 2 lignes ; écran d'erreur dédié avec consigne et réessai.
- **V5-Notifs** · 7/10 · Pré-prompt exemplaire (exemples réels, limites, mode discret). → Garder ; ajouter un état « Refusé » qui explique comment réactiver.
- **V5-Accueil** · 5/10 · Promis « aucun compteur » : il y en a 4 (cloche 2, « 3 messages », « 3 souvenirs », onglet 3) ; le salon décoratif occupe ~40 % au-dessus de la ligne de flottaison, la carte sortie arrive à 720 px. → Carte sortie en premier ; un seul badge (messages) ; illustration ≤ 25 %.
- **V5-Attente** · 7/10 · État vide réussi : explication, progression, une action. Texte gris sur brun foncé dans la carte (« Tu es dans la liste… ») ~3:1. → Contraste ; dire ce qui se passe à 300 (« on t'écrit »).
- **V5-Chats** · 6/10 · 3 sections nettes ; badges incohérents (3 + 1 ≠ 3) ; « Caramel · J. » mélange pet et initiale, on ne sait pas qui parle. → Badge onglet = somme ; « J. (Caramel) » ou pet en sous-titre.
- **V5-Groupe** · 6/10 · Bon brise-glace ; « 4 + toi » faux ; initiales « L., M., S. » + pets différents = mémoriser 3 correspondances prénom/pet/espèce ; pas d'accès visible à Signaler/Quitter. → Montrer « L. · Suzie (lapin) » une fois dans un en-tête ; menu « … » avec Signaler/Quitter.
- **V5-Revelation** · 6/10 · Titre bicolore « LES VISAGES / SONT LÀ » (blanc + noir sur rose) fragmente la lecture ; légende blanche sur rose ~2,6:1 avec l'adresse, info critique du jour. → Titre monochrome ; adresse dans une carte blanche avec bouton « Itinéraire ».
- **V5-Ange** · 8/10 · Exemplaire : une question, 3 choix, liste « reçoit / ne reçoit jamais ». → Ajouter l'état « lien envoyé » et « Sam a ouvert le lien ».
- **W-Ange** · 7/10 · Lisible sans app ; « 21:30 · Tout va bien attendu » en gris clair, information clé peu contrastée. → Contraste ; bouton « Appeler Alex » déjà bien placé.
- **W-Ange-alerte** · 8/10 · Deux actions claires, ordre juste ; blanc sur rouge OK pour le titre. → Ajouter « Lire l'adresse au 17 » (texte à dicter).
- **V5-Checkin** · 6/10 · Gros bouton : bien ; « Alerte discrète » = lien texte rouge ~15 pt en bas, cible < 44 pt probable ; aucun état « position trop loin » ni repli code (spec §2.8 `VENUE_CODE`). → Alerte en bouton 44 pt ; écran d'échec « Pas encore sur place ? Entre le code du chevalet ».
- **V5-Checkin-ok** · 6/10 · « Malo · en route » affirme un fait inconnu ; « Faux appel » et « Alerte » côte à côte, même taille : risque de tap accidentel sur l'alerte. → « Pas encore là » ; séparer l'alerte (confirmation par appui long).
- **V5-Souvenir** · 6/10 · « +1 SOUVENIR » blanc sur jaune (~1,5:1) : illisible ; « venu » non inclusif. → Texte foncé ; « venu·e » ou formulation neutre (« présent·e à 1 sortie sur 1 »).
- **V5-Apres** · 7/10 · Une personne, 3 boutons, couleurs + texte (daltonisme OK) ; aucun « Passer / je ne sais pas » ; pas d'annulation du dernier vote visible. → Ajouter « Pas d'avis » et « Modifier » jusqu'à la révélation (spec §2.10).
- **V5-Apres-resultats** · 6/10 · Lien « Écrire à Léa » dans la carte + CTA identique en bas : doublon ; texte blanc sur rose dans la carte Léa. → Un seul CTA ; contraste.
- **V5-Bande** · 6/10 · « 5 personnes » vs 4 pets dans la rue ; Tom et Sarah ont tous deux un pigeon : confusion visuelle. → Rue = liste ; empêcher deux pets identiques côte à côte ou ajouter une couleur d'accessoire.
- **V5-Chat** · 6/10 · Souffleur utile ; bandeau « Proposer un rendez-vous · avant le 20 nov. » crée une échéance (contraire à la spec pour un duo issu d'une sortie). → Retirer la date.
- **V5-Duo** · 5/10 · Deux CTA de verbes différents pour la même nature d'action (« Ouvrir · visages samedi 20 h » / « Les faire se rencontrer ») ; % de vision sans explication ; frise 3 étapes en bas déconnectée des cartes. → Un seul verbe ; légende du % au 1er affichage ; frise en tête.
- **V5-Lien** · 7/10 · 3 étapes visibles : excellent pour la mémoire de travail. → Garder.
- **V5-Lien-debloque** · 6/10 · Légende blanche sur rose ; lecteur vocal sans transcription (accessibilité sourds/malentendants). → Transcription automatique du vocal ; contraste.
- **V5-RdvDuo** · 5/10 · Date proposée (sam. 15 nov. 18 h) antérieure au déblocage des visages (samedi 20 h) ; « Actif » ressemble à un bouton mais n'est pas un interrupteur. → Bloquer les créneaux avant déblocage ; vrais interrupteurs ou texte simple.
- **V5-RdvDuo-lea** · 6/10 · Même structure, cohérente. → Idem sur « Actif ».
- **V5-Oeuf** · 7/10 · Deux boutons de poids égal : bien ; liste blanche sur rose foncé lisible. → Garder.
- **V5-Rupture** · 6/10 · Premier message présélectionné ; pas de texte libre ; « Ghoster, c'est elle qui baisse » contredit la définition de la fiabilité (présences). → Rien de présélectionné ; option « J'écris mon mot » ; corriger la phrase.
- **V5-Story** · 5/10 · Seul l'onglet Question est rendu ; chip floutée « ??? » illisible ; icônes réseaux « IG / TT / SC » en lettres, pas en logos reconnaissables. → Rendre les 3 états ; logos officiels avec libellé.
- **W-Repondre** · 6/10 · 11 chips, 3 à choisir : OK ; CTA désactivé gris foncé sur violet (on ne voit pas qu'il est désactivé ni pourquoi). → Texte d'aide « choisis 3 mots » sur le CTA désactivé.
- **V5-Profil** · 6/10 · 3 chiffres ; « 1 / 1 sorties où tu es venu » non inclusif et syntaxe lourde. → « 1 sortie sur 1 ».
- **V5-Fiche** · 5/10 · Souvenirs « ils ne s'achètent pas » avec fleur et bonnet = mêmes icônes que les accessoires vendus en Boutique ; barre de fiabilité à 6 segments suggère un objectif de 6. → Iconographie distincte souvenirs/accessoires ; pas de barre segmentée.
- **V5-Boutique** · 6/10 · Lisible ; « Ne s'achète jamais : les souvenirs » à côté d'une Fleur à 2,99 € identique au souvenir d'Inès. → Icônes différentes ; pas de vente à l'unité (spec D-020).
- **V5-Reglages** · 7/10 · Groupes clairs ; Ange gardien avec icône « ! » (avertissement) et non bouclier. → Icône bouclier comme ailleurs.
- **V5-Abonnement** · 6/10 · Clair ; « Historique 0,00 € à ce jour » alors qu'une place est consommée et un prélèvement prévu. → Historique réel.
- **V5-Confidentialite** · 6/10 · 11 lignes, 3 interrupteurs ; « Mes photos se révèlent » utilise « photos » alors que le reste dit « visages ». → Un mot : visages.
- **V5-Signaler** · 6/10 · Motif présélectionné « Messages déplacés » ; aucune confirmation avant envoi. → Aucun motif par défaut ; récapitulatif avant envoi.
- **V5-Supprimer** · 7/10 · Conséquences listées, pause proposée : bien ; « Les 3 souvenirs » faux (4 ailleurs). → Valeur dynamique.

## Les 3 changements qui feraient le plus monter ma note

1. Une seule source de vérité pour les chiffres affichés (taille du groupe, souvenirs, duos, badges, dates) et un test automatique qui compare les maquettes entre elles avant chaque tour.
2. Passe WCAG 2.2 AA complète : tous les textes sur dégradé ≥ 4,5:1 (Invite, Trouvée, Révélation, Lien-débloqué, Souvenir, Intention), cibles ≥ 44 pt pour « Alerte discrète », « Pas cette semaine », cases d'Intention, et alternative au point médian pour les lecteurs d'écran.
3. Dessiner les états manquants : check-in refusé + code du lieu, selfie raté, paiement refusé, hors ligne, chats vides, bande vide ; et réduire le glossaire visible (fusionner « voie Duo » et « duo », réserver « œuf » à un seul usage).

## Je mets 10 si…

Je mets 10 si aucune donnée ne se contredit entre deux écrans, si chaque écran passe WCAG 2.2 AA (contraste, cibles 44 pt, ordre de lecture VoiceOver testé avec le point médian), si les 6 états d'erreur/vides cités existent, et si un test 5 secondes sur 5 personnes donne la bonne réponse à « que se passe-t-il jeudi ? » sur Trouvée, Sortie et Accueil.
