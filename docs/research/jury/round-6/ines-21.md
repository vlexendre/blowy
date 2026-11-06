# Jury tour 6 — Inès, 21 ans, Bordeaux (`ines-21`)

**Verdict.** Bordeaux me donne enfin un chiffre (« environ 40 inscrits ont entre 18 et 25 ans ») et une échéance datée (« d'ici le jeu. 19 nov. ») ; mais la phrase suivante annonce ma sortie du 21 « en 26–34 ans », la grille « Âge pour une histoire » commence à 22 ans (j'en ai 21), la seule sortie 22–25 de la démo (Saint-Denis) est passée en 22–29, et toujours pas de prix étudiant : 8.

**Note globale : 8/10** (T1 4 · T2 6 · T3 7 · T4 8 · T5 8 · T6 8)

| Critère | Note |
|---|---|
| Compréhension | 9 |
| Charge cognitive | 9 |
| Envie | 8 |
| Vraie rencontre | 8 |
| Sécurité et confiance | 9 |
| Viralité | 9 |
| Argent | 7 |
| Finition visuelle | 9 |

Aucun bloquant.

## Mes reproches des tours 1 à 5, point par point

| Reproche | État au tour 6 |
|---|---|
| « dont N de 18–25 ans » sur Ville et Attente | Réglé : « environ 40 ». |
| Échéance datée | Réglé : « d'ici le jeu. 19 nov. ». |
| Tranche de ma sortie du 21 | Affichée, mais pas la mienne : « elle a lieu, en 26–34 ans ». |
| Une sortie 18–25 dans la démo | RÉGRESSION : Saint-Denis est passée de 22–25 à 22–29 ans. |
| Tarif étudiant (T1 → T6) | NON : refusé par concept-v5.5 (D.10). Le parrainage (une sortie offerte par mois) le remplace, mais il n'est ni sur Tarifs ni sur Blowy+. |
| Duo muet avant le oui | Réglé et renforcé : espèce + initiale (« Un capybara · N. »). |
| Éviter avant mon 1er groupe | Tenu. |
| Ta rue, carte « Aide Bordeaux à sortir » | Tenu. |
| Nouveau | Affiner-age n'a pas de 18–21 : je ne peux pas cocher ma propre tranche. |

## Écran par écran (97)

