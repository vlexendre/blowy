# investisseur — tour 9

**Verdict** : La sortie tombée à 18 h est enfin alignée (écran, contrat, spec §2.6, code) et l'astreinte a un calcul ; mais le business-model garde l'ancien seuil à côté du nouveau, ne chiffre ni le Duo ni l'amorçage, et la spec §6.5 contredit encore le contrat.

**Note globale : 9/10** (T7 9 → T8 9 → T9 9)

| Compréhension | Charge cognitive | Envie | Vraie rencontre | Sécurité | Viralité | Argent | Finition |
|---|---|---|---|---|---|---|---|
| 10 | 10 | 9 | 9 | 10 | 9 | 9 | 9 |

Évolution par critère (T7 → T8 → T9) : comprehension 9→9→10 · cognitive 9→9→10 · desire 9→9→9 · meet 9→9→9 · safety 9→9→10 · virality 9→9→9 · money 7→8→9 · visual 9→9→9.

Outils lancés : `node design/v5/check-facts.mjs` → 106 fichiers, 9 066 vérifications, 0 contradiction ; `NODE_PATH=$(npm root -g) node design/v5/a11y-audit.mjs .local/dc-runtime.js` → 106 écrans, 1 698 textes, 588 cibles, 0 problème, contraste min 4,53:1 (sans le runtime en argument : 2 faux positifs, contraste 1,00:1 sur un gabarit non rendu, comme au tour 8) ; `node tooling/qa/layout/overflow.mjs` → aucun signalement. Aucun de ces outils ne voit : l'initiale du duo après le double oui, les vignettes d'aperçu (exclues via `data-miniature`), l'ange non sélectionné, les écarts spec/business-model.

## Vérification point par point de mes reproches des tours 7 et 8

Tour 7 : les points de mon rapport T7 étaient réglés au tour 8 (voir round-8/investisseur.md) et le restent. Tour 8 :

| Point T8 | État au tour 9 |
|---|---|
| F1 Sortie tombée à 18 h : spec, contrat, écrans | réglé pour §2.6 et le code ; §6.5 et D-079 non alignés |
| F2 Astreinte sur le pic simultané | partiel : calcul ajouté (≈ 450 sorties au pic), mais « 300 sorties simultanées » subsiste, « majorité » vs 40 %, erreur « 450 demandes/2 % » |
| F3 Part d'astreinte des RDV Duo | partiel : « compte comme une sortie de 2 », sans volume ni coût |
| F4 Ligne ville d'amorçage | partiel : qualitative, sans chiffre ni taux d'annulation par ville |
| F5 Avis juridique Blowy+, cohorte | terrain |

## Écran par écran

