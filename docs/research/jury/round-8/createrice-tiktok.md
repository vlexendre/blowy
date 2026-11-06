# createrice-tiktok — tour 8

**Verdict** : Toutes les cartes publiques ont maintenant leur vidéo 5 s et un aperçu, 3 mots compris, et je peux partager mes 3 mots seuls ; mais « Tu y vas » en vidéo 1 s est promis et introuvable dans Mes cartes, et l'aperçu ne montre pas ce qui bouge.

**Note globale : 9/10**

| Compréhension | Charge cognitive | Envie | Vraie rencontre | Sécurité | Viralité | Argent | Finition |
|---|---|---|---|---|---|---|---|
| 9 | 9 | 9 | 9 | 9 | 9 | 9 | 9 |

Outils lancés : `node design/v5/check-facts.mjs` → 106 fichiers, 8 069 vérifications, 0 contradiction ; `a11y-audit.mjs .local/dc-runtime.js` → 106 écrans, 0 problème, contraste min 4,53:1 (sans le runtime en argument, 2 faux positifs sur `{{blockMark}}` non rendu dans V5-Signaler) ; `tooling/qa/layout/overflow.mjs` → aucun signalement. Ces outils ne voient pas l'erreur de frise de Lille ni la carte « Tu y vas » absente.

## Suivi de mes reproches du tour 7

