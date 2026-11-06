# Jury tour 6 — patron-bar (Patron de bar (Paris 11e))

**Verdict** : L'astreinte couvre maintenant tous mes créneaux, le contrat est signé des deux côtés avec un article Responsabilité et le relevé est détaillé par soirée : je signe, mais mon relevé additionne du TTC et du HT, « Blowy annule » s'écrit encore « place prévue » ici et « place réservée » là, et mon message d'accueil n'existe toujours pas.

**Note globale : 9/10** (T1 4 · T2 6 · T3 7 · T4 8 · T5 9 · T6 9)

| Critère | Note |
|---|---|
| Compréhension | 9 |
| Charge cognitive | 9 |
| Envie | 9 |
| Vraie rencontre | 9 |
| Sécurité et confiance | 9 |
| Viralité | 8 |
| Argent | 8 |
| Finition visuelle | 9 |

## Suivi de mes reproches du tour 5

- **Astreinte sur chaque créneau ouvert** : fait (« pendant tous vos créneaux » sur les 3 écrans lieu, art. 2).
- **« Blowy annule » écrit pareil côté client et contrat** : fait entre V5-Sortie-annulee et L-Contrat (« 3 € par place prévue ») ; **pas fait** dans mon propre espace : L-Effectif dit « par place réservée » (comme la spec).
- **Relevé vérifiable contre les présences** : fait (« 5 places · 4 présents · 1 absence (place payée) ») ; mais 4,99 € TTC + 3 € = 7,99 €, alors que le contrat dit 4,16 € HT.
- **Deux signatures, Responsabilité, montants HT** : faits (M. Daoud / C. Martin, art. 6, « 4,99 € TTC (4,16 € HT) »).
- **Ma vraie photo à 18 h** : fait (« Votre photo, la veille »). **Mon message d'accueil** : **pas fait** (T3, T4, T5, T6).
- **Lieu cohérent avec l'activité à Lyon** : fait (Le Five Croix-Rousse, terrain 2).

## Contrôles

`node design/v5/check-facts.mjs` : 97 fichiers, 6 039 vérifications, 0 contradiction. `a11y-audit.mjs` : 97 écrans, 1 423 textes, 538 cibles, 1 462 blocs mesurés, 0 problème, contraste min 4,53:1. `tooling/qa/layout/overflow.mjs` : aucun signalement (ni texte hors cadre, ni plage coupée). Ce que ces outils ne voient pas, relevé à la main sur les rendus et les sources : (1) la règle d'annulation canonique, présente sur 8 écrans, met « ta sécurité » sous la parenthèse « chacun 1 fois par mois, sans pénalité, place non remboursée », alors que spec §2.7 dit `SAFETY_EXIT` « à tout moment, remboursée » et que V5-Groupe-menu dit « Pour ta sécurité, toujours » ; (2) « les soirs de sortie » subsiste pour le délai d'1 h (V5-Groupe-menu, V5-Signaler) alors que l'astreinte couvre maintenant samedi 15 h, dimanche 11 h et les rendez-vous ; (3) spec révision 5 ≠ écrans sur la fiabilité (§3.1 et §2.13 : visible du groupe et du duo ; V5-Fiche : « Toi seul vois ce chiffre »), le vote (§2.11 « Non par défaut » ; V5-Apres : aucun état), Blowy+ (§6.2 « rentable dès la 2ᵉ sortie » ; V5-Abonnement : « 3 sorties par mois », et 2 × 4,99 = 9,98 < 9,99) ; (4) `business-model.md` est encore titré V5.4 : astreinte « 18 h à 2 h … par soir et par ville », point mort par ville, aucune ligne tables à deux, parrainage, imprévu ni « Blowy annule », alors que concept-v5.5 §D.13 et spec §10.1 renvoient à un calcul national qui n'existe pas ; (5) V5-Chargement promet « lundi à 21 h » quel que soit le créneau (samedi composé le mercredi 21 h, spec §1.1) ; (6) L-Effectif additionne 4,99 € (TTC) et 3 € = 7,99 €, le contrat dit 4,16 € HT, la spec §6.5 un « total HT » ; « par place réservée » (L-Effectif, spec) contre « par place prévue » (L-Contrat, V5-Sortie-annulee) ; (7) V5-Lien : rendez-vous « Quand vous voulez » contre V5-Duo-hh « Dans un lieu partenaire, à une heure couverte par l'équipe » ; (8) V5-Dispos-semaines « 28 déc.... » (quatre points).

## Écran par écran

