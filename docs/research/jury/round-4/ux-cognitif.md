# Jury V5.3 · tour 4 · Designer UX, charge cognitive et accessibilité

**Verdict.** Ma demande n°1 du tour 3 est faite (une question par écran, pastille 1/9 → 9/9) et la moitié de mes défauts de pixel sont soldés (légendes sous les ombres, padding de Signaler, chips droites, titre monochrome, heures coupées), mais il reste une règle d'absence fausse sur la Fiche, trois heures de composition différentes, cinq césures et trois défauts signalés depuis le tour 2.

**Note globale : 8/10** (tour 1 : 5/10 · tour 2 : 7/10 · tour 3 : 8/10)

| Critère | Note | Pourquoi |
|---|---|---|
| Compréhension (5 s) | 9 | Trouvée, Sortie, Accueil répondent à « que se passe-t-il jeudi ? » (test 5 s toujours pas fait). |
| Charge cognitive | 9 | Une question par écran ; mais l'heure de la proposition n'est pas mémorisable (3 versions). |
| Envie (J+1/J+7/J+30) | 8 | Frise lun. → mer. 18 h → jeu. 16 h 30 → dim. 21 h 30. |
| Vraie rencontre (2 semaines) | 8 | Chemin jusqu'à la table cohérent ; activité jamais choisie. |
| Sécurité et confiance | 9 | Signaler, besoin d'aide, « je pars » : vocabulaire tenu. |
| Viralité / distribution | 9 | 6 cartes de couleurs distinctes, chacune son lien. |
| Argent | 9 | Tarifs en un écran, achat intégré dit partout. |
| Finition visuelle | 8 | 0 problème à l'outil ; 5 césures, Profil, Oeuf, Story, timbre dans Ta rue. |

## Outils de cohérence

Exécutés le 6 nov. 2026 : `node design/v5/check-facts.mjs` → « 86 fichiers, 3549 vérifications, 0 contradiction(s) » ; `NODE_PATH=$(npm root -g) node design/v5/a11y-audit.mjs .local/dc-runtime.js` → « 86 écrans, 1207 textes, 469 cibles, 1255 blocs de texte mesurés, 0 problème(s), contraste minimum 4.53:1 ». Les 86 rendus ont été ouverts un par un. Les deux outils passent ; voici ce qu'ils ne voient pas, trouvé à la main (écrans, spec-v5 rév. 4, business-model) :

