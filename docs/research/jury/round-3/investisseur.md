# Jury V5.2 · tour 3 · Investisseur (seed, marketplaces et consumer social)

**Verdict.** Le dossier a enfin un P&L, des prix honnêtes et un seul moyen de paiement à l'écran, mais le P&L compte la compensation lieu pour zéro alors qu'elle mange presque toute la contribution, Blowy+ repose sur un avantage numérique (duos illimités) exposé à l'achat intégré, et spec-v5 décrit toujours l'ancien produit.

**Note globale : 7/10** (tour 1 : 4/10 · tour 2 : 6/10)

| Critère | Note | Pourquoi |
|---|---|---|
| Compréhension (5 s) | 9 | « Partout : une sortie se forme dès 5 personnes » : thèse de liquidité claire. |
| Charge cognitive | 7 | Funnel court ; mais deux produits (groupe, duo) à expliquer et à opérer. |
| Envie (J+1/J+7/J+30) | 8 | Rythme hebdo et bande : rétention plausible ; non mesurée. |
| Vraie rencontre (2 semaines) | 8 | Sortie à J+3, amorçage daté : la valeur arrive vite. |
| Sécurité et confiance | 8 | Couche confiance = coût, mais aussi l'argument de défendabilité. |
| Viralité / distribution | 7 | Team + 4 cartes ; un seul slug rend le canal non mesurable. |
| Argent | 6 | Contribution réelle ≈ 0,55 € par sortie après compensation lieu, pas 6,50 € ; risque IAP sur Blowy+ ; spec à 12 € / 19,99 €. |
| Finition visuelle | 8 | Propre et cohérent. |

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

