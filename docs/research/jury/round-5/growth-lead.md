# Jury tour 5 — growth-lead (Growth lead (ex-Hinge, ex-BeReal))

**Verdict** : Les écrans racontent enfin une seule boucle hebdo (lundi 21 h → mercredi 18 h → jeudi → dimanche) avec une carte et un lien à chaque marche, mais la spec que l'équipe va coder dit encore « mardi 12 h », le Duo reste au point de décision et la promesse « partout dès 5 personnes » n'est soutenue par aucun chiffre de densité.

**Note globale : 9/10** (T1 5 · T2 7 · T3 8 · T4 9 · T5 9)

| Critère | Note |
|---|---|
| Compréhension | 9 |
| Charge cognitive | 9 |
| Envie | 9 |
| Vraie rencontre | 8 |
| Sécurité et confiance | 9 |
| Viralité | 9 |
| Argent | 8 |
| Finition visuelle | 8 |

## Suivi de mes reproches du tour 4

- **Une seule heure de proposition (T4 n° 1)** : fait à l'écran (Notifs « lun. 21:00 », Chargement « lundi à 21 h », Sortie-complete « lundi 9 novembre, 21 h ») ; **pas fait dans la spec** (§1 « Mardi 12 h », §7 `outings.compose (mardi 12 h)`).
- **Duo hors du point de décision (T4 n° 2)** : **pas fait** pour Rencontrer (3 options égales au 5/9, 3e tour) ; fait pour Accueil-duo (la sortie passe en tête).
- **Mes cartes, sélecteur, carte « pas d'accord » (T4 n° 3)** : fait : V5-Cartes, « Autres cartes › », « Partager « On était 5 » » sur Apres-aucun. Mes cartes n'a ni aperçu ni lien.
- **Slug ≥ 8** : fait (`m/k7f2qX9w`, `i/r8Tz4wQm2LpV`).
- **Régression** : le lien de partage de la Confirmation est sorti du cadre ; les nouvelles Trouvées (Lyon, Saint-Denis) n'ont pas l'icône de partage de la Trouvée Paris.

## Contrôles

`node design/v5/check-facts.mjs` : 88 fichiers, 4 958 vérifications, 0 contradiction. `a11y-audit.mjs` : 88 écrans, 0 problème, contraste min 4,53:1. Ce qu'ils ne voient pas, vérifié à la main et par `scratchpad/jury-r5-experts/overflow.mjs` (texte hors de l'artboard, plages « nn–nn ans » / heures coupées) : **V5-Confirmation** a son lien « Partager « cette semaine, je sors » » rendu sous le cadre (bas 868 px > 844) et **V5-Toi** coupe « 26– / 29 ans ». check-facts ne compare pas les écrans à `spec-v5.md`, qui est resté en V5.3 (« alignée sur … concept-v5.3 », « Mardi 12 h », Blowy+ « achat intégré via RevenueCat », « 1 duo actif », bandeau « sortie entre amis pour toi » au §3 et au §12 n° 8).

## Écran par écran

