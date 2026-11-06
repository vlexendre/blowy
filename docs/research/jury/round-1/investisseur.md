# Jury V5 · tour 1 · Partner d'un fonds seed européen (consumer social)

**Verdict.** Le pivot V5 est le bon (« meet first », groupe, quartier, double issue ami/plus) et c'est la première version que je peux expliquer en une phrase à mon comité ; mais l'économie unitaire n'apparaît nulle part, Timeleft occupe déjà Paris avec 18 M d'ARR, et rien dans les écrans ne prouve une rétention au-delà de la 2e sortie : aujourd'hui c'est non pour un seed, oui pour revoir après 8 semaines de cohortes dans le 11e.

**Note globale : 4/10**

| Critère | Note | Pourquoi |
|---|---|---|
| Compréhension (5 s) | 7 | « Ton pet te trouve une bande. En vrai, cette semaine. » : pitchable. Le pet reste le point qui fera lever des sourcils en comité (critique Dazed d'Amata : « bizarre »). |
| Charge cognitive | 6 | Deux produits dans un : sorties de groupe + voie Duo (une app de rencontre classique). La voie Duo dilue le positionnement. |
| Envie (J+1/J+7/J+30) | 6 | L'horloge hebdomadaire est une bonne mécanique de rétention ; aucune raison de revenir entre deux sorties hors chat. |
| Vraie rencontre (2 semaines) | 6 | Fort : IRL à J+7. Mais aucun écran de demande hebdo/choix de créneau (spec §2.4) : le taux de placement, KPI n°1, est invisible. |
| Sécurité et confiance | 7 | Couche sécurité différenciante et défendable face aux régulateurs (DSA, art. 9) : un vrai actif de marque. |
| Viralité / distribution | 5 | +1, liste d'attente et ange gardien sont des boucles locales cohérentes avec un lancement par quartier ; aucun chiffrage ; story « Sortie » absente des rendus. |
| Argent | 3 | 12 € la place, ~6 € reversés au lieu (à négocier), ~0,4 € de Stripe : ~5 € de contribution par sortie, 1re offerte. Blowy+ 19,99 € pour 2 places : marge ~8 € si les deux places sont consommées. ARPU plafonné par le quota 1/semaine. Accessoires à 2,99 € à l'écran contre la spec (non achetables). |
| Finition visuelle | 7 | Niveau de finition d'une équipe qui sait faire du consumer ; incohérences de données entre écrans (taille du groupe 4/5/6). |

## Lecture d'ensemble

**Marché.** Les applis de rencontre déclinent (téléchargements en baisse 6 ans de suite, Tinder MAU −7 %, Bumble payants −16 %) ; seuls Hinge et l'IRL croissent. L'amitié adulte et le « meet first » sont la vague : Timeleft (Paris) revendique 18 M d'ARR et 150 k utilisateurs mensuels en ~20 mois ; Tinder Events vise 75 villes fin 2026 ; Bumble Plans arrive en 2027 ; Amata organise ~2 000 rendez-vous/mois à New York avec un jeton à 20 $.

**Défendabilité.** Le vote secret ami/plus avec accords mutuels est copiable en un sprint par Timeleft ou Tinder Events. Ce qui ne se copie pas vite : (1) la densité par quartier, (2) le réseau de lieux sous contrat, (3) la couche confiance (selfie, ange gardien sans app, check-in sans position). Le pet est une marque, pas un moat, et il polarise au-delà de 30 ans.

**Risques que je chiffre.**
- *Liquidité par quartier* : la spec interdit de recroiser une personne (`MET_BEFORE`, « jamais de limite de temps »). Avec 300 actifs dans le 11e, filtres d'âge et équilibre de genre, le vivier effectif d'une personne tombe vers 60–100 : à 4 nouvelles têtes par sortie hebdo, épuisement en 4 à 6 mois. Timeleft a vu ses petites villes se lasser de « dîner avec les mêmes ~10 personnes » et a fermé ~100 villes.
- *Équilibre romance* : la couverture « plus » dépend d'un ratio de genres que les femmes 25–35 font ou défont ; aucune donnée.
- *Opérations* : chaque quartier exige des lieux signés, payés à la place, et une astreinte sécurité ; la marge par sortie (~5 €) ne paie ni CAC payant ni ops si la fréquence est < 2 sorties/mois.
- *Store* : places et Blowy+ hors IAP via Stripe (spec §6.2, règle 3.1.5(a)) ; l'accessoire mensuel numérique pourrait forcer l'IAP sur iOS.

**Ce que je demande pour un oui.** Cohorte de 8 semaines dans le 11e : ≥ 45 % des personnes vérifiées vivent une 1re sortie sous 14 jours ; ≥ 40 % refont une sortie payante sous 21 jours ; ≥ 25 % actives à M2 ; ≥ 30 % des présents obtiennent au moins un accord ; ≥ 0,3 inscrit vérifié par sortie vécue ; contribution positive par sortie après coût lieu et 1re offerte amortie sur 3 sorties.

## Reproches du tour V4 (panel personas) : statut

- Paywall à compte à rebours, hebdo à 6,99 €, espèces payantes : **retirés**. Le seul résidu est l'état « −50 % · L. continue d'en profiter » encore dans la source de V5-Abonnement.
- IRL au niveau 6 (2 000 XP) : **réglé**, IRL à J+7.
- « Personne ne paierait Blowy+ tel quel » : le nouveau Blowy+ (2 places + accessoire) reste peu désirable (4 € d'économie).

## Écran par écran

Format : note · problème → correction attendue. `BLOQUANT` = suffit à me faire refuser.

- **V5-Welcome** · 7/10 · Positionnement clair ; « Paris 11e · Lyon 4e » assume le lancement par densité : bon signal de discipline. Le mascot-first reste le risque perception n°1. → A/B test store : capture « 5 inconnu·es, un café, jeudi » avec vraies photos de lieux vs mascotte.
- **V5-Invite** · 7/10 · Boucle +1 = CAC quasi nul si conversion > 30 % ; coût = une place offerte (~6 € de lieu). → Instrumenter conversion invité → présent ; plafonner les 1res offertes par inviteur pour éviter l'abus.
- **V5-Craft** · 6/10 · Temps d'onboarding investi dans un avatar qui ne sert pas la sortie. → Mesurer la chute ; couper si > 10 %.
- **V5-Vie** · 5/10 · 4 questions « école imaginaire » : le signal de matching est faible face à un questionnaire de type Timeleft (personnalité, budget, langues). → Remplacer au moins 2 questions par des signaux prédictifs d'affinité (rythme de vie, sujets, budget de sortie).
- **V5-Intention** · 7/10 · Double intention ami/plus = TAM élargi (amitié + rencontre) : bon. → Mesurer la part « plus » par genre dès J1 (équilibre).
- **V5-Toi** · 7/10 · Données de genre nécessaires à l'équilibre : bien. → —
- **V5-Toi-plus** · 7/10 · Bien. → —
- **V5-Toi-quartier** · 6/10 · Deux quartiers seulement : bonne discipline, mais « Ailleurs » doit capturer la demande pour choisir le 3e quartier. → Saisie libre du quartier → carte de chaleur de la demande (outil de décision d'ouverture).
- **V5-Eclosion** · 6/10 · Coût de temps sans valeur mesurable. → —
- **V5-Eclosion-ne** · 6/10 · Idem. → —
- **V5-Compte** · 7/10 · SSO : bon pour la conversion. → —
- **V5-Trouvee** · 7/10 · Moment « aha » dès J0 : c'est là que se joue l'activation. → Instrumenter Trouvée → Je viens comme métrique d'activation.
- **V5-Sortie** · 6/10 · Le prix n'apparaît jamais pour la 2e sortie : l'utilisateur découvrira 12 € après avoir pris l'habitude gratuite. → Afficher « ensuite 12 € ou Blowy+ » dès la 1re, honnêteté = rétention payante plus prévisible.
- **V5-Sortie-inscrit** · 6/10 · Rien de nouveau. → —
- **V5-Sortie-complete** · 4/10 · « 6 places prises » avec un groupe de 4 affiché : symptôme d'un modèle de capacité pas encore pensé (sur-réservation ? backfill ?). → Aligner sur la spec (pas de surréservation, backfill).
- **V5-Sortie-annulee** · 6/10 · Remboursement + priorité : bon pour la confiance ; chaque annulation coûte la 1re offerte et un lieu mécontent. → Suivre le taux d'annulation par lieu (KPI ops).
- **V5-Verif** · 6/10 · Mur selfie placé après l'engagement : bon compromis conversion/sécurité. → Taux de chute ici = KPI hebdo.
- **V5-Notifs** · 7/10 · Opt-in contextuel : bon. → —
- **V5-Accueil** · 6/10 · Pas de raison de revenir entre deux sorties hors messages ; l'Accueil est un tableau de bord, pas une boucle. → Un contenu léger hebdo (la question des pets du lundi à la bande) pour J+3.
- **V5-Attente** · 6/10 · Liste d'attente agrégée : bon outil de lancement ; seuil 300 affiché vs 120 dans la spec. → Un seul seuil.
- **V5-Chats** · 7/10 · Bande + duos = rétention entre sorties, si les chats vivent. → Mesurer % de bandes avec ≥ 1 message à J+7.
- **V5-Groupe** · 7/10 · Brise-glace de pets : le seul usage du pet qui a une valeur produit mesurable (réduction des no-shows ?). → Test : no-show avec/sans brise-glace.
- **V5-Revelation** · 6/10 · Révélation simultanée : différenciant vs Timeleft (visages au resto) ; risque de no-show de dernière minute après révélation. → Mesurer les désistements entre 9 h et 19 h 30.
- **V5-Ange** · 7/10 · Différenciation sécurité + canal d'acquisition gratuit. → —
- **W-Ange** · 7/10 · Page web sans app : acquisition passive. → Instrumenter « Découvrir › ».
- **W-Ange-alerte** · 7/10 · Responsabilité juridique : chaque alerte mal gérée est un risque réputationnel majeur. → Astreinte humaine budgétée dans le P&L.
- **V5-Checkin** · 7/10 · Check-in = donnée de présence fiable, base de la fiabilité et du paiement lieu. → —
- **V5-Checkin-ok** · 6/10 · Quiz de Nino et boisson « au nom de Nino » : complexité ops chez le lieu. → Simplifier côté lieu.
- **V5-Souvenir** · 6/10 · Le pet qui grandit est un faible moteur de rétention pour des 25–35 ans. → Mesurer l'ouverture de la Fiche après sortie ; sinon réduire le pet au brise-glace.
- **V5-Apres** · 7/10 · Le vote mutuel est la mécanique de valeur (crée bande et duos) ; copiable en un sprint. → Investir dans la qualité de composition (taux d'accords) plutôt que dans l'UI du vote.
- **V5-Apres-resultats** · 7/10 · « 2 ACCORDS » : métrique de valeur par sortie. → KPI : accords mutuels par présent.
- **V5-Bande** · 6/10 · La bande est de la rétention seulement si elle ressort ensemble ; aucune mécanique « sortie de bande » (re-groupe). → Sortie « avec ta bande + 2 nouveaux » : rétention + réensemencement du vivier.
- **V5-Chat** · 6/10 · Duo issu de sortie : bonne valeur romance sans app de swipe. → —
- **V5-Duo** · 4/10 · La voie Duo = une app de rencontre de plus, en concurrence frontale avec Hinge ; dilue l'équipe et le message. → Sortir la voie Duo du MVP ; la réintroduire si la demande « tête-à-tête » est mesurée.
- **V5-Lien** · 5/10 · Même remarque. → —
- **V5-Lien-debloque** · 5/10 · Même remarque. → —
- **V5-RdvDuo** · 5/10 · RDV gratuit dans un lieu « partenaire » : coût ops sans revenu. → Payant (place duo) ou hors partenariat.
- **V5-RdvDuo-lea** · 6/10 · Duo né d'une sortie : la meilleure conversion romance du produit. → —
- **V5-Oeuf** · 6/10 · Gadget ; ne crée pas de valeur mesurable. → Garder en bonus tardif, zéro investissement.
- **V5-Rupture** · 6/10 · Bon pour la marque (anti-ghosting). → —
- **V5-Story** · 5/10 · Story Question = acquisition hors cible (amis d'amis partout en France) ; story Sortie (locale) absente des rendus. → Prioriser la story Sortie avec lien quartier.
- **W-Repondre** · 6/10 · Bon coefficient de diffusion mais trafic non qualifié géographiquement. → Qualifier le quartier avant l'install.
- **V5-Profil** · 6/10 · « 1 / 1 sorties » : bonne métrique de confiance. → —
- **V5-Fiche** · 6/10 · Fiabilité visible = discipline des no-shows, levier marge (lieux payés sur confirmés). → —
- **V5-Boutique** · 3/10 · **BLOQUANT** · Accessoires vendus 2,99 € (contre la spec D-020 : non achetables) ; Blowy+ 19,99 € = 2 × 12 € − 4 € : aucune raison forte de s'abonner ; pas de prix pour les +1. → Clarifier un seul modèle : place à l'unité + abonnement avec un bénéfice qui ne vend pas de vitesse (ex. une place +1 offerte chaque mois, sans aucune priorité de créneau) ; retirer la vente d'accessoires.
- **V5-Reglages** · 7/10 · — → —
- **V5-Abonnement** · 5/10 · Honnête à l'écran ; l'état de rétention « −50 % » reste dans le code ; « Historique 0,00 € » contredit l'usage. → Supprimer ; historique réel.
- **V5-Confidentialite** · 7/10 · Export RGPD sous 48 h : bon signal pour la due diligence. → —
- **V5-Signaler** · 6/10 · Couverture IRL insuffisante = risque réputationnel (un seul incident médiatisé tue un quartier). → Budget T&S dédié dans le plan.
- **V5-Supprimer** · 7/10 · Motifs de départ = données de churn utiles. → « Pas assez de sorties » → signal de liquidité par quartier.

## Les 3 changements qui feraient le plus monter ma note

1. Un P&L par sortie et par quartier rendu explicite (prix place, part lieu, 1re offerte, Stripe, astreinte) et un Blowy+ qui a une raison d'exister (par ex. une place +1 offerte par mois) ; supprimer la vente d'accessoires.
2. Recentrer le MVP sur la sortie de groupe : voie Duo hors MVP, et une mécanique de rétention de bande (« ta bande + 2 nouveaux ») qui ralentit l'épuisement du vivier imposé par `MET_BEFORE`.
3. Rendre visibles les KPI qui comptent dans le produit et l'admin : taux de placement, activation Trouvée → Je viens, chute au selfie, 2e sortie à 21 j, accords par présent, inscrits par sortie vécue.

## Je mets 10 si…

Je mets 10 si une cohorte de 8 semaines dans un quartier montre ≥ 40 % de 2e sortie payante sous 21 jours, ≥ 25 % d'actifs à M2, ≥ 0,3 inscrit vérifié par sortie vécue, une contribution positive par sortie après coût lieu, et si l'équipe peut m'expliquer pourquoi Timeleft ou Tinder Events ne peuvent pas répliquer la densité de quartier et la couche confiance en 6 mois.

## Sources

- [ARR Club — Timeleft 18 M d'ARR, 150 k utilisateurs mensuels (avr. 2026)](https://www.arr.club/timeleft/timeleft-reaches-18m-arr-with-150k-monthly-users)
- [Inside Timeleft's journey — 325 → ~220 villes, lassitude des petites villes](https://timfrin.substack.com/p/inside-timelefts-journey-to-connecting)
- [Axios, 14/05/2026 — Amata, ~2 000 rendez-vous/mois, jeton 20 $](https://axios.com/2026/05/14/ai-matchmaker-online-dating-tech)
- Brief interne `docs/research/brief-marche-2026.md` (Match Group, Bumble, Hinge, Tinder Events, Bumble Plans, Dazed sur Amata).
