# ux-cognitif — tour 8

**Verdict** : Le vocabulaire des trois sorties est enfin unique et lisible ; restent des règles écrites deux fois différemment (prénom du duo spec/écran, « deux oui », trajet, Blowy+) et une frise fausse à Lille.

**Note globale : 9/10**

| Compréhension | Charge cognitive | Envie | Vraie rencontre | Sécurité | Viralité | Argent | Finition |
|---|---|---|---|---|---|---|---|
| 9 | 9 | 9 | 9 | 9 | 9 | 9 | 9 |

Outils lancés : `node design/v5/check-facts.mjs` → 106 fichiers, 8 069 vérifications, 0 contradiction ; `a11y-audit.mjs .local/dc-runtime.js` → 106 écrans, 0 problème, contraste min 4,53:1 (sans le runtime en argument, 2 faux positifs sur `{{blockMark}}` non rendu dans V5-Signaler) ; `tooling/qa/layout/overflow.mjs` → aucun signalement. Ces outils ne voient pas l'erreur de frise de Lille ni la carte « Tu y vas » absente.

## Suivi de mes reproches du tour 7

Réglés depuis T7 (vérifiés) : trois sorties distinctes avec la suite « au-delà » sur Visages, Confirmation et toutes les fiches ; « pendant tout ton rendez-vous » sur les écrans Duo ; « pendant toute la sortie d'Alex » côté ange ; deux délais légendés sur Signaler ; Welcome « 18 à 50 ans et plus » ; Trouvée sans « comme demandé dans Affiner » ; Ange renvoie à Confidentialité ; relevé sur le mois civil ; plus aucune date de composition en dur (Chargement : « réponse lundi à 21 h / mercredi à 21 h »).

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
| V5-Trouvee-lyon | 9 | « Ta prochaine sortie à Lyon, le mar. 24 nov. : composée le sam. 21 nov. 21 h » : la date est juste mais « ta prochaine sortie » reste affirmé. | « Ton créneau du mar. 24 nov. : si un groupe se forme, réponse le sam. 21 nov. 21 h ». |
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
| V5-Sortie-lille | 8 | Frise : « Sam. 14 nov. 19 h 30 · La sortie » alors que la carte dit « 15 h – 17 h » et « Comment ça se passe : 15 h » ; check-facts ne l'attrape pas. | Frise « Sam. 14 nov. 15 h · La sortie » ; contrôle check-facts : l'heure du jalon « La sortie » = startsAt. |
| V5-Trouvee-weekend | 10 | — | — |
| V5-Sortie | 9 | Trouvée et Confirmation : « dans ton quartier (≈ 8 min) » ; Sortie et Tu y vas : « ≈ 8 min depuis Paris 11e » pour le même bar : deux formulations du même trajet. | Même libellé partout (« dans ton quartier (≈ 8 min) »). |
| V5-Team | 10 | — | — |
| V5-Partage-invitation | 10 | — | — |
| V5-Invite | 10 | — | — |
| V5-Compte | 10 | — | — |
| V5-Verif | 10 | — | — |
| V5-Notifs | 10 | — | — |
| V5-Sortie-inscrit | 9 | « Nino qui coche, en vidéo 1 s : dans Mes cartes » : Mes cartes (V5-Cartes) n'a que 9 cartes, aucune « Tu y vas ». Promesse non tenue à l'écran (README E13 la dit faite). | Ajouter la 10e miniature « Tu y vas » (vidéo 1 s, pastille vidéo, son slug) dans Mes cartes, ou retirer la phrase. |
| V5-Accueil | 10 | — | — |
| V5-Accueil-discret | 10 | — | — |
| V5-Accueil-duo | 10 | — | — |
| V5-Pause | 10 | — | — |
| V5-Chats | 10 | — | — |
| V5-Groupe | 9 | « pas de numéro … seulement dans un chat à deux, après vos deux oui » ; en Duo, après les deux oui, V5-Lien bloque encore numéros et liens jusqu'aux visages : « deux oui » désigne deux moments. | « après vos deux oui au vote, ou aux visages en duo ». |
| V5-Groupe-menu | 9 | « pas de numéro … seulement dans un chat à deux, après vos deux oui » ; en Duo, après les deux oui, V5-Lien bloque encore numéros et liens jusqu'aux visages : « deux oui » désigne deux moments. | « après vos deux oui au vote, ou aux visages en duo ». |
| V5-Attente | 9 | « Ajouter un créneau · Avec le vendredi soir, une sortie a lieu le ven. 13 nov., 20 h » et « Sinon, Nino te propose le sam. 28 nov. » : deux sorties promises avant leur composition (mar. 10 nov. 21 h, mer. 25 nov. 21 h), contraire à concept V5.7 B5. | « Avec le vendredi soir : si un groupe se forme pour le ven. 13 nov., réponse le mar. 10 nov. 21 h » ; « Sinon, ton créneau du sam. 28 nov. reste ouvert : réponse le mer. 25 nov. 21 h ». |
| V5-Partage-ville | 10 | — | — |
| V5-Amorcage | 10 | — | — |
| V5-Amorcage-solo | 10 | — | — |
| V5-Sortie-complete | 10 | — | — |
| V5-Sortie-annulee | 10 | — | — |
| V5-Affiner | 10 | — | — |
| V5-Affiner-histoire | 10 | — | — |
| V5-Affiner-age | 10 | — | — |
| V5-Affiner-ambiance | 10 | — | — |
| V5-Confirmation | 10 | — | — |
| V5-Partage-confirmation | 10 | — | — |
| V5-Revelation | 10 | — | — |
| V5-Partage-checkin | 10 | — | — |
| V5-Ange | 10 | — | — |
| W-Ange | 10 | — | — |
| W-Ange-aide | 10 | — | — |
| V5-Checkin | 10 | — | — |
| V5-Checkin-ok | 10 | — | — |
| V5-Souvenir | 10 | — | — |
| V5-Apres | 9 | Aucune pastille cochée ; spec §2.11 « 3 pastilles … Non par défaut » se lit comme une présélection. Le texte de l'écran (« Sans réponse, c'est non ») est juste ; la spec est ambiguë. | Spec : « aucune pastille cochée ; sans réponse = Non à la clôture ». |
| V5-Apres-resultats | 10 | — | — |
| V5-Partage-jeudi | 10 | — | — |
| V5-Partage | 10 | — | — |
| V5-Partage-dimanche | 10 | — | — |
| V5-Apres-aucun | 10 | — | — |
| V5-Bande | 10 | — | — |
| V5-Partage-bande | 10 | — | — |
| V5-Rue | 10 | — | — |
| V5-Duo | 9 | « le prénom, aux visages » ; spec §2.13 (l. 130) et D-082 : « le prénom apparaît au double oui, pas avant et pas plus tard ». Les titres « Duo avec J. » / « Duo avec K. » après le double oui suivent l'écran, pas la spec : un dev appliquera la spec. | Trancher : spec et D-082 réécrits « prénom aux visages » (ce que disent 5 écrans et Confidentialité), ou écrans alignés sur la spec. |
| V5-Lien | 9 | « numéros … bloqués avant les visages » alors que le chat de groupe promet le numéro « après vos deux oui » (cf. Groupe). | Même règle écrite des deux côtés. |
| V5-Duo-hh-proposition | 9 | « le prénom, aux visages » ; spec §2.13 (l. 130) et D-082 : « le prénom apparaît au double oui, pas avant et pas plus tard ». Les titres « Duo avec J. » / « Duo avec K. » après le double oui suivent l'écran, pas la spec : un dev appliquera la spec. | Trancher : spec et D-082 réécrits « prénom aux visages » (ce que disent 5 écrans et Confidentialité), ou écrans alignés sur la spec. |
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
| V5-Story | 10 | — | — |
| W-Repondre | 10 | — | — |
| V5-Profil | 9 | Tuile « 1/1 sortie honorée » sans « visible par toi seulement », alors que concept V5.7 F18 l'exige partout où la fiabilité apparaît (la Fiche le dit, le Profil non). | Sous la tuile : « visible par toi seulement » (ou icône cadenas + libellé). |
| V5-Fiche | 10 | — | — |
| V5-Tarifs | 9 | « Blowy+ devient intéressant dès la 3e sortie » (Tarifs) vs « Rentable dès la 3e sortie du mois » (Abonnement) : deux phrases pour une règle. | Une phrase canonique dans facts.regles. |
| V5-Abonnement | 9 | « Rentable dès la 3e sortie du mois » ≠ « devient intéressant dès la 3e sortie » (Tarifs). | Phrase unique. |
| V5-Paiement | 10 | — | — |
| V5-Paiement-ok | 10 | — | — |
| V5-Reglages | 10 | — | — |
| V5-Confidentialite | 9 | Ligne « Ton duo … ton prénom et ton visage aux visages » contredit spec §2.13 / D-082 (prénom au double oui). | Même arbitrage que V5-Duo, une seule version. |
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

## Les 3 changements qui feraient monter ma note

1. Prénom du duo : une seule version (écrans « aux visages » vs spec §2.13 / D-082 « au double oui, pas plus tard »), et check-facts compare aussi la spec.
2. Une règle = une phrase : « deux oui » (vote vs duo) dans Groupe/Lien, trajet « dans ton quartier (≈ 8 min) » partout, Blowy+ « dès la 3e sortie » en une seule formule.
3. Frise Lille (19 h 30 → 15 h) et contrôle automatique de l'heure du jalon « La sortie » ; Attente sans sortie promise.

## Je mets 10 si…

Maquettes : 10 quand aucune règle n'a deux formulations (prénom du duo écran = spec, « deux oui », trajet, Blowy+), quand la frise de Lille est juste et quand Attente ne promet plus de sortie. Terrain (à part) : un 2e test des 5 secondes sur Chats, Chargement et Les visages.
