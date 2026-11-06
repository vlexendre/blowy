# Jury tour 11 — `investisseur`

**Verdict.** Duo chiffré (coût marginal ≈ 0 €, ≈ 0,4 sortie de capacité d’astreinte, saturation 1 125 → 1 040, point mort 128 sorties de groupe hors Duo, justifié) et ligne « Blowy annule » au libellé V5.8 avec 3 places : fait. La ville d’amorçage reste en morceaux, sans total, avec un « + 0,9 € » qui ne se recalcule pas.

**Note globale : 9/10** (T10 9 → T11 9)

| Compréhension | Charge cognitive | Envie | Vraie rencontre | Sécurité | Viralité | Argent | Finition |
|---|---|---|---|---|---|---|---|
| 10 | 10 | 9 | 10 | 10 | 9 | 9 | 10 |

Vérifications lancées (après le tour 11b, rendus régénérés à 10 h 20) : `check-facts` 107 fichiers, 10 817 vérifications, 0 contradiction ; `a11y-audit` 107 écrans, 1 667 textes, **2 problèmes** sur V5-Signaler (« {{blockMark}} » : case « Bloquer aussi » décochée mesurée comme texte brut, contraste 1,00:1 et « collé au bord » −24 px ; faux positif de l’outil, la case est correcte dans le PNG, mais le README annonce « 0 problème, 1 727 textes, 594 cibles », ce qui n’est plus ce que sort l’audit) ; `overflow.mjs` : 0 signalement (sortie vide, code 0). Chaque point ci-dessous a été vu dans le PNG rendu.

## Mes points du tour 10, vérifiés dans les rendus

- Duo : « Coût d’un Duo : ≈ 0 € de coût marginal… consomme ≈ 0,4 sortie de groupe de capacité d’astreinte… saturation ≈ 1 125 → ≈ 1 040 » ; point mort « ≈ 128 sorties de groupe par jour (600 / 4,70) ; les rendez-vous Duo n’y entrent pas » : fait (vérifié : 7,59 − 0,34 − 0,30 − 1,15 − 1,10 = 4,70 ; 600 / 4,70 = 127,7).
- « Blowy annule » : libellé « groupe incomplet à la Confirmation, ou motif interne », « au plus 3 places réservées », 0,02 × (9 + 6,19) = 0,30 € : fait, et identique à L-Contrat (« Blowy annule à la confirmation ou après (groupe incomplet compris) »).
- En-tête « Modèle économique V5.9 » : fait.
- Ville d’amorçage : morceaux chiffrés, pas de total (voir écrans).

## Écran par écran (107)

