# Jury V5.1 · tour 2 · Designer UX, charge cognitive et accessibilité

**Verdict.** Le saut est réel (une source de vérité outillée, WCAG AA mesuré, 7 états dessinés, vote sur un écran), mais l'outil ne voit pas ce qu'il ne mesure pas : la chronologie (un duo affiché avant d'exister), les tranches d'âge (Tom « 31–35 ans » dans un groupe « 26–31 ans »), « 4 inconnu·es » alors que Tom est l'ami d'Alex, et le vocabulaire glisse encore (photos/visages, alerte/besoin d'aide, confirmée/confirmation).

**Note globale : 7/10** (tour 1 : 5/10)

| Critère | Note | Pourquoi |
|---|---|---|
| Compréhension (5 s) | 8 | Welcome lisible en 5 s (titre, sous-titre, 5 pets = 5 personnes) ; Trouvée répond à « que se passe-t-il jeudi ? » sans ambiguïté. |
| Charge cognitive | 6 | Onboarding passé de 5 à 8 étapes affichées mais 13 écrans réels avant Trouvée (Ville, Rencontrer, Intention, Consentement, Toi, Toi-plus, Craft, Vie ×3, Dispos, Éclosion, Compte, Compte-age) ; 3 écrans à « 4/8 » ; Toi et Compte-age portent 2 et 3 décisions. |
| Envie (J+1/J+7/J+30) | 7 | La frise confirmation → sortie → votes à date fixe se mémorise ; Pause en 1 tap enlève la culpabilité. |
| Vraie rencontre (2 semaines) | 7 | Chemin vers la table clair (table Blowy, chevalet, code) ; contradiction Sortie (« tu tapes son code, c'est ton check-in ») vs Check-in (position d'abord). |
| Sécurité et confiance | 8 | Signaler dans l'en-tête des écrans avec inconnus, alerte en appui long séparée du faux appel, retrait discret : modèle mental simple. |
| Viralité / distribution | 7 | Une seule mise en page de carte 9:16 réutilisée 5 fois : apprise une fois. Mais les cartes affirment des choses fausses (« 4 inconnu·es »). |
| Argent | 7 | Tarifs sur un écran, calcul de rentabilité juste (2 × 4,99 = 9,98) ; « App Store » contredit le paiement Apple Pay/Stripe et la spec. |
| Finition visuelle | 7 | Contrastes passés (min 4,53:1 mesuré) ; restent des défauts de pixel : icône ⚠ posée sur la bordure du bouton « Besoin d'aide », ligne « Être rappelé·e » collée au bord, légende du vote qui chevauche l'ombre du bouton, grands vides sous les contenus. |

## Outils de cohérence

Exécutés le 6 nov. 2026 : `node design/v5/check-facts.mjs` → « 75 fichiers, 786 vérifications, 0 contradiction » ; `NODE_PATH=$(npm root -g) node design/v5/a11y-audit.mjs .local/dc-runtime.js` → « 75 écrans, 1042 textes, 420 cibles, 0 problème, contraste minimum 4.53:1 ». Les deux passent. Ils ne contrôlent ni la chronologie entre écrans, ni les tranches d'âge, ni le sens des phrases dérivées : les contradictions relevées ci-dessous leur échappent.

## Mes exigences du tour 1 : vérification point par point

- **Une seule source de vérité + test automatique** : fait, incomplet. facts.json + check-facts.mjs existent et passent. Mais l'outil ne contrôle ni l'ordre des dates (Accueil et Chats datés lundi 9 montrent le duo Jade qui démarre mer. 11 21 h), ni les tranches (Tom 31–35 vs groupe 26–31), ni le sens (« 4 inconnu·es » avec Tom, ami).
- **Taille du groupe cohérente (4/5/6)** : réglé. « 5 personnes », « 4 + toi », 5 pets partout, plus de « 6 places ».
- **Souvenirs (3/4)** : réglé. 3 sur Accueil, Profil, Fiche, Supprimer.
- **Badges 3 + 1 ≠ 3** : réglé. 3 + 1 = 4, onglet 4, aria-label « 4 messages non lus ».
- **Dates RDV avant déblocage** : réglé. RDV Jade mar. 17 nov., après visages ven. 13 nov. 21 h.
- **Progression d'onboarding incohérente** : partiellement. Pastille « n/8 » unique, mais Consentement, Toi et Toi-plus sont tous « 4/8 » (la barre ne bouge pas sur 3 écrans) et Vie affiche « 6/8 » + « Ta vision · 1 sur 3 » : deux compteurs.
- **Point médian lu par VoiceOver** : non traité. aria-label « Léa, arrivé·e », « Toi, arrivé·e » : toujours « arrivé point e ». Aucune alternative (« arrivée », « là ») prévue.
- **WCAG 2.2 AA (contraste, cibles 44 pt)** : réglé (mesuré). a11y-audit : 0 problème, min 4,53:1, 420 cibles. Ordre de lecture VoiceOver non testé.
- **6 états d'erreur/vides** : réglé. Chargement, Erreur réseau, Paiement refusé, Vérif échouée, Notifs refusées, Chats vides, Erreur âge, plus Sortie complète/annulée, 0 accord.
- **Glossaire réduit, un mot = un concept** : partiellement. Tableau de vocabulaire publié, « œuf » réservé au clin d'œil. Mais : « photos » (Profil, Vérif) vs « visages » ; « Besoin d'aide » (Check-in) vs « Alerte » (Check-in-ok) ; « confirmée » (Paiement-ok) vs « confirmation » = veille 18 h ; « Ta vision » pour une question d'activités.
- **Accueil sans compteur, carte sortie en premier** : réglé. Un seul badge (messages), carte sortie en tête, salon réduit.
- **Sortie-complete bloquant** : réglé. Raison exacte, aucun groupe affiché, une décision Oui/Non.
- **Test 5 secondes sur 5 personnes** : non fait. Aucun résultat de test dans le dépôt.

**Ma condition du 10 au tour 1** : « aucune donnée ne se contredit entre deux écrans, chaque écran passe WCAG 2.2 AA (contraste, cibles 44 pt, ordre de lecture VoiceOver testé avec le point médian), les 6 états d'erreur/vides cités existent, et un test 5 secondes sur 5 personnes donne la bonne réponse à « que se passe-t-il jeudi ? » sur Trouvée, Sortie et Accueil »  
**Statut** : 1 sur 4 tenu (les états). WCAG : contraste et cibles oui, VoiceOver/point médian non. Données : au moins 5 contradictions trouvées à la main malgré l'outil. Test 5 s : non fait.

## Lecture d'ensemble

Contradictions repérées à la main (toutes passent check-facts) :

1. **Chronologie** : facts.json fixe « aujourd'hui = lundi 9 nov. » ; le duo Jade commence mer. 11 nov. 21 h. Pourtant Accueil (« Tes duos · Jade ») et Chats (« J. a répondu à ta question », « Lieu et visages mer. 11 nov. 18 h » encore à venir) montrent un duo qui n'existe pas encore.
2. **Tranches** : composition « 26–31 ans » sur Trouvée/Sortie/Sortie-inscrit, mais Révélation affiche « Tom · 31–35 ans ». Les tranches ne suivent aucune grille fixe (26–30, 24–28, 28–32, 31–35) : ce sont des fenêtres centrées sur l'âge, donc l'âge exact se lit au milieu (Alex 28 → 26–30).
3. **« 4 inconnu·es »** sur Partage-semaine et Partage alors que Tom est l'ami d'Alex : 3 inconnu·es.
4. **Check-in** : Sortie dit « Tu tapes son code dans l'app, c'est ton check-in » ; Check-in demande d'abord la position et relègue le code en repli.
5. **Mode discret** : activé par défaut (Notifs, Réglages « activé », Confidentialité « activés par défaut »), donc l'Accueil par défaut est Accueil-discret ; l'Accueil avec Nino n'est l'état de personne au départ.
6. **Consentement après la question** : Intention-rempli (3/8) pose déjà « Une histoire plutôt… Sérieuse / On verra » ; Consentement (4/8) annonce ensuite « Les questions suivantes (… une histoire sérieuse ou non) ».

## Écran par écran

Format : note · problème → correction attendue. `BLOQUANT` = suffit à me faire refuser.

- **V5-Welcome** · 8/10 · « près de chez toi » alors que l'écran suivant promet « On ne demande jamais ta position » ; 40 % de vide entre sous-titre et pets. → « dans ton quartier » ; remonter les pets ou réduire l'espace.
- **V5-Ville** · 8/10 · Une question, saisie + suggestions claires ; « Tu peux aussi aller dans » propose 10e et 20e qui sont en liste d'attente : que signifie y aller ? → Libeller « Quartiers acceptables (quand ils ouvrent) » ou ne proposer que des quartiers ouverts.
- **V5-Ville-fermee** · 8/10 · Très bon état honnête ; deux alternatives + CTA = 3 chemins, et le CTA « M'inscrire » ne dit pas ce qui est demandé (compte ? numéro ?). → « M'inscrire avec mon numéro » ou préciser « sans créer de pet ».
- **V5-Team-amorcage** · 8/10 · « vérifié·e » (Toi) vs « vérifié » (Yacine) : bien. Deux CTA « Inviter » (carte + bouton) pour la même action. → Retirer « Inviter » dans la carte pointillée ou le rendre non interactif.
- **V5-Rencontrer** · 9/10 · Rien de présélectionné, 3 cartes, 1 question. « Voie Duo » introduit un 2e nom pour « duo ». → « À deux, par écrit · duo ».
- **V5-Intention** · 9/10 · Conforme : rien coché, carte entière cliquable, bouton grisé qui dit quoi faire. → —
- **V5-Intention-rempli** · 6/10 · Les sous-choix « sérieuse / on verra » et « enfants » apparaissent AVANT l'écran de consentement qui les annonce comme « questions suivantes » ; 3 décisions sur un écran. → Déplacer les sous-choix après Consentement (ou le consentement avant Intention).
- **V5-Consentement** · 7/10 · Texte clair ; mais incohérent avec l'ordre (voir ci-dessus) et pastille « 4/8 » partagée avec Toi et Toi-plus. → Réordonner ; numéroter 4, 5, 6 ou regrouper sous « 4/8 · 1 sur 3 ».
- **V5-Toi** · 6/10 · 2 décisions (genre + pronom) sur un écran, CTA « Choisis tes 2 réponses » ; chip « prénom seul » sans marge interne à droite (texte 582→738 px dans une chip 575→740). → Pronom sur un écran à part ou ligne d'aide claire ; padding ≥ 12 px.
- **V5-Toi-plus** · 8/10 · Clair ; « Ami·e, Plus, Non » en citron sur noir dans un paragraphe : 3 mots-boutons qu'on ne peut pas toucher. → Les montrer comme des chips inertes visiblement non cliquables, ou en texte simple.
- **V5-Craft** · 9/10 · Une décision, 5 espèces nommées, rien à mémoriser. Pastille 5/8 juste. → —
- **V5-Vie** · 6/10 · Double compteur « 6/8 » + « Ta vision · 1 sur 3 » ; « Jusqu'à 3 » mais bouton « Choisis une réponse » ; « vision » est un mot V4 hors glossaire pour une question d'activités ; seules 1 des 3 questions est dessinée. → Un compteur ; « Choisis 1 à 3 activités » ; titre « Tes sorties » ; dessiner les 3 questions.
- **V5-Dispos** · 9/10 · Cases + horaires alignés, interrupteur clair, bouton désactivé explicite. → Dessiner l'état « Une semaine sur deux » activé (paires/impaires) qui n'apparaît pas.
- **V5-Eclosion** · 8/10 · « 1,5 s · touche pour passer » + bouton : bon. L'écran n'a pas de pastille d'étape alors qu'il s'intercale entre 7/8 et 8/8. → —
- **V5-Compte** · 8/10 · Hiérarchie Apple > Google > téléphone ; mention 18+ lisible. Titre coupé « EN 1 / TAP. » (veuve d'un mot). → Césure « TON COMPTE, / EN 1 TAP. ».
- **V5-Compte-age** · 6/10 · 3 décisions sur un écran (date, âge du groupe, prénom) ; date pré-remplie 14/03/1998 alors que « rien n'est présélectionné » ; « Prénom affiché · Alex » sans chevron ni crayon : modifiable ? → Date seule ici, âge du groupe sur l'écran suivant ; roue vide au départ ; icône d'édition.
- **V5-Trouvee** · 8/10 · Répond à « que se passe-t-il jeudi ? ». « 26–31 ans » contredit Tom « 31–35 » à la Révélation ; 330 px de dégradé vide entre la carte et les boutons ; « Trop de monde ? Essaie à deux » sur 2 lignes dans un bouton. → Tranches sur une grille fixe ; remonter les CTA ; libellé « Essayer à deux ».
- **V5-Sortie** · 7/10 · Bonne structure ; mais « Tu tapes son code dans l'app, c'est ton check-in » contredit l'écran Check-in (position d'abord) ; la ligne d'annulation fait 4 lignes de texte gris avant le CTA. → Une seule méthode décrite ; annulation en 1 ligne + lien « Détails ».
- **V5-Verif** · 8/10 · Titre corrigé, consignes claires. « Tes photos … Visibles par ton groupe » : le glossaire dit « visages ». → « Tes visages » ou définir « photos » dans le glossaire.
- **V5-Notifs** · 8/10 · Pré-prompt exemplaire ; le mode discret est ON par défaut, ce qui fait de l'Accueil-discret l'état par défaut (non signalé). → Dire ici « Ton accueil sera neutre » et montrer l'aperçu.
- **V5-Sortie-inscrit** · 9/10 · Bandeau pleine largeur « Tu y vas » : réglé. « Annuler · gratuit jusqu'à … » en lien gris sous un CTA noir : bon poids. → —
- **V5-Team** · 8/10 · « Toi · vérifié » (non inclusif ici, inclusif sur Team-amorcage) ; « a rejoint · vérifié » sur 2 lignes avec la coche décalée. → « vérifié·e » partout ; une ligne.
- **V5-Accueil** · 7/10 · Carte sortie en tête, un badge : réglé. Mais « Tes duos · Jade » le lundi 9 alors que le duo commence mer. 11 ; 300 px vides sous la scène ; ce n'est pas l'état par défaut (mode discret ON). → Retirer Jade de cet état ; annoter « mode discret désactivé ».
- **V5-Accueil-discret** · 8/10 · Clair et honnête ; 60 % d'écran vide ; la carte « Mode discret activé » prend plus de place que le rendez-vous. → Carte d'explication repliable après la 1re vue.
- **V5-Pause** · 9/10 · 3 durées, rien de présélectionné, conséquence sur la sortie prévue écrite. → —
- **V5-Chats** · 6/10 · Badges justes, mais chronologie fausse : « J. a répondu » et « Visages ven. 13 nov. » alors que le duo n'a pas commencé ; Tom apparaît sous « Ta bande » avec la puce « Ta team » : deux concepts pour une ligne. → Retirer le duo de cet état ou dater l'écran après mer. 21 h (et alors retirer « Visages et lieu mer. 18 h » à venir).
- **V5-Groupe** · 8/10 · En-tête « L. Suzie · M. Gaston · S. Pia · Tom Pépite » : 4 couples prénom/pet en une ligne à mémoriser ; « Code Names » (le jeu s'écrit Codenames). → Pastilles pet + initiale dans l'en-tête ; « Codenames ».
- **V5-Groupe-menu** · 9/10 · 4 actions claires, Signaler en rouge en tête, conséquence d'un départ écrite. → —
- **V5-Sortie-complete** · 9/10 · Ancien bloquant réglé : raison, date de composition, aucune carte de groupe, Oui/Non. → —
- **V5-Sortie-annulee** · 9/10 · Aucune échéance périmée, 3 garanties cochées, proposition suivante. → —
- **V5-Attente** · 7/10 · « tu en fais partie » des 87 « personnes vérifiées » juste après une inscription « en 1 tap » sans selfie : contradiction ; chip « Ton pet » alors que la ville fermée devait passer avant toute création de pet. → « 87 / 120 personnes vérifiées · tu es inscrit·e » ; pas de chip pet si pas de pet.
- **V5-Revelation** · 6/10 · « Tom · 31–35 ans » contredit la composition « 26–31 ans » ; 3 actions de poids différent dont 2 liens gris de même taille aux conséquences opposées (« sans pénalité » / « compte comme une absence »). → Grille de tranches fixe ; séparer visuellement le retrait discret (neutre) et l'absence (avertissement).
- **V5-Ange** · 9/10 · Exemplaire ; « Un autre contact » avec un « + » de 12 px dans un rond pâle. → Icône lisible.
- **W-Ange** · 8/10 · Lisible sans app ; « Ce lien ne m'est pas destiné » en 13 pt souligné gris en pied de page. → Le monter au-dessus de l'encart promotionnel.
- **W-Ange-alerte** · 9/10 · « À lire au 17 » : réglé. Deux CTA de couleurs inverses lisibles. → —
- **V5-Checkin** · 7/10 · « Besoin d'aide » ici, « Alerte » sur Check-in-ok : deux mots pour une action ; l'icône ⚠ est posée sur la bordure gauche du bouton (x ≈ 40–66 px) ; « TU ES ARRIVÉ·E ? » en titre lu « arrivé point e ». → Un seul mot (« Alerte ») ; icône dans le bouton ; titre « Tu es là ? ».
- **V5-Checkin-code** · 8/10 · Repli clair, 5 essais annoncés ; même défaut d'icône ⚠ sur la bordure du bouton bas. → Corriger l'icône.
- **V5-Checkin-ok** · 8/10 · Plus de « en route », alerte en appui long séparée : réglé. 5 éléments d'action en bas (partir, faux appel, alerte, fin de soirée, signaler) sur un écran consulté sous stress. → Regrouper « Je pars » et « Faux appel » dans une feuille « Je veux partir ».
- **V5-Souvenir** · 8/10 · Contraste réglé, CTA principal = partager. Le titre en dégradé « SORTIE » brun/encre donne une lecture en deux tons. → Titre monochrome.
- **V5-Partage** · 6/10 · « avec 4 inconnu·es » : Tom est l'ami d'Alex, donc 3 ; la puce citron « Sans visages ni prénoms » ressemble à un réglage désactivable alors qu'il est imposé. → « avec 3 inconnu·es et un ami » ; puce en texte d'info, non bouton.
- **V5-Apres** · 8/10 · Ancien reproche réglé : un écran, 3 pastilles, « Un problème ? » par ligne, modifiable. La légende « Modifiable, résultats… » chevauche l'ombre du bouton (y ≈ 1 620–1 640 px) ; « Non » noir plein = la plus forte, sur toutes les lignes. → Espacer de 16 px ; « Non » par défaut en contour, pas en plein.
- **V5-Apres-resultats** · 9/10 · Un CTA, une ligne de partage, « Tu ne vois que les tiens ». → —
- **V5-Apres-aucun** · 9/10 · Ton neutre, une action, un repli. → —
- **V5-Partage-accords** · 6/10 · « +1 DUO » avec seulement 2 pets (Nino et la pigeonne de Sarah) : où est le duo ? La pigeonne identifie Sarah pour qui a vu le groupe. → Pets génériques (silhouettes) au lieu des vrais pets ; 1 pet par accord.
- **V5-Bande** · 8/10 · « 2 dans ta bande », pets distincts, « + Jeudi » par ligne : réglé. « Ta team · ami invité » : deux notions sous un nom. → « Ton ami · venu en team ».
- **V5-Duo** · 7/10 · Un verbe « Ouvrir » : réglé. Mais « Ouvrir » sur une proposition pas encore acceptée, et tranches 24–28 / 28–32 incompatibles avec 26–30 ailleurs. → « Dire oui » pour la proposition ; grille de tranches fixe.
- **V5-Lien** · 9/10 · 3 étapes, dates absolues, une action : modèle. → —
- **V5-Lien-debloque** · 8/10 · Transcription : réglé. « Toi · 26–30 ans » et « Jade · 24–28 ans » : deux grilles. → Grille fixe.
- **V5-RdvDuo** · 8/10 · Un CTA, ange en 3 tuiles ; « Choisir ensemble un autre lieu » en rouge ressemble à une erreur. → Lien neutre.
- **V5-Chat** · 8/10 · Signaler en en-tête, « L'utiliser » pré-remplit : réglé. 380 px vides au milieu. → —
- **V5-RdvDuo-lea** · 7/10 · Icône lunettes de soleil (l'accessoire de Nino sur la Fiche) pour une expo : un pictogramme, deux sens. → Icône « expo » dédiée.
- **V5-Oeuf** · 8/10 · Deux interrupteurs ; « Ne jamais me le proposer » et « Je veux bien » peuvent être ON ensemble. → Le 2e désactive et grise le 1er.
- **V5-Rupture** · 9/10 · Rien de présélectionné, « J'écris mon propre mot », sortie sécurité : réglé. → —
- **V5-Partage-semaine** · 6/10 · « JEUDI, JE SORS AVEC 4 INCONNU·ES » : faux (Tom) ; la carte occupe 1 030 px dont 450 de dégradé vide. → « 3 inconnu·es et un pote » ; resserrer.
- **V5-Partage-invitation** · 6/10 · Carte « VIENS JEUDI AVEC MOI ET TOM » sous la puce active « Sans visages ni prénoms » : contradiction visible. → Retirer « et Tom » ou retirer la puce sur cette carte.
- **V5-Partage-ville** · 8/10 · Clair ; même puce trompeuse « Sans visages ni prénoms » sur une carte qui n'en contiendrait jamais. → Retirer la puce ici.
- **V5-Story** · 8/10 · NGL retiré, mention 18+ ; « Autres cartes › » ouvre un 2e niveau de navigation non dessiné. → Dessiner le sélecteur de cartes.
- **W-Repondre** · 8/10 · Bouton désactivé lisible : réglé. 10 chips de longueurs inégales rotées (−3° à +3°) : lecture plus lente pour les dyslexiques. → Chips droites.
- **V5-Profil** · 7/10 · « tes photos la veille » (glossaire : visages) ; icône soleil pour les réglages (ressemble à un thème clair/sombre). → « visages » ; icône engrenage.
- **V5-Fiche** · 8/10 · Souvenirs datés distincts des accessoires : réglé. Les lunettes de l'accessoire réapparaissent comme icône d'expo (RdvDuo-lea). → Iconographie exclusive.
- **V5-Tarifs** · 8/10 · Lisible. « Ne s'achète jamais : plus de sorties » à 3 cm de « Blowy+ … la voie Duo sans limite » (gratuit = 3 duos à la fois) : l'utilisateur doit réconcilier. → Écrire « Gratuit : 3 duos à la fois. Blowy+ : sans limite » sur Duo et Tarifs.
- **V5-Abonnement** · 7/10 · « Tu résilies dans les réglages de l'App Store » + « Restaurer mes achats » alors que la place se paie par Apple Pay (Stripe, spec §6.2) : deux systèmes de paiement implicites. → Un seul fournisseur affiché et cohérent avec Supprimer.
- **V5-Paiement** · 8/10 · Feuille Apple Pay claire ; « Remboursé » (masculin) sous une « place » (féminin) : « Remboursée » ailleurs. → Accord.
- **V5-Paiement-ok** · 6/10 · « Ta place du jeu. 19 nov. est confirmée » : « confirmation » désigne la veille 18 h dans tout le produit ; ici c'est le paiement. → « Ta place est payée. Confirmation du groupe : mer. 18 nov. 18 h ».
- **V5-Reglages** · 9/10 · Pause en tête, groupes clairs, un seul statut. → —
- **V5-Confidentialite** · 7/10 · « Réglages protecteurs, activés par défaut » contient « Voie Duo » activée : ce n'est pas un réglage protecteur. → Déplacer Voie Duo dans « Mes sorties ».
- **V5-Signaler** · 7/10 · Motifs en 2 groupes, rien de présélectionné : réglé. « Être rappelé·e par l'équipe… » collé au bord gauche de son fond sombre (x ≈ 50 px, 0 marge) ; « Bloquer aussi » pré-coché alors que le reste ne l'est pas. → Padding 16 px ; assumer et expliquer le pré-cochage (« par défaut, pour ta sécurité »).
- **V5-Supprimer** · 8/10 · Chiffres justes, Pause et Supprimer de même poids : réglé. « abonnement App Store » répète l'incohérence de paiement. → Aligner sur le vrai fournisseur.
- **V5-Chargement** · 9/10 · Squelettes + message : réglé. → —
- **V5-Erreur-reseau** · 9/10 · Dit ce qui est sûr et ce qui est périmé ; repli hors ligne. → —
- **V5-Paiement-echec** · 9/10 · Raison, montant, délai de garde, 3 sorties. → —
- **V5-Verif-echec** · 9/10 · Raison + 3 consignes + repli humain. → —
- **V5-Notifs-refus** · 9/10 · Dit comment réactiver et ce qui compte. → —
- **V5-Erreur-age** · 8/10 · Clair ; mascotte souriante sur un refus. → Mascotte neutre.
- **V5-Chats-vide** · 9/10 · Dit quoi faire, un CTA. → —

## Les 3 changements qui feraient le plus monter ma note

1. Étendre check-facts à la chronologie (aucun objet affiché avant sa date de début dans un écran daté), à une grille fixe de tranches d'âge (25–29, 30–34…) et aux phrases dérivées (« N inconnu·es » = taille − 1 − team).
2. Remettre l'onboarding à une décision par écran et une pastille qui avance à chaque écran : Consentement avant toute sous-question d'intention, pronom séparé du genre, âge du groupe séparé de la date de naissance.
3. Fermer le glossaire : visages (jamais photos), alerte (jamais « besoin d'aide »), confirmation (jamais pour un paiement), un seul fournisseur de paiement nommé partout ; et une alternative au point médian pour les lecteurs d'écran.

## Je mets 10 si…

Je mets 10 si un check-facts étendu (chronologie, tranches, phrases dérivées) passe à 0 sur les 75 écrans, si chaque écran d'onboarding porte une seule décision avec une pastille qui avance, si le glossaire n'a plus aucun synonyme à l'écran, si les libellés à point médian ont un aria-label lisible, et si un test 5 secondes sur 5 personnes répond juste à « que se passe-t-il jeudi ? » sur Trouvée, Sortie et Accueil.
