# Jury tour 5 — trust-safety (Responsable Trust & Safety)

**Verdict** : Le bandeau « entre amis » a disparu et la carte de duo est réduite au pet et à l'initiale, mais le nom du pet est lui-même un identifiant, la promesse « besoin d'aide » s'affiche à des heures où personne n'est d'astreinte (samedi 15 h, dimanche 11 h, rendez-vous au parc), Confidentialité affirme encore « position jamais demandée », et la spec garde le bandeau supprimé.

**Note globale : 8/10** (T1 4 · T2 6 · T3 7 · T4 8 · T5 8)

| Critère | Note |
|---|---|
| Compréhension | 9 |
| Charge cognitive | 9 |
| Envie | 8 |
| Vraie rencontre | 9 |
| Sécurité et confiance | 8 |
| Viralité | 9 |
| Argent | 9 |
| Finition visuelle | 9 |

## Suivi de mes reproches du tour 4

- **Carte de duo = pet + initiale** : fait, mais **le nom du pet identifie** (voir V5-Duo).
- **Bandeau « entre amis » / bit à 1 bit** : fait à l'écran ; **toujours dans spec-v5** (§3 « Cette semaine, sortie entre amis pour toi », §12 n° 8).
- **Confidentialité : le lieu reçoit prénom et pet** : fait ; ligne Groupe toujours incomplète (pet, nombre f/h) ; « Position : jamais demandée » faux.
- **Clause données au contrat lieu, bouton Signaler** : faits (art. 6, L-Effectif).
- **Fiche, slugs ≥ 8 / ≥ 12, case 18+ sur W-Repondre** : faits.
- **Nouveau** : astreinte 18 h – 2 h contre créneaux de jour ouverts ; RDV duo dans un parc ; Éviter qui promet « aucun carnet envoyé » ; Confirmation Lyon sans « Je connais quelqu'un ici ».

## Contrôles

`node design/v5/check-facts.mjs` : 88 fichiers, 4 958 vérifications, 0 contradiction. `a11y-audit.mjs` : 88 écrans, 0 problème, contraste min 4,53:1. Ce qu'ils ne voient pas, vérifié à la main et par `scratchpad/jury-r5-experts/overflow.mjs` (texte hors de l'artboard, plages « nn–nn ans » / heures coupées) : **V5-Confirmation** a son lien « Partager « cette semaine, je sors » » rendu sous le cadre (bas 868 px > 844) et **V5-Toi** coupe « 26– / 29 ans ». check-facts ne compare pas les écrans à `spec-v5.md`, qui est resté en V5.3 (« alignée sur … concept-v5.3 », « Mardi 12 h », Blowy+ « achat intégré via RevenueCat », « 1 duo actif », bandeau « sortie entre amis pour toi » au §3 et au §12 n° 8).

## Écran par écran

