# trust-safety — tour 8

**Verdict** : Mon bloquant historique est fermé : la sortie pour sécurité a un bouton partout où l'on peut partir, remboursée et sans motif ; il reste une mention de fiabilité sans « visible par toi seulement », la règle du prénom en duo écrite deux fois, et l'ange du RDV marseillais non visible.

**Note globale : 9/10**

| Compréhension | Charge cognitive | Envie | Vraie rencontre | Sécurité | Viralité | Argent | Finition |
|---|---|---|---|---|---|---|---|
| 9 | 9 | 9 | 9 | 9 | 9 | 9 | 9 |

Outils lancés : `node design/v5/check-facts.mjs` → 106 fichiers, 8 069 vérifications, 0 contradiction ; `a11y-audit.mjs .local/dc-runtime.js` → 106 écrans, 0 problème, contraste min 4,53:1 (sans le runtime en argument, 2 faux positifs sur `{{blockMark}}` non rendu dans V5-Signaler) ; `tooling/qa/layout/overflow.mjs` → aucun signalement. Ces outils ne voient pas l'erreur de frise de Lille ni la carte « Tu y vas » absente.

## Suivi de mes reproches du tour 7

Réglés depuis T7 (vérifiés sur rendus) : Les visages et Confirmation ont « Je ne viens pas, pour ma sécurité » en tête (rose), puis « Je connais quelqu'un ici » avec « au-delà, c'est une sortie pour ta sécurité, examinée par l'équipe », puis « Imprévu · je ne le sens pas » ; Groupe-menu « Quitter la sortie · sécurité, je connais quelqu'un, imprévu » ; captures « iOS, signalées à l'équipe » ; « Quelqu'un de l'équipe te rappelle en quelques minutes » ([T] safety.helpCallbackTargetMinutes = 5 en spec, D-078) ; W-Ange-aide « la sortie d'Alex », W-Ange « bar partenaire, table Blowy » ; Confidentialité : fiabilité, contacts évités, cartes ; L-Effectif « Incident en cours » ; E22 fermé (spec §11.4) ; contrat nomme sécurité 3 € HT.

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
| V5-Groupe | 9 | « pas de numéro … seulement dans un chat à deux, après vos deux oui » ; en Duo, après les deux oui, V5-Lien bloque encore numéros et liens jusqu'aux visages : « deux oui » désigne deux moments. | « après vos deux oui au vote, ou aux visages en duo ». |
| V5-Groupe-menu | 10 | — | — |
| V5-Attente | 10 | — | — |
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
| V5-Duo | 9 | « le prénom, aux visages » ; spec §2.13 (l. 130) et D-082 : « le prénom apparaît au double oui, pas avant et pas plus tard ». Les titres « Duo avec J. » / « Duo avec K. » après le double oui suivent l'écran, pas la spec : un dev appliquera la spec. | Trancher : spec et D-082 réécrits « prénom aux visages » (ce que disent 5 écrans et Confidentialité), ou écrans alignés sur la spec. |
| V5-Lien | 9 | « numéros … bloqués avant les visages » alors que le chat de groupe promet le numéro « après vos deux oui » (cf. Groupe). | Même règle écrite des deux côtés. |
| V5-Duo-hh-proposition | 9 | « le prénom, aux visages » ; spec §2.13 (l. 130) et D-082 : « le prénom apparaît au double oui, pas avant et pas plus tard ». Les titres « Duo avec J. » / « Duo avec K. » après le double oui suivent l'écran, pas la spec : un dev appliquera la spec. | Trancher : spec et D-082 réécrits « prénom aux visages » (ce que disent 5 écrans et Confidentialité), ou écrans alignés sur la spec. |
| V5-Duo-hh | 10 | — | — |
| V5-Duo-hh-visages | 10 | — | — |
| V5-Duo-hh-rdv | 9 | « Ange gardien au choix, facultatif » sans la liste de contacts (Sam / Maman / Personne) visible sur RdvDuo : à Marseille, on ne voit pas qui est choisi avant « Proposer à Karim ». | Même bloc ange que RdvDuo (choix visible avant d'envoyer). |
| V5-Lien-debloque | 10 | — | — |
| V5-RdvDuo | 10 | — | — |
| V5-Chat | 10 | — | — |
| V5-RdvDuo-lea | 10 | — | — |
| V5-Oeuf | 10 | — | — |
| V5-Rupture | 10 | — | — |
| V5-Cartes | 10 | — | — |
| V5-Story | 10 | — | — |
| W-Repondre | 10 | — | — |
| V5-Profil | 8 | Tuile « 1/1 sortie honorée » sans « visible par toi seulement », alors que concept V5.7 F18 l'exige partout où la fiabilité apparaît (la Fiche le dit, le Profil non). | Sous la tuile : « visible par toi seulement » (ou icône cadenas + libellé). |
| V5-Fiche | 9 | « Venu à 1 sortie sur 1 » : README F16 annonce « la Fiche n'affiche plus N sur M » ; écart doc ↔ écran (mineur, la mention privée est là). | Aligner le README ou le libellé. |
| V5-Tarifs | 10 | — | — |
| V5-Abonnement | 10 | — | — |
| V5-Paiement | 10 | — | — |
| V5-Paiement-ok | 10 | — | — |
| V5-Reglages | 10 | — | — |
| V5-Confidentialite | 9 | Ligne « Ton duo … ton prénom et ton visage aux visages » contredit spec §2.13 / D-082 (prénom au double oui). | Même arbitrage que V5-Duo, une seule version. |
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

1. Profil : « 1/1 sortie honorée » marqué « visible par toi seulement » (F18 dit « partout »).
2. Prénom du duo : spec §2.13 / D-082 et écrans d'accord (le dev suivra la spec et montrera le prénom 48 h avant ce que promettent Confidentialité et V5-Duo).
3. Une seule règle d'échange de numéro (« après vos deux oui » vs « bloqués avant les visages ») et l'ange choisi visible sur Duo-hh-rdv avant d'envoyer.

## Je mets 10 si…

Maquettes : 10 quand chaque affichage de fiabilité dit « visible par toi seulement », quand la règle du prénom en duo et celle du numéro sont identiques en spec et à l'écran, et quand le RDV de Marseille montre l'ange choisi. Terrain (à part) : effectif d'astreinte réellement tenu à 5 min (mesure des rappels pendant le test), écart E31 « reste E » (file d'astreinte) fermé dans le code.
