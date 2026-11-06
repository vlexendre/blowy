# Jury tour 11 — `ux-cognitif`

**Verdict.** Attente, Abonnement et les lignes de « Qui voit quoi » sont faits. Restent : le prix de l’activité rangé sous « Quand tu veux » au lieu de la ligne prix, le gabarit « table et cartes » sur le foot et le bloc, deux rangées de Confidentialité encore collées à leurs bords, et la rangée « Ton groupe » qui ne suit plus le chat du tour 11b.

**Note globale : 9/10** (T10 9 → T11 9)

| Compréhension | Charge cognitive | Envie | Vraie rencontre | Sécurité | Viralité | Argent | Finition |
|---|---|---|---|---|---|---|---|
| 10 | 9 | 10 | 10 | 10 | 10 | 9 | 9 |

Vérifications lancées (après le tour 11b, rendus régénérés à 10 h 20) : `check-facts` 107 fichiers, 10 817 vérifications, 0 contradiction ; `a11y-audit` 107 écrans, 1 667 textes, **2 problèmes** sur V5-Signaler (« {{blockMark}} » : case « Bloquer aussi » décochée mesurée comme texte brut, contraste 1,00:1 et « collé au bord » −24 px ; faux positif de l’outil, la case est correcte dans le PNG, mais le README annonce « 0 problème, 1 727 textes, 594 cibles », ce qui n’est plus ce que sort l’audit) ; `overflow.mjs` : 0 signalement (sortie vide, code 0). Chaque point ci-dessous a été vu dans le PNG rendu.

## Mes points du tour 10, vérifiés dans les rendus