1. **Règle d'absence fausse sur V5-Fiche** : « Une absence prévenue avant les visages, ou un retrait pour ta sécurité, ne compte jamais. » C'est la règle V5.2. V5.3 B.6 et spec §1/§5 (D-043) : annuler après la confirmation (mer. 18 h), donc avant les visages (jeu. 16 h 30), **est** une absence. check-facts contrôle « annulation gratuite jusqu'à… » mais pas « absence prévenue avant les visages ».
2. **Trois horaires de composition** : V5-Sortie-complete « composition des groupes du jeu. 12 nov. (lundi 9 novembre, 21 h) » et V5-Notifs « lun. 21:00 » ; V5-Chargement « Nino compose ton groupe… quelques secondes » (composition instantanée à l'inscription) ; spec-v5 §1 « Mardi 12 h : composition de la semaine » et §9 job `outings.compose (mardi 12 h)`.
3. **Spec et écrans encore en désaccord** : « rentable dès la 2ᵉ sortie du mois » (spec §6.2) contre « Rentable à partir de 3 sorties par mois » (V5-Abonnement ; 2 × 4,99 = 9,98 € < 9,99 €, l'écran a raison) ; proposition duo « 48 h » (spec §5) contre « La proposition reste 7 jours » (V5-Duo-choix) ; `ShareLink` « slug aléatoire base36 ≥ 8 » contre `s/Hq3vT8` (6 car., casse mixte), `i/r8Tz4w` (6), `m/k7f2q` (5) ; en-tête de spec « révision 3 » alors que l'historique dit « 4 — cette révision ».
4. **Proposition de duo au-delà de « pet + initiale »** (V5-Duo, carte N.) : « 30–34 ans · il · musique live, volley · en amitié ». V5.3 A.3 et spec §5 : avant le double oui, « on ne voit que le pet et l'initiale ». check-facts ne vérifie que le prénom.
5. **Le lieu reçoit ton prénom, Confidentialité ne le dit pas** : L-Effectif liste « Alex, Tom, Léa, Malo, Sarah » (+ pets) ; V5-Confidentialite « Qui voit quoi » n'a que Ton groupe / Ta bande / Personne, et L-Effectif dit « prénoms seulement… aucune autre donnée » en affichant aussi les pets.
6. **Canal auxiliaire de la garantie** : V5-Trouvee-amis affiche « Cette semaine, sortie entre amis pour toi » quand la garantie n'est pas tenue (spec §3 : « moi seul·e, si la garantie n'a pas pu être tenue »). Son **absence** sur V5-Trouvee dit donc à Alex que des personnes compatibles « histoire » sont là. Avec « 2 femmes », c'est « au moins l'une des deux » (k = 2) au lieu de « exactement les deux » ; avec une seule personne du genre recherché (1 femme, 3 hommes, 1 non-binaire, permis par « jamais plus de 3 du même genre »), c'est exact.
7. **Activités jamais demandées** : l'onboarding ne demande plus d'activité (Pet = 1 question, Affiner « Activités · à choisir »), mais V5-Trouvee propose « Jeux de société » et V5-Amorcage-solo dit « une activité que tu as cochée ».
8. **Contrat lieu incomplet ou contradictoire** : L-Contrat « 3 € (1re sortie offerte) » ne dit rien des places Blowy+ (spec §6.5 : 3 € aussi pour `PLUS_INCLUDED`) ; « Préavis : 72 h… pour que Blowy en annule un. Dans les deux sens » (L-Creneaux) contre V5-Sortie-annulee « Pas assez de confirmations » (connu au plus tard à la veille 18 h, donc < 72 h) sans compensation lieu ; L-Effectif « Virement le lundi » contre spec §6.5/§10.2 « relevé mensuel » (`period 'YYYY-MM'`), relevé absent de l'écran ; « Signaler un participant » sans bouton ni numéro.
9. **P&L** : business-model compte une absence payée comme « revenu déjà perdu ≈ 3,84 € ». Or Blowy reverse **4,99 €** au lieu et a déjà payé ≈ 0,32 € de frais et doit ≈ 0,83 € de TVA : la place coûte ≈ −1,15 € de plus (≈ −0,28 € par sortie à 8 % d'absence, 60 % payées). Les tables à deux (« même règle de compensation », L-Creneaux) et l'astreinte 18 h–2 h « par soir » restent comptées à 0 ou par participant.
10. **Défauts de pixel restants** : césures « toi / compris » (Trouvée, Trouvée-amis), « 2 femmes, 3 / hommes » (Trouvée-lyon, Amorçage), « check- / in. » et « 4 / chiffres » (Sortie), « mer. / 21 h 30 » (Accueil, carte Ton duo), « à / décider » (Affiner) ; « 1 sur 1 / sortie où tu / es venu » sur 3 lignes (Profil, T3) ; deux interrupteurs indépendants (Oeuf, T2-T3) ; sélecteur « Autres cartes › » jamais dessiné (Story, T2-T3) ; même illustration de café pour Café des Oiseaux et Le Comptoir Gabriel (Confirmation, Checkin, RdvDuo) ; vignette du café posée comme un timbre sur le trottoir de Ta rue ; « Tom, ton pote, est prévenu » (Sortie-annulee) contre « proches » partout ; « Tu viens seul » sur Lille en solo (persona Sarah).

## Mes exigences du tour 3 : vérification point par point

- **Une décision par écran** : réglé (Ville, Naissance, Genre, Pet, Rencontrer, Tu cherches, Consentement, Pour une histoire, Créneaux). Seul Créneaux porte 3 entrées dont 2 avec défaut.
- **Défauts de pixel du T3** : réglés : légendes Apres/Abonnement, padding « Être rappelé », case « Bloquer aussi », chips W-Repondre, titre Souvenir, « 21 h » (Lien), « 10 min » (Erreur-reseau), « ; » (Groupe-menu), lignes team (Sortie), « nouvelle » ×3 (« à découvrir »), 5 actions (Check-in-ok → 4). Non réglés : interrupteurs de l'Oeuf, « 1 sur 1 » (Profil), sélecteur de Story. Nouveaux : « toi / compris », « 3 / hommes », « check- / in. », « mer. / 21 h 30 », « à / décider ».
- **check-facts étendu (accord/duo, garantie/composition, liens)** : réglé (3549 vérifications, contrôles injectés vérifiés selon le README). a11y-audit mesure désormais les boîtes. Ils ne voient pas : la règle d'absence de la Fiche, l'heure de composition, la carte N. au-delà de l'initiale, les dates sans numéro (« mer. »).
- **Test 5 secondes sur 5 personnes** : toujours pas fait (aucun résultat dans le dépôt).
- **Glossaire** : « pote » revient (Sortie-annulee), « Je préfère la discrétion » vs « Mode discret ».

## Lecture d'ensemble

Le tour est le plus propre des quatre : l'onboarding respecte enfin la règle « une question par écran », et les outils mesurent ce qu'ils annoncent. Ce qui me retient à 8 n'est plus la finition générale, c'est la mémoire de l'utilisateur : quand arrive la proposition (3 réponses), quand une annulation devient une absence (2 réponses, dont une sur la Fiche, l'écran où l'on vérifie sa fiabilité), et ce qu'on voit d'une proposition de duo (la règle écrite sous la carte contredit la carte). Ce sont des contradictions de règle, pas de pixel ; elles coûtent plus cher en support qu'un texte coupé.

## Écran par écran

Format : note · problème → correction attendue. `BLOQUANT` = suffit à me faire refuser.

- **V5-Welcome** · 9/10 · Lisible en 5 s ; ~220 px vides entre le texte et les pets (y≈660–870 @2x). → Remonter les pets.
- **V5-Ville** · 10/10 · Une question, pastille 1/9, barre proportionnelle ; « trajet : on te le demande avec tes créneaux » annonce la suite. → —
- **V5-Ville-bordeaux** · 9/10 · État honnête, une action ; « Continue : on te dit, après tes créneaux, quand la tienne peut avoir lieu » : bon. → —
- **V5-Toi** · 10/10 · Date seule : ma demande n°1 T3 réglée. → —
- **V5-Genre** · 10/10 · Une question ; règle de comptage dite sous les choix. → —
- **V5-Pet** · 10/10 · Pet seul (activités sorties) ; « Choisis pour moi » réduit la décision. → —
- **V5-Rencontrer** · 9/10 · Une question, 3 réponses distinctes (« Groupe et duo » remplace le double « Les deux ») : réglé. → —
- **V5-Intention** · 9/10 · Une question ; « Amitiés et histoire » et « Une histoire » portent le même sous-titre. → Sous-titres différents (« groupes mixtes amitié + histoire »).
- **V5-Consentement** · 9/10 · Boutons de même poids ; « AMITIÉ SEULEMENT » tient dans son bouton : réglé. → —
- **V5-Toi-plus** · 8/10 · « Une ou plusieurs cases » mais CTA désactivé « CHOISIS UNE RÉPONSE » (singulier). → « Coche au moins une case ».
- **V5-Dispos** · 8/10 · Trois décisions sur un écran (créneaux, semaines off, trajet) ; deux ont un défaut, la case « Certaines semaines » ne dit pas ce qui se passe ensuite (un écran ? Affiner ?). → « … tu les choisiras dans Affiner » sous la case.
- **V5-Erreur-age** · 9/10 · « Nouvelle saisie dans 24 h » : réglé. Raton souriant sur un refus (T2, T3). → Pose neutre.
- **V5-Trouvee** · 8/10 · Répond à « que se passe-t-il jeudi ? » ; « toi / compris » orphelin ; « Jeux de société » sorti de nulle part (aucune activité demandée). → Insécable « toi compris » ; dire d'où vient l'activité.
- **V5-Trouvee-amis** · 8/10 · Même structure ; « toi / compris » orphelin. → Insécable.
- **V5-Trouvee-lyon** · 8/10 · « 2 femmes, 3 / hommes » coupé ; ordre des segments différent de Trouvée (« toi compris » au milieu). → Même ordre partout : « 5 personnes · tranche · f/h, toi compris ».
- **V5-Sortie** · 8/10 · Lignes team réglées. « check- / in. » coupé sur 2 lignes et « 4 / chiffres » orphelin dans « Comment ça se passe » ; colonne de libellés de 200 px pour 3 mots. → Colonne gauche 120 px, insécables « 4 chiffres », pas de césure dans « check-in ».
- **V5-Team** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Partage-invitation** · 9/10 · Deux actions, deux promesses claires. → —
- **V5-Invite** · 9/10 · « Ce lien… ne marche qu'une fois » : un seul sens pour « lien personnel ». → —
- **V5-Compte** · 9/10 · Ordre réglé (après « Je viens »). « Je préfère la discrétion » ici et « Mode discret » dans Notifs : deux noms, deux endroits pour le même interrupteur. → Un seul libellé « Mode discret ».
- **V5-Verif** · 8/10 · « photos » ×3 dans un paragraphe (T3) ; « ta photo ici » clair. → « Tes photos » défini une fois.
- **V5-Notifs** · 8/10 · Interrupteur à l'état réel ; « lun. 21:00 » contre « mardi 12 h » (spec) contre « quelques secondes » (Chargement) : on ne peut pas mémoriser quand arrive la proposition. → Une seule heure, dite une fois.
- **V5-Sortie-inscrit** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Accueil** · 8/10 · Carte « Ton duo » : « mer. / 21 h 30 » coupé (l'outil ne voit pas « mer. » sans numéro). → « mer. 11 nov. 21 h 30 » insécable.
- **V5-Accueil-discret** · 8/10 · 60 % de vide ; explication toujours dépliée (T3). → Repliable après la 1re vue.
- **V5-Accueil-duo** · 8/10 · Trois cartes, la sortie en 3e « facultatif » : la hiérarchie dit le contraire de « Ta sortie » ailleurs. → Même ordre que l'Accueil.
- **V5-Pause** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Chats** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Groupe** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Groupe-menu** · 9/10 · « Pour ta sécurité, toujours. » en phrase séparée : réglé. → —
- **V5-Attente** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Partage-ville** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Amorcage** · 8/10 · Tableau modèle ; « 2 femmes, 3 / hommes » coupé. → Insécable.
- **V5-Amorcage-solo** · 8/10 · « Tu viens seul » au masculin (persona Sarah) ; « une activité que tu as cochée » (aucune case d'activité n'existe). → Formulation épicène ; activité cohérente.
- **V5-Sortie-complete** · 8/10 · « composition… (lundi 9 novembre, 21 h) » : 3e version de l'heure de composition. → Une seule heure.
- **V5-Sortie-annulee** · 8/10 · « Tom, ton pote, est prévenu » : « pote » hors glossaire (« proches »). → « Tom est prévenu ».
- **V5-Affiner** · 8/10 · « à / décider » coupé sur 2 lignes ; « Activités · à choisir » alors que l'app propose déjà des activités. → « à décider » insécable ; « Activités · Nino choisit » tant que vide.
- **V5-Affiner-histoire** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Eviter** · 9/10 · Une décision, conséquences en 3 lignes. → —
- **V5-Confirmation** · 9/10 · Liste prénom · tranche · pet lisible ; « Je connais quelqu'un ici · examiné en privé, sans pénalité » sans « 1 fois par mois », que Révélation ajoute. → Même libellé aux deux endroits.
- **V5-Partage-confirmation** · 8/10 · « « Demain » en option » : option non dessinée. → Dessiner le choix.
- **V5-Revelation** · 9/10 · 4 actions mais hiérarchisées (principal, ligne, lien, rose) ; libellé « 1 fois par mois » différent de Confirmation. → Un libellé.
- **V5-Partage-checkin** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Ange** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **W-Ange** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **W-Ange-aide** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Checkin** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Checkin-ok** · 9/10 · 4 actions sous stress (au lieu de 5), « J'y suis » retiré : réglé. Les 4 coches « arrivés » : aria non vérifiable sur le rendu. → aria « 4 sur 5 arrivés » sur le groupe.
- **V5-Souvenir** · 10/10 · « SORTIE VÉCUE. » monochrome : réglé. → —
- **V5-Apres** · 10/10 · Légende à distance de l'ombre ; aucun état par défaut : réglés. → —
- **V5-Apres-resultats** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Partage** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Partage-dimanche** · 9/10 · Composition propre (pastilles en ligne). → —
- **V5-Apres-aucun** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Bande** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Rue** · 8/10 · Souvenirs dans la scène (réglé), mais la vignette du café est collée comme un timbre carré sur le trottoir (y≈1035–1125 @2x), sans ombre ni échelle. → Objet dessiné à l'échelle de la rue (enseigne, banc).
- **V5-Duo** · 8/10 · « DIRE OUI… » ouvre un choix : réglé. Carte N. : 4 informations (tranche, pronom, activités, intention) alors que la règle dit « pet et initiale » : le texte sous la carte contredit la carte. → Carte N. = pet + initiale + « en amitié ».
- **V5-Duo-choix** · 8/10 · Trois options claires ; « 7 jours » contre « 48 h » (spec). → Une durée.
- **V5-Lien** · 9/10 · « 21 h 30 » sur une ligne : réglé. → —
- **V5-Lien-debloque** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-RdvDuo** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Chat** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-RdvDuo-lea** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Oeuf** · 7/10 · Les deux interrupteurs restent indépendants (T2, T3, non réglé) : « Ne jamais » activé laisse « Je veux bien » actif. → « Ne jamais » grise le premier.
- **V5-Rupture** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Story** · 7/10 · « Autres cartes › » vers un sélecteur jamais dessiné (T2, T3) ; « Sans logo blowy. » : chip ou interrupteur ? état illisible. → Dessiner le sélecteur ; interrupteur avec état.
- **W-Repondre** · 10/10 · Chips droites : réglé. → —
- **V5-Profil** · 7/10 · « 1 sur 1 / sortie où tu / es venu » sur 3 lignes (T3, non réglé) ; « Mes cartes › » vers un écran non dessiné. → « 1 sortie sur 1 » ; dessiner Mes cartes.
- **V5-Fiche** · 7/10 · « Une absence prévenue avant les visages… ne compte jamais » : règle d'absence contraire à Sortie (« Ensuite, c'est une absence ») et à Confirmation (« Annuler maintenant compte comme une absence »). → « Une annulation avant la veille 18 h, ou un retrait pour ta sécurité, ne compte jamais ».
- **V5-Tarifs** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Abonnement** · 10/10 · Légende à distance de l'ombre : réglé. → —
- **V5-Paiement** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Paiement-ok** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Reglages** · 10/10 · « Format et voie Duo » : un seul réglage : réglé. → —
- **V5-Confidentialite** · 9/10 · Lisible ; « Qui voit quoi » oublie le lieu (prénom la veille). → Ligne « Le lieu : ton prénom, la veille 18 h ».
- **V5-Signaler** · 10/10 · Padding du rappel et case neutre : réglés. → —
- **V5-Supprimer** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Chargement** · 8/10 · « Quelques secondes » contredit la composition hebdo. → Texte vrai.
- **V5-Erreur-reseau** · 10/10 · « 10 min. » sur une ligne : réglé. → —
- **V5-Paiement-echec** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Verif-echec** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Notifs-refus** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Chats-vide** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **L-Effectif** · 8/10 · Hiérarchie claire ; « Signaler un participant » est une carte sans bouton ni numéro : on ne sait pas comment signaler. « prénoms seulement » à côté d'icônes de pets. → Bouton « Signaler » ; retirer les pets ou dire « prénoms et pets ».
- **L-Creneaux** · 9/10 · Grille lisible ; « coup de feu, fermé » déborde dans la colonne des tables. → Libellé dans la colonne état.
- **L-Contrat** · 9/10 · 5 articles, une page. → Signataire Blowy visible.

## Les 3 changements qui feraient le plus monter ma note

1. Une seule règle d'absence (Fiche alignée sur « après la veille 18 h ») et une seule heure de proposition (spec, Notifs, Sortie-complete, Chargement) ; ajouter les deux à check-facts.
2. Solder les 8 défauts listés (5 césures, « 1 sortie sur 1 », interrupteurs de l'Oeuf, sélecteur de Story) et étendre l'audit aux jours sans numéro (« mer. » + heure) et aux césures de mots composés.
3. Faire le test 5 secondes sur 5 personnes (Trouvée, Sortie, Accueil) et publier les réponses dans le dépôt.

## Je mets 10 si…

Je mets 10 si aucune règle n'a deux versions (absence, heure de proposition, carte de duo avant le oui, durée d'une proposition), si les défauts de pixel listés ici sont à zéro sur les 86 rendus, si check-facts couvre ces règles, et si un test 5 secondes sur 5 personnes répond juste à « que se passe-t-il jeudi ? » sur Trouvée, Sortie et Accueil.
