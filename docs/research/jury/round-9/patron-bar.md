# patron-bar — tour 9

**Verdict** : Mon contrat se lit enfin comme un contrat (tableau HT, vouvoiement, annexe) et l'effectif couvre deux semaines ; il reste la phrase de la spec §6.5 qui contredit mon contrat, une ligne d'effectif contradictoire et un atelier traité comme un bar.

**Note globale : 9/10** (T7 9 → T8 9 → T9 9)

| Compréhension | Charge cognitive | Envie | Vraie rencontre | Sécurité | Viralité | Argent | Finition |
|---|---|---|---|---|---|---|---|
| 10 | 9 | 10 | 10 | 10 | 9 | 9 | 9 |

Évolution par critère (T7 → T8 → T9) : comprehension 9→9→10 · cognitive 9→9→9 · desire 9→9→10 · meet 9→9→10 · safety 9→9→10 · virality 8→8→9 · money 9→9→9 · visual 9→9→9.

Outils lancés : `node design/v5/check-facts.mjs` → 106 fichiers, 9 066 vérifications, 0 contradiction ; `NODE_PATH=$(npm root -g) node design/v5/a11y-audit.mjs .local/dc-runtime.js` → 106 écrans, 1 698 textes, 588 cibles, 0 problème, contraste min 4,53:1 (sans le runtime en argument : 2 faux positifs, contraste 1,00:1 sur un gabarit non rendu, comme au tour 8) ; `node tooling/qa/layout/overflow.mjs` → aucun signalement. Aucun de ces outils ne voit : l'initiale du duo après le double oui, les vignettes d'aperçu (exclues via `data-miniature`), l'ange non sélectionné, les écarts spec/business-model.

## Vérification point par point de mes reproches des tours 7 et 8

Tour 7 : les points de mon rapport T7 étaient réglés au tour 8 (voir round-8/patron-bar.md) et le restent. Tour 8 :

| Point T8 | État au tour 9 |
|---|---|
| F1 Sortie tombée à 18 h payée comme le contrat | réglé dans §2.6 (UNDERSIZED = Blowy annule) et vérifié dans le code (révision 8) ; mais §6.5 garde une autre phrase « identique » et D-079 dit encore « déjà confirmée » |
| F2 Article 3 en tableau HT au vouvoiement | réglé : 5 lignes cas → montant HT, règles client en annexe |
| F3 Effectif semaine suivante | réglé : « Semaine du 16 nov. » ; une ligne du sam. 14 contradictoire |
| F4 Une seule phrase canonique | partiel : écrans = contrat, spec §6.5 non |
| F5 Relevé au centime | terrain |

## Écran par écran

