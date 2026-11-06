# ux-cognitif — tour 9

**Verdict** : Les doublons de formulation du tour 8 sont réglés et contrôlés, mais la règle la plus sensible (prénom du duo) reste appliquée à l'écran à l'inverse de la spec, et « vous avez dit oui tous les deux » sert maintenant à deux accords différents.

**Note globale : 9/10** (T7 9 → T8 9 → T9 9)

| Compréhension | Charge cognitive | Envie | Vraie rencontre | Sécurité | Viralité | Argent | Finition |
|---|---|---|---|---|---|---|---|
| 10 | 9 | 10 | 10 | 9 | 10 | 9 | 9 |

Évolution par critère (T7 → T8 → T9) : comprehension 9→9→10 · cognitive 8→9→9 · desire 9→9→10 · meet 9→9→10 · safety 9→9→9 · virality 9→9→10 · money 9→9→9 · visual 9→9→9.

Outils lancés : `node design/v5/check-facts.mjs` → 106 fichiers, 9 066 vérifications, 0 contradiction ; `NODE_PATH=$(npm root -g) node design/v5/a11y-audit.mjs .local/dc-runtime.js` → 106 écrans, 1 698 textes, 588 cibles, 0 problème, contraste min 4,53:1 (sans le runtime en argument : 2 faux positifs, contraste 1,00:1 sur un gabarit non rendu, comme au tour 8) ; `node tooling/qa/layout/overflow.mjs` → aucun signalement. Aucun de ces outils ne voit : l'initiale du duo après le double oui, les vignettes d'aperçu (exclues via `data-miniature`), l'ange non sélectionné, les écarts spec/business-model.

## Vérification point par point de mes reproches des tours 7 et 8

Tour 7 : les points de mon rapport T7 étaient réglés au tour 8 (voir round-8/ux-cognitif.md) et le restent. Tour 8 :