| Écran | Note | Ce qui empêche le 10 | Correction attendue |
|---|---|---|---|
| `V5-Welcome` · 01 · Bienvenue | 9 | Le raton est toujours debout au milieu de la table de 5 (pas assis à une place) ; ~150 px vides entre le texte et l'illustration. | Raton assis à une place, illustration remontée. |
| `V5-Ville` · 02 · Tu sors où ? (1/9) | 10 | Rien. | — |
| `V5-Ville-bordeaux` · 02b · Bordeaux, aucune sortie encore | 9 | « Environ 40 qui ont entre 18 et 25 ans » : enfin. Mais « 60 inscrits » au lieu de « 64 vérifiées » : est-ce que ces 40 ont passé le selfie ? | « personnes vérifiées ». |
| `V5-Toi` · 03 · Date de naissance (2/9) | 10 | Rien. | — |
| `V5-Genre` · 04 · Tu es… (3/9) | 10 | Rien. | — |
| `V5-Pet` · 05 · Ton pet (4/9) | 10 | Rien. | — |
| `V5-Rencontrer` · 06 · Comment rencontrer (5/9) | 10 | Rien. | — |
| `V5-Intention` · 07 · Tu cherches (6/9) | 10 | Rien : la promesse a maintenant son état honnête (« Cette semaine, pas encore »). | — |
| `V5-Consentement` · 08 · Consentement, si histoire (7/9) | 10 | Rien. | — |
| `V5-Toi-plus` · 09 · Pour une histoire (8/9) | 10 | Rien. | — |
| `V5-Dispos` · 10 · Créneaux, semaines, trajet (9/9) | 10 | Rien : la case renvoie désormais à un état coché dessiné (10a). | — |
| `V5-Dispos-semaines` · 10a · Une semaine sur deux, cochée | 8 | « Une semaine sur deux, à partir de » + « dès lun. 16 nov. » (redondant) ; « Sans toi : 16, 30 nov., 14, 28 déc.…. » (point, points de suspension, point ; « Sans toi » ambigu) ; semaines du lundi, week-end inclus ou non : pas dit. | « Sans sortie : semaines du 16 nov., du 30 nov., du 14 déc.… (week-end compris) ». |
| `V5-Eviter` · 10b · Éviter les personnes que tu connais (facultatif) | 10 | Rien. | — |
| `V5-Erreur-age` · 10c · Moins de 18 ans | 10 | Rien. | — |
| `V5-Trouvee` · 11 · Nino t’a trouvé une sortie | 10 | Rien : ligne « Lieu et prénoms le mer. 11 nov. 18 h. Annulation gratuite jusque-là », raton en pastille, partage en icône. | — |
| `V5-Trouvee-lyon` · 11b · Lyon 7e → Lyon 4e, mardi | 9 | « Et la semaine d'après : mar. 24 nov. · Atelier céramique. » : toujours ni heure ni quartier (T5 → T6). | « mar. 24 nov. · 19 h 30 · Atelier céramique · Lyon 1er ». |
| `V5-Sortie-lyon` · 11c · Sortie à Lyon | 9 | Même gabarit que Paris : réglé. La ligne « Bastien vient avec toi · 3 nouvelles personnes › » répète mot pour mot la phrase du groupe 60 px au-dessus. | Supprimer la ligne, ou la transformer en statut de Bastien (« selfie fait »). |
| `V5-Confirmation-lyon` · 11d · Lyon : lieu et prénoms la veille | 7 | « Photo fournie par le lieu » posé sur des maisons dessinées (le décor de Ta rue), le même visuel que pour Bloc Station à Paris 18e ; pastille blanche tronquée en haut à droite de l'image. | Une vraie photo par lieu (le terrain du Five), sans élément coupé. |
| `V5-Trouvee-banlieue` · 11e · Saint-Denis → Paris 18e | 8 | C'était la sortie 22–25 de la démo ; elle est passée en 22–29. | Revenir à 22–25 ou en dessiner une autre. |
| `V5-Sortie-banlieue` · 11f · Sortie à Paris 18e | 9 | Gabarit commun : réglé. Ligne « Yacine vient avec toi · 3 nouvelles personnes › » en double avec la phrase du groupe. | Supprimer le doublon. |
| `V5-Confirmation-banlieue` · 11g · Paris 18e : lieu et prénoms, avec Yacine | 7 | « Toi · 26–29 ans » au milieu de quatre « 22–25 ans » (tranche d'Alex, pas de l'habitant de Saint-Denis) ; « Photo fournie par le lieu » = les mêmes maisons dessinées qu'à Lyon ; « Saint-/Denis » coupé ; mêmes pets qu'à Paris et Lyon (Yacine a Pépite, le pet de Tom). | Tranche propre au profil, vraie photo de Bloc Station, insécable « Saint‑Denis ». |
| `V5-Pas-encore` · 11h · Cette semaine, pas encore (Marseille) | 9 | Le titre et la 1re phrase disent deux fois « Cette semaine, pas encore » ; aucune suite : ni « on te prévient dès que c'est possible », ni voie Duo ; ~330 px vides. | Retirer la redite, ajouter « On te prévient dès que c'est possible » et « En attendant : la voie Duo › ». |
| `V5-Sortie` · 12 · Fiche de sortie | 9 | Frise de 3 jalons, prix sous le bouton, « Tom vient avec toi » : test des 5 secondes réglé. La ligne « Tom vient avec toi · 3 nouvelles personnes › » répète la phrase du groupe juste au-dessus. | Supprimer le doublon (l'écran fait 1 069 px). |
| `V5-Team` · 13 · Viens avec quelqu’un | 9 | Le parrainage est ici (« ta prochaine sortie est offerte, 1 par mois au plus ») : le seul geste de prix, caché sur l'écran « Viens avec quelqu'un ». | Le répéter sur Tarifs. |
| `V5-Partage-invitation` · 13b · Invitation personnelle (message) | 10 | Rien. | — |
| `V5-Invite` · 13c · Le proche arrive par le lien | 10 | Rien : plus de mascotte sur la page reçue. | — |
| `V5-Compte` · 14 · Ta place : compte, discret ou normal | 10 | Rien. | — |
| `V5-Verif` · 15 · Selfie vérifié | 10 | Rien : « Alex · 26–29 ans ». | — |
| `V5-Notifs` · 16 · Notifications | 10 | Rien. | — |
| `V5-Sortie-inscrit` · 17 · Tu y vas | 10 | Rien : « Titre dans ton agenda : « Rendez-vous · 19 h 30 » ». | — |
| `V5-Accueil` · 18 · Accueil | 10 | Rien : « Lieu révélé mer. 11 nov. 18 h », « Mettre en pause mes sorties », « Taille du pet », duo en 2e plan. | — |
| `V5-Accueil-discret` · 18b · Accueil, mode discret | 10 | Rien. | — |
| `V5-Accueil-duo` · 18c · Accueil, format à deux | 8 | « Jeudi 12 novembre · avec quelqu'un que tu connais, si tu veux » : inchangé, alors que concept-v5.5 E.23 demandait de le reformuler. | « Jeudi 12 novembre · 19 h 30 · facultatif ». |
| `V5-Pause` · 19 · Pause en 1 tap | 10 | Rien : « Personne ne voit que tu es en pause ». | — |
| `V5-Chats` · 20 · Chats | 10 | Rien : pastille grise. | — |
| `V5-Groupe` · 21 · Chat du groupe | 10 | Rien. | — |
| `V5-Groupe-menu` · 21b · Signaler, bloquer, quitter | 8 | « Pendant les soirs de sortie, une personne de l'équipe répond en moins d'1 h » : contredit « joignable pendant toute ta sortie » (sorties sam. 15 h, dim. 11 h). | « Pendant ta sortie, une personne de l'équipe répond en moins d'1 h ». |
| `V5-Attente` · 22 · Bordeaux : il manque 2 personnes, daté | 7 | Mon écran. En haut, « environ 40 inscrits ont entre 18 et 25 ans » (« ans » seul sur sa ligne) ; en dessous, ma sortie du 21 « a lieu, en 26–34 ans ». Je n'y suis pas. | Tranche qui m'inclut (« en 18–25 ans ») ou dire pourquoi. |
| `V5-Partage-ville` · 22b · Carte « Aide Bordeaux à sortir » | 10 | La carte que je posterais pour Bordeaux. | — |
| `V5-Amorcage` · 23 · Lille : toi et 2 proches | 9 | Même date, même tranche, même lieu que la version solo : réglé. Mais gabarit à part (tableau, ni frise, ni « Règles d'annulation › », « Je viens · offerte » sans « ensuite 4,99 € »). | Gabarit commun de Sortie. |
| `V5-Amorcage-solo` · 23b · Lille en solo | 10 | Épicène, rassurant, dans 5 jours. | — |
| `V5-Sortie-complete` · 24 · Pas de place cette fois | 9 | Raton de 150 px sur un écran de refus. | Pastille 40 px. |
| `V5-Sortie-annulee` · 25 · Sortie annulée | 10 | Rien : « Annulée le mer. 11 nov. à 18 h », « Tom est prévenu ». | — |
| `V5-Affiner` · 26 · Affiner plus tard | 8 | « Âge pour une histoire · 26–34 ans » alors que l'écran 26c ne coche que « 30–34 ans ». | Résumé = tranches cochées (« 30–34 ans »). |
| `V5-Affiner-histoire` · 26b · Affiner : histoire, horizon | 9 | Horizon dessiné (« Dans 1 à 2 ans », « Dans 3 à 5 ans », « Pas de projet », « Je ne sais pas ») ; pas de « J'en ai déjà ». | Ajouter « J'en ai déjà ». |
| `V5-Affiner-age` · 26c · Âge pour une histoire | 7 | 22–25 est la plus jeune tranche : à 21 ans, rien pour moi. | Ajouter 18–21 (et le haut de la grille). |
| `V5-Affiner-ambiance` · 26d · Ambiance | 10 | Rien. | — |
| `V5-Confirmation` · 27 · Veille 18 h : lieu, photo, prénoms, pets | 9 | Trajet, pets, « Changer mes photos » : réglé. Le haut de la photo du lieu passe sous la pastille de date ; « Partager ma semaine » ajouté sous le bouton (3 liens). | Photo entière ; partage hors de la veille. |
| `V5-Partage-confirmation` · 27b · Carte « cette semaine je sors » | 10 | Rien. | — |
| `V5-Revelation` · 28 · J −3 h : les visages | 9 | 3 lignes sous « À ce soir » : réglé. Mais « Partager « je sors ce soir » » est glissé entre « Je connais quelqu'un ici » et « Je ne peux plus venir ». | Partage en dernier ou hors de cet écran. |
| `V5-Partage-checkin` · 28b · Carte « je sors ce soir » | 10 | Rien. | — |
| `V5-Ange` · 29 · Ange gardien | 10 | Rien. | — |
| `W-Ange` · 30 · WEB · page de l’ange | 10 | Rien. | — |
| `W-Ange-aide` · 30b · WEB · besoin d’aide (lieu, pas de position) | 10 | Rien : « L'équipe est joignable pendant toute la sortie ». | — |
| `V5-Checkin` · 31 · Check-in par code | 10 | Rien : code seulement, « Ta position n'est jamais demandée ». | — |
| `V5-Checkin-ok` · 31b · Check-in fait | 10 | Rien. | — |
| `V5-Souvenir` · 32 · Sortie vécue : voter | 9 | Table et 5 verres, raton petit au centre : réglé. Les éclaboussures de couleur derrière la table restent criardes. | Retirer les éclaboussures. |
| `V5-Apres` · 33 · Vote secret | 10 | Rien. | — |
| `V5-Apres-resultats` · 34 · Tes accords : partager la soirée | 8 | « VOUS AVEZ DIT PLUS TOUS LES / DEUX » : « DEUX » toujours seul sur sa ligne (T5 → T6). | Insécable « tous les deux » ou « PLUS, TOUS LES DEUX ». |
| `V5-Partage-jeudi` · 34a · Carte « Alors, jeudi ? » (sans votes) | 10 | Rien. | — |
| `V5-Partage` · 34b · Carte « on était 5 » | 10 | Rien. | — |
| `V5-Partage-dimanche` · 34c · Carte « ma bande s’agrandit » | 10 | Rien : plus de mascotte. | — |
| `V5-Apres-aucun` · 34d · Pas d’accord cette fois | 9 | « Partager « On était 5 » » proposé sur l'écran « Pas d'accord cette fois » ; raton 130 px. | Retirer le partage de cet écran. |
| `V5-Bande` · 35 · Ta bande | 9 | Le titre « TA BANDE » est posé sur le banc orange du décor. | Décaler le banc ou le titre. |
| `V5-Partage-bande` · 35b · Carte « Ma bande » (mode capture) | 10 | Rien. | — |
| `V5-Rue` · 36 · Ta rue | 10 | Rien. | — |
| `V5-Duo` · 37 · Voie Duo : espèce et initiale avant le oui | 10 | Espèce et initiale : même le nom du pet ne passe plus. | — |
| `V5-Lien` · 38 · Duo : vous écrivez | 10 | Rien. | — |
| `V5-Duo-hh` · 38a · Duo homme-homme (K.) | 7 | Une seule étape dessinée (le chat). Les icônes des étapes 1 et 2 sont le raton Nino dans un duo « entre Gaston et Biscuit » ; « joignable pendant toute ta sortie » dans un chat sans sortie ; dates copiées du duo de Jade. | Proposition, visages et rendez-vous dessinés ; icônes et phrase propres à ce duo. |
| `V5-Lien-debloque` · 38b · Les visages | 10 | Rien. | — |
| `V5-RdvDuo` · 39 · Rendez-vous à deux | 9 | « Une personne de l'équipe est joignable pendant toute ta sortie » sur un rendez-vous ; vignette = même dessin que le check-in. | « pendant tout ton rendez-vous ». |
| `V5-Chat` · 40 · Duo après une sortie | 8 | Bandeau violet « Proposer un rendez-vous à deux » toujours permanent (T2 → T6), même après « Plutôt un samedi ». | Le replier une fois une proposition envoyée. |
| `V5-RdvDuo-lea` · 40b · Rendez-vous, table à deux (lieu partenaire) | 10 | Rien : lieu partenaire, table à deux, équipe joignable : le bloquant du tour 5 est levé. | — |
| `V5-Oeuf` · 41 · Clin d’œil | 10 | Rien. | — |
| `V5-Rupture` · 42 · Partir proprement | 10 | Rien. | — |
| `V5-Cartes` · 43 · Mes cartes | 8 | « Aucun rappel, aucune pastille » : bien. Mais les 9 vignettes 9:16 sont des dégradés vides : aucun aperçu réel (concept-v5.5 D.11). | Miniature réelle de chaque carte. |
| `V5-Story` · 43b · Décris-moi en 3 mots | 9 | Seule carte qui garde le raton en grand. | Mots seuls, comme les autres cartes. |
| `W-Repondre` · 44 · WEB · un proche répond | 9 | « Alex aimerait savoir comment ses proches décrivent Alex » (répétition). | « … comment ses proches le décrivent ». |
| `V5-Profil` · 45 · Profil | 10 | Rien. | — |
| `V5-Fiche` · 46 · Nino : souvenirs, fiabilité privée | 10 | Rien. | — |
| `V5-Tarifs` · 47 · Tarifs | 7 | 4,99 €, 9,99 € : toujours rien pour une étudiante, et le parrainage n'est même pas écrit ici. | Place étudiante, ou « Invite quelqu'un : ta prochaine sortie offerte (1 par mois) ». |
| `V5-Abonnement` · 48 · Blowy+ : sorties, Apple Pay | 7 | « Rentable à partir de 3 sorties par mois » : j'en fais 2. | Formule 2 sorties ou prix étudiant. |
| `V5-Paiement` · 49 · Place : Apple Pay | 10 | Rien. | — |
| `V5-Paiement-ok` · 49b · Place payée | 10 | Rien. | — |
| `V5-Reglages` · 50 · Réglages | 10 | Rien : « Urgent pendant une sortie · < 1 h ». | — |
| `V5-Confidentialite` · 51 · Confidentialité | 9 | « Ton groupe » complet : réglé. « Accord donné … : qui tu veux rencontrer, type d'histoire » n'inclut ni l'âge pour une histoire ni l'horizon enfants ; « Ta bande : la même chose » (le lieu la veille, les visages : pas la bande). | Lister âge et horizon dans l'accord ; ligne bande exacte. |
| `V5-Signaler` · 52 · Signaler | 8 | « Être rappelé par l'équipe · moins d'1 h les soirs de sortie » : contredit l'astreinte « pendant toute ta sortie » (A.1). | « moins d'1 h pendant ta sortie ». |
| `V5-Supprimer` · 53 · Supprimer le compte | 10 | Rien. | — |
| `V5-Chargement` · 54 · Chargement | 10 | Rien : « d'ici là. » tient sur une ligne. | — |
| `V5-Erreur-reseau` · 55 · Pas de connexion | 10 | Rien. | — |
| `V5-Paiement-echec` · 56 · Paiement refusé | 10 | Rien. | — |
| `V5-Verif-echec` · 57 · Selfie non vérifié | 10 | Rien : « supprimée sous 48 h ». | — |
| `V5-Notifs-refus` · 58 · Notifications refusées | 10 | Rien. | — |
| `V5-Chats-vide` · 59 · Chats vides | 10 | Rien. | — |
| `L-Effectif` · 60 · Effectif de la veille 18 h | 10 | Rien vu de mon côté (côté lieu). | — |
| `L-Creneaux` · 61 · Créneaux et plafond de tables | 10 | Rien vu de mon côté (côté lieu). | — |
| `L-Contrat` · 62 · Contrat d’une page | 10 | Rien vu de mon côté (côté lieu). | — |

## Les 3 changements qui feraient monter ma note

1. Attente : la tranche de ma sortie du sam. 21 nov. doit m'inclure (18–25 / 22–25), ou l'écran doit dire pourquoi c'est 26–34.
2. Grille d'âge complète dans « Âge pour une histoire » : 18–21 en bas, 40 ans et plus en haut.
3. Un prix pour moi : place étudiante, ou le parrainage écrit en clair sur Tarifs et Blowy+.

## Je mets 10 si…

Je mets 10 si ma sortie du sam. 21 nov. à Bordeaux est annoncée dans une tranche qui m'inclut, si je peux cocher « 18–21 » dans Âge pour une histoire, et s'il existe un prix pour moi : place étudiante ou parrainage affiché sur Tarifs. Le chiffre des 18–25, l'échéance datée, le Duo muet et Éviter sont faits.
