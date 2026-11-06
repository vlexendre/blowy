# Jury tour 5 — patron-bar (Patron de bar (Paris 11e))

**Verdict** : Mes trois demandes du tour 4 sont faites (contrat complet, relevé mensuel chiffré, tables à deux dans ma grille, SMS en cas d'aide) : je signe, mais l'astreinte s'arrête à 18 h alors que Blowy remplit mon samedi 15 h et mon dimanche 11 h, et la règle « Blowy annule » n'est pas écrite pareil chez le client et dans mon contrat.

**Note globale : 9/10** (T1 4 · T2 6 · T3 7 · T4 8 · T5 9)

| Critère | Note |
|---|---|
| Compréhension | 9 |
| Charge cognitive | 9 |
| Envie | 9 |
| Vraie rencontre | 9 |
| Sécurité et confiance | 8 |
| Viralité | 8 |
| Argent | 8 |
| Finition visuelle | 9 |

## Suivi de mes reproches du tour 4

- **Article Argent complet (Blowy+, je connais quelqu'un, annulation par Blowy)** : fait (L-Contrat art. 3).
- **Relevé vérifiable, date de versement unique** : fait en partie : « novembre, 2 places vides, 7,99 €, versés le 5 décembre » ; **pas de détail ni de présences**.
- **Bouton Signaler** : fait.
- **Tables à deux dans la grille et le plafond** : fait (L-Creneaux).
- **SMS au référent en cas d'aide** : fait (W-Ange-aide, L-Effectif).
- **Ma vraie photo à 18 h** : « Changer la photo › » : fait ; la maquette garde une illustration commune.
- **Message du lieu dans le chat à 18 h (T3, T4)** : **pas fait**.

## Contrôles

`node design/v5/check-facts.mjs` : 88 fichiers, 4 958 vérifications, 0 contradiction. `a11y-audit.mjs` : 88 écrans, 0 problème, contraste min 4,53:1. Ce qu'ils ne voient pas, vérifié à la main et par `scratchpad/jury-r5-experts/overflow.mjs` (texte hors de l'artboard, plages « nn–nn ans » / heures coupées) : **V5-Confirmation** a son lien « Partager « cette semaine, je sors » » rendu sous le cadre (bas 868 px > 844) et **V5-Toi** coupe « 26– / 29 ans ». check-facts ne compare pas les écrans à `spec-v5.md`, qui est resté en V5.3 (« alignée sur … concept-v5.3 », « Mardi 12 h », Blowy+ « achat intégré via RevenueCat », « 1 duo actif », bandeau « sortie entre amis pour toi » au §3 et au §12 n° 8).

## Écran par écran

| Écran | Note | Ce qui empêche le 10 | Correction attendue |
|---|---|---|---|
| V5-Welcome | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Ville | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Ville-bordeaux | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Toi | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Genre | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Pet | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Rencontrer | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Intention | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Consentement | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Toi-plus | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Dispos | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Eviter | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Erreur-age | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Trouvee | 9 | « un bar à jeux du 11e » sans nom avant mercredi : pas de file devant chez moi un lundi. | — |
| V5-Trouvee-lyon | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Sortie-lyon | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Confirmation-lyon | 8 | « Le Mêlée Café » pour « Foot à 5 · un five de la Croix-Rousse » : un café n'a pas de terrain ; le client arrive au mauvais endroit ou le lieu ment. | Lieu cohérent avec l'activité annoncée. |
| V5-Trouvee-banlieue | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Sortie | 9 | « Chacun paie ce qu'il boit », « Personne n'anime » : exactement le contrat. | — |
| V5-Team | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Partage-invitation | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Invite | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Compte | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Verif | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Notifs | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Sortie-inscrit | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Accueil | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Accueil-discret | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Accueil-duo | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Pause | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Chats | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Groupe | 8 | Toujours aucun message du lieu à 18 h (« table au fond à gauche ») (T3, T4). | Message de bienvenue du lieu posté avec la confirmation. |
| V5-Groupe-menu | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Attente | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Partage-ville | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Amorcage | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Amorcage-solo | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Sortie-complete | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Sortie-annulee | 8 | « Le lieu reçoit 3 € par place prévue » ; mon contrat : « Sortie confirmée puis annulée par Blowy : 3 € par place réservée ». Une sortie annulée « faute de confirmations » n'a jamais été confirmée : selon le contrat, je ne touche rien. | Même formule partout : « sortie annulée par Blowy à moins de 72 h : 3 € par place prévue ». |
| V5-Affiner | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Affiner-histoire | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Confirmation | 9 | Adresse, métro, table, chevalet, « signataire de la charte » ; illustration au lieu de ma photo (maquette). | Cadre « photo du lieu » explicite. |
| V5-Partage-confirmation | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Revelation | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Partage-checkin | 9 | Chevalet orange en vedette : bonne pub pour les lieux, sans nous désigner. | — |
| V5-Ange | 9 | Rien qui touche mon service ni ma caisse. | — |
| W-Ange | 9 | Rien qui touche mon service ni ma caisse. | — |
| W-Ange-aide | 9 | SMS au référent du lieu : réglé. « son personnel n'intervient pas à ta place » : tournure ambiguë. | « à la place de l'équipe ». |
| V5-Checkin | 9 | « Pas de chevalet ? Demande au comptoir la table Blowy » : mon staff doit le savoir ; toujours pas de fiche staff d'une page. | Fiche staff téléchargeable dans l'espace lieu. |
| V5-Checkin-ok | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Souvenir | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Apres | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Apres-resultats | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Partage | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Partage-dimanche | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Apres-aucun | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Bande | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Rue | 9 | « Café des Oiseaux » en panneau : sympa, sans adresse. | — |
| V5-Duo | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Lien | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Lien-debloque | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-RdvDuo | 8 | « table confirmée par Le Comptoir Gabriel » alors que « Jade doit accepter le créneau » : je bloque une table pour un rendez-vous pas encore accepté ; même illustration que le Café des Oiseaux. | Table réservée après les deux oui ; photo propre au lieu. |
| V5-Chat | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-RdvDuo-lea | 8 | Rendez-vous gratuit au parc : pas de table, pas de client pour un lieu partenaire, et pas de staff si ça tourne mal. | Proposer d'abord les tables à deux des lieux partenaires. |
| V5-Oeuf | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Rupture | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Cartes | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Story | 9 | Rien qui touche mon service ni ma caisse. | — |
| W-Repondre | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Profil | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Fiche | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Tarifs | 9 | « Une place vide après la veille est reversée au lieu » : clair. | — |
| V5-Abonnement | 9 | « Si tu ne viens pas après la veille 18 h, le lieu reçoit 3 € » : dit au client (T4 réglé). | — |
| V5-Paiement | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Paiement-ok | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Reglages | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Confidentialite | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Signaler | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Supprimer | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Chargement | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Erreur-reseau | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Paiement-echec | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Verif-echec | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Notifs-refus | 9 | Rien qui touche mon service ni ma caisse. | — |
| V5-Chats-vide | 9 | Rien qui touche mon service ni ma caisse. | — |
| L-Effectif | 8 | Relevé « novembre, 2 places vides, 7,99 €, versés le 5 décembre » sans détail par soirée ni présences du check-in : je ne peux pas vérifier ; « Léa confirmé », « Sarah confirmé ». | Lien « Détail » (date, prénom, payée/offerte, montant) et présences à J +1 ; « ✓ » au lieu de l'accord. |
| L-Creneaux | 8 | Samedi 15 h – 17 h et dimanche 11 h – 13 h ouverts, mais l'encart dit « Astreinte 18 h – 2 h, chaque soir de sortie » : dimanche midi, j'appelle qui ? Préavis « 72 h dans les deux sens » alors que Blowy annule à la veille 18 h. | Astreinte affichée par créneau ; préavis et compensation dans la même phrase. |
| L-Contrat | 8 | Signé par le lieu seul (aucun signataire Blowy) ; ni responsabilité ni assurance (casse, accident à la table Blowy) ; « 4,99 € » sans HT/TTC (business-model : 4,16 € HT) ; « vérifie l'identité » trop fort. | Signature des deux parties, article Responsabilité, montants HT. |

## Les 3 changements qui feraient monter ma note le plus

1. Astreinte sur chaque créneau que Blowy remplit (samedi 15 h, dimanche 11 h, tables à deux), affichée par ligne dans L-Creneaux, ou ces créneaux fermés.
2. Une seule règle « Blowy annule » (Sortie-annulee = contrat = business-model) et un relevé vérifiable : détail par soirée et présences du check-in.
3. Contrat signé des deux parties avec un article Responsabilité/assurance et des montants HT ; table à deux réservée seulement après les deux oui ; message du lieu dans le chat à 18 h.

## Je mets 10 si…

Je mets 10 si chaque créneau que j'ouvre est couvert par l'astreinte à l'heure où il a lieu, si la compensation quand Blowy annule est écrite pareil côté client et dans mon contrat, si mon relevé mensuel se vérifie ligne par ligne contre les présences, si le contrat porte deux signatures et une clause de responsabilité, et si ma vraie photo et mon message d'accueil arrivent à 18 h.
