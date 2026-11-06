# Jury tour 5 — investisseur (Investisseur seed (consumer social))

**Verdict** : Le canal de Blowy+ est tranché (Apple Pay via Stripe, plus de commission Apple) et l'astreinte est enfin un coût fixe avec un point mort, mais ce point mort (≈ 27 sorties le même soir par ville) contredit la promesse « partout dès 5 personnes », le business-model oublie trois lignes de compensation, et la spec qu'on code est restée en V5.3 : le produit testé et le produit construit divergent davantage qu'au tour 4.

**Note globale : 8/10** (T1 4 · T2 6 · T3 7 · T4 8 · T5 8)

| Critère | Note |
|---|---|
| Compréhension | 9 |
| Charge cognitive | 8 |
| Envie | 8 |
| Vraie rencontre | 9 |
| Sécurité et confiance | 9 |
| Viralité | 9 |
| Argent | 7 |
| Finition visuelle | 9 |

## Suivi de mes reproches du tour 4

- **Perte réelle sur absence, astreinte en coût fixe, seuil de rentabilité** : fait dans business-model (point mort ≈ 27 sorties/soir/ville).
- **Blowy+ : séparer ou valider** : tranché : abonnement « sorties » en Apple Pay/Stripe, duos gratuits ; **avis juridique toujours « à revalider »**.
- **Spec alignée (« 3 sorties », heure, 48 h/7 j, slugs, en-tête)** : **régressé** : spec-v5 dit toujours « Mardi 12 h », Blowy+ « achat intégré via RevenueCat » + « duos illimités », « 1 duo actif », « rentable dès la 2ᵉ sortie », « on ne promet jamais de résilier depuis l'app ».
- **Tables à deux, annulations par Blowy dans le P&L** : **pas fait** : écrites au contrat, absentes de business-model.
- **Cohorte de 8 semaines** : pas encore lancée.

## Contrôles

`node design/v5/check-facts.mjs` : 88 fichiers, 4 958 vérifications, 0 contradiction. `a11y-audit.mjs` : 88 écrans, 0 problème, contraste min 4,53:1. Ce qu'ils ne voient pas, vérifié à la main et par `scratchpad/jury-r5-experts/overflow.mjs` (texte hors de l'artboard, plages « nn–nn ans » / heures coupées) : **V5-Confirmation** a son lien « Partager « cette semaine, je sors » » rendu sous le cadre (bas 868 px > 844) et **V5-Toi** coupe « 26– / 29 ans ». check-facts ne compare pas les écrans à `spec-v5.md`, qui est resté en V5.3 (« alignée sur … concept-v5.3 », « Mardi 12 h », Blowy+ « achat intégré via RevenueCat », « 1 duo actif », bandeau « sortie entre amis pour toi » au §3 et au §12 n° 8).

## Écran par écran

