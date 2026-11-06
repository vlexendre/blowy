# Modèle économique V5.3 — hypothèses chiffrées (à valider par un test terrain)

Toutes les valeurs ci-dessous sont des **hypothèses de travail**, pas des mesures. Elles servent à décider quoi mesurer pendant le test de 8 semaines. Prix en euros TTC, TVA 20 %. Révisé après le jury tour 3 (l'investisseur avait relevé que le forfait lieu de 15 € ramenait la contribution à ≈ 0,55 €).

## Prix et canaux (concept V5.3 §C)
| Offre | Canal | Prix TTC | HT | Frais estimés | Net Blowy |
|---|---|---|---|---|---|
| Place de sortie (après la 1re offerte) | Apple Pay via Stripe (service consommé hors app) | 4,99 € | 4,16 € | ≈ 0,32 € (≈ 1,5 % + 0,25 €) | ≈ 3,84 € |
| Blowy+ mensuel (toutes les sorties + duos illimités) | Achat intégré (RevenueCat) | 9,99 € | 8,33 € | commission Apple 15 % (programme petites entreprises) ≈ 1,25 € | ≈ 7,08 € / mois |

Frais Stripe et commission Apple cités de mémoire : à revérifier sur les grilles en vigueur. Le choix des canaux est à revalider juridiquement (règles App Store sur les services physiques) avant soumission.

## Une sortie de 5 personnes (hypothèses)
| Ligne | Hypothèse | Montant |
|---|---|---|
| Places payées à l'unité | 2 sur 5 | 2 × 3,84 = 7,68 € |
| Abonné Blowy+ (3 sorties par mois en moyenne) | 1 sur 5 | 7,08 / 3 ≈ 2,36 € |
| 1re sortie offerte | 2 sur 5 | 0 € |
| **Revenu net par sortie** | | **≈ 10,04 €** |
| Compensation lieu (absences après confirmation) | taux d'absence 8 % → 0,4 absent par sortie ; place payée : son prix va au lieu (revenu déjà perdu, ≈ 3,84 €) ; place offerte : Blowy verse 3 € ; mix 60 % payées / 40 % offertes | − 0,4 × (0,6 × 3,84 + 0,4 × 3) ≈ − 1,40 € |
| Support / modération (astreinte pendant les créneaux, revue humaine) | 0,50 € par participant | − 2,50 € |
| Vérification d'âge/selfie (fournisseur) amortie sur 4 sorties | ≈ 1 € par personne / 4 | − 1,25 € |
| **Contribution par sortie** | | **≈ 4,90 €** |

Sensibilités : chaque point d'absence en plus coûte ≈ 0,17 € par sortie ; passer de 2 à 1 place offerte par groupe (cohorte plus ancienne) ajoute ≈ 3,84 €.

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