| Écran | Note | Ce qui empêche le 10 | Correction attendue |
|---|---|---|---|
| `L-Contrat` | 10 | Rien. | — |
| `L-Creneaux` | 10 | Rien. | — |
| `L-Effectif` | 10 | Rien. | — |
| `V5-Abonnement` | 10 | Rien. | — |
| `V5-Accueil` | 10 | Rien. | — |
| `V5-Accueil-discret` | 10 | Rien. | — |
| `V5-Accueil-duo` | 10 | Rien. | — |
| `V5-Affiner` | 10 | Rien. | — |
| `V5-Affiner-age` | 10 | Rien. | — |
| `V5-Affiner-ambiance` | 10 | Rien. | — |
| `V5-Affiner-histoire` | 10 | Rien. | — |
| `V5-Amorcage` | 10 | Rien. | — |
| `V5-Amorcage-solo` | 9 | business-model V5.9 : « Coût d’une ville d’amorçage » donne des morceaux (≈ 600 € fixes + ≈ 19 € par 1re sortie + « ≈ + 0,9 € par sortie ») mais aucun total pour une ville nommée ; et « + 0,9 € » ne se recalcule pas : 10 % × 3 places × 3 € HT = 0,90 € est le coût total, pas l’écart avec 2 % (0,72 € à revenu perdu nul, 1,22 € avec les 6,19 € de la ligne « Blowy annule »). | Ligne « Bordeaux (≈ 60 vérifiés → ≈ 12 premières sorties) : 600 + 12 × 19 + 12 × 0,90 ≈ 840 € » ; « + 0,9 € » remplacé par « 0,90 € au lieu de 0,18 € (≈ + 0,72 €) » avec le calcul. |
| `V5-Ange` | 10 | Rien. | — |
| `V5-Apres` | 10 | Rien. | — |
| `V5-Apres-aucun` | 10 | Rien. | — |
| `V5-Apres-resultats` | 10 | Rien. | — |
| `V5-Attente` | 9 | business-model V5.9 : « Coût d’une ville d’amorçage » donne des morceaux (≈ 600 € fixes + ≈ 19 € par 1re sortie + « ≈ + 0,9 € par sortie ») mais aucun total pour une ville nommée ; et « + 0,9 € » ne se recalcule pas : 10 % × 3 places × 3 € HT = 0,90 € est le coût total, pas l’écart avec 2 % (0,72 € à revenu perdu nul, 1,22 € avec les 6,19 € de la ligne « Blowy annule »). | Ligne « Bordeaux (≈ 60 vérifiés → ≈ 12 premières sorties) : 600 + 12 × 19 + 12 × 0,90 ≈ 840 € » ; « + 0,9 € » remplacé par « 0,90 € au lieu de 0,18 € (≈ + 0,72 €) » avec le calcul. |
| `V5-Bande` | 10 | Rien. | — |
| `V5-Cartes` | 10 | Rien. | — |
| `V5-Chargement` | 10 | Rien. | — |
| `V5-Chat` | 10 | Rien. | — |
| `V5-Chats` | 10 | Rien. | — |
| `V5-Chats-vide` | 10 | Rien. | — |
| `V5-Checkin` | 10 | Rien. | — |
| `V5-Checkin-ok` | 10 | Rien. | — |
| `V5-Compte` | 10 | Rien. | — |
| `V5-Confidentialite` | 10 | Rien. | — |
| `V5-Confirmation` | 10 | Rien. | — |
| `V5-Confirmation-banlieue` | 10 | Rien. | — |
| `V5-Confirmation-lyon` | 10 | Rien. | — |
| `V5-Consentement` | 10 | Rien. | — |
| `V5-Dispos` | 10 | Rien. | — |
| `V5-Dispos-semaines` | 10 | Rien. | — |
| `V5-Duo` | 10 | Rien. | — |
| `V5-Duo-hh` | 10 | Rien. | — |
| `V5-Duo-hh-proposition` | 10 | Rien. | — |
| `V5-Duo-hh-rdv` | 10 | Rien. | — |
| `V5-Duo-hh-visages` | 10 | Rien. | — |
| `V5-Erreur-age` | 10 | Rien. | — |
| `V5-Erreur-reseau` | 10 | Rien. | — |
| `V5-Eviter` | 10 | Rien. | — |
| `V5-Fiche` | 10 | Rien. | — |
| `V5-Genre` | 10 | Rien. | — |
| `V5-Groupe` | 10 | Rien. | — |
| `V5-Groupe-calme` | 10 | Rien. | — |
| `V5-Groupe-menu` | 10 | Rien. | — |
| `V5-Intention` | 10 | Rien. | — |
| `V5-Invite` | 10 | Rien. | — |
| `V5-Lien` | 10 | Rien. | — |
| `V5-Lien-debloque` | 10 | Rien. | — |
| `V5-Notifs` | 10 | Rien. | — |
| `V5-Notifs-refus` | 10 | Rien. | — |
| `V5-Oeuf` | 10 | Rien. | — |
| `V5-Paiement` | 10 | Rien. | — |
| `V5-Paiement-echec` | 10 | Rien. | — |
| `V5-Paiement-ok` | 10 | Rien. | — |
| `V5-Partage` | 10 | Rien. | — |
| `V5-Partage-bande` | 10 | Rien. | — |
| `V5-Partage-checkin` | 10 | Rien. | — |
| `V5-Partage-confirmation` | 10 | Rien. | — |
| `V5-Partage-dimanche` | 10 | Rien. | — |
| `V5-Partage-invitation` | 10 | Rien. | — |
| `V5-Partage-jeudi` | 10 | Rien. | — |
| `V5-Partage-ville` | 10 | Rien. | — |
| `V5-Pas-encore` | 10 | Rien. | — |
| `V5-Pas-encore-nantes` | 10 | Rien. | — |
| `V5-Pause` | 10 | Rien. | — |
| `V5-Pet` | 10 | Rien. | — |
| `V5-Profil` | 10 | Rien. | — |
| `V5-RdvDuo` | 10 | Rien. | — |
| `V5-RdvDuo-lea` | 10 | Rien. | — |
| `V5-Reglages` | 10 | Rien. | — |
| `V5-Rencontrer` | 10 | Rien. | — |
| `V5-Revelation` | 10 | Rien. | — |
| `V5-Rue` | 10 | Rien. | — |
| `V5-Rupture` | 10 | Rien. | — |
| `V5-Signaler` | 10 | Rien. | — |
| `V5-Sortie` | 10 | Rien. | — |
| `V5-Sortie-annulee` | 10 | Rien. | — |
| `V5-Sortie-banlieue` | 10 | Rien. | — |
| `V5-Sortie-complete` | 10 | Rien. | — |
| `V5-Sortie-inscrit` | 10 | Rien. | — |
| `V5-Sortie-lille` | 10 | Rien. | — |
| `V5-Sortie-lyon` | 10 | Rien. | — |
| `V5-Sortie-nantes` | 10 | Rien. | — |
| `V5-Souvenir` | 10 | Rien. | — |
| `V5-Story` | 10 | Rien. | — |
| `V5-Supprimer` | 10 | Rien. | — |
| `V5-Tarifs` | 10 | Rien. | — |
| `V5-Team` | 10 | Rien. | — |
| `V5-Toi` | 10 | Rien. | — |
| `V5-Toi-plus` | 10 | Rien. | — |
| `V5-Trouvee` | 10 | Rien. | — |
| `V5-Trouvee-banlieue` | 10 | Rien. | — |
| `V5-Trouvee-lyon` | 10 | Rien. | — |
| `V5-Trouvee-nantes` | 10 | Rien. | — |
| `V5-Trouvee-weekend` | 10 | Rien. | — |
| `V5-Verif` | 10 | Rien. | — |
| `V5-Verif-echec` | 10 | Rien. | — |
| `V5-Ville` | 10 | Rien. | — |
| `V5-Ville-bordeaux` | 9 | business-model V5.9 : « Coût d’une ville d’amorçage » donne des morceaux (≈ 600 € fixes + ≈ 19 € par 1re sortie + « ≈ + 0,9 € par sortie ») mais aucun total pour une ville nommée ; et « + 0,9 € » ne se recalcule pas : 10 % × 3 places × 3 € HT = 0,90 € est le coût total, pas l’écart avec 2 % (0,72 € à revenu perdu nul, 1,22 € avec les 6,19 € de la ligne « Blowy annule »). | Ligne « Bordeaux (≈ 60 vérifiés → ≈ 12 premières sorties) : 600 + 12 × 19 + 12 × 0,90 ≈ 840 € » ; « + 0,9 € » remplacé par « 0,90 € au lieu de 0,18 € (≈ + 0,72 €) » avec le calcul. |
| `V5-Ville-nantes` | 10 | Rien. | — |
| `V5-Welcome` | 10 | Rien. | — |
| `W-Ange` | 10 | Rien. | — |
| `W-Ange-aide` | 10 | Rien. | — |
| `W-Repondre` | 10 | Rien. | — |

Aucun écran BLOQUANT.

## Les 3 changements qui feraient monter ma note

1. Coût total d’une ville d’amorçage nommée (Bordeaux) en euros, avec le nombre de premières sorties.
2. « + 0,9 € » recalculé et posé (10 % vs 2 % × 3 places × 3 € HT, revenu perdu nul en amorçage).
3. Au point mort (128 sorties/jour), écrire le volume Duo correspondant (≈ 26 RDV/jour) et la marge d’astreinte restante.

## Je mets 10 si…

Documents : 10 quand business-model donne le total en euros d’une ville d’amorçage nommée et un « Blowy annule » en amorçage qui se recalcule. Terrain à part (inchangé).

## À part : ce qui relève du test terrain (ne retient pas le 10)

- ≥ 40 % de 2e sortie payante sous 21 jours ; ≥ 25 % d'actifs à M2.
- ≥ 0,3 inscrit vérifié par sortie vécue ; contribution positive après astreinte réelle.
- Taux réel de sorties tombées à 18 h par ville ; avis juridique écrit sur Blowy+ via Stripe.
