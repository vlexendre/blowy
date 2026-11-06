# Jury tour 6 — ux-cognitif (Chercheuse en UX cognitive)

**Verdict** : La spec est enfin en révision 5, le test des 5 secondes a eu lieu et ses corrections sont à l'écran, les outils voient le hors-cadre : mais une même règle a encore deux versions (sécurité « toujours » / « 1 fois par mois », fiabilité privée / visible, vote sans défaut / « Non par défaut », rendez-vous « quand vous voulez » / « heure couverte ») et Confidentialité n'est pas encore la liste unique.

**Note globale : 9/10** (T1 5 · T2 7 · T3 8 · T4 8 · T5 9 · T6 9)

| Critère | Note |
|---|---|
| Compréhension | 9 |
| Charge cognitive | 8 |
| Envie | 8 |
| Vraie rencontre | 8 |
| Sécurité et confiance | 8 |
| Viralité | 9 |
| Argent | 8 |
| Finition visuelle | 9 |

## Suivi de mes reproches du tour 5

- **Spec en V5.4 (T5 n° 1)** : fait (révision 5). Restent des écarts écran ↔ spec : fiabilité (§3.1, §2.13), vote (§2.11), Blowy+ « dès la 2ᵉ » (§6.2), quartiers (§2.1 D-063 contre Réglages).
- **Liste unique « qui voit quoi »** : Profil renvoie à Confidentialité (fait) ; ligne Groupe complète (fait) ; **manquent les lignes Duo et Ange gardien**, et V5-Ange garde sa propre liste.
- **Défauts T5** : « 26–29 » insécable, « là. », apostrophes, « il » ×2, gabarits Lyon/Saint-Denis, Sortie-complete, Supprimer « tes duos » : faits. **Non faits** : V5-Groupe « sauf entre accords mutuels », V5-Chats-vide « Voir ma proposition ».
- **Outils** : fait (overflow.mjs à 0, contrôles repris dans a11y-audit).
- **Test 5 secondes** : fait (5/5) ; ses corrections sont appliquées sur Sortie, Accueil, Trouvée. **Pas sur Chats** : « Lieu mer. 11 nov. 18 h » sans verbe, l'ambiguïté que 4/5 lecteurs ont eue sur l'Accueil.
- **Nouveau** : règle d'annulation grammaticalement fausse pour la sécurité ; « soirs de sortie » ; Chargement « lundi à 21 h » ; « 28 déc.... ».

## Contrôles

`node design/v5/check-facts.mjs` : 97 fichiers, 6 039 vérifications, 0 contradiction. `a11y-audit.mjs` : 97 écrans, 1 423 textes, 538 cibles, 1 462 blocs mesurés, 0 problème, contraste min 4,53:1. `tooling/qa/layout/overflow.mjs` : aucun signalement (ni texte hors cadre, ni plage coupée). Ce que ces outils ne voient pas, relevé à la main sur les rendus et les sources : (1) la règle d'annulation canonique, présente sur 8 écrans, met « ta sécurité » sous la parenthèse « chacun 1 fois par mois, sans pénalité, place non remboursée », alors que spec §2.7 dit `SAFETY_EXIT` « à tout moment, remboursée » et que V5-Groupe-menu dit « Pour ta sécurité, toujours » ; (2) « les soirs de sortie » subsiste pour le délai d'1 h (V5-Groupe-menu, V5-Signaler) alors que l'astreinte couvre maintenant samedi 15 h, dimanche 11 h et les rendez-vous ; (3) spec révision 5 ≠ écrans sur la fiabilité (§3.1 et §2.13 : visible du groupe et du duo ; V5-Fiche : « Toi seul vois ce chiffre »), le vote (§2.11 « Non par défaut » ; V5-Apres : aucun état), Blowy+ (§6.2 « rentable dès la 2ᵉ sortie » ; V5-Abonnement : « 3 sorties par mois », et 2 × 4,99 = 9,98 < 9,99) ; (4) `business-model.md` est encore titré V5.4 : astreinte « 18 h à 2 h … par soir et par ville », point mort par ville, aucune ligne tables à deux, parrainage, imprévu ni « Blowy annule », alors que concept-v5.5 §D.13 et spec §10.1 renvoient à un calcul national qui n'existe pas ; (5) V5-Chargement promet « lundi à 21 h » quel que soit le créneau (samedi composé le mercredi 21 h, spec §1.1) ; (6) L-Effectif additionne 4,99 € (TTC) et 3 € = 7,99 €, le contrat dit 4,16 € HT, la spec §6.5 un « total HT » ; « par place réservée » (L-Effectif, spec) contre « par place prévue » (L-Contrat, V5-Sortie-annulee) ; (7) V5-Lien : rendez-vous « Quand vous voulez » contre V5-Duo-hh « Dans un lieu partenaire, à une heure couverte par l'équipe » ; (8) V5-Dispos-semaines « 28 déc.... » (quatre points).

