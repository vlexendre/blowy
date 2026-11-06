# Jury tour 12 — `investisseur`

**Verdict.** Ville d’amorçage chiffrée (« Exemple Bordeaux : 600 € + 12 × (19 € + 1,22 €) ≈ 843 € », surcoût « Blowy annule » recalculé : 0,08 × 15,19 = 1,22 €, dont 0,72 € de compensations) : fait. Mais la décision du tour 12 (activité prépayée, « reversée intégralement ») crée un coût que le modèle ne chiffre pas : les frais de paiement sur la part activité, à la charge de Blowy, et un statut TVA non écrit.

**Note globale : 9/10** (T11 9 → T12 9)

| Compréhension | Charge cognitive | Envie | Vraie rencontre | Sécurité | Viralité | Argent | Finition |
|---|---|---|---|---|---|---|---|
| 10 | 10 | 9 | 10 | 10 | 9 | 9 | 10 |

Vérifications lancées (rendus régénérés à 10 h 53, après le tour 12) : `check-facts` 107 fichiers, 10 945 vérifications, 0 contradiction ; `a11y-audit` 107 écrans, 1 733 textes, 594 cibles, 1 818 blocs mesurés, **0 problème**, contraste minimum 4,53:1 (le faux positif « {{blockMark}} » de V5-Signaler a disparu ; le README est conforme) ; `overflow.mjs` : 0 signalement (code 0). Limite constatée : check-facts contrôle le récapitulatif de V5-Paiement (16,99 €) mais pas V5-Paiement-ok ni V5-Paiement-echec, qui disent encore 4,99 € (voir les écrans). Chaque point ci-dessous a été vu dans le PNG rendu.

## Mes points du tour 11, vérifiés dans business-model V5.9

- Total d’une ville nommée : « Exemple Bordeaux : 600 € + 12 premières sorties × (19 € + 1,22 €) ≈ 843 € pour les 4 premières semaines (12 sorties, ≈ 60 personnes) » : fait (recalculé : 12 × 20,22 = 242,6 ; + 600 = 842,6).
- « + 0,9 € » remplacé par « (10 % − 2 %) × (3 × 3 € + 6,19 €) ≈ 1,22 € par sortie, dont ≈ 0,72 € de compensations et remboursements au-delà du taux moyen » : fait (0,08 × 9 = 0,72 ; 0,08 × 15,19 = 1,215).
- Volume Duo au point mort (≈ 26 RDV/jour à 128 sorties) : toujours pas écrit, mais déductible (1 pour 5) ; ne retient pas le 10.
- Nouveau : « Activités payantes … flux neutre pour Blowy, hors frais de paiement ≈ 1,5 % » : les frais ne sont pas chiffrés et le prix est « reversé intégralement », donc payés par Blowy. Au barème du tableau (≈ 1,5 % + 0,25 €) : atelier à 25 € = 5 × 0,375 € + 2 places offertes × 0,25 € (transaction ouverte pour la seule activité) ≈ 2,38 € par sortie, soit la moitié des 4,70 € de contribution ; bloc 12 € ≈ 1,40 € ; five 9 € ≈ 1,18 €. Stripe ne rend pas ses frais sur un remboursement (Blowy annule, sécurité). Et « TTC reversé » n’est neutre que si Blowy encaisse au nom et pour le compte du lieu (débours) ; sinon Blowy doit la TVA sur 25 €.

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
| `V5-Amorcage-solo` | 10 | Rien. | — |
| `V5-Ange` | 10 | Rien. | — |
| `V5-Apres` | 10 | Rien. | — |
| `V5-Apres-aucun` | 10 | Rien. | — |
| `V5-Apres-resultats` | 10 | Rien. | — |
| `V5-Attente` | 10 | Rien. | — |
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
| `V5-Paiement` | 9 | Débit de 16,99 € dont 12 € de bloc « reversés intégralement » au lieu : les ≈ 0,18 € de frais sur la part bloc (et 0,25 € par transaction pour une place offerte qui ne paie que l’activité) restent à Blowy et ne sont dans aucune ligne de business-model. | Ligne « Activités prépayées » dans « Une sortie de 5 personnes » : part des sorties à activité (hypothèse), frais par sortie (atelier ≈ 2,38 €, bloc ≈ 1,40 €, five ≈ 1,18 €), contribution et point mort recalculés ; ou frais déduits du reversement, écrit au contrat. |
| `V5-Paiement-echec` | 9 | « Ta banque a refusé le paiement de 4,99 €. » pour la place du jeu. 19 nov. que V5-Paiement facture 16,99 € (place + bloc 12 €). Régression du tour 12. | « Ta banque a refusé le paiement de 16,99 € (place 4,99 € + bloc 12 €). » ; même règle check-facts que pour Paiement-ok. |
| `V5-Paiement-ok` | 9 | Récapitulatif « Place · jeu. 19 nov. 4,99 € » alors que V5-Paiement débite 16,99 € pour la même sortie (« Place de sortie 4,99 € » + « Bloc d’escalade, payé avec ta place 12 € ») : le reçu ne correspond pas au paiement. Régression du tour 12 (Paiement modifié, écran suivant non suivi). | Lignes « Place · jeu. 19 nov. 4,99 € », « Bloc d’escalade 12 € », « Total 16,99 € » ; « Si la sortie n’a pas lieu : place et bloc remboursés automatiquement » ; règle check-facts Paiement → Paiement-ok. |
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
| `V5-Tarifs` | 9 | « 1re sortie offerte · Aucune carte demandée » : faux pour une 1re sortie d’activité, et c’est l’hypothèse « 2 places sur 5 offertes » sans friction du modèle qui change (la 1re sortie d’atelier coûte 25 € et une carte). | Tarifs corrigé ; business-model : conversion de la 1re sortie séparée bar (0 €, sans carte) / activité (carte + prix), à mesurer au test. |
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
| `V5-Ville-bordeaux` | 10 | Rien. | — |
| `V5-Ville-nantes` | 10 | Rien. | — |
| `V5-Welcome` | 10 | Rien. | — |
| `W-Ange` | 10 | Rien. | — |
| `W-Ange-aide` | 10 | Rien. | — |
| `W-Repondre` | 10 | Rien. | — |

Aucun écran BLOQUANT.

## Les 3 changements qui feraient monter ma note

1. Chiffrer les frais de paiement de la part activité (atelier ≈ 2,38 €, bloc ≈ 1,40 €, five ≈ 1,18 € par sortie) avec une part de sorties à activité, puis recalculer contribution et point mort.
2. Écrire le statut fiscal du flux activité (encaissement au nom et pour le compte du lieu, hors chiffre d’affaires Blowy) et l’aligner sur « TTC reversé » (spec) / « (HT) » (contrat).
3. Conversion de la 1re sortie séparée bar / activité (carte requise) ; Tarifs et reçus à 16,99 € alignés.

## Je mets 10 si…

Documents : 10 quand business-model chiffre les frais de la part activité dans la contribution (ou les fait porter au lieu, écrit au contrat), donne le point mort recalculé et écrit le statut TVA du flux activité. Terrain à part (inchangé).

## À part : ce qui relève du test terrain (ne retient pas le 10)

- ≥ 40 % de 2e sortie payante sous 21 jours ; ≥ 25 % d'actifs à M2.
- ≥ 0,3 inscrit vérifié par sortie vécue ; contribution positive après astreinte réelle.
- Taux réel de sorties tombées à 18 h par ville ; avis juridique écrit sur Blowy+ via Stripe.
