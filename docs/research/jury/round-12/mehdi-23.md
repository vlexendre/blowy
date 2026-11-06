# Jury tour 12 — `mehdi-23`

**Verdict.** Non-régression vérifiée dans les PNG sur les écrans du tour 12 (Sortie-lille, Sortie-lyon, Sortie-banlieue, Amorçage, Amorçage-solo, Trouvée*, Paiement, Paiement-ok, Paiement-echec, Confidentialité, L-Contrat, L-Effectif, Supprimer, Ville) et mon parcours (Saint-Denis (Trouvée, Sortie, Lieu confirmé)) : une régression précise, V5-Paiement-ok et V5-Paiement-echec disent 4,99 € pour la place du jeu. 19 nov. que V5-Paiement (tour 12) facture 16,99 € (place + bloc 12 €) ; et sur mon parcours : `V5-Confirmation-banlieue`, `V5-Trouvee-banlieue` (voir les écrans). Je passe à 9 tant que ce n’est pas corrigé.

**Note globale : 9/10** (T11 10 → T12 9)

| Compréhension | Charge cognitive | Envie | Vraie rencontre | Sécurité | Viralité | Argent | Finition |
|---|---|---|---|---|---|---|---|
| 10 | 10 | 10 | 10 | 10 | 9 | 9 | 10 |

Vérifications lancées (rendus régénérés à 10 h 53, après le tour 12) : `check-facts` 107 fichiers, 10 945 vérifications, 0 contradiction ; `a11y-audit` 107 écrans, 1 733 textes, 594 cibles, 1 818 blocs mesurés, **0 problème**, contraste minimum 4,53:1 (le faux positif « {{blockMark}} » de V5-Signaler a disparu ; le README est conforme) ; `overflow.mjs` : 0 signalement (code 0). Limite constatée : check-facts contrôle le récapitulatif de V5-Paiement (16,99 €) mais pas V5-Paiement-ok ni V5-Paiement-echec, qui disent encore 4,99 € (voir les écrans). Chaque point ci-dessous a été vu dans le PNG rendu.

## Non-régression du tour 12, vue dans les rendus

- Sortie-banlieue : « à l’accueil de la salle, chevalet orange ; chaussons prêtés », « Bloc en groupe, sur les voies faciles », « Place offerte (ta 1re sortie) + bloc 12 € » : ma remarque du tour 11 est réglée.
- Mais Lieu confirmé dit toujours « Table Blowy, chevalet orange » chez Bloc Station : la veille, je ne sais plus où aller. Et Trouvée-banlieue dit « offerte » sans les 12 €.
- Régression : V5-Paiement-ok et V5-Paiement-echec disent 4,99 € pour la place du jeu. 19 nov. que V5-Paiement (tour 12) facture 16,99 € (place + bloc 12 €) (« Place · jeu. 19 nov. 4,99 € » ; « Ta banque a refusé le paiement de 4,99 € »).

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
| `V5-Trouvee-banlieue` | 9 | « Ta 1re sortie est offerte. » seul, alors que la Sortie de Saint-Denis affiche sous « Je viens » « Place offerte (ta 1re sortie) + bloc 12 € » et que ce montant est désormais débité dans l’app : le 1er écran laisse croire à 0 €. | « Ta 1re sortie est offerte (+ bloc 12 €, payé dans l’app) » sous la date, même formule que la Sortie. |
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

1. Paiement-ok et Paiement-echec à 16,99 € (place + bloc), avec une règle check-facts qui relie les trois écrans du paiement.
2. Lieu confirmé de Saint-Denis : « À l’accueil de la salle, chevalet orange », comme la Sortie.
3. Trouvée : « Ta 1re sortie est offerte (+ activité N €, payé dans l’app) ».

## Je mets 10 si…

Maquettes : 10 dès que Paiement-ok / Paiement-echec disent 16,99 € et que V5-Confirmation-banlieue, V5-Trouvee-banlieue sont corrigés comme indiqué.

## À part : ce qui relève du test terrain (ne retient pas le 10)

Rien de nouveau.