- **P&L par sortie et par ville** : partiellement. business-model.md donne un P&L par sortie (≈ 6,50 € de contribution) et les indicateurs du test de 8 semaines ; pas de P&L par ville (astreinte, lieux, ops). L'estimation Stripe « de mémoire » (1,5 % + 0,25 €) correspond au tarif public des cartes standard de l'EEE.
- **Un seul canal d'abonnement, spec et écrans d'accord** : écrans oui (Apple Pay partout, plus d'« App Store » ni de « Restaurer ») ; spec non (Blowy+ en Stripe Billing + RevenueCat, placeholder 19,99 €, 2 crédits + 1 accessoire mensuel).
- **Duo hors MVP** : non. Gardé, gratuit pour 1 duo actif, et c'est l'avantage de Blowy+.
- **spec-v5 à jour avec le concept** : non. En-tête « 2026-11-06 », source `concept-v5.md` seulement : place à 12 € « conso incluse », `duo.maxActive` 3, quartier `LIVE` avec seuil 120, annulation ≥ 24 h → crédit 90 j, `photoRevealAt` à 9 h.
- **Contrat lieu minimal** : dans le concept (H.24, 15 €), pas dessiné (V5.3).
- **Défendabilité face à Timeleft et Tinder Events** : argumentée (densité par les teams, couche confiance, continuité bande/duo), présentée comme hypothèse : honnête.

**Ma condition du 10 au tour 2** : cohorte de 8 semaines + contribution positive + 5 lieux sous contrat + réponse sur la copie.
**Statut** : la réponse sur la copie est écrite ; rien n'est mesuré ; 0 lieu sous contrat dessiné ; la contribution est surestimée (ci-dessous).

## Lecture d'ensemble : le P&L ne tient pas tel qu'écrit

business-model.md dit : compensation lieu de 15 € par place non honorée « couverte par la non-remise des absents », donc « ≈ 0 € net ». C'est faux. Les absents payants (4,99 €) sont déjà dans le revenu de 10,30 € (2 payants sur 5) ; ne pas les rembourser n'apporte rien de plus. Et un absent sur sa 1re sortie offerte ou en Blowy+ ne laisse rien.

| Ligne | business-model | Recalcul |
|---|---|---|
| Revenu net par sortie | 10,30 € | 10,30 € |
| Support / astreinte | − 2,50 € | − 2,50 € (sous-estimé : coût par soir, pas par participant) |
| Vérification | − 1,25 € | − 1,25 € |
| Compensation lieu à 8 % d'absence (5 × 0,08 × 15 €) | ≈ 0 € | **− 6,00 €** |
| Annulations gratuites après l'effectif lieu (mer. 18 h → jeu. 16 h 30), non chiffrées | — | à ajouter |
| **Contribution** | **≈ 6,50 €** | **≈ 0,55 €**, négative dès qu'environ 1 place sur 140 est annulée gratuitement après l'effectif lieu puis compensée (5 × 0,73 % × 15 € ≈ 0,55 €) |

À cela s'ajoute le risque achat intégré : si Apple exige l'IAP pour les « duos sans limite », 15 à 30 % de Blowy+ partent en commission. Le modèle a le bon sens (pas de dark pattern, prix honnêtes), mais il n'a aujourd'hui pas de marge démontrée, et la spec décrit un autre produit que les écrans.

## Écran par écran

Format : note · problème → correction attendue. `BLOQUANT` = suffit à me faire refuser.

- **V5-Welcome** · 8/10 · « Ou un tête-à-tête, par écrit d'abord » : le Duo reste dans la promesse principale ; deux produits à financer. → Promesse = la sortie ; Duo après.
- **V5-Ville** · 9/10 · 6 lieux partenaires au 11e : début d'actif défendable. → —
- **V5-Ville-nantes** · 8/10 · « Partout dès 5 personnes » : bonne thèse de liquidité ; la marge d'une ville sans lieu signé est inconnue. → —
- **V5-Toi** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Pet** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Rencontrer** · 6/10 · Duo à égalité dès 4/8 : je le voulais hors MVP ; il est gardé, gratuit, et c'est l'avantage de Blowy+. → Duo après la 1re sortie vécue.
- **V5-Consentement** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Toi-plus** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Dispos** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Compte** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Erreur-age** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Trouvee** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Trouvee-potes** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Sortie** · 8/10 · « Ensuite 4,99 € la place » annoncé avant : honnête. → —
- **V5-Verif** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Notifs** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Sortie-inscrit** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Team** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Invite** · 9/10 · Invité : 1re offerte, coût lieu nul, vérification ≈ 1 € : CAC d'invitation bas. → —
- **V5-Accueil** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Accueil-discret** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Accueil-duo** · 7/10 · Un Accueil complet pour le format à deux : coût d'un 2e produit. → —
- **V5-Pause** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Chats** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Groupe** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Groupe-menu** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Attente** · 8/10 · « La voie Duo, à Nantes » : du dating en ligne dans une ville sans lieu ; hors thèse. → Retirer le Duo des villes sans sortie.
- **V5-Amorcage** · 9/10 · Amorçage daté dans un lieu qui a confirmé : la thèse « partout dès 5 » devient testable. → —
- **V5-Sortie-complete** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Sortie-annulee** · 8/10 · « Ta 1re sortie reste offerte » : le coût d'acquisition s'allonge à chaque annulation. → Mesurer le taux d'annulation par ville.
- **V5-Affiner** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Affiner-histoire** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Confirmation** · 8/10 · Lieu signataire d'une charte : actif. → —
- **V5-Partage-confirmation** · 7/10 · Même slug `r8Tz4w` sur toutes les cartes : impossible d'attribuer une inscription à une carte, donc l'indicateur « 0,3 inscrit par sortie » ne se mesure pas par canal. → Slug par carte.
- **V5-Revelation** · 8/10 · Annuler après les visages = absence : protège la présence. → —
- **V5-Ange** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **W-Ange** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **W-Ange-aide** · 7/10 · « Une personne de l'équipe appelle Alex sous 5 min » : astreinte humaine sur tous les créneaux ; le P&L la met à 0,50 € par participant (2,50 € par sortie) : il faut ~40 sorties par soir et par équipe pour payer une personne. → Coût d'astreinte par soir et par ville, pas par participant.
- **V5-Checkin** · 9/10 · Code du chevalet : présence vérifiable, donc fiabilité et compensation lieu calculables. → —
- **V5-Checkin-ok** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Partage-checkin** · 7/10 · Même slug `r8Tz4w` sur toutes les cartes : impossible d'attribuer une inscription à une carte, donc l'indicateur « 0,3 inscrit par sortie » ne se mesure pas par canal. → Slug par carte.
- **V5-Souvenir** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Partage** · 7/10 · Même slug `r8Tz4w` sur toutes les cartes : impossible d'attribuer une inscription à une carte, donc l'indicateur « 0,3 inscrit par sortie » ne se mesure pas par canal. → Slug par carte.
- **V5-Apres** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Apres-resultats** · 8/10 · Accords = rétention ; le chat Léa ouvre un duo gratuit. → —
- **V5-Apres-aucun** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Bande** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Rue** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Duo** · 6/10 · « Gratuit : 1 duo actif. Blowy+ : sans limite » : le différenciateur payant est une fonction numérique dans l'app. App Store 3.1.1 impose l'achat intégré pour débloquer une fonction ; 3.1.3(e) n'exempte que les biens et services consommés hors de l'app. Blowy+ payé par Apple Pay/Stripe est fragile en revue. → Blowy+ = sorties seulement ; duos illimités hors abonnement, ou en achat intégré avec la commission chiffrée.
- **V5-Lien** · 7/10 · Modération de chat sans revenu. → —
- **V5-Lien-debloque** · 7/10 · Idem. → —
- **V5-RdvDuo** · 6/10 · « table confirmée par Le Comptoir Gabriel », « Rendez-vous gratuit » : coût ops et compensation possible, revenu nul. → « Lieu suggéré » sans réservation tant que le Duo n'a pas prouvé sa valeur.
- **V5-Chat** · 8/10 · Duo né d'une sortie : la meilleure conversion romance. → —
- **V5-RdvDuo-lea** · 9/10 · Lieu public, zéro coût. → —
- **V5-Oeuf** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Rupture** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Partage-invitation** · 7/10 · Même slug `r8Tz4w` sur toutes les cartes : impossible d'attribuer une inscription à une carte, donc l'indicateur « 0,3 inscrit par sortie » ne se mesure pas par canal. → Slug nominatif pour la team.
- **V5-Story** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **W-Repondre** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Profil** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Fiche** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Tarifs** · 7/10 · Lisible. Blowy+ « toutes tes sorties (1 par semaine) » à 9,99 € = ~2,30 € la sortie pour un habitué contre 4,99 € : les meilleurs clients paient le moins. « Les places incluses ne se reportent pas » suppose un quota que le libellé nie. → Chiffrer la cannibalisation dans business-model ; un libellé de quota cohérent.
- **V5-Abonnement** · 7/10 · « Résiliable ici en 1 tap », sans « Restaurer » : un seul canal à l'écran, réglé. Risque achat intégré (voir Duo). → —
- **V5-Paiement** · 9/10 · Place payée par Apple Pay/Stripe = service consommé hors app : défendable. → —
- **V5-Paiement-ok** · 9/10 · Reçu, remboursement automatique. → —
- **V5-Reglages** · 8/10 · « Format » et « Voie Duo » : le Duo a deux réglages. → —
- **V5-Confidentialite** · 8/10 · « Position · jamais stockée » contredit la page d'aide : risque réputationnel. → —
- **V5-Signaler** · 8/10 · Rappel humain < 1 h les soirs de sortie : à budgéter par soir. → —
- **V5-Supprimer** · 7/10 · Aucun motif de départ collecté (T2). → Une question facultative.
- **V5-Chargement** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Erreur-reseau** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Paiement-echec** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Verif-echec** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Notifs-refus** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Chats-vide** · 8/10 · Rien de bloquant pour le modèle sur cet écran. → —

## Les 3 changements qui feraient le plus monter ma note

1. Refaire le P&L : compensation lieu comptée (≈ 6 € par sortie à 8 % d'absence), annulations gratuites après l'effectif lieu, astreinte par soir et par ville, commission de paiement selon le canal retenu ; puis fixer le prix ou la règle d'absence qui rend la contribution positive.
2. Mettre spec-v5 au niveau de concept-v5.2 (4,99 € / 9,99 €, Blowy+ sans crédits ni accessoire, `duo.maxActive` 1, plus de seuil 120 ni `NEIGHBORHOOD_NOT_LIVE`, annulation jusqu'aux visages, `photoRevealAt`) : aujourd'hui, l'équipe qui code depuis la spec construit un autre produit.
3. Trancher Blowy+ face à Apple : avantage payant = sorties (service hors app, Stripe défendable) ; duos illimités hors abonnement ou en achat intégré chiffré ; et retirer le Duo des points d'entrée tant que la cohorte n'a pas prouvé la 2e sortie payante.

## Je mets 10 si…

Je mets 10 si la cohorte de 8 semaines de business-model montre ≥ 40 % de 2e sortie payante sous 21 jours, ≥ 25 % d'actifs à M2, ≥ 0,3 inscrit vérifié par sortie vécue attribué par source, une contribution positive par sortie après compensation lieu réelle, astreinte par soir et commission de paiement, au moins 5 lieux sous contrat par quartier ouvert, et si spec, concept et écrans décrivent le même produit.

## Sources

- [Apple — App Store Review Guidelines, 3.1.1 et 3.1.3(e)](https://developer.apple.com/app-store/review/guidelines/#in-app-purchase)
- [Stripe — tarifs France (cartes standard de l'EEE)](https://stripe.com/fr/pricing)