| Écran | Note | Ce qui empêche le 10 | Correction |
|---|---|---|---|
| V5-Welcome | 10 | — | — |
| V5-Ville | 10 | — | — |
| V5-Ville-bordeaux | 9 | Ville d'amorçage : ligne qualitative seulement (« ≈ 3,84 € par personne ») ; la sortie tombée à 18 h, désormais payée 3 € HT par place réservée (V5.8 §2), n'a ni taux par ville ni ligne de coût : à Bordeaux (≈ 60 vérifiés) ce taux sera très au-dessus des 2 % nationaux. | Ligne « Blowy annule (groupe incomplet) » avec taux par ville (amorçage vs dense) et coût d'une ville d'amorçage chiffré (sorties offertes × 5 × 3,84 + annulations × 3 €). |
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
| V5-Attente | 9 | Ville d'amorçage : ligne qualitative seulement (« ≈ 3,84 € par personne ») ; la sortie tombée à 18 h, désormais payée 3 € HT par place réservée (V5.8 §2), n'a ni taux par ville ni ligne de coût : à Bordeaux (≈ 60 vérifiés) ce taux sera très au-dessus des 2 % nationaux. | Ligne « Blowy annule (groupe incomplet) » avec taux par ville (amorçage vs dense) et coût d'une ville d'amorçage chiffré (sorties offertes × 5 × 3,84 + annulations × 3 €). |
| V5-Partage-ville | 10 | — | — |
| V5-Amorcage | 10 | — | — |
| V5-Amorcage-solo | 9 | Ville d'amorçage : ligne qualitative seulement (« ≈ 3,84 € par personne ») ; la sortie tombée à 18 h, désormais payée 3 € HT par place réservée (V5.8 §2), n'a ni taux par ville ni ligne de coût : à Bordeaux (≈ 60 vérifiés) ce taux sera très au-dessus des 2 % nationaux. | Ligne « Blowy annule (groupe incomplet) » avec taux par ville (amorçage vs dense) et coût d'une ville d'amorçage chiffré (sorties offertes × 5 × 3,84 + annulations × 3 €). |
| V5-Sortie-complete | 10 | — | — |
| V5-Sortie-annulee | 9 | Écran, Tarifs et contrat disent « Sortie annulée par Blowy à la confirmation ou après : chaque place réservée est compensée au lieu par Blowy. » ; la spec §6.5 impose encore « Si Blowy annule une sortie confirmée, le lieu reçoit 3 € par place réservée. » comme « formulation identique côté client, contrat et relevé », et D-079 (§2.6) dit « déjà confirmée … Avant la confirmation : 0 € ». D-087 citée en §2.6 n'existe ni en §12 ni dans docs/decisions.md ; §13 n'a pas de révision 8. | §6.5 reprend la phrase de facts.tarifsContrat ; D-079 dit « à la confirmation ou après (groupe incomplet compris) » ; D-087 ajoutée en §12 et ligne V5.8 en §13. |
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
| W-Ange-aide | 9 | business-model V5.8 : le dimensionnement ajouté (2 personnes → ≈ 450 sorties au pic, ≈ 1 125 / jour) coexiste avec l'ancienne phrase « au-delà de ≈ 300 sorties simultanées une 3e personne » ; « la majorité des sorties » puis « 40 % » ; « 450 demandes/2 % » au lieu de « 9 demandes / 2 % » ; volume Duo (RDV/jour) jamais chiffré alors qu'il consomme l'astreinte sans revenu. | Supprimer la ligne « 300 sorties simultanées », corriger « majorité » et le calcul, ajouter « N RDV Duo/jour → coût d'astreinte par RDV » et le point mort avec Duo. |
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
| V5-Duo | 10 | — | — |
| V5-Lien | 10 | — | — |
| V5-Duo-hh-proposition | 10 | — | — |
| V5-Duo-hh | 10 | — | — |
| V5-Duo-hh-visages | 10 | — | — |
| V5-Duo-hh-rdv | 10 | — | — |
| V5-Lien-debloque | 10 | — | — |
| V5-RdvDuo | 9 | business-model V5.8 : le dimensionnement ajouté (2 personnes → ≈ 450 sorties au pic, ≈ 1 125 / jour) coexiste avec l'ancienne phrase « au-delà de ≈ 300 sorties simultanées une 3e personne » ; « la majorité des sorties » puis « 40 % » ; « 450 demandes/2 % » au lieu de « 9 demandes / 2 % » ; volume Duo (RDV/jour) jamais chiffré alors qu'il consomme l'astreinte sans revenu. | Supprimer la ligne « 300 sorties simultanées », corriger « majorité » et le calcul, ajouter « N RDV Duo/jour → coût d'astreinte par RDV » et le point mort avec Duo. |
| V5-Chat | 10 | — | — |
| V5-RdvDuo-lea | 10 | — | — |
| V5-Oeuf | 10 | — | — |
| V5-Rupture | 10 | — | — |
| V5-Cartes | 10 | — | — |
| V5-Story | 10 | — | — |
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
| L-Contrat | 9 | Écran, Tarifs et contrat disent « Sortie annulée par Blowy à la confirmation ou après : chaque place réservée est compensée au lieu par Blowy. » ; la spec §6.5 impose encore « Si Blowy annule une sortie confirmée, le lieu reçoit 3 € par place réservée. » comme « formulation identique côté client, contrat et relevé », et D-079 (§2.6) dit « déjà confirmée … Avant la confirmation : 0 € ». D-087 citée en §2.6 n'existe ni en §12 ni dans docs/decisions.md ; §13 n'a pas de révision 8. | §6.5 reprend la phrase de facts.tarifsContrat ; D-079 dit « à la confirmation ou après (groupe incomplet compris) » ; D-087 ajoutée en §12 et ligne V5.8 en §13. |

Aucun écran BLOQUANT.

## Les 3 changements qui feraient monter ma note

1. business-model : une seule règle d'astreinte (supprimer « 300 sorties simultanées »), calcul corrigé, volume Duo/jour et son coût.
2. Ligne « Blowy annule (groupe incomplet) » avec taux par ville et coût chiffré d'une ville d'amorçage (Bordeaux, Lille).
3. Spec §6.5 / D-079 / D-087 alignés sur le contrat.

## Je mets 10 si…

Documents et maquettes : 10 quand business-model n'a qu'un seuil d'astreinte cohérent, chiffre le Duo et la ville d'amorçage (y compris la sortie tombée à 18 h payée 3 € HT), et quand la spec §6.5 dit ce que disent contrat et écrans. Terrain (à part, ne retient pas le 10) : ≥ 40 % de 2e sortie payante sous 21 j, ≥ 25 % d'actifs à M2, ≥ 0,3 inscrit vérifié par sortie, contribution positive après astreinte réelle, avis juridique écrit sur Blowy+.

## À part : ce qui relève du test terrain (ne retient pas le 10)

- ≥ 40 % de 2e sortie payante sous 21 jours ; ≥ 25 % d'actifs à M2.
- ≥ 0,3 inscrit vérifié par sortie vécue ; contribution positive après astreinte réelle.
- Taux réel de sorties tombées à 18 h par ville ; avis juridique écrit sur Blowy+ via Stripe.
