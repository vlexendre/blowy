# Jury tour 12 — `patron-bar`

**Verdict.** Article 1 en deux variantes (« Bar : … sans animation » / « Lieu d’activité : … encadre l’activité comme d’habitude ; l’activité est prépayée dans l’app avec la place »), ligne activité en article 3, prix dans la spec (`activityDetail.priceCents`) et « Pendant » du five et du bloc : fait. Reste que la ligne activité ne dit ni TTC ni ce qui se passe quand la place est remboursée, que la spec §6.5 ne la recopie pas et garde « TTC par défaut », et que mon Lieu confirmé de salle de bloc dit encore « Table Blowy ».

**Note globale : 9/10** (T11 9 → T12 9)

| Compréhension | Charge cognitive | Envie | Vraie rencontre | Sécurité | Viralité | Argent | Finition |
|---|---|---|---|---|---|---|---|
| 10 | 10 | 10 | 10 | 10 | 9 | 9 | 10 |

Vérifications lancées (rendus régénérés à 10 h 53, après le tour 12) : `check-facts` 107 fichiers, 10 945 vérifications, 0 contradiction ; `a11y-audit` 107 écrans, 1 733 textes, 594 cibles, 1 818 blocs mesurés, **0 problème**, contraste minimum 4,53:1 (le faux positif « {{blockMark}} » de V5-Signaler a disparu ; le README est conforme) ; `overflow.mjs` : 0 signalement (code 0). Limite constatée : check-facts contrôle le récapitulatif de V5-Paiement (16,99 €) mais pas V5-Paiement-ok ni V5-Paiement-echec, qui disent encore 4,99 € (voir les écrans). Chaque point ci-dessous a été vu dans le PNG rendu.

## Mes points du tour 11, vérifiés dans les rendus et la spec

- L-Contrat, article 1 : « Bar : réserve une table « Blowy » … sans animation » / « Lieu d’activité (atelier, salle, terrain) : réserve les places du créneau et encadre l’activité comme d’habitude » : fait, « Aucune animation » ne s’applique plus au lieu d’activité.
- L-Contrat, article 3 : « Activité prépayée, place confirmée, honorée ou non — son prix, reversé en totalité (HT) » : ligne présente. Mais « (HT) » contredit spec §6.5 (« TTC reversé par défaut ; HT si le contrat le prévoit ») sans donner le montant : pour un atelier affiché 25 €, je touche 25 € ou 20,83 € ? Et la ligne ne dit pas « rien pour une place remboursée » : juste sous « Blowy annule … 3 € HT par place réservée », je lis 3 € + 25 €, alors que la spec dit « jamais pour une place remboursée ».
- Spec : `activityDetail.priceCents` (§7.5, V5.10) et `Venue.activityPriceCents` : fait. Mais §6.5 dit toujours « à ajouter à l’article 3 du contrat par le designer, texte non recopié ici tant qu’il n’existe pas » (il existe), E34 « reste : … texte du contrat (designer) », et §2 (Lieu) dit encore pour tous les lieux « Le lieu reçoit un groupe … sans animation ».
- V5-Sortie-lyon et V5-Sortie-banlieue : « Pendant » et « Tu arrives » propres au five et au bloc : fait. V5-Confirmation-banlieue (« Table Blowy, chevalet orange » chez Bloc Station) n’a pas suivi.

## Écran par écran (107)

| Écran | Note | Ce qui empêche le 10 | Correction attendue |
|---|---|---|---|
| `L-Contrat` | 9 | Article 3, « Activité prépayée, place confirmée, honorée ou non — son prix, reversé en totalité (HT) » : « HT » sans montant alors que la spec §6.5 reverse le TTC par défaut (atelier 25 € : 25 € ou 20,83 € ?) ; rien n’exclut la place remboursée, et la ligne « Blowy annule … 3 € HT par place réservée » juste au-dessus laisse lire 3 € + le prix de l’activité. | « Activité prépayée : son prix TTC affiché dans l’app (ex. atelier 25 €), reversé en totalité pour chaque place confirmée non remboursée (présence, absence, imprévu) ; place remboursée (sécurité, Blowy annule) : rien au titre de l’activité » ; même texte recopié mot pour mot en spec §6.5. |
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
| `V5-Confirmation-banlieue` | 9 | « Table Blowy, chevalet orange » sous Bloc Station, alors que V5-Sortie-banlieue (tour 12) dit « Tu arrives : à l’accueil de la salle, chevalet orange ; chaussons prêtés ». Deux points de rendez-vous pour la même sortie ; Lyon, lui, est aligné (« Terrain 2, chevalet orange au bord »). | « À l’accueil de la salle, chevalet orange » sur Lieu confirmé, comme la Sortie ; « table Blowy » réservé aux bars (règle check-facts). |
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

1. Article 3 : la ligne activité en TTC chiffré (« ex. atelier 25 € ») et « rien au titre de l’activité pour une place remboursée ».
2. Spec : §6.5 recopie la nouvelle ligne mot pour mot et aligne le régime (TTC ou HT) sur le contrat ; E34 fermé côté contrat ; §2 « sans animation » limité aux bars.
3. Lieu confirmé de la salle de bloc : « À l’accueil de la salle, chevalet orange » comme la Sortie ; Paiement-ok / -echec à 16,99 €.

## Je mets 10 si…

Maquettes et spec : 10 quand l’article 3 dit TTC (ou HT) avec un exemple chiffré et exclut la place remboursée, que §6.5 le recopie mot pour mot avec le même régime, que §2 ne dit plus « sans animation » aux lieux d’activité, et que Lieu confirmé de Saint-Denis dit « accueil de la salle ». Terrain à part : premier relevé au centime avec une ligne « activités ».

## À part : ce qui relève du test terrain (ne retient pas le 10)

- Premier relevé mensuel réel au centime, avec une ligne « Blowy annule » (groupe incomplet).
- Délai réel de rappel quand je presse « Incident en cours ».
- Taux réel de no-show sur un atelier payant et ce qu’en dit le céramiste.