Réglés depuis T7 (vérifiés) : aperçu 5 s sur les 7 cartes animables et sur 3 mots ; Mes cartes « Les cartes marquées vidéo » + pastilles ; Story avec « Vidéo 5 s » ; « Partager mes 3 mots, seuls » dans le chat ; Les visages sans lien de partage ; Souvenir : vote d'abord.

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
| V5-Sortie-inscrit | 8 | « Nino qui coche, en vidéo 1 s : dans Mes cartes » : Mes cartes (V5-Cartes) n'a que 9 cartes, aucune « Tu y vas ». Promesse non tenue à l'écran (README E13 la dit faite). | Ajouter la 10e miniature « Tu y vas » (vidéo 1 s, pastille vidéo, son slug) dans Mes cartes, ou retirer la phrase. |
| V5-Accueil | 10 | — | — |
| V5-Accueil-discret | 10 | — | — |
| V5-Accueil-duo | 10 | — | — |
| V5-Pause | 10 | — | — |
| V5-Chats | 10 | — | — |
| V5-Groupe | 10 | — | — |
| V5-Groupe-menu | 10 | — | — |
| V5-Attente | 10 | — | — |
| V5-Partage-ville | 9 | Aperçu en 3 vignettes (0 s / 2,5 s / 5 s) : les trois images sont presque identiques (seule l'opacité de l'icône change) ; je ne vois pas ce qui bouge en 5 s. | Vignettes qui montrent le mouvement réel (entrée du titre, pets, lien), ou aperçu en boucle plein écran au tap. |
| V5-Amorcage | 10 | — | — |
| V5-Amorcage-solo | 10 | — | — |
| V5-Sortie-complete | 10 | — | — |
| V5-Sortie-annulee | 10 | — | — |
| V5-Affiner | 10 | — | — |
| V5-Affiner-histoire | 10 | — | — |
| V5-Affiner-age | 10 | — | — |
| V5-Affiner-ambiance | 10 | — | — |
| V5-Confirmation | 10 | — | — |
| V5-Partage-confirmation | 9 | Aperçu en 3 vignettes (0 s / 2,5 s / 5 s) : les trois images sont presque identiques (seule l'opacité de l'icône change) ; je ne vois pas ce qui bouge en 5 s. | Vignettes qui montrent le mouvement réel (entrée du titre, pets, lien), ou aperçu en boucle plein écran au tap. |
| V5-Revelation | 10 | — | — |
| V5-Partage-checkin | 9 | Aperçu en 3 vignettes (0 s / 2,5 s / 5 s) : les trois images sont presque identiques (seule l'opacité de l'icône change) ; je ne vois pas ce qui bouge en 5 s. | Vignettes qui montrent le mouvement réel (entrée du titre, pets, lien), ou aperçu en boucle plein écran au tap. |
| V5-Ange | 10 | — | — |
| W-Ange | 10 | — | — |
| W-Ange-aide | 10 | — | — |
| V5-Checkin | 10 | — | — |
| V5-Checkin-ok | 10 | — | — |
| V5-Souvenir | 10 | — | — |
| V5-Apres | 10 | — | — |
| V5-Apres-resultats | 10 | — | — |
| V5-Partage-jeudi | 9 | Aperçu en 3 vignettes (0 s / 2,5 s / 5 s) : les trois images sont presque identiques (seule l'opacité de l'icône change) ; je ne vois pas ce qui bouge en 5 s. | Vignettes qui montrent le mouvement réel (entrée du titre, pets, lien), ou aperçu en boucle plein écran au tap. |
| V5-Partage | 9 | Aperçu en 3 vignettes (0 s / 2,5 s / 5 s) : les trois images sont presque identiques (seule l'opacité de l'icône change) ; je ne vois pas ce qui bouge en 5 s. | Vignettes qui montrent le mouvement réel (entrée du titre, pets, lien), ou aperçu en boucle plein écran au tap. |
| V5-Partage-dimanche | 9 | Aperçu en 3 vignettes (0 s / 2,5 s / 5 s) : les trois images sont presque identiques (seule l'opacité de l'icône change) ; je ne vois pas ce qui bouge en 5 s. | Vignettes qui montrent le mouvement réel (entrée du titre, pets, lien), ou aperçu en boucle plein écran au tap. |
| V5-Apres-aucun | 10 | — | — |
| V5-Bande | 10 | — | — |
| V5-Partage-bande | 9 | Aperçu en 3 vignettes (0 s / 2,5 s / 5 s) : les trois images sont presque identiques (seule l'opacité de l'icône change) ; je ne vois pas ce qui bouge en 5 s. | Vignettes qui montrent le mouvement réel (entrée du titre, pets, lien), ou aperçu en boucle plein écran au tap. |
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
| V5-Cartes | 9 | « Nino qui coche, en vidéo 1 s : dans Mes cartes » : Mes cartes (V5-Cartes) n'a que 9 cartes, aucune « Tu y vas ». Promesse non tenue à l'écran (README E13 la dit faite). | Ajouter la 10e miniature « Tu y vas » (vidéo 1 s, pastille vidéo, son slug) dans Mes cartes, ou retirer la phrase. |
| V5-Story | 9 | Aperçu en 3 vignettes (0 s / 2,5 s / 5 s) : les trois images sont presque identiques (seule l'opacité de l'icône change) ; je ne vois pas ce qui bouge en 5 s. | Vignettes qui montrent le mouvement réel (entrée du titre, pets, lien), ou aperçu en boucle plein écran au tap. |
| W-Repondre | 9 | « Alex aimerait savoir comment ses proches décrivent Alex » : répétition maladroite sur la page d'entrée virale. | « Alex aimerait savoir comment ses proches le décrivent ». |
| V5-Profil | 10 | — | — |
| V5-Fiche | 10 | — | — |
| V5-Tarifs | 10 | — | — |
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
| L-Effectif | 10 | — | — |
| L-Creneaux | 10 | — | — |
| L-Contrat | 10 | — | — |

## Les 3 changements qui feraient monter ma note

1. Carte « Tu y vas » (vidéo 1 s, Nino qui coche) réellement présente dans Mes cartes, avec pastille vidéo et son lien.
2. Aperçu vidéo qui montre le mouvement (vignettes différentes ou boucle plein écran au tap) : aujourd'hui 0 s / 2,5 s / 5 s se ressemblent.
3. W-Repondre : « comment ses proches le décrivent » (la page que mes abonnés ouvrent).

## Je mets 10 si…

Maquettes : 10 quand « Tu y vas » est dans Mes cartes et que l'aperçu montre l'animation réelle. Rien de terrain dans ma condition. Faits : cartes distinctes, vidéo sur 3 mots, pastilles vidéo, partage retiré des visages, « Partager mes 3 mots, seuls ».
