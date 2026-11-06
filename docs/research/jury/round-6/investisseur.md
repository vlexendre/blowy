# Jury tour 6 — investisseur (Investisseur seed (consumer social))

**Verdict** : La spec est enfin alignée sur les écrans (Stripe Billing, 3 duos, J − 3 21 h), mais business-model.md est resté en V5.4 alors que le produit a ajouté une astreinte de jour, des tables à deux, un parrainage en sortie offerte et un imprévu mensuel compensé : le produit qu'on promet coûte plus que le modèle qu'on me montre.

**Note globale : 8/10** (T1 4 · T2 6 · T3 7 · T4 8 · T5 8 · T6 8)

| Critère | Note |
|---|---|
| Compréhension | 9 |
| Charge cognitive | 8 |
| Envie | 8 |
| Vraie rencontre | 9 |
| Sécurité et confiance | 9 |
| Viralité | 9 |
| Argent | 6 |
| Finition visuelle | 9 |

## Suivi de mes reproches du tour 5

- **Spec révision 5 alignée (T5 n° 1)** : fait. Restent « rentable dès la 2ᵉ sortie » (§6.2, faux) et l'écart E1 (code à « mardi 12 h »).
- **business-model complet (T5 n° 2)** : **pas fait, et régressé relativement** : titre « V5.4 », astreinte « 18 h à 2 h … par ville », aucune ligne tables à deux, annulations par Blowy, parrainage, imprévu, places Blowy+ vides, cannibalisation ; concept §D.13 et spec §10.1 (« point mort sur le volume national ») renvoient à un calcul absent.
- **Un seul chiffre TTC/HT** : spec et contrat en HT (fait) ; L-Effectif et Tarifs encore en 4,99 €.
- **Avis juridique Blowy+ hors achat intégré, cohorte de 8 semaines** : pas faits.

## Contrôles

`node design/v5/check-facts.mjs` : 97 fichiers, 6 039 vérifications, 0 contradiction. `a11y-audit.mjs` : 97 écrans, 1 423 textes, 538 cibles, 1 462 blocs mesurés, 0 problème, contraste min 4,53:1. `tooling/qa/layout/overflow.mjs` : aucun signalement (ni texte hors cadre, ni plage coupée). Ce que ces outils ne voient pas, relevé à la main sur les rendus et les sources : (1) la règle d'annulation canonique, présente sur 8 écrans, met « ta sécurité » sous la parenthèse « chacun 1 fois par mois, sans pénalité, place non remboursée », alors que spec §2.7 dit `SAFETY_EXIT` « à tout moment, remboursée » et que V5-Groupe-menu dit « Pour ta sécurité, toujours » ; (2) « les soirs de sortie » subsiste pour le délai d'1 h (V5-Groupe-menu, V5-Signaler) alors que l'astreinte couvre maintenant samedi 15 h, dimanche 11 h et les rendez-vous ; (3) spec révision 5 ≠ écrans sur la fiabilité (§3.1 et §2.13 : visible du groupe et du duo ; V5-Fiche : « Toi seul vois ce chiffre »), le vote (§2.11 « Non par défaut » ; V5-Apres : aucun état), Blowy+ (§6.2 « rentable dès la 2ᵉ sortie » ; V5-Abonnement : « 3 sorties par mois », et 2 × 4,99 = 9,98 < 9,99) ; (4) `business-model.md` est encore titré V5.4 : astreinte « 18 h à 2 h … par soir et par ville », point mort par ville, aucune ligne tables à deux, parrainage, imprévu ni « Blowy annule », alors que concept-v5.5 §D.13 et spec §10.1 renvoient à un calcul national qui n'existe pas ; (5) V5-Chargement promet « lundi à 21 h » quel que soit le créneau (samedi composé le mercredi 21 h, spec §1.1) ; (6) L-Effectif additionne 4,99 € (TTC) et 3 € = 7,99 €, le contrat dit 4,16 € HT, la spec §6.5 un « total HT » ; « par place réservée » (L-Effectif, spec) contre « par place prévue » (L-Contrat, V5-Sortie-annulee) ; (7) V5-Lien : rendez-vous « Quand vous voulez » contre V5-Duo-hh « Dans un lieu partenaire, à une heure couverte par l'équipe » ; (8) V5-Dispos-semaines « 28 déc.... » (quatre points).

## Écran par écran

