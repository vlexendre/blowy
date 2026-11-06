# Modèle économique V5.4 — hypothèses chiffrées (à valider par un test terrain)

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

### Astreinte (coût fixe par soir et par ville)
Hypothèse : 1 personne d'astreinte de 18 h à 2 h ≈ 200 € chargés par soir et par ville active.
| Sorties le même soir dans la ville | Astreinte par sortie | Contribution par sortie |
|---|---|---|
| 10 | 20,00 € | − 12,41 € |
| 27 | 7,41 € | ≈ 0 € (point mort) |
| 50 | 4,00 € | ≈ 3,59 € |
| 100 | 2,00 € | ≈ 5,59 € |
Conséquence : n'ouvrir des soirs de sortie que là où la densité dépasse le point mort (≈ 27 sorties, soit ≈ 135 participants le même soir), ou mutualiser l'astreinte entre villes (même fuseau) — à mesurer pendant le test.

Sensibilités : chaque point d'absence en plus coûte ≈ 0,18 € par sortie ; une place offerte de moins par groupe ajoute ≈ 3,84 €.

## Ce que le test de 8 semaines doit mesurer
- ≥ 40 % des participants à une 1re sortie font une 2e sortie payante sous 21 jours.
- ≥ 25 % d'actifs à M2.
- ≥ 0,3 nouvel inscrit vérifié par sortie vécue (venir avec quelqu'un + cartes à lien unique + ange gardien + 3 mots), mesuré par lien.
- Welcome → 1re sortie vécue ≥ 25 % ; chute au selfie < 30 %.
- Taux d'absence après confirmation < 8 %.
- Contribution par sortie positive après coûts réels.

## Défendabilité (hypothèses stratégiques, pas des faits mesurés)
- Densité par quartier et par créneau construite par les invitations (on vient avec quelqu'un), pas par l'achat média.
- Couche confiance difficile à greffer sur un produit fondé sur le profil public : vérification 18+, vote secret à résultat minimal, garantie de compatibilité silencieuse, visages tardifs, ange gardien sans appli.
- Continuité après la sortie (bande, duo) que Timeleft (positionné « pas de rencontre amoureuse ») et Tinder Events (pas de groupe composé) n'ont pas.
