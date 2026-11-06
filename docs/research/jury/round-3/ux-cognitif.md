# Jury V5.2 · tour 3 · Designer UX, charge cognitive et accessibilité

**Verdict.** Le check-facts étendu et la grille d'âge fixe règlent le fond (zéro contradiction de données que je retrouve dans le périmètre de l'outil), mais trois écrans d'onboarding portent encore deux décisions, sept défauts de pixel du tour 2 sont toujours là, et l'outil ne voit ni le consentement daté après le duo, ni les heures coupées en fin de ligne.

**Note globale : 8/10** (tour 1 : 5/10 · tour 2 : 7/10)

| Critère | Note | Pourquoi |
|---|---|---|
| Compréhension (5 s) | 9 | Trouvée, Sortie et Accueil répondent à « que se passe-t-il jeudi ? » (non testé sur 5 personnes). |
| Charge cognitive | 7 | 8 écrans, pastille qui avance ; mais 3 écrans à double décision et 5 actions sur Check-in-ok. |
| Envie (J+1/J+7/J+30) | 8 | Frise lun. 21 h → mer. 18 h → jeu. 16 h 30 → dim. 21 h 30 mémorisable ; Pause et Ta rue sans jauge. |
| Vraie rencontre (2 semaines) | 8 | Chemin jusqu'à la table cohérent (code du chevalet partout). |
| Sécurité et confiance | 8 | Signaler partout, « Besoin d'aide » un seul mot, retrait et absence séparés. |
| Viralité / distribution | 8 | Une mise en page de carte apprise une fois ; phrases justes. |
| Argent | 8 | Un seul fournisseur nommé (Apple Pay) ; tarifs sur un écran. |
| Finition visuelle | 7 | Contrastes et cibles mesurés ; légendes sous les ombres, coupures d'heures, chips inclinées, padding de Signaler. |

## Outils de cohérence

Exécutés le 6 nov. 2026 : `node design/v5/check-facts.mjs` → « 75 fichiers, 2480 vérifications, 0 contradiction(s) » ; `NODE_PATH=$(npm root -g) node design/v5/a11y-audit.mjs .local/dc-runtime.js` → « 75 écrans, 1038 textes, 420 cibles, 0 problème(s), contraste minimum 4.53:1 ». J'ai aussi re-rendu les 75 sources (Playwright, @2x) et comparé aux PNG livrés : identiques au texte près (7 écrans diffèrent de quelques centaines de pixels d'illustration). Les deux outils passent. Ils ne voient pas ce qui suit, trouvé à la main :

- **Garantie « au moins 2 » + composition** (Trouvée, Sortie, Sortie-inscrit, Confirmation) : « 2 femmes, 3 hommes » et « Au moins 2 personnes du groupe cherchent aussi une histoire compatible avec la tienne ». Alex (il) cherche des femmes (ses duos : Jade, Léa) ; il n'y a que 2 femmes : ce sont forcément elles. check-facts vérifie « au moins N = garantie », pas que N reste inférieur à l'effectif du genre recherché.
- **Consentement après le duo** : Lien « Depuis dimanche 8 novembre, 21 h » (duo Jade) ; Confidentialité et Affiner-histoire « Accord donné le lundi 9 novembre ». La chronologie de facts.json ne contient pas la date d'accord.
- **Un seul lien pour deux promesses** : `blowy.app/i/r8Tz4w` est imprimé sur les 4 cartes publiques (Partage-confirmation, Partage-checkin, Partage, Partage-invitation), alors que V5-Invite dit « Lien à usage unique, réservé à toi ».
- **Position** : W-Ange-aide affiche « Position au moment de la demande · 21:04 · 12 rue Oberkampf » ; Confidentialité dit « Position · jamais stockée » et Check-in « Ta position n'est jamais demandée si tu tapes le code ».
- **Prénom avant le oui** : V5-Duo, carte « avec N. », pied de page « Dire oui à Nils ouvrirait un 2e duo ».
- **spec-v5.md non mise à jour** (en-tête : 2026-11-06, source `concept-v5.md`) : `photoRevealAt = min(9 h, startsAt − 3 h)` (= 9 h pour 19 h 30) et parcours J2 « 9 h photos simultanées » ; précondition « quartier `LIVE` », seuil 120, erreur `NEIGHBORHOOD_NOT_LIVE` ; `duo.maxActive` 3 ; place en placeholder 12 € « conso incluse » ; Blowy+ 19,99 € = 2 crédits + 1 accessoire mensuel ; annulation ≥ 24 h → crédit 90 j. Les écrans disent : visages à J −3 h, partout dès 5 personnes, 1 duo actif, 4,99 € conso non incluse, 9,99 € toutes les sorties, accessoires jamais vendus, annulation gratuite jusqu'aux visages.
- **Défauts de pixel du tour 2 toujours là** : légende chevauchée par l'ombre du bouton (Apres y≈1600–1625 @2x ; Abonnement y≈1615–1640) ; « Être rappelé par l'équipe… » collé au bord gauche de son fond (Signaler) ; chips inclinées (W-Repondre) ; titre bicolore (Souvenir) ; deux interrupteurs indépendants (Oeuf) ; 5 actions sous stress (Check-in-ok). Nouveaux : heures et dates coupées (« 21 / h. » Lien, « 10 / min. » Erreur-reseau, « mar. 10 / nov. » Accueil, « nov. / 21 h » Duo et Accueil-duo), « ; pour ta sécurité » en début de ligne (Groupe-menu), « Tom vient avec / toi » et « + 1 place pour un / pote » (Sortie, Sortie-inscrit), « nouvelle » ×3 sous les « ? » alors qu'un des trois est Malo.

