# growth-lead — tour 9

**Verdict** : Mes quatre conditions du tour 8 sont tenues (Attente, Trouvée-Lyon, frise de Lille, promesse « Tu y vas » retirée) ; ce qui reste empêche encore le 10 : l'aperçu vidéo ne montre pas le lien, l'Attente promet encore « elle a lieu », le duo garde l'initiale après le double oui.

**Note globale : 9/10** (T7 9 → T8 9 → T9 9)

| Compréhension | Charge cognitive | Envie | Vraie rencontre | Sécurité | Viralité | Argent | Finition |
|---|---|---|---|---|---|---|---|
| 10 | 9 | 10 | 9 | 10 | 9 | 10 | 9 |

Évolution par critère (T7 → T8 → T9) : comprehension 9→9→10 · cognitive 9→9→9 · desire 9→9→10 · meet 9→9→9 · safety 9→9→10 · virality 9→9→9 · money 9→9→10 · visual 9→9→9.

Outils lancés : `node design/v5/check-facts.mjs` → 106 fichiers, 9 066 vérifications, 0 contradiction ; `NODE_PATH=$(npm root -g) node design/v5/a11y-audit.mjs .local/dc-runtime.js` → 106 écrans, 1 698 textes, 588 cibles, 0 problème, contraste min 4,53:1 (sans le runtime en argument : 2 faux positifs, contraste 1,00:1 sur un gabarit non rendu, comme au tour 8) ; `node tooling/qa/layout/overflow.mjs` → aucun signalement. Aucun de ces outils ne voit : l'initiale du duo après le double oui, les vignettes d'aperçu (exclues via `data-miniature`), l'ange non sélectionné, les écarts spec/business-model.

## Vérification point par point de mes reproches des tours 7 et 8

Tour 7 : les points de mon rapport T7 étaient réglés au tour 8 (voir round-8/growth-lead.md) et le restent. Tour 8 :