| Écran | Note | Ce qui empêche le 10 | Correction attendue |
|---|---|---|---|
| V5-Welcome | 9 | « Toutes orientations · en groupe ou à deux » : réglé. | — |
| V5-Ville | 9 | « On ne demande jamais ta position » : vrai pour l'inscription ; à nuancer dans Confidentialité. | — |
| V5-Ville-bordeaux | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Toi | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Genre | 9 | « jamais qui » ; « Autre » compté à part : juste. | — |
| V5-Pet | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Rencontrer | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Intention | 9 | Promesse générale, sans absolu : mon T4 levé. | — |
| V5-Consentement | 8 | « Une seule exception : la personne avec qui tu as un duo » ; or une simple proposition de duo dit déjà à un chercheur « histoire seulement » que l'autre lui est compatible, avant tout oui (voir Duo). | L'écrire, ou n'envoyer la proposition qu'à la 2e personne après le oui de la 1re. |
| V5-Toi-plus | 9 | Promesse alignée. | — |
| V5-Dispos | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Eviter | 8 | « Aucun carnet d'adresses n'est envoyé ni gardé » ; spec §4.5 : chaque numéro part en SHA-256 non salé (un numéro français se retrouve par force brute en minutes). Les tiers ne sont pas informés. | « Ton carnet part sous forme d'empreintes, comparées puis effacées aussitôt » ; sel serveur ou PSI ; mention des tiers dans la politique. |
| V5-Erreur-age | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Trouvee | 9 | Bandeau supprimé : mon canal à 1 bit est fermé à l'écran. La spec le décrit encore (§3, §12 n° 8) : un dev le reconstruira. | Retirer le bandeau de la spec et de `D-038`. |
| V5-Trouvee-lyon | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Sortie-lyon | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Confirmation-lyon | 7 | Pas de « Je connais quelqu'un ici » : l'issue sans pénalité disparaît dans la ville d'amorçage, où le vivier est petit et les chances de connaître quelqu'un plus grandes. | Même bloc que la Confirmation Paris. |
| V5-Trouvee-banlieue | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Sortie | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Team | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Partage-invitation | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Invite | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Compte | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Verif | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Notifs | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Sortie-inscrit | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Accueil | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Accueil-discret | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Accueil-duo | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Pause | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Chats | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Groupe | 8 | « pas de numéro ni de réseau, sauf entre accords mutuels » dans le chat de GROUPE : après la sortie, un numéro posté là est lu par les 5, accord ou pas. | Filtre levé seulement dans un chat à deux. |
| V5-Groupe-menu | 9 | « une personne de l'équipe répond en moins d'1 h » « pendant les soirs de sortie » : honnête. | — |
| V5-Attente | 9 | Samedi 15 h – 17 h à Bordeaux : même question d'astreinte. | Idem. |
| V5-Partage-ville | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Amorcage | 8 | Même créneau du samedi 15 h – 17 h, même trou d'astreinte. | Idem. |
| V5-Amorcage-solo | 8 | Lille sam. 15 h – 17 h : sortie de jour, hors de l'astreinte « 18 h – 2 h » annoncée partout. | Astreinte sur chaque créneau ouvert, ou promesse d'aide affichée seulement si couverte (spec §2.10). |
| V5-Sortie-complete | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Sortie-annulee | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Affiner | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Affiner-histoire | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Confirmation | 8 | « Imprévu » absent entre mer. 18 h et jeu. 16 h 30 ; lien de partage sous le cadre. | Ligne « Imprévu » ici aussi. |
| V5-Partage-confirmation | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Revelation | 9 | Filigrane, captures signalées, imprévu : bon. | — |
| V5-Partage-checkin | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Ange | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| W-Ange | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| W-Ange-aide | 8 | « équipe joignable de 18 h à 2 h, les soirs de sortie » : une demande d'aide un samedi à 15 h ne trouve personne ; « à ta place » ambigu. | Couvrir les créneaux de jour ; « à la place de l'équipe ». |
| V5-Checkin | 9 | « Plutôt vérifier ma position une fois » : honnête ici, mais contredit Confidentialité. | — |
| V5-Checkin-ok | 9 | « Besoin d'aide · appui long 2 s » : ne dit pas qui répond de jour. | Afficher qui répond à l'heure de la sortie. |
| V5-Souvenir | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Apres | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Apres-resultats | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Partage | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Partage-dimanche | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Apres-aucun | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Bande | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Rue | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Duo | 7 | « Biscuit · N. » : le nom du pet est montré à chaque groupe (Confirmation : Pépite, Suzie, Gaston, Pia), dans la Bande, Ta rue, les chats. Quiconque a partagé une sortie avec N. le reconnaît avant le oui de N. Pour un chercheur « histoire seulement », la proposition elle-même dit que N. lui est compatible. | Avant le double oui : espèce et alias tiré au sort, jamais le nom du pet ; exclure des propositions les co-présents passés (`MET_BEFORE`) ; inférence écrite dans Consentement. |
| V5-Lien | 9 | Filtres avant les visages, projet compatible « activé par vous deux » : juste. | — |
| V5-Lien-debloque | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-RdvDuo | 8 | Sam. 14 nov. 15 h : « Check-in sur place, besoin d'aide et faux appel, comme en sortie » à une heure sans astreinte. | Couvrir ou le dire. |
| V5-Chat | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-RdvDuo-lea | 6 | **BLOQUANT** Parc des Buttes-Chaumont, sam. 21 nov. 15 h, « Lieu public · gratuit » : pas de chevalet, pas de personnel, pas d'astreinte avant 18 h, et la spec (§2.13) impose un lieu partenaire. « besoin d'aide… comme en sortie » est faux à cet endroit et à cette heure. | Rendez-vous en lieu partenaire seulement (tables à deux), ou promesse réduite à ce qui marche (GEO, 17). |
| V5-Oeuf | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Rupture | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Cartes | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Story | 9 | Slug 8 caractères, 18+ : réglé. | — |
| W-Repondre | 9 | Case « J'ai 18 ans ou plus » : réglé. | — |
| V5-Profil | 8 | « Ton groupe voit : prénom, pronom, tranche d'âge, et ton visage » : oublie le pet (et le nombre f/h). | Liste unique. |
| V5-Fiche | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Tarifs | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Abonnement | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Paiement | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Paiement-ok | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Reglages | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Confidentialite | 7 | « Position : jamais demandée » est faux (check-in GEO, spec §2.9) ; « Ton groupe » sans pet ni nombre f/h ; « Personne : tes votes » alors qu'un accord mutuel est montré à l'autre. | « Position : une fois au check-in si tu le choisis, jamais gardée » ; ligne Groupe complète ; « tes votes, sauf un accord mutuel ». |
| V5-Signaler | 8 | « Ne ressemble pas à son selfie » : personne ne voit le selfie. | « Ne ressemble pas à ses photos ». |
| V5-Supprimer | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Chargement | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Erreur-reseau | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Paiement-echec | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Verif-echec | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Notifs-refus | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Chats-vide | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| L-Effectif | 9 | « prénoms et pets », bouton Signaler, SMS d'aide : réglé. | — |
| L-Creneaux | 8 | Samedi 15 h, dimanche 11 h ouverts sous un encart « Astreinte 18 h – 2 h ». | Astreinte par créneau ouvert. |
| L-Contrat | 8 | « vérifie l'âge et l'identité de chaque participant » : le selfie vérifie l'âge et la ressemblance aux photos ; la pièce n'est demandée qu'après 3 échecs. | « vérifie l'âge et la ressemblance avec les photos ». |

## Les 3 changements qui feraient monter ma note le plus

1. Duo : avant le double oui, espèce + alias tiré au sort (jamais le nom du pet), aucune proposition entre personnes déjà co-présentes, et l'inférence « une proposition = compatible » écrite dans Consentement.
2. Couverture d'aide réelle : astreinte sur chaque créneau ouvert (samedi 15 h, dimanche 11 h, rendez-vous à deux) ou promesse affichée seulement si une astreinte est planifiée ; rendez-vous à deux en lieu partenaire seulement.
3. spec-v5 et Confidentialité alignées : bandeau « entre amis » retiré de la spec, « Position » vraie, ligne Groupe complète, Éviter honnête (empreintes salées, effacées), « Je connais quelqu'un ici » sur toutes les confirmations.

## Je mets 10 si…

Je mets 10 si un audit croisé des 88 écrans, de spec-v5 et du contrat lieu contre « Qui voit quoi » ne trouve aucun quasi-identifiant avant un oui (nom de pet compris), aucune promesse d'aide affichée à une heure sans astreinte, aucune phrase absolue démentie par une fonction (position, carnet d'adresses), et si la spec ne contient plus rien que les écrans ont retiré.