| Écran | Note | Ce qui empêche le 10 | Correction |
|---|---|---|---|
| V5-Welcome | 10 | — | — |
| V5-Ville | 10 | — | — |
| V5-Ville-bordeaux | 10 | — | — |
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
| V5-Sortie-lille | 9 | Atelier céramique (Lille) : « Des cartes de questions sur la table, si vous voulez. Personne n'anime. » et « Chacun paie ce qu'il boit » : gabarit bar collé sur un atelier, qui par nature est animé et ne se paie pas à la boisson ; le contrat dit « Aucune animation ». | Variante « Pendant » par type de lieu : « L'atelier guide la séance ; vous êtes à la même table » ; « Atelier inclus / à régler sur place : N € » ; article 1 du contrat adapté aux ateliers. |
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
| V5-Attente | 10 | — | — |
| V5-Partage-ville | 10 | — | — |
| V5-Amorcage | 9 | Atelier céramique (Lille) : « Des cartes de questions sur la table, si vous voulez. Personne n'anime. » et « Chacun paie ce qu'il boit » : gabarit bar collé sur un atelier, qui par nature est animé et ne se paie pas à la boisson ; le contrat dit « Aucune animation ». | Variante « Pendant » par type de lieu : « L'atelier guide la séance ; vous êtes à la même table » ; « Atelier inclus / à régler sur place : N € » ; article 1 du contrat adapté aux ateliers. |
| V5-Amorcage-solo | 9 | Atelier céramique (Lille) : « Des cartes de questions sur la table, si vous voulez. Personne n'anime. » et « Chacun paie ce qu'il boit » : gabarit bar collé sur un atelier, qui par nature est animé et ne se paie pas à la boisson ; le contrat dit « Aucune animation ». | Variante « Pendant » par type de lieu : « L'atelier guide la séance ; vous êtes à la même table » ; « Atelier inclus / à régler sur place : N € » ; article 1 du contrat adapté aux ateliers. |
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
| W-Ange-aide | 10 | — | — |
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
| V5-RdvDuo | 10 | — | — |
| V5-Chat | 10 | — | — |
| V5-RdvDuo-lea | 10 | — | — |
| V5-Oeuf | 10 | — | — |
| V5-Rupture | 10 | — | — |
| V5-Cartes | 10 | — | — |
| V5-Story | 10 | — | — |
| W-Repondre | 10 | — | — |
| V5-Profil | 10 | — | — |
| V5-Fiche | 10 | — | — |
| V5-Tarifs | 9 | Écran, Tarifs et contrat disent « Sortie annulée par Blowy à la confirmation ou après : chaque place réservée est compensée au lieu par Blowy. » ; la spec §6.5 impose encore « Si Blowy annule une sortie confirmée, le lieu reçoit 3 € par place réservée. » comme « formulation identique côté client, contrat et relevé », et D-079 (§2.6) dit « déjà confirmée … Avant la confirmation : 0 € ». D-087 citée en §2.6 n'existe ni en §12 ni dans docs/decisions.md ; §13 n'a pas de révision 8. | §6.5 reprend la phrase de facts.tarifsContrat ; D-079 dit « à la confirmation ou après (groupe incomplet compris) » ; D-087 ajoutée en §12 et ligne V5.8 en §13. |
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
| L-Effectif | 9 | « sam. 14 nov. 15 h · aucune table » puis « sam. 14 nov. 15 h · table de 2 · 1 rendez-vous Duo » : deux lignes contradictoires pour le même créneau. | Une ligne par créneau : « sam. 14 nov. 15 h · table de 5 : aucune · table de 2 : 1 rendez-vous Duo ». |
| L-Creneaux | 10 | — | — |
| L-Contrat | 9 | Écran, Tarifs et contrat disent « Sortie annulée par Blowy à la confirmation ou après : chaque place réservée est compensée au lieu par Blowy. » ; la spec §6.5 impose encore « Si Blowy annule une sortie confirmée, le lieu reçoit 3 € par place réservée. » comme « formulation identique côté client, contrat et relevé », et D-079 (§2.6) dit « déjà confirmée … Avant la confirmation : 0 € ». D-087 citée en §2.6 n'existe ni en §12 ni dans docs/decisions.md ; §13 n'a pas de révision 8. | §6.5 reprend la phrase de facts.tarifsContrat ; D-079 dit « à la confirmation ou après (groupe incomplet compris) » ; D-087 ajoutée en §12 et ligne V5.8 en §13. |

Aucun écran BLOQUANT.

## Les 3 changements qui feraient monter ma note

1. Spec §6.5 : remplacer la phrase par celle du contrat et des écrans, D-079 « à la confirmation ou après (groupe incomplet compris) », D-087 écrite en §12.
2. L-Effectif : une ligne par créneau (sam. 14 nov. 15 h : table de 5 aucune, table de 2 : 1 RDV Duo).
3. Ateliers (Lille) : texte « Pendant » et paiement adaptés, article 1 du contrat valable pour un atelier.

## Je mets 10 si…

Maquettes et spec : 10 quand §6.5 dit mot pour mot ce que dit mon contrat, quand l'effectif n'a qu'une ligne par créneau et quand un atelier n'est plus décrit comme un bar sans animation. Terrain (à part) : premier relevé réel qui retombe au centime sur le contrat, y compris une sortie tombée à 18 h.

## À part : ce qui relève du test terrain (ne retient pas le 10)

- Premier relevé mensuel réel au centime, avec une ligne « Blowy annule » (groupe incomplet).
- Délai réel de rappel quand je presse « Incident en cours ».
