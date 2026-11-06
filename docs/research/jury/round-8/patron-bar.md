# patron-bar — tour 8

**Verdict** : Mon espace lieu est presque celui que je signerais : mois civil, toute la semaine, message d'accueil visible du client ; mais une sortie tombée à 18 h est payée dans mon contrat et pas dans la spec, et l'article 3 est un pavé au tutoiement.

**Note globale : 9/10**

| Compréhension | Charge cognitive | Envie | Vraie rencontre | Sécurité | Viralité | Argent | Finition |
|---|---|---|---|---|---|---|---|
| 9 | 9 | 9 | 9 | 9 | 8 | 9 | 9 |

Outils lancés : `node design/v5/check-facts.mjs` → 106 fichiers, 8 069 vérifications, 0 contradiction ; `a11y-audit.mjs .local/dc-runtime.js` → 106 écrans, 0 problème, contraste min 4,53:1 (sans le runtime en argument, 2 faux positifs sur `{{blockMark}}` non rendu dans V5-Signaler) ; `tooling/qa/layout/overflow.mjs` → aucun signalement. Ces outils ne voient pas l'erreur de frise de Lille ni la carte « Tu y vas » absente.

## Suivi de mes reproches du tour 7

Réglés depuis T7 (vérifiés) : relevé « 1er – 30 nov. » avec mar. 3 et jeu. 5 nov. ; effectif sur mar., jeu., sam., table de 2 et dim. ; message d'accueil sur chaque Confirmation (Paris, Lyon, Saint-Denis) et annoncé dans le chat ; « Vos participants le voient sur Lieu confirmé » ; « Incident en cours : quelqu'un de l'équipe vous rappelle en quelques minutes » ; contrat qui nomme sécurité, imprévu, Blowy annule, table Duo 0 € HT sans garantie ; business-model aligné (Duo 0 €). Viralité 8 : rien sur l'écran lieu ne me fait parler de Blowy à un confrère (pas de « recommander à un lieu »), pas un défaut de maquette.

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
| V5-Sortie-lille | 10 | — | — |
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
| V5-Amorcage | 10 | — | — |
| V5-Amorcage-solo | 10 | — | — |
| V5-Sortie-complete | 10 | — | — |
| V5-Sortie-annulee | 9 | « Annulée … à la confirmation : pas assez de participants » + « Sortie annulée par Blowy à la confirmation ou après : chaque place réservée est compensée » ; spec §2.6 : à lockAt avec < 4 → CANCELLED UNDERSIZED (jamais CONFIRMED) et le code exige wasConfirmed : ce cas n'est pas compensé côté spec/code. Et spec §6.5 impose une autre phrase « identique côté client, contrat et relevé » (« Si Blowy annule une sortie confirmée, le lieu reçoit 3 € par place réservée »). | Spec §2.6/§6.5 : UNDERSIZED à lockAt = « Blowy annule » compensé 3 € HT ; phrase canonique unique recopiée en spec ; check-facts compare aussi la spec. |
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
| V5-Tarifs | 9 | Art. 3 promet 3 € HT par place si « Blowy annule … à la confirmation » ; spec §2.6 + code (wasConfirmed) ne paient pas une sortie tombée à 18 h faute de monde ; spec §6.5 donne une autre phrase canonique. | Spec et code alignés sur le contrat (UNDERSIZED compensé), phrase unique. |
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
| L-Effectif | 9 | Spec §10 (D-086) : effectif « semaine en cours et la suivante » ; l'écran ne montre que la semaine du 10 au 15 nov. | Deuxième rangée « semaine du 17 nov. » (places dès la composition). |
| L-Creneaux | 10 | — | — |
| L-Contrat | 8 | Art. 3 recopie les phrases client au tutoiement (« Pour ta sécurité », « sans raison à donner », « place non remboursée ») dans un contrat qui vouvoie le gérant : un bloc de 14 lignes où je dois traduire chaque cas en ce que je touche. | Art. 3 en tableau cas → montant HT (absence/imprévu payée 4,16 ; offerte/Blowy+ 3 ; sécurité et « je connais » 3 ; Blowy annule 3/place ; Duo 0), phrases client en annexe. |

## Les 3 changements qui feraient monter ma note

1. Sortie tombée à 18 h faute de monde : spec §2.6 (UNDERSIZED) et code compensent 3 € HT comme le disent mon contrat et l'écran client ; une seule phrase canonique (spec §6.5 en impose encore une autre).
2. Article 3 en tableau « cas → montant HT », au vouvoiement, phrases client en annexe.
3. Effectif : semaine en cours et suivante, comme la spec §10 le prévoit.

## Je mets 10 si…

Maquettes : 10 quand l'article 3 se lit en tableau HT au vouvoiement, quand l'effectif montre aussi la semaine suivante, et quand spec et code paient la sortie tombée à 18 h comme le contrat. Terrain (à part) : premier relevé réel qui retombe au centime sur le contrat.
