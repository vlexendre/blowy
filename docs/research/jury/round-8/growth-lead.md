# growth-lead — tour 8

**Verdict** : La boucle (inviter, venir avec, cartes à lien, parrainage, ange, 3 mots) est complète et honnête ; il reste trois promesses d'écran que le moteur ne tient pas (Attente, Tu y vas, Lyon).

**Note globale : 9/10**

| Compréhension | Charge cognitive | Envie | Vraie rencontre | Sécurité | Viralité | Argent | Finition |
|---|---|---|---|---|---|---|---|
| 9 | 9 | 9 | 9 | 9 | 9 | 9 | 9 |

Outils lancés : `node design/v5/check-facts.mjs` → 106 fichiers, 8 069 vérifications, 0 contradiction ; `a11y-audit.mjs .local/dc-runtime.js` → 106 écrans, 0 problème, contraste min 4,53:1 (sans le runtime en argument, 2 faux positifs sur `{{blockMark}}` non rendu dans V5-Signaler) ; `tooling/qa/layout/overflow.mjs` → aucun signalement. Ces outils ne voient pas l'erreur de frise de Lille ni la carte « Tu y vas » absente.

## Suivi de mes reproches du tour 7

Réglés depuis T7 (vérifiés) : Attente « d'ici le mer. 18 nov. 21 h » ; Pas-encore et Pas-encore-nantes calculés (« réponse le lun. 16 nov. 21 h ») ; Sortie-complete, Sortie-annulee, Apres-aucun « ton créneau … si un groupe se forme » ; Ville-bordeaux « personnes vérifiées » ; Team « Garder sa place 30 min » ; Notifs « Ta sortie de jeudi » ; Cartes phrase juste + pastilles vidéo ; Story en vidéo ; W-Repondre « Alex t'offre ta 1re sortie ». Voie Duo à égalité au 5/9 : choix assumé et argumenté au README, mesuré au test : je ne le compte plus contre le 10.

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
| V5-Trouvee-lyon | 9 | « Ta prochaine sortie à Lyon, le mar. 24 nov. : composée le sam. 21 nov. 21 h » : la date est juste mais « ta prochaine sortie » reste affirmé. | « Ton créneau du mar. 24 nov. : si un groupe se forme, réponse le sam. 21 nov. 21 h ». |
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
| V5-Sortie-inscrit | 8 | « Nino qui coche, en vidéo 1 s : dans Mes cartes » : Mes cartes (V5-Cartes) n'a que 9 cartes, aucune « Tu y vas ». Promesse non tenue à l'écran (README E13 la dit faite). | Ajouter la 10e miniature « Tu y vas » (vidéo 1 s, pastille vidéo, son slug) dans Mes cartes, ou retirer la phrase. |
| V5-Accueil | 10 | — | — |
| V5-Accueil-discret | 10 | — | — |
| V5-Accueil-duo | 10 | — | — |
| V5-Pause | 10 | — | — |
| V5-Chats | 10 | — | — |
| V5-Groupe | 10 | — | — |
| V5-Groupe-menu | 10 | — | — |
| V5-Attente | 8 | « Ajouter un créneau · Avec le vendredi soir, une sortie a lieu le ven. 13 nov., 20 h » et « Sinon, Nino te propose le sam. 28 nov. » : deux sorties promises avant leur composition (mar. 10 nov. 21 h, mer. 25 nov. 21 h), contraire à concept V5.7 B5. | « Avec le vendredi soir : si un groupe se forme pour le ven. 13 nov., réponse le mar. 10 nov. 21 h » ; « Sinon, ton créneau du sam. 28 nov. reste ouvert : réponse le mer. 25 nov. 21 h ». |
| V5-Partage-ville | 10 | — | — |
| V5-Amorcage | 10 | — | — |
| V5-Amorcage-solo | 10 | — | — |
| V5-Sortie-complete | 10 | — | — |
| V5-Sortie-annulee | 10 | — | — |
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
| V5-Cartes | 9 | « Nino qui coche, en vidéo 1 s : dans Mes cartes » : Mes cartes (V5-Cartes) n'a que 9 cartes, aucune « Tu y vas ». Promesse non tenue à l'écran (README E13 la dit faite). | Ajouter la 10e miniature « Tu y vas » (vidéo 1 s, pastille vidéo, son slug) dans Mes cartes, ou retirer la phrase. |
| V5-Story | 10 | — | — |
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

1. Attente : remplacer « une sortie a lieu le ven. 13 nov. » et « Nino te propose le sam. 28 nov. » par « si un groupe se forme, réponse le … 21 h » (c'est l'écran qui pousse à inviter).
2. Livrer la carte « Tu y vas » (vidéo 1 s) dans Mes cartes, ou retirer la promesse de Tu y vas.
3. Trouvée-Lyon « ton créneau du mar. 24 nov. : réponse sam. 21 nov. 21 h » ; corriger la frise de Lille (19 h 30 → 15 h) et faire contrôler l'heure du jalon par check-facts.

## Je mets 10 si…

Maquettes : je mets 10 quand Attente et Trouvée-Lyon ne promettent plus aucune sortie avant sa composition, que la carte « Tu y vas » existe dans Mes cartes, et que la frise de Lille dit 15 h. Terrain (noté à part, ne bloque pas le 10 maquettes) : test de 8 semaines avec Welcome → 1re sortie ≥ 25 %, chute au selfie < 30 %, ≥ 0,3 inscrit vérifié par sortie vécue attribué par slug.