| Écran | Note | Ce qui empêche le 10 | Correction attendue |
|---|---|---|---|
| V5-Welcome | 8 | « Une sortie dès 5 personnes, partout » ; business-model : astreinte 200 €/soir/ville, point mort ≈ 27 sorties le même soir (≈ 135 participants). Une sortie seule à Bordeaux porte ≈ 200 € d'astreinte. | Promesse adossée à une astreinte nationale mutualisée chiffrée, ou villes ouvertes par densité. |
| V5-Ville | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Ville-bordeaux | 8 | 64 vérifiés, 3 lieux : sous le point mort de plus d'un ordre de grandeur. | Coût d'une ville d'amorçage dans business-model. |
| V5-Toi | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Genre | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Pet | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Rencontrer | 8 | Duo encore au point de décision ; moins grave depuis qu'il est gratuit et plafonné à 3, mais c'est un 2e produit à modérer sans revenu. | Mesurer la part d'inscrits Duo seul et leur 1re sortie payante. |
| V5-Intention | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Consentement | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Toi-plus | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Dispos | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Eviter | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Erreur-age | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Trouvee | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Trouvee-lyon | 8 | Lyon en solo : même question de point mort que Bordeaux. | Idem. |
| V5-Sortie-lyon | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Confirmation-lyon | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Trouvee-banlieue | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Sortie | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Team | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Partage-invitation | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Invite | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Compte | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Verif | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Notifs | 8 | « lun. 21:00 » à l'écran ; spec §1/§7 : « Mardi 12 h ». Divergence aggravée depuis T4 : seuls les écrans ont bougé. | Spec révision 5 = V5.4. |
| V5-Sortie-inscrit | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Accueil | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Accueil-discret | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Accueil-duo | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Pause | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Chats | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Groupe | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Groupe-menu | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Attente | 9 | Leviers de liquidité sans achat média : bien. | Mesurer le délai « il manque N » → sortie vécue. |
| V5-Partage-ville | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Amorcage | 8 | « Pas besoin d'attendre que Lille « ouvre » » : chaque sortie isolée coûte une soirée d'astreinte. | Idem. |
| V5-Amorcage-solo | 8 | Samedi 15 h – 17 h : sortie de jour, hors de la plage d'astreinte 18 h – 2 h que modélise business-model. | 2e plage d'astreinte (jour) dans le modèle, ou pas de créneaux de jour. |
| V5-Sortie-complete | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Sortie-annulee | 7 | « Le lieu reçoit 3 € par place prévue » + « Ta 1re sortie reste offerte » : ≈ 15 € plus un CAC rallongé par annulation ; aucune ligne « annulations par Blowy » dans business-model malgré concept C.12. | Ligne chiffrée avec taux d'annulation hypothétique. |
| V5-Affiner | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Affiner-histoire | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Confirmation | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Partage-confirmation | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Revelation | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Partage-checkin | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Ange | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| W-Ange | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| W-Ange-aide | 8 | « appelle Alex sous 5 min » : un SLA par ville et par soir ; plus une plage de jour non modélisée. | SLA et plages dans le coût d'astreinte. |
| V5-Checkin | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Checkin-ok | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Souvenir | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Apres | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Apres-resultats | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Partage | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Partage-dimanche | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Apres-aucun | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Bande | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Rue | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Duo | 8 | 3 duos gratuits : produit sans revenu, modération à budgéter. | Coût de modération par duo dans business-model. |
| V5-Lien | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Lien-debloque | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-RdvDuo | 7 | Table à deux = 2 places gratuites ; une absence coûte 2 × 3 € à Blowy, revenu 0 ; absent du P&L (T4, non traité). | Ligne « tables à deux » ou « lieu suggéré » sans réservation. |
| V5-Chat | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-RdvDuo-lea | 8 | Parc gratuit : zéro coût, mais hors lieu partenaire (contraire à la spec) et hors astreinte. | Trancher. |
| V5-Oeuf | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Rupture | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Cartes | 9 | Un lien par carte : attribution mesurable, c'est ce que je veux voir dans la cohorte. | — |
| V5-Story | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| W-Repondre | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Profil | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Fiche | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Tarifs | 9 | Prix et règle lisibles. | — |
| V5-Abonnement | 8 | Hors achat intégré : ma demande T4. Restent : avis juridique 3.1.3(e) non écrit ; « résiliable ici » contre spec §6 « on ne promet jamais de résilier depuis l'app » ; cannibalisation : à 4 sorties par mois, 7,93 € nets = 1,98 € par sortie contre 3,84 € pour une place. | Avis écrit avant soumission ; spec alignée ; cannibalisation dans business-model. |
| V5-Paiement | 9 | Apple Pay via Stripe, « BLW Réservation » : propre. | — |
| V5-Paiement-ok | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Reglages | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Confidentialite | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Signaler | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Supprimer | 9 | Résiliation avec le compte : propre. | — |
| V5-Chargement | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Erreur-reseau | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Paiement-echec | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Verif-echec | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Notifs-refus | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| V5-Chats-vide | 9 | Aucun coût ni risque nouveau sur cet écran. | — |
| L-Effectif | 8 | « 4,99 € si elle était payée » ; business-model : « 4,16 € HT reversés ». Relevé 7,99 € = 4,99 + 3 : les écrans suivent l'un, le modèle l'autre. | Un chiffre (HT ou TTC) partout. |
| L-Creneaux | 8 | Samedi 15 h et dimanche 11 h ouverts : 2e plage d'astreinte absente du coût. | La compter. |
| L-Contrat | 8 | 3 € pour une place « libérée par je connais quelqu'un ici », place Blowy+ vide, sortie annulée par Blowy : trois engagements, aucun chiffré dans business-model ; contrat sans engagement (préavis 30 j) : pas d'actif durable. | Lignes chiffrées ; engagement minimal sur les créneaux. |

## Les 3 changements qui feraient monter ma note le plus

1. Spec-v5 révision 5 alignée sur V5.4 (Blowy+ Stripe Billing et RevenueCat désactivé, 3 duos, lundi 21 h, résiliation dans l'app, bandeau retiré) : aujourd'hui ce qu'on code n'est pas ce qu'on teste.
2. business-model complet : 4,99 € ou 4,16 € HT (un seul), annulations par Blowy, tables à deux, places Blowy+ vides, cannibalisation de Blowy+, plage d'astreinte de jour, et une règle d'ouverture de ville cohérente avec « partout dès 5 personnes ».
3. Avis juridique écrit sur Blowy+ hors achat intégré, puis cohorte de 8 semaines publiée.

## Je mets 10 si…

Je mets 10 si la cohorte de 8 semaines montre ≥ 40 % de 2e sortie payante sous 21 jours, ≥ 25 % d'actifs à M2, ≥ 0,3 inscrit vérifié par sortie vécue attribué par slug, une contribution positive par ville après astreinte (soir et jour) et toutes les compensations (absences, Blowy+, tables à deux, annulations par Blowy), au moins 5 lieux sous contrat par quartier ouvert, un avis juridique écrit sur le canal de Blowy+, et si spec, concept, business-model et écrans ne divergent sur aucun chiffre.
