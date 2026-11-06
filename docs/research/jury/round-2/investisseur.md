# Jury V5.1 · tour 2 · Partner d'un fonds seed européen (consumer social)

**Verdict.** Le modèle est devenu lisible et honnête (1re offerte, 4,99 € la place, Blowy+ 9,99 €, rien d'autre à vendre, le lieu ne coûte plus rien), et la team de 2–3 est un vrai levier de cold start ; mais l'ARPU est plafonné à ~10 € par mois et par personne active, la voie Duo reste dans le MVP et devient même l'argument payant (« Duo sans limite »), les écrans disent « App Store » quand la spec dit Stripe, et la spec n'est pas à jour (12 €, 19,99 €, conso incluse) : deux sources de vérité pour l'équipe qui code.

**Note globale : 6/10** (tour 1 : 4/10)

| Critère | Note | Pourquoi |
|---|---|---|
| Compréhension (5 s) | 8 | Pitch en une phrase : « 5 inconnu·es vérifié·es, un lieu du quartier, cette semaine ; après, chacun dit en secret ami·e ou plus ». |
| Charge cognitive | 6 | Deux produits restent dans le MVP (sorties + Duo) et un 3e mécanisme (team d'amorçage) ; 15 écrans avant la valeur. |
| Envie (J+1/J+7/J+30) | 7 | Horloge hebdo, Pause, Sortie de bande (ma demande pour freiner l'épuisement du vivier) : réglé sur le papier. |
| Vraie rencontre (2 semaines) | 8 | IRL à J+3 dans la démo, créneaux cochés, alternative proposée sur complet/annulé : le taux de placement a enfin des leviers à l'écran. |
| Sécurité et confiance | 8 | Couche confiance différenciante (selfie 18+, ange gardien sans app, rappel < 1 h, alerte) : défendable devant un régulateur et devant mon comité. |
| Viralité / distribution | 7 | Team + cartes 9:16 + amorçage à 3 vérifiés : boucle locale cohérente avec le lancement par quartier. |
| Argent | 5 | Contribution par place payée ≈ 4,99 − ~0,30 (Stripe) ≈ 4,7 € ; la 1re offerte ne coûte plus que l'acquisition puisque le lieu n'est plus payé. Mais : quota 1 sortie/semaine → ARPU max ≈ 20 €/mois à l'unité, ≈ 10 € avec Blowy+ ; Blowy+ fait payer le gros utilisateur 2,50 € la sortie ; si l'abonnement passe par l'App Store comme l'écrit Abonnement, Apple prend 15 % (programme Small Business) ; le lieu non payé n'a aucun engagement contractuel. |
| Finition visuelle | 8 | Finition d'équipe consumer, outillage de cohérence (check-facts, audit WCAG) : signe de discipline que je note. |

## Outils de cohérence

Exécutés le 6 nov. 2026 : `node design/v5/check-facts.mjs` → « 75 fichiers, 786 vérifications, 0 contradiction » ; `NODE_PATH=$(npm root -g) node design/v5/a11y-audit.mjs .local/dc-runtime.js` → « 75 écrans, 1042 textes, 420 cibles, 0 problème, contraste minimum 4.53:1 ». Les deux passent. Ils ne contrôlent ni la chronologie entre écrans, ni les tranches d'âge, ni le sens des phrases dérivées : les contradictions relevées ci-dessous leur échappent.

## Mes exigences du tour 1 : vérification point par point

- **P&L par sortie explicite ; Blowy+ avec une raison d'exister ; pas de vente d'accessoires** : partiellement. Accessoires gagnés seulement : réglé. Prix clairs et calcul de rentabilité affiché : réglé. P&L par sortie : absent du dossier ; concept-v5.1 H.23 dit « rentable dès la 2e sortie du mois » alors que les écrans disent « dès la 3e » (les écrans ont raison : 2 × 4,99 = 9,98 < 9,99).
- **Supprimer l'état de rétention −50 %** : réglé. README : « aucune offre de rétention dans le code ».
- **Afficher le prix de la 2e sortie dès la 1re** : réglé. Sortie : « Ensuite 4,99 € la place, ou Blowy+ 9,99 € par mois. Aucune carte demandée aujourd'hui. »
- **Voie Duo hors MVP** : refusé. Duo à égalité dès l'onboarding (Rencontrer), ouvert dans une ville fermée (Attente), et argument de Blowy+ (« La voie Duo sans limite »).
- **Mécanique « ta bande + 2 nouveaux » contre l'épuisement du vivier MET_BEFORE** : réglé (écran). Bande : « Sortie de bande · Toi, Tom et Sarah + 2 nouvelles personnes ».
- **Capacité / sur-réservation clarifiée (« 6 places » vs 4)** : réglé. Sortie-complete : réponse arrivée après composition, aucune sur-réservation.
- **KPI visibles (placement, activation, chute selfie, 2e sortie 21 j, accords/présent, inscrits/sortie)** : hors maquette. spec §10 Dashboard les liste ; aucun écran admin rendu.
- **Seuil d'ouverture unique (120 vs 300)** : réglé. 87/120 partout, + 3 lieux signés.
- **Historique Abonnement « 0,00 € » faux** : réglé. « 1 offerte · 1 payée 4,99 € ».

**Ma condition du 10 au tour 1** : « une cohorte de 8 semaines dans un quartier montre ≥ 40 % de 2e sortie payante sous 21 jours, ≥ 25 % d'actifs à M2, ≥ 0,3 inscrit vérifié par sortie vécue, une contribution positive par sortie après coût lieu, et l'équipe peut m'expliquer pourquoi Timeleft ou Tinder Events ne peuvent pas répliquer la densité de quartier et la couche confiance en 6 mois »  
**Statut** : Non évaluable par des maquettes : aucune cohorte. Seul point vérifiable : la contribution par sortie après coût lieu est désormais positive par construction (le lieu n'est plus payé). Le moat reste argumenté nulle part dans le dossier.

## Lecture d'ensemble

Économie unitaire telle que je la reconstruis (hypothèses : Stripe ~1,5 % + 0,25 € par place ; Apple 15 % si l'abonnement est un achat intégré).

| Cas | Revenu / mois | Coût variable | Contribution |
|---|---|---|---|
| 2 sorties payées à l'unité | 9,98 € | ~0,65 € | ~9,3 € |
| Blowy+ via Stripe, 4 sorties | 9,99 € | ~0,40 € | ~9,6 € (2,40 €/sortie) |
| Blowy+ via App Store, 4 sorties | 9,99 € | ~1,50 € | ~8,5 € |
| 1re sortie offerte | 0 € | astreinte + modération | négatif, amorti sur la 2e |

Un actif rapporte donc 5 à 10 € par mois, plafonné par le quota hebdomadaire. Pour couvrir une astreinte sécurité humaine « < 1 h les soirs de sortie » et des ops lieu par quartier, il faut de l'ordre de 1 500 à 3 000 payeurs par ville. C'est faisable à Paris, pas dans le 11e seul. Le dossier doit montrer ce calcul ; il ne le montre pas.

Risque nouveau : le lieu n'est plus payé. C'est bon pour la marge, mauvais pour la défendabilité (un lieu sans contrat rémunéré part chez Timeleft ou Tinder Events à la première offre) et pour la qualité (rien ne garantit la table).

## Écran par écran

Format : note · problème → correction attendue. `BLOQUANT` = suffit à me faire refuser.

- **V5-Welcome** · 8/10 · Positionnement clair, villes ouvertes assumées (discipline de densité). → A/B store mascotte vs vraies photos de lieux.
- **V5-Ville** · 8/10 · Saisie libre = carte de chaleur de la demande (ma demande du tour 1) ; quartiers acceptables = liquidité. → —
- **V5-Ville-fermee** · 8/10 · Progression réelle + date : bon outil d'ouverture. Où est capturé le contact pour « on t'écrit une fois » ? → Montrer le contact demandé.
- **V5-Team-amorcage** · 8/10 · Amorçage par teams de 3 : CAC quasi nul, pas besoin du seuil de 120. Risque : groupes de 2 blocs d'amis, faible taux d'accord. → Mesurer accords/présent en amorçage vs sorties normales.
- **V5-Rencontrer** · 5/10 · Le Duo à égalité dès l'écran 3 dilue le produit et l'équipe. → Duo après la 1re sortie vécue, ou hors MVP.
- **V5-Intention** · 8/10 · Double intention = TAM élargi. → Mesurer la part « plus » par genre dès J1.
- **V5-Intention-rempli** · 7/10 · « Projet compatible » (sérieuse, enfants) = signal de matching utile pour le Duo, que je voudrais hors MVP. → —
- **V5-Consentement** · 8/10 · Conformité art. 9 : un actif de due diligence. → —
- **V5-Toi** · 8/10 · Données d'équilibre de genre : nécessaires. → —
- **V5-Toi-plus** · 8/10 · — → —
- **V5-Craft** · 8/10 · Curseurs retirés : onboarding plus court sur ce point. → —
- **V5-Vie** · 7/10 · « Tu sors plutôt… » = signal prédictif (ma demande) ; 3 écrans au lieu d'1. → 1 question avant Trouvée.
- **V5-Dispos** · 8/10 · Créneaux cochés = taux de placement mesurable. → —
- **V5-Eclosion** · 7/10 · Coût de temps sans valeur mesurable, réduit à 1,5 s. → —
- **V5-Compte** · 8/10 · SSO : bon pour la conversion. → —
- **V5-Compte-age** · 8/10 · Âge du groupe = qualité de composition. → —
- **V5-Trouvee** · 8/10 · Moment d'activation ; composition anonyme qui rassure. → Instrumenter Trouvée → Je viens.
- **V5-Sortie** · 8/10 · Prix futur annoncé : réglé. → —
- **V5-Verif** · 8/10 · Vérification après engagement : bon compromis ; coût du fournisseur d'estimation d'âge non chiffré. → Coût par vérification dans le P&L.
- **V5-Notifs** · 8/10 · Opt-in contextuel. → —
- **V5-Sortie-inscrit** · 8/10 · — → —
- **V5-Team** · 8/10 · Invitation = acquisition ; « leur 1re sortie est offerte aussi » ne coûte plus de lieu. → Plafonner les 1res offertes par inviteur (abus).
- **V5-Accueil** · 8/10 · Pause en 1 tap : rétention sans culpabilité. → —
- **V5-Accueil-discret** · 8/10 · — → —
- **V5-Pause** · 8/10 · Pause vs churn : bonne mécanique. → Mesurer le retour après pause.
- **V5-Chats** · 8/10 · Bande + duos = rétention entre sorties. → % de bandes avec ≥ 1 message à J+7.
- **V5-Groupe** · 8/10 · Brise-glace : test no-show avec/sans. → —
- **V5-Groupe-menu** · 8/10 · — → —
- **V5-Sortie-complete** · 8/10 · Ancien symptôme de capacité réglé. → —
- **V5-Sortie-annulee** · 8/10 · Annulation = 1re offerte conservée, coût faible désormais. → Taux d'annulation par lieu (KPI ops).
- **V5-Attente** · 7/10 · « La voie Duo, déjà ouverte » dans une ville sans lieux signés : du dating en ligne à Saint-Denis, hors de la thèse. → Retirer le Duo des villes fermées.
- **V5-Revelation** · 7/10 · Visages et lieu la veille + annulation = absence : protège le taux de présence (bon pour la qualité), au prix de 25 h d'exposition (risque réputationnel). → —
- **V5-Ange** · 8/10 · Différenciation + acquisition gratuite. → —
- **W-Ange** · 8/10 · Page web sans app : acquisition passive. → Instrumenter « Voir › ».
- **W-Ange-alerte** · 7/10 · « Une personne de l'équipe t'appelle sous 5 min » : promesse d'astreinte humaine 7 j/7 sur les créneaux, non budgétée dans le dossier. → Coût d'astreinte par ville dans le P&L.
- **V5-Checkin** · 8/10 · Présence fiable = base de la fiabilité. → —
- **V5-Checkin-code** · 8/10 · — → —
- **V5-Checkin-ok** · 8/10 · Plus de complexité ops chez le lieu : réglé. → —
- **V5-Souvenir** · 8/10 · Le pet réduit à un compteur de souvenirs : ma demande. → —
- **V5-Partage** · 8/10 · Acquisition locale post-sortie. → Tracking K par source.
- **V5-Apres** · 8/10 · Mécanique de valeur, copiable ; la qualité de composition est l'investissement. → —
- **V5-Apres-resultats** · 8/10 · Accords par présent = KPI de valeur. → —
- **V5-Apres-aucun** · 8/10 · Rattrapage vers la sortie suivante : bon pour la 2e sortie. → —
- **V5-Partage-accords** · 6/10 · Carte la plus virale mais elle révèle le vote de Sarah (pet identifiable) : risque réputationnel et RGPD. → Silhouettes génériques.
- **V5-Bande** · 8/10 · Sortie de bande : réglé. → Mesurer la part des sorties de bande dans la rétention M2.
- **V5-Duo** · 5/10 · Une app de dating de plus, en frontal avec Hinge ; et c'est désormais l'avantage payant de Blowy+. → Hors MVP, ou réservé aux duos nés d'une sortie.
- **V5-Lien** · 6/10 · Même remarque. → —
- **V5-Lien-debloque** · 6/10 · Même remarque. → —
- **V5-RdvDuo** · 5/10 · « Lieu partenaire · table pour 2 réservée · Rendez-vous gratuit » : coût ops sans revenu, lieu non payé. → « Lieu suggéré », pas de réservation tant que le Duo n'est pas prouvé.
- **V5-Chat** · 7/10 · Duo né d'une sortie : la meilleure conversion romance du produit. → —
- **V5-RdvDuo-lea** · 7/10 · Lieu public sans réservation : zéro coût. → —
- **V5-Oeuf** · 6/10 · Gadget, zéro investissement : OK tant qu'il reste désactivé par défaut. → —
- **V5-Rupture** · 8/10 · Anti-ghosting = marque. → —
- **V5-Partage-semaine** · 7/10 · « 4 inconnu·es » faux : premier commentaire négatif garanti. → Phrase calculée.
- **V5-Partage-invitation** · 7/10 · Lien de place en Story publique : places perdues hors zone. → Lien nominatif.
- **V5-Partage-ville** · 8/10 · Outil d'ouverture de ville à coût nul. → —
- **V5-Story** · 7/10 · Trafic non qualifié géographiquement, mais la page qualifie la ville ensuite. → —
- **W-Repondre** · 8/10 · « Et toi, tu sors où ? » → Ville : qualifie le trafic (ma demande). → —
- **V5-Profil** · 8/10 · — → —
- **V5-Fiche** · 8/10 · Fiabilité privée : moins d'anxiété, même discipline. → —
- **V5-Tarifs** · 6/10 · Un seul modèle, honnête. Plafond d'ARPU ~10–20 €/mois ; « Duo sans limite » contredit « Ne s'achète jamais : plus de… ». → P&L par ville publié ; un bénéfice Blowy+ qui n'est pas « plus de duos ».
- **V5-Abonnement** · 5/10 · « Tu résilies dans les réglages de l'App Store » + « Restaurer mes achats » = achat intégré (15–30 % pour Apple) alors que la spec §6.2 prévoit Stripe Billing hors IAP. Laquelle est vraie ? → Trancher et mettre l'écran, la spec et Supprimer d'accord ; chiffrer la commission.
- **V5-Paiement** · 8/10 · Apple Pay via Stripe pour un service physique (règle 3.1.5(a)) : cohérent avec la spec. → —
- **V5-Paiement-ok** · 8/10 · Upsell chiffré et honnête. → —
- **V5-Reglages** · 8/10 · — → —
- **V5-Confidentialite** · 8/10 · Export sous 48 h, durées : bon pour la due diligence. → —
- **V5-Signaler** · 8/10 · Couverture IRL + SLA 1 h : risque réputationnel réduit ; coût humain à budgéter. → —
- **V5-Supprimer** · 7/10 · Aucun motif de départ collecté (signal de liquidité perdu). → 1 question facultative.
- **V5-Chargement** · 8/10 · — → —
- **V5-Erreur-reseau** · 8/10 · — → —
- **V5-Paiement-echec** · 8/10 · Place gardée 30 min : protège la conversion. → —
- **V5-Verif-echec** · 8/10 · Repli pièce d'identité : coût humain par cas à chiffrer. → —
- **V5-Notifs-refus** · 8/10 · — → —
- **V5-Erreur-age** · 8/10 · — → —
- **V5-Chats-vide** · 8/10 · — → —

## Les 3 changements qui feraient le plus monter ma note

1. Un P&L par sortie et par ville dans le dossier (place, Stripe ou Apple, 1re offerte, vérification d'âge, astreinte, modération, ops lieu) et un seul canal d'abonnement tranché entre spec et écrans.
2. Sortir le Duo du MVP (ou le réserver aux duos nés d'une sortie) et trouver à Blowy+ un bénéfice qui ne soit pas « plus de duos » ; mettre spec-v5 à jour avec concept-v5.1 (4,99 €, 9,99 €, conso non incluse, visages la veille).
3. Un contrat lieu minimal (créneaux, plafond, préavis) même non rémunéré, pour que la densité de lieux devienne un actif défendable face à Timeleft et Tinder Events.

## Je mets 10 si…

Je mets 10 si une cohorte de 8 semaines dans un quartier montre ≥ 40 % de 2e sortie payante sous 21 jours, ≥ 25 % d'actifs à M2, ≥ 0,3 inscrit vérifié par sortie vécue, une contribution positive par ville après astreinte et vérification, au moins 5 lieux sous contrat par quartier ouvert, et si l'équipe m'explique pourquoi Timeleft ou Tinder Events ne répliquent pas la densité de quartier et la couche confiance en 6 mois.

## Sources

- [ARR Club — Timeleft 18 M d'ARR, 150 k utilisateurs mensuels (avr. 2026)](https://www.arr.club/timeleft/timeleft-reaches-18m-arr-with-150k-monthly-users)
- [Apple — App Store Small Business Program (commission de 15 %)](https://developer.apple.com/app-store/small-business-program/)
- Interne : docs/product/spec-v5.md §6.2 (placeholders 1200 / 19,99 €, conso incluse) vs concept-v5.1 H.23
