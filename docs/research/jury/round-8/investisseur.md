# investisseur — tour 8

**Verdict** : Écrans et prix sont cohérents et honnêtes ; le modèle économique a un seul point mort mais l'astreinte à 5 min reste dimensionnée à 2 personnes sans justification, et la règle « Blowy annule à 18 h » diverge encore entre écrans/contrat et spec/code.

**Note globale : 9/10**

| Compréhension | Charge cognitive | Envie | Vraie rencontre | Sécurité | Viralité | Argent | Finition |
|---|---|---|---|---|---|---|---|
| 9 | 9 | 9 | 9 | 9 | 9 | 8 | 9 |

Outils lancés : `node design/v5/check-facts.mjs` → 106 fichiers, 8 069 vérifications, 0 contradiction ; `a11y-audit.mjs .local/dc-runtime.js` → 106 écrans, 0 problème, contraste min 4,53:1 (sans le runtime en argument, 2 faux positifs sur `{{blockMark}}` non rendu dans V5-Signaler) ; `tooling/qa/layout/overflow.mjs` → aucun signalement. Ces outils ne voient pas l'erreur de frise de Lille ni la carte « Tu y vas » absente.

## Suivi de mes reproches du tour 7

Réglés depuis T7 (vérifiés) : un seul point mort (≈ 134 sorties/jour, 4,49 € par sortie tous postes) ; table Duo 0 € alignée partout ; Tarifs « 2 × 4,99 € … dès la 3e sortie » ; Abonnement sans HT ; relevé mois civil ; E22 fermé.

## Écran par écran

| Écran | Note | Ce qui empêche le 10 | Correction |
|---|---|---|---|
| V5-Welcome | 10 | — | — |
| V5-Ville | 10 | — | — |
| V5-Ville-bordeaux | 9 | ≈ 60 personnes vérifiées, 3 lieux : le taux d'annulation « Blowy annule » est posé à 2 % national, sans distinguer une ville d'amorçage où il sera bien plus haut. | Sensibilité « Blowy annule » par statut de ville. |
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
| V5-Sortie-lille | 9 | Frise : « Sam. 14 nov. 19 h 30 · La sortie » alors que la carte dit « 15 h – 17 h » et « Comment ça se passe : 15 h » ; check-facts ne l'attrape pas. | Frise « Sam. 14 nov. 15 h · La sortie » ; contrôle check-facts : l'heure du jalon « La sortie » = startsAt. |
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
| V5-Amorcage-solo | 9 | 5 places offertes d'un coup à Lille : le coût d'une ville d'amorçage n'a toujours pas de ligne dans business-model (demandé T7). | Ligne « ville d'amorçage » (lieux, 1res sorties offertes, annulations UNDERSIZED). |
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
| W-Ange-aide | 9 | « en quelques minutes » ([T] 5 min) : business-model garde 2 personnes × 12 h pour toute la France et écrit « au-delà de ≈ 300 sorties simultanées une 3e personne » sans calcul ; or au point mort (134 sorties/jour) presque tout tombe le jeudi 19 h 30 : ≈ 670 personnes à la même heure pour 2 personnes. | Dimensionner l'astreinte sur le pic simultané (taux d'alerte × durée d'un appel), pas sur la journée ; ligne de part d'astreinte des RDV Duo. |
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
| L-Contrat | 9 | Art. 3 promet 3 € HT par place si « Blowy annule … à la confirmation » ; spec §2.6 + code (wasConfirmed) ne paient pas une sortie tombée à 18 h faute de monde ; spec §6.5 donne une autre phrase canonique. | Spec et code alignés sur le contrat (UNDERSIZED compensé), phrase unique. |

## Les 3 changements qui feraient monter ma note

1. business-model : astreinte dimensionnée sur le pic simultané du jeudi soir (pas « 300 sorties simultanées » affirmé), part d'astreinte des RDV Duo, ligne « ville d'amorçage ».
2. Spec §2.6/§6.5 et code alignés sur l'écran et le contrat pour la sortie tombée à 18 h (UNDERSIZED compensé), taux mesuré par ville.
3. Avis juridique écrit sur Blowy+ via Stripe, puis cohorte de 8 semaines publiée.

## Je mets 10 si…

Maquettes et documents : 10 quand spec, contrat et écrans disent la même chose pour la sortie tombée à 18 h et quand business-model justifie l'astreinte à 5 min sur le pic simultané avec les lignes Duo et ville d'amorçage. Terrain (à part, ne bloque pas le 10 maquettes) : ≥ 40 % de 2e sortie payante sous 21 j, ≥ 25 % d'actifs à M2, ≥ 0,3 inscrit vérifié par sortie, contribution positive après astreinte réelle, avis juridique écrit sur Blowy+.
