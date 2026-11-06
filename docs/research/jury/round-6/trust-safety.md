# Jury tour 6 — trust-safety (Responsable Trust & Safety)

**Verdict** : Mon bloquant du tour 5 est levé (rendez-vous au Café Ginette, table à deux, astreinte sur toutes les heures, check-in par code, carte Duo espèce + initiale), mais la règle d'annulation affichée sur 8 écrans rationne la sortie pour sécurité à « 1 fois par mois, place non remboursée », et deux écrans d'aide disent encore « les soirs de sortie ».

**Note globale : 8/10** (T1 4 · T2 6 · T3 7 · T4 8 · T5 8 · T6 8)

| Critère | Note |
|---|---|
| Compréhension | 9 |
| Charge cognitive | 9 |
| Envie | 8 |
| Vraie rencontre | 9 |
| Sécurité et confiance | 7 |
| Viralité | 9 |
| Argent | 9 |
| Finition visuelle | 9 |

## Suivi de mes reproches du tour 5

- **BLOQUANT T5 (V5-RdvDuo-lea au parc)** : levé : Café Ginette, « table à deux, réservée après vos deux oui », check-in par code, astreinte.
- **Nom du pet sur la carte Duo** : fait (« Un capybara · N. », espèce générique).
- **Astreinte sur toutes les heures** : fait sur 9 écrans et dans le contrat ; **pas fait** sur V5-Groupe-menu et V5-Signaler (« les soirs de sortie »).
- **Spec sans le bandeau, position vraie, Éviter honnête, « Je connais quelqu'un ici » partout** : faits (spec §3 « jamais, pour personne », check-in code seul, empreintes HMAC « comparées puis effacées », bloc présent sur les 3 confirmations).
- **Groupe : filtre levé « entre accords mutuels » dans un chat à 5** : **pas fait**.
- **Nouveau** : règle canonique qui rationne la sécurité ; V5-Ange « position en continu » ; W-Ange-aide « sous 5 min » sans base dans la spec ; spec §3.1 qui montre la fiabilité au groupe alors que l'écran promet le contraire.

## Contrôles

`node design/v5/check-facts.mjs` : 97 fichiers, 6 039 vérifications, 0 contradiction. `a11y-audit.mjs` : 97 écrans, 1 423 textes, 538 cibles, 1 462 blocs mesurés, 0 problème, contraste min 4,53:1. `tooling/qa/layout/overflow.mjs` : aucun signalement (ni texte hors cadre, ni plage coupée). Ce que ces outils ne voient pas, relevé à la main sur les rendus et les sources : (1) la règle d'annulation canonique, présente sur 8 écrans, met « ta sécurité » sous la parenthèse « chacun 1 fois par mois, sans pénalité, place non remboursée », alors que spec §2.7 dit `SAFETY_EXIT` « à tout moment, remboursée » et que V5-Groupe-menu dit « Pour ta sécurité, toujours » ; (2) « les soirs de sortie » subsiste pour le délai d'1 h (V5-Groupe-menu, V5-Signaler) alors que l'astreinte couvre maintenant samedi 15 h, dimanche 11 h et les rendez-vous ; (3) spec révision 5 ≠ écrans sur la fiabilité (§3.1 et §2.13 : visible du groupe et du duo ; V5-Fiche : « Toi seul vois ce chiffre »), le vote (§2.11 « Non par défaut » ; V5-Apres : aucun état), Blowy+ (§6.2 « rentable dès la 2ᵉ sortie » ; V5-Abonnement : « 3 sorties par mois », et 2 × 4,99 = 9,98 < 9,99) ; (4) `business-model.md` est encore titré V5.4 : astreinte « 18 h à 2 h … par soir et par ville », point mort par ville, aucune ligne tables à deux, parrainage, imprévu ni « Blowy annule », alors que concept-v5.5 §D.13 et spec §10.1 renvoient à un calcul national qui n'existe pas ; (5) V5-Chargement promet « lundi à 21 h » quel que soit le créneau (samedi composé le mercredi 21 h, spec §1.1) ; (6) L-Effectif additionne 4,99 € (TTC) et 3 € = 7,99 €, le contrat dit 4,16 € HT, la spec §6.5 un « total HT » ; « par place réservée » (L-Effectif, spec) contre « par place prévue » (L-Contrat, V5-Sortie-annulee) ; (7) V5-Lien : rendez-vous « Quand vous voulez » contre V5-Duo-hh « Dans un lieu partenaire, à une heure couverte par l'équipe » ; (8) V5-Dispos-semaines « 28 déc.... » (quatre points).