| Écran | Note | Ce qui empêche le 10 | Correction attendue |
|---|---|---|---|
| V5-Welcome | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Ville | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Ville-bordeaux | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Toi | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Genre | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Pet | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Rencontrer | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Intention | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Consentement | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Toi-plus | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Dispos | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Dispos-semaines | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Eviter | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Erreur-age | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Trouvee | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Trouvee-lyon | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Sortie-lyon | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Confirmation-lyon | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Trouvee-banlieue | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Sortie-banlieue | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Confirmation-banlieue | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Pas-encore | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Sortie | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Team | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Partage-invitation | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Invite | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Compte | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Verif | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Notifs | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Sortie-inscrit | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Accueil | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Accueil-discret | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Accueil-duo | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Pause | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Chats | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Groupe | 8 | Toujours aucun message du lieu à 18 h (« table au fond à gauche, demandez Sami »). | Message d'accueil du lieu posté avec la confirmation. |
| V5-Groupe-menu | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Attente | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Partage-ville | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Amorcage | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Amorcage-solo | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Sortie-complete | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Sortie-annulee | 8 | Annulée « le mer. 11 nov. à 18 h … pas assez de confirmations » : elle n'a jamais été confirmée, donc selon « Sortie confirmée puis annulée » je ne touche rien ; mais j'ai gardé la table jusqu'à 18 h (T5, non tranché). | Dire au lieu ce qu'il reçoit dans ce cas précis. |
| V5-Affiner | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Affiner-histoire | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Affiner-age | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Affiner-ambiance | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Confirmation | 9 | « Photo fournie par le lieu », chevalet au fond : bon. Pas de mot du lieu. | Message d'accueil. |
| V5-Partage-confirmation | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Revelation | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Partage-checkin | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Ange | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| W-Ange | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| W-Ange-aide | 9 | SMS au référent, « son personnel n'intervient pas à la place de l'équipe » : clair. | — |
| V5-Checkin | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Checkin-ok | 9 | « 4 sur 5 arrivés » : je voudrais la même présence sur mon relevé à J + 1. | — |
| V5-Souvenir | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Apres | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Apres-resultats | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Partage-jeudi | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Partage | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Partage-dimanche | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Apres-aucun | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Bande | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Partage-bande | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Rue | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Duo | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Lien | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Duo-hh | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Lien-debloque | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-RdvDuo | 9 | Table à deux réservée après les deux oui : réglé. | — |
| V5-Chat | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-RdvDuo-lea | 9 | Lieu partenaire, table à deux : réglé. | — |
| V5-Oeuf | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Rupture | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Cartes | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Story | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| W-Repondre | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Profil | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Fiche | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Tarifs | 8 | « Une place vide après la veille est reversée au lieu » : le client comprend 4,99 € ; je reçois 4,16 € HT. | « son prix hors taxes est reversé au lieu ». |
| V5-Abonnement | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Paiement | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Paiement-ok | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Reglages | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Confidentialite | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Signaler | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Supprimer | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Chargement | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Erreur-reseau | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Paiement-echec | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Verif-echec | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Notifs-refus | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Chats-vide | 9 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| L-Effectif | 8 | Relevé : « 4,99 € » (TTC) + « 3 € » = « 7,99 € » ; le contrat paie 4,16 € HT : mon comptable ne rapproche pas. Encart « 3 € par place réservée » contre « prévue » au contrat. Seul jeudi est listé alors que mardi, samedi, dimanche et la table à deux sont ouverts. « l'équipe rappelle sous 1 h » pour un refus de payer en plein service. Pas de message d'accueil. | Relevé en HT avec la TVA à part ; un seul mot ; tous mes créneaux de la semaine ; rappel < 15 min pour un incident en salle ; champ « message d'accueil ». |
| L-Creneaux | 9 | Clair. Samedi 15 h – 17 h : 1 table + 1 table de 2 sous un plafond de 2 : je ne sais pas si la table de 2 consomme une des 2. | « plafond : 2 tables, tables de 2 comprises ». |
| L-Contrat | 9 | Deux signatures, Responsabilité, assurance : bon. « 3 € si elle était offerte… » sans HT/TTC, juste après « 4,16 € HT » ; l'imprévu n'est pas nommé. | « 3 € HT » ; « absence ou imprévu ». |

## Les 3 changements qui feraient monter ma note le plus

1. Relevé et contrat sur une seule base (HT, TVA à part) et un seul mot (« place prévue »), sur L-Effectif, L-Contrat, Tarifs, Sortie-annulee et la spec.
2. Message d'accueil du lieu à 18 h dans le chat du groupe, réglable dans l'espace lieu.
3. Effectif de la semaine sur tous mes créneaux ouverts (tables à deux comprises) et rappel rapide pour un incident en salle.

## Je mets 10 si…

Je mets 10 si mon relevé est en HT ligne par ligne et retombe sur le contrat au centime, si « Blowy annule » s'écrit avec les mêmes mots partout (contrat, relevé, client, spec) et dit ce que je touche quand la sortie tombe à 18 h, si mon message d'accueil part avec la confirmation, et si l'effectif montre tous mes créneaux de la semaine.