| Écran | Note | Ce qui empêche le 10 | Correction attendue |
|---|---|---|---|
| V5-Welcome | 8 | « Une sortie dès 5 personnes, partout » + astreinte désormais promise à toute heure de créneau : business-model chiffre encore 200 € par soir **et par ville**, plage 18 h – 2 h. | Modèle d'astreinte nationale par fuseau, jour et soir, avec point mort national. |
| V5-Ville | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Ville-bordeaux | 8 | ≈ 60 inscrits, 3 lieux : coût d'une ville d'amorçage (astreinte, vérification, lieux) absent du modèle. | Ligne « ville d'amorçage ». |
| V5-Toi | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Genre | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Pet | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Rencontrer | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Intention | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Consentement | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Toi-plus | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Dispos | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Dispos-semaines | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Eviter | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Erreur-age | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Trouvee | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Trouvee-lyon | 8 | Lyon en solo : même question de point mort. | Idem. |
| V5-Sortie-lyon | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Confirmation-lyon | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Trouvee-banlieue | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Sortie-banlieue | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Confirmation-banlieue | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Pas-encore | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Sortie | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Team | 8 | Parrainage = prochaine sortie offerte (≈ 3,84 € nets perdus, + 3 € HT au lieu si absence) : absent du modèle. | Ligne parrainage et coût par inscrit attribué. |
| V5-Partage-invitation | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Invite | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Compte | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Verif | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Notifs | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Sortie-inscrit | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Accueil | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Accueil-discret | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Accueil-duo | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Pause | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Chats | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Groupe | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Groupe-menu | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Attente | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Partage-ville | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Amorcage | 8 | Sam. 15 h – 17 h : sortie de jour couverte par l'astreinte, plage non chiffrée. | Plage de jour dans le coût d'astreinte. |
| V5-Amorcage-solo | 8 | Idem, et 5 places offertes d'un coup (1res sorties). | CAC d'amorçage chiffré. |
| V5-Sortie-complete | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Sortie-annulee | 8 | 3 € par place versés au lieu + 1re sortie qui reste offerte : aucune ligne « annulations par Blowy » (T5, non traité). | Taux hypothétique et coût par sortie. |
| V5-Affiner | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Affiner-histoire | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Affiner-age | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Affiner-ambiance | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Confirmation | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Partage-confirmation | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Revelation | 8 | Imprévu 1 fois par mois : la place offerte ou Blowy+ non remboursée coûte 3 € HT à Blowy ; taux non modélisé. | Hypothèse de taux d'imprévu. |
| V5-Partage-checkin | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Ange | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| W-Ange | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| W-Ange-aide | 8 | « sous 5 min » : SLA qui dimensionne l'astreinte (plusieurs personnes par fuseau aux pics) ; non chiffré. | SLA et effectif d'astreinte dans le modèle. |
| V5-Checkin | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Checkin-ok | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Souvenir | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Apres | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Apres-resultats | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Partage-jeudi | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Partage | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Partage-dimanche | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Apres-aucun | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Bande | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Partage-bande | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Rue | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Duo | 8 | 3 duos gratuits pour tous : modération sans revenu. | Coût de modération par duo. |
| V5-Lien | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Duo-hh | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Lien-debloque | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-RdvDuo | 8 | Table à deux : 0 € de revenu, 3 € HT par absent, astreinte mobilisée : absent du modèle (T4, T5). | Ligne tables à deux. |
| V5-Chat | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-RdvDuo-lea | 8 | Idem un samedi 15 h : plage de jour. | Idem. |
| V5-Oeuf | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Rupture | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Cartes | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Story | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| W-Repondre | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Profil | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Fiche | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Tarifs | 9 | « reversée au lieu » sans base : TTC ou HT selon l'écran. | HT. |
| V5-Abonnement | 8 | Écran juste (« 3 sorties par mois ») ; spec §6.2 « dès la 2ᵉ » ; cannibalisation : à 4 sorties, 7,93 € nets = 1,98 €/sortie contre 3,84 € pour une place, et 3 € HT payés par Blowy à chaque absence ; avis juridique 3.1.3(e) non écrit. | Corriger la spec ; ligne cannibalisation ; avis écrit avant soumission. |
| V5-Paiement | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Paiement-ok | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Reglages | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Confidentialite | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Signaler | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Supprimer | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Chargement | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Erreur-reseau | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Paiement-echec | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Verif-echec | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Notifs-refus | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Chats-vide | 9 | Rien qui change l'économie unitaire sur cet écran. | — |
| L-Effectif | 8 | Relevé 4,99 € TTC + 3 € = 7,99 € ; contrat et spec en HT : le reporting finance n'aura pas une seule base. | Tout en HT. |
| L-Creneaux | 9 | Dimanche 11 h et samedi 15 h ouverts : plages d'astreinte de jour réelles. | Les chiffrer. |
| L-Contrat | 8 | Sans engagement, préavis 30 jours : aucun actif durable ; 3 € sans base fiscale. | Engagement minimal de créneaux ; « 3 € HT ». |

## Les 3 changements qui feraient monter ma note le plus

1. business-model V5.5 : astreinte nationale par fuseau (jour + soir, SLA 5 min / 1 h), tables à deux, parrainage, imprévu, annulations par Blowy, places Blowy+ vides, cannibalisation, ville d'amorçage, et point mort national.
2. Une seule base (HT) et un seul chiffre partout : spec §6.2 corrigée (3 sorties), L-Effectif et Tarifs en HT.
3. Avis juridique écrit sur Blowy+ via Stripe, puis cohorte de 8 semaines publiée.

## Je mets 10 si…

Je mets 10 si la cohorte de 8 semaines montre ≥ 40 % de 2e sortie payante sous 21 jours, ≥ 25 % d'actifs à M2, ≥ 0,3 inscrit vérifié par sortie vécue attribué par slug, une contribution positive après astreinte nationale (jour et soir, au SLA affiché) et toutes les compensations (absences, imprévus, Blowy+, tables à deux, parrainage, annulations par Blowy), au moins 5 lieux sous contrat par quartier ouvert, un avis juridique écrit sur le canal de Blowy+, et si spec, concept, business-model et écrans ne divergent sur aucun chiffre ni aucune base fiscale.