## Écran par écran

| Écran | Note | Ce qui empêche le 10 | Correction attendue |
|---|---|---|---|
| V5-Welcome | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Ville | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Ville-bordeaux | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Toi | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Genre | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Pet | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Rencontrer | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Intention | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Consentement | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Toi-plus | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Dispos | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Dispos-semaines | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Eviter | 9 | Empreintes « comparées puis effacées » : réglé ; les tiers dont le numéro est traité ne sont pas mentionnés. | Mention des tiers dans la politique. |
| V5-Erreur-age | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Trouvee | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Trouvee-lyon | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Sortie-lyon | 7 | « sauf pour ta sécurité, « je connais quelqu'un ici » ou un imprévu (chacun 1 fois par mois, sans pénalité, place non remboursée) » : la parenthèse couvre aussi la sécurité (rationnée, non remboursée), contre spec §2.7 (`SAFETY_EXIT` à tout moment, remboursé) et V5-Groupe-menu (« Pour ta sécurité, toujours »). | Sortir la sécurité de la parenthèse : « Pour ta sécurité : toujours, remboursée, sans pénalité. » puis « je connais quelqu'un ici » (remboursée) et imprévu (non remboursée), 1 fois par mois chacun ; contrôle check-facts. |
| V5-Confirmation-lyon | 7 | « sauf pour ta sécurité, « je connais quelqu'un ici » ou un imprévu (chacun 1 fois par mois, sans pénalité, place non remboursée) » : la parenthèse couvre aussi la sécurité (rationnée, non remboursée), contre spec §2.7 (`SAFETY_EXIT` à tout moment, remboursé) et V5-Groupe-menu (« Pour ta sécurité, toujours »). | Sortir la sécurité de la parenthèse : « Pour ta sécurité : toujours, remboursée, sans pénalité. » puis « je connais quelqu'un ici » (remboursée) et imprévu (non remboursée), 1 fois par mois chacun ; contrôle check-facts. |
| V5-Trouvee-banlieue | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Sortie-banlieue | 7 | « sauf pour ta sécurité, « je connais quelqu'un ici » ou un imprévu (chacun 1 fois par mois, sans pénalité, place non remboursée) » : la parenthèse couvre aussi la sécurité (rationnée, non remboursée), contre spec §2.7 (`SAFETY_EXIT` à tout moment, remboursé) et V5-Groupe-menu (« Pour ta sécurité, toujours »). | Sortir la sécurité de la parenthèse : « Pour ta sécurité : toujours, remboursée, sans pénalité. » puis « je connais quelqu'un ici » (remboursée) et imprévu (non remboursée), 1 fois par mois chacun ; contrôle check-facts. |
| V5-Confirmation-banlieue | 7 | « sauf pour ta sécurité, « je connais quelqu'un ici » ou un imprévu (chacun 1 fois par mois, sans pénalité, place non remboursée) » : la parenthèse couvre aussi la sécurité (rationnée, non remboursée), contre spec §2.7 (`SAFETY_EXIT` à tout moment, remboursé) et V5-Groupe-menu (« Pour ta sécurité, toujours »). | Sortir la sécurité de la parenthèse : « Pour ta sécurité : toujours, remboursée, sans pénalité. » puis « je connais quelqu'un ici » (remboursée) et imprévu (non remboursée), 1 fois par mois chacun ; contrôle check-facts. |
| V5-Pas-encore | 10 | Calculé avant composition, sur la ville et les créneaux, chiffre masqué sous 10 : aucune fuite. | — |
| V5-Sortie | 7 | « sauf pour ta sécurité, « je connais quelqu'un ici » ou un imprévu (chacun 1 fois par mois, sans pénalité, place non remboursée) » : la parenthèse couvre aussi la sécurité (rationnée, non remboursée), contre spec §2.7 (`SAFETY_EXIT` à tout moment, remboursé) et V5-Groupe-menu (« Pour ta sécurité, toujours »). | Sortir la sécurité de la parenthèse : « Pour ta sécurité : toujours, remboursée, sans pénalité. » puis « je connais quelqu'un ici » (remboursée) et imprévu (non remboursée), 1 fois par mois chacun ; contrôle check-facts. |
| V5-Team | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Partage-invitation | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Invite | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Compte | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Verif | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Notifs | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Sortie-inscrit | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Accueil | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Accueil-discret | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Accueil-duo | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Pause | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Chats | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Groupe | 8 | « pas de numéro ni de réseau, sauf entre accords mutuels » dans le chat de GROUPE : un numéro posté là est lu par les 5 (T5, non traité). | Filtre levé seulement dans un chat à deux. |
| V5-Groupe-menu | 7 | « moins d'1 h les soirs de sortie » : l'astreinte couvre désormais samedi 15 h, dimanche 11 h et les rendez-vous ; la phrase dit le contraire à Lille (sam. 15 h) et au duo du samedi. Et « Pour ta sécurité, toujours » contredit les 8 écrans de la règle. | « Une personne de l'équipe répond en moins d'1 h pendant toute ta sortie » ; bannir « soirs de sortie » dans check-facts. |
| V5-Attente | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Partage-ville | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Amorcage | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Amorcage-solo | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Sortie-complete | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Sortie-annulee | 9 | Fiabilité intacte, Tom prévenu : bon ; phrase lieu ambiguë (sortie jamais confirmée). | — |
| V5-Affiner | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Affiner-histoire | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Affiner-age | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Affiner-ambiance | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Confirmation | 6 | **BLOQUANT** « sauf pour ta sécurité, « je connais quelqu'un ici » ou un imprévu (chacun 1 fois par mois, sans pénalité, place non remboursée) » : la parenthèse couvre aussi la sécurité (rationnée, non remboursée), contre spec §2.7 (`SAFETY_EXIT` à tout moment, remboursé) et V5-Groupe-menu (« Pour ta sécurité, toujours »). C'est l'écran de 18 h : celui qui découvre un prénom qui l'inquiète lit que partir lui coûte sa place et un quota mensuel. | Sortir la sécurité de la parenthèse : « Pour ta sécurité : toujours, remboursée, sans pénalité. » puis « je connais quelqu'un ici » (remboursée) et imprévu (non remboursée), 1 fois par mois chacun ; contrôle check-facts. |
| V5-Partage-confirmation | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Revelation | 9 | « les captures sont détectées et signalées » : vrai pour la capture iOS, pas pour l'enregistrement d'écran Android ni un 2e téléphone ; « signalées » à qui ? | « Les captures d'écran sont signalées à l'équipe » (sans absolu). |
| V5-Partage-checkin | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Ange | 7 | « Jamais … ta position en continu » : laisse entendre qu'une position ponctuelle est partagée, contre Confidentialité (« jamais demandée ») et spec §2.10 (« Aucune position, jamais »). | « Jamais ton groupe, tes messages, ta position (jamais demandée) ». |
| W-Ange | 9 | « lieu public » accolé à un bar partenaire : vrai mais vague pour un ange qui doit agir. | « bar partenaire, table Blowy ». |
| W-Ange-aide | 8 | « appelle Alex sous 5 min » : spec §10.1 vise ≤ 60 min, Signaler et L-Effectif disent 1 h ; une astreinte mutualisée par fuseau ne tient pas 5 min sur deux alertes simultanées, et rien ne la dimensionne. | Un SLA unique en `[T] safety` (alerte ≠ rappel) et dimensionné dans business-model. |
| V5-Checkin | 10 | Code seul, « Ta position n'est jamais demandée. » : vrai et vérifiable. | — |
| V5-Checkin-ok | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Souvenir | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Apres | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Apres-resultats | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Partage-jeudi | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Partage | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Partage-dimanche | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Apres-aucun | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Bande | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Partage-bande | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Rue | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Duo | 9 | Espèce + initiale : réglé. Rien n'exclut d'une proposition une personne déjà croisée en sortie (`MET_BEFORE` n'est écrit que pour les groupes). | `MET_BEFORE` aussi en Duo, écrit en spec. |
| V5-Lien | 8 | Étape 3 « Quand vous voulez » : contredit « heure couverte par l'équipe » (Duo-hh) et spec §2.13 (412 `OUTSIDE_ONCALL_HOURS`). | Texte de Duo-hh. |
| V5-Duo-hh | 9 | Même finition que le duo F-H ; « toute ta sortie » dans un duo écrit. | « pendant ton rendez-vous ». |
| V5-Lien-debloque | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-RdvDuo | 9 | Table réservée après les deux oui : réglé. Même « toute ta sortie ». | « pendant ton rendez-vous ». |
| V5-Chat | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-RdvDuo-lea | 9 | Bloquant levé. Reste « pendant toute ta sortie » pour un rendez-vous. | « pendant ton rendez-vous ». |
| V5-Oeuf | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Rupture | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Cartes | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Story | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| W-Repondre | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Profil | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Fiche | 7 | « sauf pour ta sécurité, « je connais quelqu'un ici » ou un imprévu (chacun 1 fois par mois, sans pénalité, place non remboursée) » : la parenthèse couvre aussi la sécurité (rationnée, non remboursée), contre spec §2.7 (`SAFETY_EXIT` à tout moment, remboursé) et V5-Groupe-menu (« Pour ta sécurité, toujours »). Et « Ton groupe n'en voit rien » (fiabilité) contre spec §3.1 / §2.13 qui l'exposent au groupe confirmé et au duo : un dev l'affichera. | Sortir la sécurité de la parenthèse : « Pour ta sécurité : toujours, remboursée, sans pénalité. » puis « je connais quelqu'un ici » (remboursée) et imprévu (non remboursée), 1 fois par mois chacun ; contrôle check-facts. Spec : fiabilité « moi seul ». |
| V5-Tarifs | 7 | « sauf pour ta sécurité, « je connais quelqu'un ici » ou un imprévu (chacun 1 fois par mois, sans pénalité, place non remboursée) » : la parenthèse couvre aussi la sécurité (rationnée, non remboursée), contre spec §2.7 (`SAFETY_EXIT` à tout moment, remboursé) et V5-Groupe-menu (« Pour ta sécurité, toujours »). | Sortir la sécurité de la parenthèse : « Pour ta sécurité : toujours, remboursée, sans pénalité. » puis « je connais quelqu'un ici » (remboursée) et imprévu (non remboursée), 1 fois par mois chacun ; contrôle check-facts. |
| V5-Abonnement | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Paiement | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Paiement-ok | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Reglages | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Confidentialite | 8 | Position et ligne Groupe désormais vraies ; il manque « Ton duo » (espèce + initiale avant le double oui) et « Ton ange » : la liste unique ne couvre pas tous les acteurs. | Ajouter les deux lignes. |
| V5-Signaler | 7 | Dans l'encart rouge « En danger maintenant ? » : « moins d'1 h les soirs de sortie » : l'astreinte couvre désormais samedi 15 h, dimanche 11 h et les rendez-vous ; la phrase dit le contraire à Lille (sam. 15 h) et au duo du samedi. | « Une personne de l'équipe répond en moins d'1 h pendant toute ta sortie » ; bannir « soirs de sortie » dans check-facts. |
| V5-Supprimer | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Chargement | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Erreur-reseau | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Paiement-echec | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Verif-echec | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Notifs-refus | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| V5-Chats-vide | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| L-Effectif | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| L-Creneaux | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |
| L-Contrat | 9 | Rien de déductible au-delà de la promesse sur cet écran. | — |

## Les 3 changements qui feraient monter ma note le plus

1. Sortir la sécurité du quota dans la règle canonique (« toujours, remboursée, sans pénalité ») sur les 8 écrans, la spec §2.7 restant la référence, avec un contrôle check-facts.
2. Une seule promesse de délai, vraie à toute heure de créneau : bannir « soirs de sortie », fixer en spec le SLA alerte (W-Ange-aide « 5 min ») et rappel (1 h), et le dimensionner.
3. Spec et écrans d'accord sur ce que voient les autres : fiabilité privée (§3.1, §2.13), lignes Duo et Ange dans Confidentialité, « position en continu » retiré, filtre du chat de groupe.

## Je mets 10 si…

Je mets 10 si un audit croisé des 97 écrans, de spec-v5 et du contrat lieu ne trouve aucune phrase qui limite, retarde ou fait payer une sortie pour sécurité, aucune promesse d'aide liée à une plage horaire autre que « pendant toute ta sortie », aucun délai d'intervention sans valeur `[T]` en spec et coût dans business-model, aucune donnée montrée par la spec que l'écran dit privée (fiabilité), et si Confidentialité couvre tous les acteurs (groupe, bande, duo, ange, lieu).