| Point T8 | État au tour 9 |
|---|---|
| F1 Prénom du duo : une version | partiel : la tournure « le prénom, aux visages » est bannie, mais Lien/Duo/Duo-hh/Chats/Accueil montrent encore « J. » / « K. » après le double oui ; le prénom n'arrive qu'à Les visages |
| F2 « Deux oui » une tournure | partiel : tournure unique au duo, mais réemployée pour l'accord sur le créneau (RdvDuo, Duo-hh-rdv) |
| F3 Trajet « ≈ N min depuis <quartier> » | réglé et contrôlé |
| F4 Blowy+ une formule | réglé (« intéressant dès la 3e sortie du mois »), mais écrite deux fois sur Abonnement |
| F5 Frise Lille + Attente sans sortie promise | réglé ; Attente garde « elle a lieu » |

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
| V5-Sortie-lille | 9 | Atelier céramique (Lille) : « Des cartes de questions sur la table, si vous voulez. Personne n'anime. » et « Chacun paie ce qu'il boit » : gabarit bar collé sur un atelier, qui par nature est animé et ne se paie pas à la boisson ; le contrat dit « Aucune animation ». | Variante « Pendant » par type de lieu : « L'atelier guide la séance ; vous êtes à la même table » ; « Atelier inclus / à régler sur place : N € » ; article 1 du contrat adapté aux ateliers. |
| V5-Trouvee-weekend | 10 | — | — |
| V5-Sortie | 10 | — | — |
| V5-Team | 10 | — | — |
| V5-Partage-invitation | 10 | — | — |
| V5-Invite | 10 | — | — |
| V5-Compte | 10 | — | — |
| V5-Verif | 10 | — | — |
| V5-Notifs | 10 | — | — |
| V5-Sortie-inscrit | 10 | — | — |
| V5-Accueil | 9 | Après le double oui, l'écran garde l'initiale : « DUO AVEC J. », « Répondre à J. », « Caramel · J. Duo ouvert quand vous avez dit oui tous les deux », « DUO AVEC K. », Chats « J. · Caramel », Accueil « Ton duo J. ». Le prénom (« Jade », « Karim ») n'apparaît qu'à Les visages. Les écrans appliquent donc toujours « prénom aux visages », contre concept V5.8 §1, spec §2.13 (D-082) et la ligne Confidentialité « ton prénom quand vous avez dit oui tous les deux ». | « Duo avec Jade », « Répondre à Jade », « Jade · Caramel », « Duo avec Karim » dès le double oui ; check-facts dans les deux sens (`ecransApresOui` : prénom obligatoire, initiale interdite). |
| V5-Accueil-discret | 10 | — | — |
| V5-Accueil-duo | 9 | Après le double oui, l'écran garde l'initiale : « DUO AVEC J. », « Répondre à J. », « Caramel · J. Duo ouvert quand vous avez dit oui tous les deux », « DUO AVEC K. », Chats « J. · Caramel », Accueil « Ton duo J. ». Le prénom (« Jade », « Karim ») n'apparaît qu'à Les visages. Les écrans appliquent donc toujours « prénom aux visages », contre concept V5.8 §1, spec §2.13 (D-082) et la ligne Confidentialité « ton prénom quand vous avez dit oui tous les deux ». | « Duo avec Jade », « Répondre à Jade », « Jade · Caramel », « Duo avec Karim » dès le double oui ; check-facts dans les deux sens (`ecransApresOui` : prénom obligatoire, initiale interdite). |
| V5-Pause | 10 | — | — |
| V5-Chats | 9 | Après le double oui, l'écran garde l'initiale : « DUO AVEC J. », « Répondre à J. », « Caramel · J. Duo ouvert quand vous avez dit oui tous les deux », « DUO AVEC K. », Chats « J. · Caramel », Accueil « Ton duo J. ». Le prénom (« Jade », « Karim ») n'apparaît qu'à Les visages. Les écrans appliquent donc toujours « prénom aux visages », contre concept V5.8 §1, spec §2.13 (D-082) et la ligne Confidentialité « ton prénom quand vous avez dit oui tous les deux ». | « Duo avec Jade », « Répondre à Jade », « Jade · Caramel », « Duo avec Karim » dès le double oui ; check-facts dans les deux sens (`ecransApresOui` : prénom obligatoire, initiale interdite). |
| V5-Groupe | 9 | Le jalon de la veille 18 h a trois noms : « Lieu et prénoms » (frises), « confirmation » (Tarifs, contrat), « la révélation, mer. 11 nov. 18 h » / « Lieu révélé » (Groupe, Groupe-menu, Chats, Accueil, Confirmations). | Un seul nom à l'écran (« Lieu et prénoms ») ; « révélation » et « révélé » bannis par check-facts. |
| V5-Groupe-menu | 9 | Le jalon de la veille 18 h a trois noms : « Lieu et prénoms » (frises), « confirmation » (Tarifs, contrat), « la révélation, mer. 11 nov. 18 h » / « Lieu révélé » (Groupe, Groupe-menu, Chats, Accueil, Confirmations). | Un seul nom à l'écran (« Lieu et prénoms ») ; « révélation » et « révélé » bannis par check-facts. |
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
| V5-Confirmation | 9 | Le jalon de la veille 18 h a trois noms : « Lieu et prénoms » (frises), « confirmation » (Tarifs, contrat), « la révélation, mer. 11 nov. 18 h » / « Lieu révélé » (Groupe, Groupe-menu, Chats, Accueil, Confirmations). | Un seul nom à l'écran (« Lieu et prénoms ») ; « révélation » et « révélé » bannis par check-facts. |
| V5-Partage-confirmation | 10 | — | — |
| V5-Revelation | 10 | — | — |
| V5-Partage-checkin | 10 | — | — |
| V5-Ange | 10 | — | — |
| W-Ange | 10 | — | — |
| W-Ange-aide | 10 | — | — |
| V5-Checkin | 10 | — | — |
| V5-Checkin-ok | 10 | — | — |
| V5-Souvenir | 10 | — | — |
| V5-Apres | 10 | — | — |
| V5-Apres-resultats | 10 | — | — |
| V5-Partage-jeudi | 10 | — | — |
| V5-Partage | 10 | — | — |
| V5-Partage-dimanche | 10 | — | — |
| V5-Apres-aucun | 10 | — | — |
| V5-Bande | 10 | — | — |
| V5-Partage-bande | 10 | — | — |
| V5-Rue | 10 | — | — |
| V5-Duo | 9 | Après le double oui, l'écran garde l'initiale : « DUO AVEC J. », « Répondre à J. », « Caramel · J. Duo ouvert quand vous avez dit oui tous les deux », « DUO AVEC K. », Chats « J. · Caramel », Accueil « Ton duo J. ». Le prénom (« Jade », « Karim ») n'apparaît qu'à Les visages. Les écrans appliquent donc toujours « prénom aux visages », contre concept V5.8 §1, spec §2.13 (D-082) et la ligne Confidentialité « ton prénom quand vous avez dit oui tous les deux ». | « Duo avec Jade », « Répondre à Jade », « Jade · Caramel », « Duo avec Karim » dès le double oui ; check-facts dans les deux sens (`ecransApresOui` : prénom obligatoire, initiale interdite). |
| V5-Lien | 8 | Après le double oui, l'écran garde l'initiale : « DUO AVEC J. », « Répondre à J. », « Caramel · J. Duo ouvert quand vous avez dit oui tous les deux », « DUO AVEC K. », Chats « J. · Caramel », Accueil « Ton duo J. ». Le prénom (« Jade », « Karim ») n'apparaît qu'à Les visages. Les écrans appliquent donc toujours « prénom aux visages », contre concept V5.8 §1, spec §2.13 (D-082) et la ligne Confidentialité « ton prénom quand vous avez dit oui tous les deux ». | « Duo avec Jade », « Répondre à Jade », « Jade · Caramel », « Duo avec Karim » dès le double oui ; check-facts dans les deux sens (`ecransApresOui` : prénom obligatoire, initiale interdite). |
| V5-Duo-hh-proposition | 10 | — | — |
| V5-Duo-hh | 9 | Après le double oui, l'écran garde l'initiale : « DUO AVEC J. », « Répondre à J. », « Caramel · J. Duo ouvert quand vous avez dit oui tous les deux », « DUO AVEC K. », Chats « J. · Caramel », Accueil « Ton duo J. ». Le prénom (« Jade », « Karim ») n'apparaît qu'à Les visages. Les écrans appliquent donc toujours « prénom aux visages », contre concept V5.8 §1, spec §2.13 (D-082) et la ligne Confidentialité « ton prénom quand vous avez dit oui tous les deux ». | « Duo avec Jade », « Répondre à Jade », « Jade · Caramel », « Duo avec Karim » dès le double oui ; check-facts dans les deux sens (`ecransApresOui` : prénom obligatoire, initiale interdite). |
| V5-Duo-hh-visages | 10 | — | — |
| V5-Duo-hh-rdv | 9 | « table à deux, réservée quand vous avez dit oui tous les deux » au passé, sur l'écran même où « … doit accepter le créneau » : la phrase canonique du double oui du duo sert aussi à l'accord sur le créneau, et la table n'est pas encore réservée. « Deux oui » désigne à nouveau deux moments. | « Table à deux, réservée dès que Karim accepte ce créneau » (et Jade), et réserver « quand vous avez dit oui tous les deux » au duo seul. |
| V5-Lien-debloque | 10 | — | — |
| V5-RdvDuo | 9 | « table à deux, réservée quand vous avez dit oui tous les deux » au passé, sur l'écran même où « … doit accepter le créneau » : la phrase canonique du double oui du duo sert aussi à l'accord sur le créneau, et la table n'est pas encore réservée. « Deux oui » désigne à nouveau deux moments. | « Table à deux, réservée dès que Karim accepte ce créneau » (et Jade), et réserver « quand vous avez dit oui tous les deux » au duo seul. |
| V5-Chat | 10 | — | — |
| V5-RdvDuo-lea | 9 | « table à deux, réservée quand vous avez dit oui tous les deux » au passé, sur l'écran même où « … doit accepter le créneau » : la phrase canonique du double oui du duo sert aussi à l'accord sur le créneau, et la table n'est pas encore réservée. « Deux oui » désigne à nouveau deux moments. | « Table à deux, réservée dès que Karim accepte ce créneau » (et Jade), et réserver « quand vous avez dit oui tous les deux » au duo seul. |
| V5-Oeuf | 10 | — | — |
| V5-Rupture | 10 | — | — |
| V5-Cartes | 10 | — | — |
| V5-Story | 9 | Aperçu 5 s : la vignette « 0 s · titre » coupe le titre (« AIDE BORDEAUX / À SORTIR » à moitié masqué, « DÉCRIS-MOI EN » sans « 3 MOTS. ») ; la vignette « 5 s · lien » est identique à 2,5 s et ne montre pas la pastille du lien (bas de carte rogné : vignette ≈ 0,73 de ratio pour une carte à 0,62). Les miniatures sont exclues de l'audit (`data-miniature`), donc aucun outil ne le voit. | Vignettes au ratio exact de la carte ; titre entier dès 0 s ; pastille « Toi aussi · blowy.app/… » visible sur la vignette 5 s ; contrôle dédié des miniatures (titre entier, lien présent à 5 s). |
| W-Repondre | 10 | — | — |
| V5-Profil | 10 | — | — |
| V5-Fiche | 10 | — | — |
| V5-Tarifs | 10 | — | — |
| V5-Abonnement | 9 | « Intéressant dès la 3e sortie du mois. » écrit deux fois sur le même écran (tuile « Blowy+ » puis paragraphe « … Blowy+ devient intéressant dès la 3e sortie du mois »). | Garder la phrase une fois (paragraphe), la tuile affiche « 9,99 € / mois ». |
| V5-Paiement | 10 | — | — |
| V5-Paiement-ok | 10 | — | — |
| V5-Reglages | 10 | — | — |
| V5-Confidentialite | 9 | « Seule ta personne de duo le sait, quand vous avez dit oui tous les deux. » ≠ phrase exacte de la spec §2.16 « Seule une personne avec qui tu as un duo sait que vous avez dit oui tous les deux. » (Confidentialité est censée être générée depuis la spec). La ligne duo promet le prénom au double oui que V5-Lien ne tient pas. | Une seule phrase, recopiée par check-facts depuis la spec ; aligner Lien, Duo, Chats, Accueil sur la ligne duo. |
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

1. Prénom du duo dès le double oui sur Lien, Duo, Duo-hh, Chats, Accueil, Accueil-duo, et check-facts dans le sens après-oui.
2. « Vous avez dit oui tous les deux » réservé au duo ; « réservée dès que Karim accepte ce créneau » sur les rendez-vous.
3. Un seul nom pour le jalon de la veille 18 h (« Lieu et prénoms ») : bannir « révélation » / « Lieu révélé » ; phrase Confidentialité = spec §2.16 mot pour mot.

## Je mets 10 si…

Maquettes : 10 quand le prénom du duo s'affiche dès le double oui partout, quand « oui tous les deux » ne désigne que le duo, quand le jalon de 18 h a un seul nom, et quand la phrase de Confidentialité est celle de la spec. Terrain (à part) : 2e test des 5 secondes sur Chats, Chargement, Les visages et le Duo (« Qui est J. ? »).

## À part : ce qui relève du test terrain (ne retient pas le 10)

- 2e test des 5 secondes sur Chats, Chargement, Les visages et Duo.
- Test de compréhension de la règle d'annulation (3 sorties distinctes) sur 10 personnes.
