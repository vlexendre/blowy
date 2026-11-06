# Modèle économique V5.9 — hypothèses chiffrées (à valider par un test terrain)

Toutes les valeurs ci-dessous sont des **hypothèses de travail**, pas des mesures. Elles servent à décider quoi mesurer pendant le test de 8 semaines. Prix en euros TTC, TVA 20 %. Révisé après les jurys tours 3 et 4 (forfait lieu, commission Apple, astreinte en coût fixe).

## Prix et canaux (concept V5.4 §C)
| Offre | Canal | Prix TTC | HT | Frais estimés | Net Blowy |
|---|---|---|---|---|---|
| Place de sortie (après la 1re offerte) | Apple Pay via Stripe (service consommé hors app) | 4,99 € | 4,16 € | ≈ 0,32 € (≈ 1,5 % + 0,25 €) | ≈ 3,84 € |
| Blowy+ (abonnement « sorties » : toutes tes sorties) | Apple Pay via Stripe Billing (service consommé hors app, aucune fonction numérique incluse) | 9,99 € / mois | 8,33 € | ≈ 0,40 € | ≈ 7,93 € / mois |
| Duo | gratuit pour tous (3 actifs max) | — | — | — | — |

Frais Stripe cités de mémoire : à revérifier sur la grille en vigueur. Le classement de Blowy+ comme service consommé hors de l'app est à revalider juridiquement avant soumission App Store.

## Une sortie de 5 personnes (hypothèses)
| Ligne | Hypothèse | Montant |
|---|---|---|
| Places payées à l'unité | 2 sur 5 | 2 × 3,84 = 7,68 € |
| Abonné Blowy+ (3 sorties par mois en moyenne) | 1 sur 5 | 7,93 / 3 ≈ 2,64 € |
| 1re sortie offerte | 2 sur 5 | 0 € |
| **Revenu net par sortie** | | **≈ 10,32 €** |
| Absences après confirmation | 8 % → 0,4 absent par sortie ; place payée : 4,16 € HT reversés au lieu (Blowy garde seulement les frais à sa charge) ; place offerte : 3 € versés par Blowy ; mix 60/40 | − 0,4 × (0,6 × 4,16 + 0,4 × 3) ≈ − 1,48 € |
| Vérification d'âge/selfie amortie sur 4 sorties | ≈ 1 € par personne / 4 | − 1,25 € |
| **Contribution avant astreinte** | | **≈ 7,59 €** |

### Astreinte (V5.5 : toutes les heures de créneaux, mutualisée par fuseau)
Hypothèse : couvrir toutes les heures de sorties et de rendez-vous Duo d'un fuseau (France métropolitaine) coûte ≈ 2 personnes × 12 h ≈ 600 € chargés par jour, **pour toutes les villes à la fois**.
| Sorties par jour (toutes villes) | Astreinte par sortie | Contribution par sortie |
|---|---|---|
| 40 | 15,00 € | − 7,41 € |
| 80 | 7,50 € | ≈ 0 € (avant postes V5.6) |
| 200 | 3,00 € | ≈ 4,59 € |
| 500 | 1,20 € | ≈ 6,39 € |
Ce tableau ne tient compte que de la contribution avant postes V5.6 (7,59 €) ; le point mort retenu est celui de la section suivante, tous postes inclus. Une petite ville ne coûte pas d'astreinte en plus : le point mort se lit sur le volume **national**.

### Autres postes (V5.4 → V5.6)
| Poste | Règle | Effet par sortie (hypothèse) |
|---|---|---|
| Imprévu (1/mois) | place non remboursée, reversée au lieu comme une absence | inclus dans le taux d'absence (8 %) |
| Sortie pour raison de sécurité | toujours remboursée, lieu compensé 3 € HT par Blowy | à 1 % des places : − 0,05 × (3,84 + 3) ≈ − 0,34 € |
| « Blowy annule » (groupe incomplet à la Confirmation, ou motif interne) | 3 € HT par place réservée au lieu + remboursement ; un groupe incomplet compte au plus 3 places réservées | à 2 % des sorties : − 0,02 × (3 × 3 € + revenu perdu de ces 3 places ≈ 6,19 €) ≈ − 0,30 € |
| Parrainage (prochaine sortie offerte, 1/mois) | coût = une place non encaissée par filleul venu | à 0,3 filleul par sortie : − 0,3 × 3,84 ≈ − 1,15 € (c'est le coût d'acquisition, à comparer à une acquisition payante) |
| Duo à une table de 2 | gratuit, sans garantie ni compensation pour le lieu (spec et contrat alignés : 0 €) | 0 € |
| Cannibalisation Blowy+ | un abonné qui sort 4 fois/mois rapporte 7,93/4 ≈ 1,98 € par sortie au lieu de 3,84 € | si 30 % des places passent en Blowy+ à 4 sorties/mois : ≈ − 1,10 € |
| **Contribution avant astreinte, tous postes** | | ≈ 7,59 − 0,34 − 0,30 − 1,15 − 1,10 ≈ **4,70 €** |
**Point mort national retenu : ≈ 128 sorties de groupe par jour** (600 / 4,70), soit ≈ 640 participants ; les rendez-vous Duo n'y entrent pas (ils ne rapportent rien et leur coût marginal est nul tant que l'astreinte n'est pas saturée, voir ci-dessous). L'astreinte est dimensionnée pour un rappel humain en ≈ 5 min pendant une sortie (`safety.helpCallbackTargetMinutes`) : dimensionnement détaillé ci-dessous.