## Mes exigences du tour 2 : vérification point par point

- **check-facts étendu (chronologie, tranches, phrases dérivées)** : réglé. 2480 vérifications : jour de semaine, chronologie par écran (`facts.ecrans`), grille fixe, « N nouvelles personnes », « N sur 5 arrivés », slugs, vocabulaire banni, point médian dans les boutons et titres. Ce qu'il ne voit pas : date d'accord (9 nov.) postérieure au duo (8 nov.) ; garantie vs composition ; « usage unique » vs lien public ; coupures de lignes.
- **Une seule décision par écran** : non. Toi (date + genre), Pet (pet + activités), Rencontrer (comment + pour quoi). Le concept se contredit lui-même : E.14 fusionne, E.15 dit « une décision par écran ».
- **Pastille qui avance** : réglé (1/8 → 8/8, barre proportionnelle, plus de « 4/8 » répété ni de double compteur).
- **Glossaire sans synonyme** : quasi réglé (visages, besoin d'aide, confirmée/confirmation, payée, Codenames). Restent « photos » (Verif, Supprimer) et deux réglages pour le Duo (Réglages).
- **aria-label sans point médian** : réglé (formulations épicènes, outil le vérifie).
- **Défauts de pixel du tour 2** : icône ⚠ et titre « arrivé·e » réglés ; légende sous le vote, padding de « Être rappelé », chips inclinées, titre bicolore, interrupteurs de l'œuf, 5 actions du check-in : non réglés.
- **Test 5 secondes sur 5 personnes** : non fait (aucun résultat dans le dépôt).

**Ma condition du 10 au tour 2** : 5 conditions ; 2 tenues (check-facts étendu, aria), 1 partielle (glossaire), 2 non (une décision par écran, test 5 s).

## Lecture d'ensemble

Le saut du tour est méthodologique : un outil qui aurait trouvé 58 contradictions dans la version précédente, et des tranches qui ne trahissent plus l'âge. Les écrans d'état (H) sont exemplaires. Ce qui reste est du ressort de la finition et de la règle de décision : 3 écrans d'onboarding à double décision, 7 défauts de pixel signalés au tour 2 et toujours là, 6 nouvelles coupures de ligne dans des heures et des dates. Aucun n'est bloquant ; ensemble, ils me tiennent à 8.

## Écran par écran

Format : note · problème → correction attendue. `BLOQUANT` = suffit à me faire refuser.

- **V5-Welcome** · 9/10 · Lisible en 5 s ; 220 px vides entre le texte et les pets. → Remonter les pets ou réduire l'espace.
- **V5-Ville** · 9/10 · Une question ; pastille 1/8 et barre proportionnelle : réglé. → —
- **V5-Ville-nantes** · 9/10 · État honnête, une action. → —
- **V5-Toi** · 7/10 · Deux décisions (date + genre) ; le bouton désactivé « TA DATE ET TON GENRE » oblige à retenir qu'il en manque une. Contraire à E.15 « une décision par écran ». → Date seule, puis genre ; ou réécrire E.15 et l'assumer.
- **V5-Pet** · 7/10 · Deux décisions (pet + 1 à 3 activités) ; « Tes sujets de conversation : plus tard » ajoute une 3e notion. → Activités dans Affiner, ou écran séparé.
- **V5-Rencontrer** · 6/10 · Deux questions, 6 cartes de même style, « Les deux » deux fois avec deux sens ; CTA « Choisis tes 2 réponses ». → Deux écrans, ou libellés distincts (« Groupe et duo » / « Potes et histoire »).
- **V5-Consentement** · 9/10 · Ordre réglé (avant la question sensible), boutons de même poids. « POTES SEULEMENT » touche presque les bords de son bouton (texte ≈405–735 dans 400–740 @2x). → Corps plus petit ou 2 lignes.
- **V5-Toi-plus** · 9/10 · Une question, cases vides. → —
- **V5-Dispos** · 9/10 · Semaines off déplacées : réglé. → —
- **V5-Compte** · 9/10 · Césure « TON COMPTE, / EN 1 TAP. » et crayon d'édition : réglés. → —
- **V5-Erreur-age** · 9/10 · « Compris » / « Erreur de date ? » : réglé. Raton souriant sur un refus (T2). → Pose neutre.
- **V5-Trouvee** · 8/10 · Répond à « que se passe-t-il jeudi ? ». « nouvelle » sous les 3 « ? » alors qu'un des trois est Malo : lu comme 3 femmes, contredit « 2 femmes, 3 hommes ». → « ? » seul, « nouvelle personne » en aria-label.
- **V5-Trouvee-potes** · 9/10 · Message avant le choix, même structure que Trouvée. → —
- **V5-Sortie** · 8/10 · Check-in par code cohérent avec l'écran Check-in : réglé. Lignes cassées « Tom vient avec / toi », « + 1 place pour un / pote » ; la phrase d'annulation mêle deux règles (« gratuite jusqu'aux visages » / « sans effet, une fois par mois »). → Une règle par phrase ; ligne team sur une ligne.
- **V5-Verif** · 8/10 · « photos » trois fois dans un paragraphe pour une section titrée « Ton visage ». → « Tes photos » défini une fois (ce que tu télécharges) ; « visages » = ce que voit le groupe.
- **V5-Notifs** · 9/10 · Interrupteur = état réel, libellé = état : réglé. → —
- **V5-Sortie-inscrit** · 8/10 · Mêmes lignes cassées que Sortie. → Une ligne.
- **V5-Team** · 9/10 · « vérifié » sur une ligne : réglé. → —
- **V5-Invite** · 8/10 · Clair ; « Lien à usage unique, réservé à toi » contredit le même lien sur 4 cartes publiques. → Deux types de liens nommés différemment.
- **V5-Accueil** · 8/10 · Chronologie réglée (duo commencé dim. 8). « mar. 10 / nov. » coupé dans « Ton duo » ; 330 px vides sous la scène. → Espaces insécables ; remonter la scène.
- **V5-Accueil-discret** · 8/10 · 60 % de vide ; la carte d'explication reste dépliée. → Repliable après la 1re vue.
- **V5-Accueil-duo** · 8/10 · « visages mar. 10 / nov. 21 h » coupé. → Espace insécable.
- **V5-Pause** · 9/10 · 3 durées, rien de présélectionné. → —
- **V5-Chats** · 9/10 · « Ton pote · venu en team » : un concept, un libellé : réglé. → —
- **V5-Groupe** · 9/10 · Pastilles pet + initiale, « Codenames » : réglé. → —
- **V5-Groupe-menu** · 8/10 · « ; pour ta sécurité, toujours. » commence une ligne. → Espace insécable avant « ; » ou phrase séparée.
- **V5-Attente** · 9/10 · Titre = date + manque ; 3 actions claires. → —
- **V5-Amorcage** · 9/10 · Tableau Quand / Activité / Lieu / Groupe : modèle. → —
- **V5-Sortie-complete** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Sortie-annulee** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Affiner** · 9/10 · États affichés, tout facultatif. → —
- **V5-Affiner-histoire** · 9/10 · « J'en ai déjà » présent. → —
- **V5-Confirmation** · 9/10 · « Lieu confirmé » (état) vs « confirmation » : vocabulaire tenu. → —
- **V5-Partage-confirmation** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Revelation** · 9/10 · Grille fixe ; retrait (neutre) et absence (rose) séparés : réglé. → —
- **V5-Ange** · 9/10 · « + » de « Un autre contact » toujours 12 px dans un rond pâle. → Icône lisible.
- **W-Ange** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **W-Ange-aide** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Checkin** · 9/10 · « TU ES LÀ ? » : réglé (plus de point médian). → —
- **V5-Checkin-ok** · 7/10 · Toujours 5 actions sous stress (Je pars, Faux appel, Besoin d'aide, « J'y suis », Fin de soirée) ; les 4 coches « arrivés » sans aria-label. → Regrouper « Je veux partir » ; aria « 4 sur 5 arrivés ».
- **V5-Partage-checkin** · 8/10 · 40 % de dégradé vide. → Resserrer.
- **V5-Souvenir** · 8/10 · Titre « SORTIE VÉCUE. » bicolore (dégradé brun → encre) et sous-titre bicolore : signalé au T2, non réglé. → Monochrome.
- **V5-Partage** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Apres** · 7/10 · « Non » par défaut en contour : réglé. La légende « Modifiable, résultats le dim. 15 nov. 21 h 30. » est encore sous l'ombre du bouton (y≈1600–1625 @2x) : défaut T2 non corrigé. Le contour noir épais du « Non » non choisi se lit comme sélectionné. → 16 px sous l'ombre ; contour fin pour l'état par défaut.
- **V5-Apres-resultats** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Apres-aucun** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Bande** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Rue** · 8/10 · Bande de sol vide (y≈970–1180) ; les souvenirs « qui décorent la rue » sont en dehors de la rue. → Placer les souvenirs dans la scène.
- **V5-Duo** · 7/10 · « DIRE OUI » noir actif alors que dire oui est impossible sans fermer J. ou payer ; l'explication est 300 px plus bas. « Nils » en clair en pied, « N. » sur la carte. « 21 h » orphelin. → « Dire oui » ouvre le choix (fermer J. / Blowy+) ; « N. » partout.
- **V5-Lien** · 8/10 · « 21 / h. » coupé. → Espace insécable.
- **V5-Lien-debloque** · 9/10 · — → —
- **V5-RdvDuo** · 9/10 · « Choisir ensemble… » neutre : réglé. → —
- **V5-Chat** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-RdvDuo-lea** · 9/10 · Icône parc à la place des lunettes : réglé. → —
- **V5-Oeuf** · 8/10 · Les deux interrupteurs restent indépendants (T2). → « Ne jamais » désactive et grise le premier.
- **V5-Rupture** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Partage-invitation** · 9/10 · Puce trompeuse retirée, phrase juste. → —
- **V5-Story** · 8/10 · « Autres cartes › » ouvre un sélecteur jamais dessiné (T2). → Dessiner le sélecteur.
- **W-Repondre** · 7/10 · Chips encore inclinées (−3° à +3°), « la personne qu'on appelle » penchée : lecture plus lente (T2, non réglé). → Chips droites.
- **V5-Profil** · 9/10 · Engrenage : réglé. « 1 sur 1 / sortie où tu / es venu » sur 3 lignes. → « 1 sortie sur 1 ».
- **V5-Fiche** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Tarifs** · 9/10 · « 1 duo actif » partout : réglé. → —
- **V5-Abonnement** · 8/10 · « 9,99 € par mois · résiliable ici en 1 tap » sous l'ombre du bouton. → 16 px de marge.
- **V5-Paiement** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Paiement-ok** · 9/10 · « payée » au lieu de « confirmée » : réglé. → —
- **V5-Reglages** · 8/10 · « Format : groupe et duo » et « Voie Duo : activée » : deux réglages pour un concept. → Un seul réglage.
- **V5-Confidentialite** · 9/10 · Interrupteurs à l'état réel ; Voie Duo sortie des réglages protecteurs : réglé. → —
- **V5-Signaler** · 7/10 · « Être rappelé par l'équipe · moins d'1 h… » : le texte démarre au bord gauche de son fond sombre (x≈46 @2x, 0 marge) : T2, non réglé. La case « Bloquer aussi » décochée a un contour rouge qui se lit comme une erreur. → Padding 16 px ; contour neutre.
- **V5-Supprimer** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Chargement** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Erreur-reseau** · 8/10 · « 10 / min. » coupé. → Espace insécable.
- **V5-Paiement-echec** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Verif-echec** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Notifs-refus** · 9/10 · Une action claire, vocabulaire du glossaire. → —
- **V5-Chats-vide** · 9/10 · Une action claire, vocabulaire du glossaire. → —

## Les 3 changements qui feraient le plus monter ma note

1. Une décision par écran pour de vrai : Toi (date | genre), Pet (pet | activités), Rencontrer (comment | pour quoi) ; ou trancher E.14 contre E.15 et retirer une décision de chaque écran (activités → Affiner).
2. Solder les défauts de pixel : légendes sous le bouton (Apres, Abonnement), padding de « Être rappelé » (Signaler), chips droites (W-Repondre), titre monochrome (Souvenir), interrupteurs liés (Oeuf), espaces insécables dans toutes les heures et dates, « ; » en début de ligne, « nouvelle » ×3.
3. Étendre check-facts à : date d'accord < tout duo « histoire », garantie < effectif du genre recherché, une seule promesse par lien ; ajouter une détection de coupure de ligne dans « N h », « N min », « N nov. » ; puis faire le test 5 secondes sur 5 personnes.

## Je mets 10 si…

Je mets 10 si chaque écran d'onboarding porte une seule décision avec une pastille qui avance, si les défauts de pixel listés ici sont à zéro sur les 75 rendus, si check-facts couvre aussi accord/duo, garantie/composition et liens, et si un test 5 secondes sur 5 personnes répond juste à « que se passe-t-il jeudi ? » sur Trouvée, Sortie et Accueil.