- V5-Attente : « POUR SORTIR PLUS TÔT » : fait.
- V5-Abonnement : « intéressant dès la 3e sortie du mois » une seule fois (rangée Blowy+ retirée) : fait.
- V5-Confidentialite, « Qui voit quoi » : 13 à 26 pt d’air au-dessus et au-dessous du texte de chaque rangée : fait ; les cartes plus bas, non (voir l’écran).
- Prix de l’atelier : présent (« Atelier : 25 € sur place, à régler au lieu »), mais pas là où je le demandais (ligne prix sous « JE VIENS »).

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
| `V5-Amorcage` | 9 | Le prix de l’activité est dans la rangée « Quand tu veux » (« Tu pars quand tu veux. Atelier : 25 € sur place, à régler au lieu. Chacun paie ce qu’il boit. ») : un coût rangé sous l’heure de départ ; la ligne prix sous « JE VIENS » dit seulement « Offerte (ta 1re sortie) · ensuite 4,99 € », ce qu’on retient comme « gratuit ». | Ligne prix sous « JE VIENS » : « Offerte (ta 1re sortie) · Atelier 25 € sur place » ; la rangée « Quand tu veux » garde « Tu pars quand tu veux. Chacun paie ce qu’il boit. » |
| `V5-Amorcage-solo` | 9 | Le prix de l’activité est dans la rangée « Quand tu veux » (« Tu pars quand tu veux. Atelier : 25 € sur place, à régler au lieu. Chacun paie ce qu’il boit. ») : un coût rangé sous l’heure de départ ; la ligne prix sous « JE VIENS » dit seulement « Offerte (ta 1re sortie) · ensuite 4,99 € », ce qu’on retient comme « gratuit ». | Ligne prix sous « JE VIENS » : « Offerte (ta 1re sortie) · Atelier 25 € sur place » ; la rangée « Quand tu veux » garde « Tu pars quand tu veux. Chacun paie ce qu’il boit. » |
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
| `V5-Confidentialite` | 9 | « Qui voit quoi » corrigé (10 pt). Mais deux autres rangées restent collées : « Mode discret » (encre à 3 pt du haut de carte, « « Rappel » » à 1 pt du filet, mesuré dans le PNG : y 1864 / 1984, filet 1986) et « Accord donné le lundi 9 novembre » (4 pt du haut, 3 pt du filet). Et « Ton groupe : prénom, pronom, tranche d’âge, pet… ; le lieu la veille 18 h » met le prénom avant le pet, alors que Groupe et Chats (tour 11b) ne montrent que les pets avant la Confirmation (spec §3.1). | padding 10 pt sur toutes les rangées de cartes (Réglages, Données sensibles), contrôle a11y étendu au haut de carte ; « Ton groupe : pet, nombre de femmes et d’hommes ; prénom et lieu la veille 18 h ; visages le jour J, 3 h avant ». |
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
| `V5-Sortie-banlieue` | 9 | Bloc : 12 € rangé sous « Quand tu veux » ; « Pendant » dit « Des cartes de questions sur la table… Personne n’anime » dans une salle de bloc, et « Tu arrives : table Blowy ». | Prix dans la ligne sous « JE VIENS » ; « Pendant » propre au bloc ; point d’arrivée réel de la salle (« accueil, chevalet orange »). |
| `V5-Sortie-complete` | 10 | Rien. | — |
| `V5-Sortie-inscrit` | 10 | Rien. | — |
| `V5-Sortie-lille` | 9 | Le prix de l’activité est dans la rangée « Quand tu veux » (« Tu pars quand tu veux. Atelier : 25 € sur place, à régler au lieu. Chacun paie ce qu’il boit. ») : un coût rangé sous l’heure de départ ; la ligne prix sous « JE VIENS » dit seulement « Offerte (ta 1re sortie) · ensuite 4,99 € », ce qu’on retient comme « gratuit ». | Ligne prix sous « JE VIENS » : « Offerte (ta 1re sortie) · Atelier 25 € sur place » ; la rangée « Quand tu veux » garde « Tu pars quand tu veux. Chacun paie ce qu’il boit. » |
| `V5-Sortie-lyon` | 9 | Foot à 5 : 9 € rangé sous « Quand tu veux » : en plus du prix mal rangé, « Pendant » dit « Des cartes de questions sur la table, si vous voulez. Personne n’anime. » et « 19 h 30 » « table Blowy » ; la Confirmation de Lyon dit « Terrain 2, chevalet orange au bord ». Deux vocabulaires pour le même lieu. | Prix dans la ligne sous « JE VIENS » ; « Pendant » propre au five (« Le match se joue sur le terrain du lieu ») ; « Tu arrives : terrain, chevalet orange au bord », comme la Confirmation. |
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
| `V5-Ville-bordeaux` | 10 | Rien. | — |
| `V5-Ville-nantes` | 10 | Rien. | — |
| `V5-Welcome` | 10 | Rien. | — |
| `W-Ange` | 10 | Rien. | — |
| `W-Ange-aide` | 10 | Rien. | — |
| `W-Repondre` | 10 | Rien. | — |

Aucun écran BLOQUANT.

## Les 3 changements qui feraient monter ma note

1. Prix de l’activité dans la ligne sous « JE VIENS » (5 écrans), plus sous « Quand tu veux ».
2. Confidentialité : marges des rangées « Mode discret » et « Accord donné » ; « Ton groupe » aligné sur §3.1.
3. Sortie-lyon et Sortie-banlieue : « Pendant » et « Tu arrives » propres au five et au bloc.

## Je mets 10 si…

Maquettes : 10 quand ces trois points sont vus dans les PNG. Terrain à part : 2e test des 5 secondes (Chats, Chargement, Les visages, Duo).

## À part : ce qui relève du test terrain (ne retient pas le 10)

- 2e test des 5 secondes sur Chats, Chargement, Les visages et Duo.
- Test de compréhension de la règle d'annulation (3 sorties distinctes) sur 10 personnes.
- Sur 10 personnes, après Sortie-lille : « combien vas-tu payer samedi ? » (attendu : 0 € Blowy + 25 € d’atelier).