## Écran par écran

| Écran | Note | Ce qui empêche le 10 | Correction attendue |
|---|---|---|---|
| V5-Welcome | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Ville | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Ville-bordeaux | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Toi | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Genre | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Pet | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Rencontrer | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Intention | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Consentement | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Toi-plus | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Dispos | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Dispos-semaines | 8 | « Sans toi : 16, 30 nov., 14, 28 déc.... » : quatre points (abréviation + points de suspension). | « 28 déc.… ». |
| V5-Eviter | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Erreur-age | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Trouvee | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Trouvee-lyon | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Sortie-lyon | 8 | « sauf pour ta sécurité, « je connais quelqu'un ici » ou un imprévu (chacun 1 fois par mois, sans pénalité, place non remboursée) » : la parenthèse couvre aussi la sécurité (rationnée, non remboursée), contre spec §2.7 (`SAFETY_EXIT` à tout moment, remboursé) et V5-Groupe-menu (« Pour ta sécurité, toujours »). | Sortir la sécurité de la parenthèse : « Pour ta sécurité : toujours, remboursée, sans pénalité. » puis « je connais quelqu'un ici » (remboursée) et imprévu (non remboursée), 1 fois par mois chacun ; contrôle check-facts. |
| V5-Confirmation-lyon | 8 | « sauf pour ta sécurité, « je connais quelqu'un ici » ou un imprévu (chacun 1 fois par mois, sans pénalité, place non remboursée) » : la parenthèse couvre aussi la sécurité (rationnée, non remboursée), contre spec §2.7 (`SAFETY_EXIT` à tout moment, remboursé) et V5-Groupe-menu (« Pour ta sécurité, toujours »). | Sortir la sécurité de la parenthèse : « Pour ta sécurité : toujours, remboursée, sans pénalité. » puis « je connais quelqu'un ici » (remboursée) et imprévu (non remboursée), 1 fois par mois chacun ; contrôle check-facts. |
| V5-Trouvee-banlieue | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Sortie-banlieue | 8 | « sauf pour ta sécurité, « je connais quelqu'un ici » ou un imprévu (chacun 1 fois par mois, sans pénalité, place non remboursée) » : la parenthèse couvre aussi la sécurité (rationnée, non remboursée), contre spec §2.7 (`SAFETY_EXIT` à tout moment, remboursé) et V5-Groupe-menu (« Pour ta sécurité, toujours »). | Sortir la sécurité de la parenthèse : « Pour ta sécurité : toujours, remboursée, sans pénalité. » puis « je connais quelqu'un ici » (remboursée) et imprévu (non remboursée), 1 fois par mois chacun ; contrôle check-facts. |
| V5-Confirmation-banlieue | 8 | « sauf pour ta sécurité, « je connais quelqu'un ici » ou un imprévu (chacun 1 fois par mois, sans pénalité, place non remboursée) » : la parenthèse couvre aussi la sécurité (rationnée, non remboursée), contre spec §2.7 (`SAFETY_EXIT` à tout moment, remboursé) et V5-Groupe-menu (« Pour ta sécurité, toujours »). | Sortir la sécurité de la parenthèse : « Pour ta sécurité : toujours, remboursée, sans pénalité. » puis « je connais quelqu'un ici » (remboursée) et imprévu (non remboursée), 1 fois par mois chacun ; contrôle check-facts. |
| V5-Pas-encore | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Sortie | 8 | « sauf pour ta sécurité, « je connais quelqu'un ici » ou un imprévu (chacun 1 fois par mois, sans pénalité, place non remboursée) » : la parenthèse couvre aussi la sécurité (rationnée, non remboursée), contre spec §2.7 (`SAFETY_EXIT` à tout moment, remboursé) et V5-Groupe-menu (« Pour ta sécurité, toujours »). Et la ligne « Tom vient avec toi · 3 nouvelles personnes › » répète mot pour mot la phrase du groupe 500 px plus haut. | Sortir la sécurité de la parenthèse : « Pour ta sécurité : toujours, remboursée, sans pénalité. » puis « je connais quelqu'un ici » (remboursée) et imprévu (non remboursée), 1 fois par mois chacun ; contrôle check-facts. Supprimer la ligne redondante. |
| V5-Team | 9 | « GARDER LA PLACE DE TOM (30 MIN) » occupe toute la largeur du bouton (≈ 8 pt de marge). | « Garder sa place 30 min ». |
| V5-Partage-invitation | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Invite | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Compte | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Verif | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Notifs | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Sortie-inscrit | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Accueil | 9 | Corrections du test 5 s faites (« Lieu révélé », « Mettre en pause mes sorties », duo en second plan). Moitié basse vide (1 190 → 1 510 px). | — |
| V5-Accueil-discret | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Accueil-duo | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Pause | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Chats | 8 | « Lieu mer. 11 nov. 18 h » sans verbe : la correction du test 5 s (« Lieu révélé ») n'est faite que sur l'Accueil. | « Lieu révélé mer. 11 nov. 18 h » partout. |
| V5-Groupe | 8 | « pas de numéro ni de réseau, sauf entre accords mutuels » dans un chat de 5 : quand, entre qui ? (T5, non traité). | « … levé seulement dans un chat à deux, après vos deux oui ». |
| V5-Groupe-menu | 8 | « moins d'1 h les soirs de sortie » : l'astreinte couvre désormais samedi 15 h, dimanche 11 h et les rendez-vous ; la phrase dit le contraire à Lille (sam. 15 h) et au duo du samedi. « Pour ta sécurité, toujours » contredit la règle « 1 fois par mois » des autres écrans. | « Une personne de l'équipe répond en moins d'1 h pendant toute ta sortie » ; bannir « soirs de sortie » dans check-facts. |
| V5-Attente | 8 | Bandeau « environ 40 inscrits ont entre 18 et 25 ans » au-dessus d'une sortie « en 26–34 ans » : deux tranches sans lien, on se demande laquelle est la sienne. | Indicateur de la tranche de la sortie. |
| V5-Partage-ville | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Amorcage | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Amorcage-solo | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Sortie-complete | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Sortie-annulee | 8 | « Sortie confirmée puis annulée par Blowy : 3 € » sur une sortie annulée à 18 h faute de confirmations, donc jamais confirmée : le lecteur ne sait pas si la phrase s'applique. | Phrase propre au cas affiché. |
| V5-Affiner | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Affiner-histoire | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Affiner-age | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Affiner-ambiance | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Confirmation | 8 | « sauf pour ta sécurité, « je connais quelqu'un ici » ou un imprévu (chacun 1 fois par mois, sans pénalité, place non remboursée) » : la parenthèse couvre aussi la sécurité (rationnée, non remboursée), contre spec §2.7 (`SAFETY_EXIT` à tout moment, remboursé) et V5-Groupe-menu (« Pour ta sécurité, toujours »). « ≈ 8 min depuis Paris 11e » pour un lieu… du 11e. | Sortir la sécurité de la parenthèse : « Pour ta sécurité : toujours, remboursée, sans pénalité. » puis « je connais quelqu'un ici » (remboursée) et imprévu (non remboursée), 1 fois par mois chacun ; contrôle check-facts. Trajet depuis l'adresse déclarée ou « dans ton quartier ». |
| V5-Partage-confirmation | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Revelation | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Partage-checkin | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Ange | 8 | Liste « Ton ange verra seulement » autonome (2e source) ; « Jamais … ta position en continu » laisse entendre une position ponctuelle. | Renvoi à Confidentialité ; « ta position (jamais demandée) ». |
| W-Ange | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| W-Ange-aide | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Checkin | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Checkin-ok | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Souvenir | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Apres | 8 | Écran : aucun état par défaut, « Sans réponse, c'est non » ; spec §2.11 : « **Non par défaut** ». Le dev suivra la spec. | Spec §2.11 alignée sur l'écran. |
| V5-Apres-resultats | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Partage-jeudi | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Partage | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Partage-dimanche | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Apres-aucun | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Bande | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Partage-bande | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Rue | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Duo | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Lien | 8 | Étape 3 « Quand vous voulez. Nino en propose pendant 7 jours » ; V5-Duo-hh, même étape : « Dans un lieu partenaire, à une heure couverte par l'équipe ». Deux versions du même jalon. | Un seul texte d'étape 3 (celui de Duo-hh). |
| V5-Duo-hh | 9 | « pendant toute ta sortie » dans un duo écrit. | « pendant ton rendez-vous ». |
| V5-Lien-debloque | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-RdvDuo | 9 | « joignable pendant toute ta **sortie** » sur un rendez-vous : un mot pour un autre concept. | « pendant ton rendez-vous ». |
| V5-Chat | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-RdvDuo-lea | 9 | Même « toute ta sortie » sur un rendez-vous. | « pendant ton rendez-vous ». |
| V5-Oeuf | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Rupture | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Cartes | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Story | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| W-Repondre | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Profil | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Fiche | 8 | « Toi seul vois ce chiffre. Ton groupe n'en voit rien » ; spec §3.1 (Prénom, tranche, **fiabilité** ✓ dès CONFIRMED) et §2.13 (fiabilité après le double oui) disent l'inverse. Plus la règle ambiguë. | Retirer « fiabilité » des colonnes Groupe/Duo de la spec ; Sortir la sécurité de la parenthèse : « Pour ta sécurité : toujours, remboursée, sans pénalité. » puis « je connais quelqu'un ici » (remboursée) et imprévu (non remboursée), 1 fois par mois chacun ; contrôle check-facts. |
| V5-Tarifs | 8 | « sauf pour ta sécurité, « je connais quelqu'un ici » ou un imprévu (chacun 1 fois par mois, sans pénalité, place non remboursée) » : la parenthèse couvre aussi la sécurité (rationnée, non remboursée), contre spec §2.7 (`SAFETY_EXIT` à tout moment, remboursé) et V5-Groupe-menu (« Pour ta sécurité, toujours »). « reversée au lieu » sans dire HT. | Sortir la sécurité de la parenthèse : « Pour ta sécurité : toujours, remboursée, sans pénalité. » puis « je connais quelqu'un ici » (remboursée) et imprévu (non remboursée), 1 fois par mois chacun ; contrôle check-facts. |
| V5-Abonnement | 8 | « Rentable à partir de 3 sorties par mois » (vrai : 2 × 4,99 = 9,98 < 9,99) ; spec §6.2 : « dès la 2ᵉ sortie ». | Corriger la spec. |
| V5-Paiement | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Paiement-ok | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Reglages | 8 | « Mes quartiers Paris 11e + 2 » à côté de « Trajet maximum 30 min » ; spec D-063 : les quartiers se déduisent du trajet. Deux réglages pour un concept. | Retirer « Mes quartiers » ou l'afficher en lecture seule. |
| V5-Confidentialite | 8 | Présentée comme la liste unique, elle n'a ni ligne « Ton duo » (espèce + initiale, puis prénom aux visages) ni « Ton ange gardien » ; V5-Ange garde donc sa propre liste. | Ajouter les deux lignes ; V5-Ange renvoie ici. |
| V5-Signaler | 8 | « moins d'1 h les soirs de sortie » : l'astreinte couvre désormais samedi 15 h, dimanche 11 h et les rendez-vous ; la phrase dit le contraire à Lille (sam. 15 h) et au duo du samedi. | « Une personne de l'équipe répond en moins d'1 h pendant toute ta sortie » ; bannir « soirs de sortie » dans check-facts. |
| V5-Supprimer | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Chargement | 8 | « Ta proposition arrive lundi à 21 h » : vrai pour le jeudi seulement (samedi → mercredi 21 h, spec §1.1). | Jour calculé. |
| V5-Erreur-reseau | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Paiement-echec | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Verif-echec | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Notifs-refus | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Chats-vide | 8 | « Voir ma proposition » alors qu'il n'y en a peut-être pas (T5, non traité). | « Voir quand arrive ma proposition ». |
| L-Effectif | 8 | « 3 € par place **réservée** » ; L-Contrat et V5-Sortie-annulee : « par place **prévue** ». Total 7,99 € = 4,99 TTC + 3 €, contrat en HT. | Un mot, une base (HT) partout. |
| L-Creneaux | 9 | Une action claire, vocabulaire du glossaire, rien à mémoriser. | — |
| L-Contrat | 9 | Lisible en 30 s ; « 3 € » sans base HT/TTC alors que la ligne d'avant précise « 4,16 € HT ». | « 3 € HT ». |

## Les 3 changements qui feraient monter ma note le plus

1. Réécrire la règle d'annulation pour que la sécurité soit hors quota et remboursée, et bannir « soirs de sortie » : une règle, une version, sur les 10 écrans concernés.
2. Aligner spec ↔ écrans là où ils divergent encore : fiabilité (privée), vote (aucun défaut), Blowy+ (3 sorties), quartiers (dérivés du trajet), « place prévue/réservée », étape 3 du duo.
3. Confidentialité vraiment unique (lignes Duo et Ange, V5-Ange y renvoie) et solder les restes : Groupe « accords mutuels », Chats-vide, Chats « Lieu révélé », Chargement calculé, « 28 déc.… ».

## Je mets 10 si…

Je mets 10 si un diff automatique écrans ↔ spec-v5 ne trouve plus aucune règle à deux versions (sécurité, fiabilité, vote, Blowy+, quartiers, compensation, étape 3 du duo, délai d'1 h), si Confidentialité est la seule liste « qui voit quoi » (Duo et Ange compris), si les reliquats listés ici sont à zéro sur les 97 rendus, et si un 2e test 5 secondes répond juste sur Chats et Chargement comme sur Trouvée, Sortie et Accueil.
