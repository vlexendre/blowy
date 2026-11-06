# Jury tour 11 — `patron-bar`

**Verdict.** Le prix de l’activité est affiché (atelier 25 €, five 9 €, bloc 12 €) et le contrat a sa variante « Lieu d’activité ». Mais l’article 1 garde « Aucune animation » face à un atelier « Encadré par le lieu », un no-show sur une activité payante ne me paie que 4,16 € HT, et la spec ne porte ni le prix ni la variante.

**Note globale : 9/10** (T10 9 → T11 9)

| Compréhension | Charge cognitive | Envie | Vraie rencontre | Sécurité | Viralité | Argent | Finition |
|---|---|---|---|---|---|---|---|
| 10 | 10 | 10 | 10 | 10 | 9 | 9 | 10 |

Vérifications lancées (après le tour 11b, rendus régénérés à 10 h 20) : `check-facts` 107 fichiers, 10 817 vérifications, 0 contradiction ; `a11y-audit` 107 écrans, 1 667 textes, **2 problèmes** sur V5-Signaler (« {{blockMark}} » : case « Bloquer aussi » décochée mesurée comme texte brut, contraste 1,00:1 et « collé au bord » −24 px ; faux positif de l’outil, la case est correcte dans le PNG, mais le README annonce « 0 problème, 1 727 textes, 594 cibles », ce qui n’est plus ce que sort l’audit) ; `overflow.mjs` : 0 signalement (sortie vide, code 0). Chaque point ci-dessous a été vu dans le PNG rendu.

## Mes points du tour 10, vérifiés dans les rendus

- Prix de l’activité sur Sortie-lille, Amorçage, Amorçage-solo (« Atelier : 25 € sur place, à régler au lieu »), Sortie-lyon (« Foot à 5 : 9 € »), Sortie-banlieue (« Bloc : 12 € ») : fait, vu dans les PNG, contrôlé par check-facts (`facts.activitePrix`).
- L-Contrat, article 1 : variante « Lieu d’activité » présente ; « Aucune animation » non levé (voir l’écran).
- Spec révision 8 : §2 (lieu) dit toujours « Consommation non incluse… sans animation » et `activityDetail` n’a pas de prix : le contrat s’appuie sur « le prix affiché dans l’app » que la spec ne définit pas.

## Écran par écran (107)

| Écran | Note | Ce qui empêche le 10 | Correction attendue |
|---|---|---|---|
| `L-Contrat` | 9 | Article 1 : la variante « Lieu d’activité (atelier, salle, terrain) : réserve les places du créneau ; chaque participant règle l’activité sur place, au prix affiché dans l’app, encaissé par le lieu » suit « Aucune animation » sans le lever, alors que Lille dit « Encadré par le lieu ». Article 3 : une place d’atelier réservée et non honorée me rapporte 4,16 € HT (ou 3 €) quand l’atelier vaut 25 € et que j’ai sorti la matière. | Article 1 : « Bar : aucune animation… / Lieu d’activité : l’activité est encadrée par le lieu… ». Article 3 : ligne « Activité réservée non honorée » (règle explicite : due par le participant, ou compensée à N € HT, ou rien, mais écrit). |
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
| `V5-Sortie-banlieue` | 9 | « Bloc : 12 € » : fait. Même gabarit bar : « cartes de questions sur la table », « table Blowy » dans une salle de bloc. | « Pendant » et « Tu arrives » propres à la salle de bloc. |
| `V5-Sortie-complete` | 10 | Rien. | — |
| `V5-Sortie-inscrit` | 10 | Rien. | — |
| `V5-Sortie-lille` | 10 | Rien. | — |
| `V5-Sortie-lyon` | 9 | « Foot à 5 : 9 € sur place, à régler au lieu » : fait. Mais « Pendant : Des cartes de questions sur la table, si vous voulez. Personne n’anime. » et « Tu arrives : table Blowy » sur un five ; ma Confirmation dit « Terrain 2, chevalet orange au bord ». | « Pendant » et « Tu arrives » propres au terrain (comme Lille l’a eu pour l’atelier). |
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

1. Contrat : article 1 en deux variantes exclusives (bar / lieu d’activité) ; article 3 : règle écrite pour une activité réservée non honorée.
2. Spec : `activityDetail` porte le prix et qui l’encaisse (aujourd’hui `{key, label, durationMinutes, ledBy?}`, aucun prix ; §2 dit encore « sans animation, consommation non incluse » pour tous les lieux).
3. Sortie-lyon et Sortie-banlieue : « Pendant » et « Tu arrives » du five et du bloc.

## Je mets 10 si…

Maquettes : 10 quand le contrat ne dit plus « Aucune animation » à un lieu d’activité, qu’une activité réservée non honorée a sa ligne en article 3 (et dans §6.5), que la spec porte le prix de l’activité, et que le five et le bloc ont leur propre « Pendant ». Terrain à part : premier relevé au centime.

## À part : ce qui relève du test terrain (ne retient pas le 10)

- Premier relevé mensuel réel au centime, avec une ligne « Blowy annule » (groupe incomplet).
- Délai réel de rappel quand je presse « Incident en cours ».
- Taux réel de no-show sur un atelier payant et ce qu’en dit le céramiste.