| Point T8 | État au tour 9 |
|---|---|
| F1 Attente : plus de sortie promise avant composition | réglé : « si un groupe se forme pour le ven. 13 nov., réponse le mar. 10 nov. 21 h » ; reste « elle a lieu » (voir Attente) |
| F2 Trouvée-Lyon « ta prochaine sortie » | réglé : « Ton créneau du mar. 24 nov. : si un groupe se forme, réponse le sam. 21 nov. 21 h » |
| F3 Frise de Lille 19 h 30 | réglé : « Sam. 14 nov. 15 h · La sortie », contrôlé par check-facts (frise = carte) |
| F4 « Tu y vas » en vidéo 1 s absente de Mes cartes | réglé par retrait de la promesse (Sortie-inscrit : « Tu y vas. Rien d'autre à faire avant mer. 11 nov. 18 h. ») |
| F5 W-Repondre « ses proches décrivent Alex » | réglé : « comment ses proches le décrivent » |

## Écran par écran

| Écran | Note | Ce qui empêche le 10 | Correction |
|---|---|---|---|
| V5-Welcome | 10 | — | — |
| V5-Ville | 10 | — | — |
| V5-Ville-bordeaux | 10 | — | — |
| V5-Toi | 10 | — | — |
| V5-Genre | 10 | — | — |
| V5-Pet | 10 | — | — |
| V5-Rencontrer | 10 | — | — |
| V5-Intention | 10 | — | — |
| V5-Consentement | 10 | — | — |
| V5-Toi-plus | 10 | — | — |
| V5-Dispos | 10 | — | — |
| V5-Dispos-semaines | 10 | — | — |
| V5-Eviter | 10 | — | — |
| V5-Erreur-age | 10 | — | — |
| V5-Trouvee | 10 | — | — |
| V5-Trouvee-lyon | 10 | — | — |
| V5-Sortie-lyon | 10 | — | — |
| V5-Confirmation-lyon | 10 | — | — |
| V5-Trouvee-banlieue | 10 | — | — |
| V5-Sortie-banlieue | 10 | — | — |
| V5-Confirmation-banlieue | 10 | — | — |
| V5-Pas-encore | 10 | — | — |
| V5-Ville-nantes | 10 | — | — |
| V5-Trouvee-nantes | 10 | — | — |
| V5-Sortie-nantes | 10 | — | — |
| V5-Pas-encore-nantes | 10 | — | — |
| V5-Sortie-lille | 10 | — | — |
| V5-Trouvee-weekend | 10 | — | — |
| V5-Sortie | 10 | — | — |
| V5-Team | 10 | — | — |
| V5-Partage-invitation | 10 | — | — |
| V5-Invite | 10 | — | — |
| V5-Compte | 10 | — | — |
| V5-Verif | 10 | — | — |
| V5-Notifs | 10 | — | — |
| V5-Sortie-inscrit | 10 | — | — |
| V5-Accueil | 10 | — | — |
| V5-Accueil-discret | 10 | — | — |
| V5-Accueil-duo | 10 | — | — |
| V5-Pause | 10 | — | — |
| V5-Chats | 10 | — | — |
| V5-Groupe | 10 | — | — |
| V5-Groupe-menu | 10 | — | — |
| V5-Attente | 9 | « Si elles arrivent d'ici le mer. 18 nov. 21 h, elle a lieu » : promesse ferme alors que la composition peut échouer (≤ 3 du même genre, tranche) ; l'intertitre « Pour qu'elle ait lieu » coiffe « Ajouter un créneau … ven. 13 nov. », qui ne fait pas avoir lieu la sortie du 21 mais en crée une autre. | « Si 2 personnes compatibles arrivent d'ici le mer. 18 nov. 21 h, Nino la compose » ; intertitre « Pour sortir plus tôt » au-dessus du vendredi. |
| V5-Partage-ville | 9 | Aperçu 5 s : la vignette « 0 s · titre » coupe le titre (« AIDE BORDEAUX / À SORTIR » à moitié masqué, « DÉCRIS-MOI EN » sans « 3 MOTS. ») ; la vignette « 5 s · lien » est identique à 2,5 s et ne montre pas la pastille du lien (bas de carte rogné : vignette ≈ 0,73 de ratio pour une carte à 0,62). Les miniatures sont exclues de l'audit (`data-miniature`), donc aucun outil ne le voit. | Vignettes au ratio exact de la carte ; titre entier dès 0 s ; pastille « Toi aussi · blowy.app/… » visible sur la vignette 5 s ; contrôle dédié des miniatures (titre entier, lien présent à 5 s). |
| V5-Amorcage | 10 | — | — |
| V5-Amorcage-solo | 10 | — | — |
| V5-Sortie-complete | 10 | — | — |
| V5-Sortie-annulee | 10 | — | — |
| V5-Affiner | 10 | — | — |
| V5-Affiner-histoire | 10 | — | — |
| V5-Affiner-age | 10 | — | — |
| V5-Affiner-ambiance | 10 | — | — |
| V5-Confirmation | 10 | — | — |
| V5-Partage-confirmation | 9 | Aperçu 5 s : la vignette « 0 s · titre » coupe le titre (« AIDE BORDEAUX / À SORTIR » à moitié masqué, « DÉCRIS-MOI EN » sans « 3 MOTS. ») ; la vignette « 5 s · lien » est identique à 2,5 s et ne montre pas la pastille du lien (bas de carte rogné : vignette ≈ 0,73 de ratio pour une carte à 0,62). Les miniatures sont exclues de l'audit (`data-miniature`), donc aucun outil ne le voit. | Vignettes au ratio exact de la carte ; titre entier dès 0 s ; pastille « Toi aussi · blowy.app/… » visible sur la vignette 5 s ; contrôle dédié des miniatures (titre entier, lien présent à 5 s). |
| V5-Revelation | 10 | — | — |
| V5-Partage-checkin | 9 | Aperçu 5 s : la vignette « 0 s · titre » coupe le titre (« AIDE BORDEAUX / À SORTIR » à moitié masqué, « DÉCRIS-MOI EN » sans « 3 MOTS. ») ; la vignette « 5 s · lien » est identique à 2,5 s et ne montre pas la pastille du lien (bas de carte rogné : vignette ≈ 0,73 de ratio pour une carte à 0,62). Les miniatures sont exclues de l'audit (`data-miniature`), donc aucun outil ne le voit. | Vignettes au ratio exact de la carte ; titre entier dès 0 s ; pastille « Toi aussi · blowy.app/… » visible sur la vignette 5 s ; contrôle dédié des miniatures (titre entier, lien présent à 5 s). |
| V5-Ange | 10 | — | — |
| W-Ange | 10 | — | — |
| W-Ange-aide | 10 | — | — |
| V5-Checkin | 10 | — | — |
| V5-Checkin-ok | 10 | — | — |
| V5-Souvenir | 10 | — | — |
| V5-Apres | 10 | — | — |
| V5-Apres-resultats | 10 | — | — |
| V5-Partage-jeudi | 9 | Aperçu 5 s : la vignette « 0 s · titre » coupe le titre (« AIDE BORDEAUX / À SORTIR » à moitié masqué, « DÉCRIS-MOI EN » sans « 3 MOTS. ») ; la vignette « 5 s · lien » est identique à 2,5 s et ne montre pas la pastille du lien (bas de carte rogné : vignette ≈ 0,73 de ratio pour une carte à 0,62). Les miniatures sont exclues de l'audit (`data-miniature`), donc aucun outil ne le voit. | Vignettes au ratio exact de la carte ; titre entier dès 0 s ; pastille « Toi aussi · blowy.app/… » visible sur la vignette 5 s ; contrôle dédié des miniatures (titre entier, lien présent à 5 s). |
| V5-Partage | 9 | Aperçu 5 s : la vignette « 0 s · titre » coupe le titre (« AIDE BORDEAUX / À SORTIR » à moitié masqué, « DÉCRIS-MOI EN » sans « 3 MOTS. ») ; la vignette « 5 s · lien » est identique à 2,5 s et ne montre pas la pastille du lien (bas de carte rogné : vignette ≈ 0,73 de ratio pour une carte à 0,62). Les miniatures sont exclues de l'audit (`data-miniature`), donc aucun outil ne le voit. | Vignettes au ratio exact de la carte ; titre entier dès 0 s ; pastille « Toi aussi · blowy.app/… » visible sur la vignette 5 s ; contrôle dédié des miniatures (titre entier, lien présent à 5 s). |
| V5-Partage-dimanche | 9 | Aperçu 5 s : la vignette « 0 s · titre » coupe le titre (« AIDE BORDEAUX / À SORTIR » à moitié masqué, « DÉCRIS-MOI EN » sans « 3 MOTS. ») ; la vignette « 5 s · lien » est identique à 2,5 s et ne montre pas la pastille du lien (bas de carte rogné : vignette ≈ 0,73 de ratio pour une carte à 0,62). Les miniatures sont exclues de l'audit (`data-miniature`), donc aucun outil ne le voit. | Vignettes au ratio exact de la carte ; titre entier dès 0 s ; pastille « Toi aussi · blowy.app/… » visible sur la vignette 5 s ; contrôle dédié des miniatures (titre entier, lien présent à 5 s). |
| V5-Apres-aucun | 10 | — | — |
| V5-Bande | 10 | — | — |
| V5-Partage-bande | 9 | Aperçu 5 s : la vignette « 0 s · titre » coupe le titre (« AIDE BORDEAUX / À SORTIR » à moitié masqué, « DÉCRIS-MOI EN » sans « 3 MOTS. ») ; la vignette « 5 s · lien » est identique à 2,5 s et ne montre pas la pastille du lien (bas de carte rogné : vignette ≈ 0,73 de ratio pour une carte à 0,62). Les miniatures sont exclues de l'audit (`data-miniature`), donc aucun outil ne le voit. | Vignettes au ratio exact de la carte ; titre entier dès 0 s ; pastille « Toi aussi · blowy.app/… » visible sur la vignette 5 s ; contrôle dédié des miniatures (titre entier, lien présent à 5 s). |
| V5-Rue | 10 | — | — |
| V5-Duo | 9 | Après le double oui, l'écran garde l'initiale : « DUO AVEC J. », « Répondre à J. », « Caramel · J. Duo ouvert quand vous avez dit oui tous les deux », « DUO AVEC K. », Chats « J. · Caramel », Accueil « Ton duo J. ». Le prénom (« Jade », « Karim ») n'apparaît qu'à Les visages. Les écrans appliquent donc toujours « prénom aux visages », contre concept V5.8 §1, spec §2.13 (D-082) et la ligne Confidentialité « ton prénom quand vous avez dit oui tous les deux ». | « Duo avec Jade », « Répondre à Jade », « Jade · Caramel », « Duo avec Karim » dès le double oui ; check-facts dans les deux sens (`ecransApresOui` : prénom obligatoire, initiale interdite). |
| V5-Lien | 9 | Après le double oui, l'écran garde l'initiale : « DUO AVEC J. », « Répondre à J. », « Caramel · J. Duo ouvert quand vous avez dit oui tous les deux », « DUO AVEC K. », Chats « J. · Caramel », Accueil « Ton duo J. ». Le prénom (« Jade », « Karim ») n'apparaît qu'à Les visages. Les écrans appliquent donc toujours « prénom aux visages », contre concept V5.8 §1, spec §2.13 (D-082) et la ligne Confidentialité « ton prénom quand vous avez dit oui tous les deux ». | « Duo avec Jade », « Répondre à Jade », « Jade · Caramel », « Duo avec Karim » dès le double oui ; check-facts dans les deux sens (`ecransApresOui` : prénom obligatoire, initiale interdite). |
| V5-Duo-hh-proposition | 10 | — | — |
| V5-Duo-hh | 10 | — | — |
| V5-Duo-hh-visages | 10 | — | — |
| V5-Duo-hh-rdv | 10 | — | — |
| V5-Lien-debloque | 10 | — | — |
| V5-RdvDuo | 10 | — | — |
| V5-Chat | 10 | — | — |
| V5-RdvDuo-lea | 10 | — | — |
| V5-Oeuf | 10 | — | — |
| V5-Rupture | 10 | — | — |
| V5-Cartes | 10 | — | — |
| V5-Story | 9 | Aperçu 5 s : la vignette « 0 s · titre » coupe le titre (« AIDE BORDEAUX / À SORTIR » à moitié masqué, « DÉCRIS-MOI EN » sans « 3 MOTS. ») ; la vignette « 5 s · lien » est identique à 2,5 s et ne montre pas la pastille du lien (bas de carte rogné : vignette ≈ 0,73 de ratio pour une carte à 0,62). Les miniatures sont exclues de l'audit (`data-miniature`), donc aucun outil ne le voit. | Vignettes au ratio exact de la carte ; titre entier dès 0 s ; pastille « Toi aussi · blowy.app/… » visible sur la vignette 5 s ; contrôle dédié des miniatures (titre entier, lien présent à 5 s). |
| W-Repondre | 10 | — | — |
| V5-Profil | 10 | — | — |
| V5-Fiche | 10 | — | — |
| V5-Tarifs | 10 | — | — |
| V5-Abonnement | 10 | — | — |
| V5-Paiement | 10 | — | — |
| V5-Paiement-ok | 10 | — | — |
| V5-Reglages | 10 | — | — |
| V5-Confidentialite | 10 | — | — |
| V5-Signaler | 10 | — | — |
| V5-Supprimer | 10 | — | — |
| V5-Chargement | 10 | — | — |
| V5-Erreur-reseau | 10 | — | — |
| V5-Paiement-echec | 10 | — | — |
| V5-Verif-echec | 10 | — | — |
| V5-Notifs-refus | 10 | — | — |
| V5-Chats-vide | 10 | — | — |
| L-Effectif | 10 | — | — |
| L-Creneaux | 10 | — | — |
| L-Contrat | 10 | — | — |

Aucun écran BLOQUANT.

## Les 3 changements qui feraient monter ma note

1. Aperçu vidéo : vignette 5 s avec le lien visible et titre entier à 0 s, sur les 8 écrans de partage (c'est l'attribution du lien qui fait la boucle).
2. Attente : « Si 2 personnes compatibles arrivent…, Nino la compose » et intertitre « Pour sortir plus tôt » au-dessus du vendredi.
3. Prénom du duo dès le double oui (Lien, Duo, Chats, Accueil).

## Je mets 10 si…

Maquettes : 10 quand la vignette 5 s montre le lien et la vignette 0 s le titre entier sur les 8 écrans de partage, quand l'Attente ne garantit plus « elle a lieu », et quand le duo affiche le prénom dès le double oui. Terrain (à part, ne retient pas le 10) : Welcome → 1re sortie ≥ 25 %, chute au selfie < 30 %, ≥ 0,3 inscrit vérifié par sortie vécue attribué par slug, part de la voie Duo et sa conversion en sortie de groupe.

## À part : ce qui relève du test terrain (ne retient pas le 10)

- Welcome → 1re sortie vécue ≥ 25 % ; chute au selfie < 30 %.
- ≥ 0,3 nouvel inscrit vérifié par sortie vécue, attribué par slug (cartes, invitation, 3 mots, ange).
- Part des inscrits qui choisissent la voie Duo et conversion Duo → 1re sortie de groupe.