| Écran | Note | Ce qui empêche le 10 | Correction attendue |
|---|---|---|---|
| V5-Welcome | 9 | « Une sortie dès 5 personnes, partout » : promesse que V5-Ville-bordeaux (64 vérifiées, il manque 2) dément deux écrans plus loin. | « Une sortie dès 5 personnes sur un même créneau » ; mesurer Welcome → Ville par ville. |
| V5-Ville | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Ville-bordeaux | 8 | « 64 personnes vérifiées » puis « il manque 2 personnes » (Attente) : le visiteur conclut que l'app est vide ou que le problème, c'est lui. | Afficher le compte utile (« 3 personnes sur le samedi après-midi ») ou aucun chiffre. |
| V5-Toi | 8 | « (« 26– / 29 ans ») » coupé à la ligne : premier écran rempli, premier défaut visible. | Plage insécable. |
| V5-Genre | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Pet | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Rencontrer | 7 | 3e tour : « À deux, par écrit » et « Groupe et duo » à égalité avec « En petit groupe » au 5/9. La voie Duo n'amène personne (pas de « venir avec quelqu'un », pas de carte). | Duo proposé après la 1re sortie vécue ; à défaut, A/B sur cet écran et mesure de « venir avec quelqu'un » par réponse. |
| V5-Intention | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Consentement | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Toi-plus | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Dispos | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Eviter | 9 | Bien placé avant la 1re composition ; la demande d'accès aux contacts juste avant la Trouvée est un point de chute à mesurer. | Mesurer la chute à cet écran ; « Non merci » doit rester à égalité. |
| V5-Erreur-age | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Trouvee | 9 | Moment lundi 21 h clair, partage en haut à droite. Mes cartes date cette carte « mercredi » alors qu'elle s'ouvre ici, lundi. | Une seule date de déblocage (lundi) dans Mes cartes. |
| V5-Trouvee-lyon | 8 | Pas d'icône de partage ni « Activité choisie selon le lieu… » : gabarit différent de Paris, justement dans la ville où chaque carte compte double. | Même gabarit que la Trouvée Paris, partage compris. |
| V5-Sortie-lyon | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Confirmation-lyon | 8 | Aucune entrée de partage, pas de « Je connais quelqu'un ici » : la ville d'amorçage n'a pas sa carte du mercredi. | Même bloc que la Confirmation Paris. |
| V5-Trouvee-banlieue | 8 | « Une sortie à 17 min de chez toi » : bon titre pour Saint-Denis ; pas d'icône de partage. | Partage comme à Paris. |
| V5-Sortie | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Team | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Partage-invitation | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Invite | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Compte | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Verif | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Notifs | 9 | « lun. 21:00 » partout à l'écran ; la spec (§1, §7) compose « mardi 12 h » : on testera une heure, on livrera l'autre. | Spec alignée sur lundi 21 h. |
| V5-Sortie-inscrit | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Accueil | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Accueil-discret | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Accueil-duo | 9 | La sortie est en tête (T4 réglé). | — |
| V5-Pause | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Chats | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Groupe | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Groupe-menu | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Attente | 9 | Trois leviers (créneau, carte ville, venir avec quelqu'un) ; « Une seule notification » : bon. | Mesurer le délai « il manque 2 » → sortie vécue. |
| V5-Partage-ville | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Amorcage | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Amorcage-solo | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Sortie-complete | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Sortie-annulee | 9 | « Oui, le 19 » en un tap : la relance est là. | — |
| V5-Affiner | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Affiner-histoire | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Confirmation | 8 | Le lien « Partager « cette semaine, je sors » » est rendu sous le cadre (868 > 844 px) : la carte du mercredi n'a plus d'entrée visible. | Remonter le lien ; la règle d'annulation, déjà passée à 18 h, peut céder sa place. |
| V5-Partage-confirmation | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Revelation | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Partage-checkin | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Ange | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| W-Ange | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| W-Ange-aide | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Checkin | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Checkin-ok | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Souvenir | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Apres | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Apres-resultats | 9 | « Écrire à Léa » en principal : juste. Deux liens côte à côte (« Partager la soirée » / « Ma bande s'agrandit ») pour un même moment. | Un seul : « Ma bande s'agrandit » le dimanche. |
| V5-Partage | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Partage-dimanche | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Apres-aucun | 9 | « Partager « On était 5 » » : la moitié des 1res sorties a enfin sa carte. | — |
| V5-Bande | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Rue | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Duo | 8 | Proposition « Biscuit · N. » sans aucun contexte : le taux de « Dire oui » sera bas, et c'est la seule voie sans invitation. | Mesurer le taux de oui ; garder « Ou viens jeudi en groupe › ». |
| V5-Lien | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Lien-debloque | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-RdvDuo | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Chat | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-RdvDuo-lea | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Oeuf | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Rupture | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Cartes | 8 | Dessiné (ma demande T4), mais 7 pastilles de couleur sans aperçu ni lien ; « Cette semaine, je sors · mercredi » alors que la Trouvée la propose lundi. | Vignettes 9:16, lien visible, date de déblocage juste. |
| V5-Story | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| W-Repondre | 9 | « Et toi, tu sors où ? » après l'envoi : boucle d'acquisition propre, case 18+ ajoutée. | Attribution par slug `m/`. |
| V5-Profil | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Fiche | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Tarifs | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Abonnement | 8 | « Rentable à partir de 3 sorties par mois » pour un produit à 1 sortie par semaine : seuls les très réguliers paient ; part d'abonnés à mesurer. | Mesurer la part d'abonnés et leur fréquence réelle. |
| V5-Paiement | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Paiement-ok | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Reglages | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Confidentialite | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Signaler | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Supprimer | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Chargement | 9 | « Ta proposition arrive lundi à 21 h. » : vrai et rassurant. « là. » seul sur sa ligne. | Insécable « d'ici là ». |
| V5-Erreur-reseau | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Paiement-echec | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Verif-echec | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Notifs-refus | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| V5-Chats-vide | 9 | Écran juste pour la boucle ; rien ne freine le passage à l'étape suivante. | — |
| L-Effectif | 9 | Hors de mon périmètre ; l'effectif fiable à 18 h est ce qui fait revenir les lieux. | — |
| L-Creneaux | 9 | Plafond et tables à deux : la capacité est lisible. | — |
| L-Contrat | 9 | Hors de mon périmètre. | — |

## Les 3 changements qui feraient monter ma note le plus

1. Passer `spec-v5.md` en V5.4 (lundi 21 h au §1 et au §7, 3 duos gratuits, Blowy+ hors achat intégré) : sinon on teste à l'écran une boucle que le code n'aura pas.
2. Duo proposé après la 1re sortie vécue (ou A/B mesuré sur Rencontrer), pour que chaque nouvel inscrit passe d'abord par le canal qui invite.
3. Mes cartes en vignettes avec lien et date de déblocage juste ; entrée de partage visible sur Confirmation (sous le cadre aujourd'hui), Trouvée Lyon, Trouvée Saint-Denis et Confirmation Lyon.

## Je mets 10 si…

Je mets 10 si le test de 8 semaines mesure dans le 11e Welcome → 1re sortie vécue ≥ 25 % et une chute au selfie < 30 %, si chaque sortie vécue produit ≥ 0,3 inscrit vérifié attribué par slug (invitation, lun., mer., jeu., ven., dim., ville, ange, 3 mots), si Bordeaux passe de « il manque 2 » à une sortie vécue en moins de 3 semaines, et si l'heure de la proposition (lundi 21 h) est la même dans la spec, le moteur et les écrans.