**Activités payantes (atelier, five, bloc)** : le prix de l'activité est **prépayé dans l'app avec la place**, encaissé par Blowy **au nom et pour le compte du lieu** (mandat d'encaissement), et reversé au lieu pour chaque place confirmée, honorée ou non, **diminué des frais de paiement proportionnels (≈ 1,5 %)** : un atelier à 25 € est reversé ≈ 24,63 €. Le flux est donc neutre pour Blowy : les frais fixes par transaction (≈ 0,25 €) sont déjà comptés sur la place, et l'activité seule (place offerte ou Blowy+) supporte ses propres frais fixes, déduits aussi du reversement. TVA : l'activité est vendue par le lieu, qui la facture et en reverse la TVA ; Blowy ne facture que sa place (hypothèse à valider par un expert-comptable). Le lieu d'activité ne perd jamais le prix d'une place confirmée ; une place remboursée (sécurité, « Blowy annule », annulation avant la Confirmation) rembourse aussi l'activité et le lieu ne reçoit alors que la compensation prévue (3 € HT), jamais l'activité.

Sensibilités : chaque point d'absence en plus coûte ≈ 0,18 € par sortie ; une place offerte de moins par groupe ajoute ≈ 3,84 €.

### Dimensionnement de l'astreinte (hypothèses, à mesurer)
- Pic : le jeudi soir, entre 19 h et 20 h 30. Hypothèse : 40 % des sorties du jour commencent sur ce créneau de 90 min.
- Demandes « besoin d'aide » ou « je pars mal à l'aise » : hypothèse 2 % des sorties ; traitement ≈ 10 min de personne chacune (rappel + suivi).
- Une personne traite ≈ 9 demandes en 90 min. Pour tenir un rappel en ≈ 5 min, on vise ≤ 50 % d'occupation, soit ≈ 4,5 demandes par personne sur le pic.
- Avec 2 personnes : ≈ 9 demandes traitables sur le pic ; 9 demandes ÷ 2 % ≈ 450 sorties au pic ; 450 ÷ 40 % ≈ 1 125 sorties par jour. Au-delà, une 3e personne (+ 300 €/jour).
- Duo : un rendez-vous Duo compte comme une sortie de 2 personnes pour l'astreinte (même taux de 2 %) ; il ne rapporte rien, il est donc un coût d'acquisition et de rétention.
- Volume Duo (hypothèse) : 1 rendez-vous Duo pour 5 sorties de groupe. **Coût d'un Duo** : ≈ 0 € de coût marginal (astreinte fixe, pas de compensation lieu, vérification déjà faite) ; il consomme ≈ 0,4 sortie de groupe de capacité d'astreinte (2 personnes au lieu de 5). Avec ce volume, la saturation de 2 personnes passe de ≈ 1 125 à ≈ 1 040 sorties de groupe par jour.
- Sortie qui ne se forme pas à la confirmation (« Blowy annule ») : hypothèse 2 % des sorties en ville active, 10 % en ville d'amorçage ; coût = 3 € HT par place réservée + remboursement (déjà compté dans « Autres postes » au taux moyen de 2 %).
- **Coût d'une ville d'amorçage** (hypothèses) : ≈ 600 € fixes (2 jours d'ops pour signer 1 à 2 lieux) + ≈ 19 € de revenu non encaissé par 1re sortie (5 × 3,84 €) + un surcoût « Blowy annule » de (10 % − 2 %) × (3 × 3 € + 6,19 €) ≈ 1,22 € par sortie, dont ≈ 0,72 € de compensations et remboursements au-delà du taux moyen déjà compté. **Exemple Bordeaux** : 600 € + 12 premières sorties × (19 € + 1,22 €) ≈ **843 €** pour les 4 premières semaines (12 sorties, ≈ 60 personnes), à comparer au coût d'acquisition payant de 60 personnes vérifiées. Aucune astreinte en plus (mutualisée) ; le coût propre est la 1re sortie offerte de chaque participant (≈ 3,84 € de revenu non encaissé par personne) et le temps ops pour signer 1–2 lieux.
Ces chiffres sont des hypothèses : le test de 8 semaines doit mesurer le taux réel de demandes et le temps de traitement.

## Ce que le test de 8 semaines doit mesurer
- ≥ 40 % des participants à une 1re sortie font une 2e sortie payante sous 21 jours.
- ≥ 25 % d'actifs à M2.
- ≥ 0,3 nouvel inscrit vérifié par sortie vécue (venir avec quelqu'un + cartes à lien unique + ange gardien + 3 mots), mesuré par lien.
- Welcome → 1re sortie vécue ≥ 25 % ; chute au selfie < 30 %.
- Taux d'absence après confirmation < 8 %.
- Contribution par sortie positive après coûts réels (y compris sécurité, annulations Blowy, parrainage et cannibalisation Blowy+).
- Avis juridique écrit sur le classement de Blowy+ (service consommé hors app) avant soumission App Store.

## Défendabilité (hypothèses stratégiques, pas des faits mesurés)
- Densité par quartier et par créneau construite par les invitations (on vient avec quelqu'un), pas par l'achat média.
- Couche confiance difficile à greffer sur un produit fondé sur le profil public : vérification 18+, vote secret à résultat minimal, garantie de compatibilité silencieuse, visages tardifs, ange gardien sans appli.
- Continuité après la sortie (bande, duo) que Timeleft (positionné « pas de rencontre amoureuse ») et Tinder Events (pas de groupe composé) n'ont pas.
