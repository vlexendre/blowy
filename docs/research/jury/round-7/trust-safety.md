# Jury tour 7 — trust-safety (Responsable Trust & Safety)

**Verdict** : Le bloquant du tour 6 est levé : la sortie pour sécurité est « toujours possible, sans pénalité, place remboursée » sur 10 écrans, « soirs de sortie » et « position en continu » ont disparu, Confidentialité a ses lignes Duo et Ange. Mais cette sortie n'a toujours aucun bouton avant d'arriver (Les visages ne propose qu'un quota ou un imprévu non remboursé), le « sous 5 min » de l'ange n'a ni valeur en spec ni coût, et les rendez-vous promettent l'équipe « pendant ta sortie ».

**Note globale : 9/10** (T1 4 · T2 6 · T3 7 · T4 8 · T5 8 · T6 8 · T7 9)

| Critère | Note |
|---|---|
| Compréhension | 9 |
| Charge cognitive | 9 |
| Envie | 9 |
| Vraie rencontre | 9 |
| Sécurité et confiance | 8 |
| Viralité | 9 |
| Argent | 9 |
| Finition visuelle | 9 |

## Suivi de mes reproches du tour 6

- **BLOQUANT T6 (sécurité rationnée sur V5-Confirmation)** : levé. Phrase canonique « Pour ta sécurité : toujours possible, sans pénalité, place remboursée » sur Sortie ×4, Confirmation ×3, Fiche, Tarifs, Les visages, Groupe-menu, Check-in fait ; spec §2.7 et §6.4 alignées (illimitée, remboursée, lieu 3 € HT).
- **« soirs de sortie »** (Groupe-menu, Signaler) : fait, banni par check-facts.
- **« position en continu »** (V5-Ange) : fait.
- **Fiabilité privée en spec** : fait (§2.15, §3.1, §7.5, D-076). Le code l'expose encore (E24, à faire).
- **Confidentialité : Duo et Ange** : fait. Manquent fiabilité, contacts évités, cartes.
- **Filtre du chat de groupe** : fait (« seulement dans un chat à deux, après vos deux oui »).
- **SLA « 5 min » en `[T]` et dimensionné** : pas fait.
- **« pendant ton rendez-vous »** sur les écrans Duo : pas fait (la phrase canonique a gardé « ta sortie »).
- **Captures « détectées et signalées »** (absolu) : pas fait.
- **`MET_BEFORE` en Duo** : non vérifiable à l'écran, absent de §2.13.

## Contrôles

`node design/v5/check-facts.mjs` : 104 fichiers, 6 925 vérifications, 0 contradiction. `a11y-audit.mjs` lancé comme le README l'indique (`.local/dc-runtime.js`) : 104 écrans, 1 520 textes, 564 cibles, 1 569 blocs, 0 problème, contraste min 4,53:1 (lancé sans argument, il sort 3 « problèmes » d'outillage : `{{blockMark}}` non résolu sur V5-Signaler, « Voir ma ville » à 888 px sur W-Repondre ; les rendus PNG sont propres). `tooling/qa/layout/overflow.mjs` : aucun signalement. Les 104 rendus ouverts (planches 4 par 4, lieu en taille réelle). Ce que les outils ne voient pas, relevé à la main : (1) **V5-Revelation** n'a aucun bouton « je pars pour ma sécurité » : les deux sorties proposées sont « Je connais quelqu'un ici » (1 fois par mois) et « Je ne le sens pas · imprévu » (place **non remboursée**), alors que « partir mal à l'aise » sur place (V5-Checkin-ok) est une sortie pour sécurité **remboursée** : ne pas venir coûte, venir puis partir ne coûte rien ; (2) « « Je connais quelqu'un ici » : 1 fois par mois, place remboursée » sur 10 écrans, sans la suite du concept A.1 / spec §2.7 (D-073) : « au-delà, sortie pour ta sécurité, sans pénalité » ; (3) W-Ange-aide « appelle Alex sous 5 min » : `facts.sla.aide` = 5 min, mais spec `[T] safety.humanResponseMinutes` = 60, §7.4 `responseMinutes:60`, et business-model ne dimensionne aucun délai de 5 min ; la même page, adressée à l'ange, dit « pendant toute **ta** sortie » ; (4) V5-RdvDuo, V5-RdvDuo-lea, V5-Duo-hh-rdv : « joignable pendant toute ta sortie » sur un rendez-vous, alors que concept A.5 et le glossaire de la spec disent « ta sortie ou ton rendez-vous » (la phrase canonique de `facts.regles.astreinte` a gardé la moitié) ; (5) spec §2.7 cite comme phrase « affichée à l'identique partout » « …sauf si tu pars pour ta sécurité (toujours possible, remboursé) ou pour un imprévu (1 fois par mois, non remboursé) », texte qu'aucun écran n'affiche ; spec §6.5 et §10.2 : « Si Blowy annule une sortie confirmée, le lieu reçoit 3 € par place réservée », écrans et contrat : « Sortie annulée par Blowy à la confirmation ou après : 3 € HT… » ; et spec §2.6 (`→ CANCELLED` à `lockAt` si < 4 : remboursements, aucune compensation ; §6.5 « avant la confirmation : 0 ») contre V5-Sortie-annulee (annulée à 18 h à la confirmation → 3 € HT au lieu) ; (6) spec §2.11 « **Non par défaut** » contre V5-Apres (aucune pastille cochée) ; spec §2.13 / §3.2 (prénom dès `EXCHANGE`) contre V5-Duo, V5-Lien et Confidentialité (« le prénom, aux visages ») ; (7) business-model V5.6 : le tableau d'astreinte calcule un point mort à 80 sorties/jour avec 7,59 €, le texte en dessous à 134 avec 4,49 € ; « Duo à une table de 2 : sans garantie ni compensation pour le lieu, 0 € » contre spec §2.13 / §6.5 et L-Creneaux (« même règle de compensation ») ; spec §10.1 « volume national **du soir** » ; (8) L-Effectif : « Relevé de novembre » qui commence au « jeu. 29 oct. » ; effectif limité au jeudi alors que L-Creneaux ouvre mardi, samedi, dimanche et une table de 2 ; L-Contrat art. 3 ne nomme ni la sortie pour sécurité ni l'imprévu (une place **payée** libérée pour sécurité vaut 4,16 € HT d'après le contrat, 3 € HT d'après la spec §6.5) ; le message d'accueil n'existe dans aucune section de la spec et n'apparaît pas sur V5-Confirmation ; (9) V5-Attente : « Si elles arrivent d'ici le jeu. 19 nov. » pour le sam. 21 nov., composé le mer. 18 nov. 21 h (J − 3) ; V5-Pas-encore et V5-Pas-encore-nantes : « On te prévient mardi à 21 h » (`facts.nantes.prevenu` en dur) alors que la spec calcule l'état honnête le vendredi 21 h W−1 et que le jeudi de Nantes se compose le lundi ; (10) V5-Trouvee : « Lieu calme, comme demandé dans Affiner » sur la 1re Trouvée, juste après l'onboarding (Affiner est « plus tard », écran 26) ; V5-Welcome « 60 ans et plus » contre la grille « 50 ans et plus » ; (11) Confidentialité n'a pas de ligne fiabilité (« Personne : tes votes, ta position, ton âge exact, ce que tu cherches »), ni contacts évités ni cartes (spec §2.16) ; V5-Ange garde sa propre liste ; (12) V5-Cartes : « Chaque carte … s'exporte en vidéo de 5 s » alors que « 3 mots » (V5-Story) et « Inviter » n'ont pas ce bouton ; aucun aperçu vidéo nulle part ; (13) spec §11.4 : E22 (sortie pour sécurité non compensée au lieu), E23 (« je connais quelqu'un » hors quota = **absence** dans le code), E24 (fiabilité exposée aux autres dans les contrats) sont « à faire » ; (14) V5-Team « GARDER LA PLACE DE TOM (30 MIN) » toujours plein bord ; V5-Revelation et V5-Duo-hh-visages « les captures sont détectées et signalées » (absolu).

## Écran par écran

| Écran | Note | Ce qui empêche le 10 | Correction attendue |
|---|---|---|---|
| V5-Welcome | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Ville | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Ville-bordeaux | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Toi | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Genre | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Pet | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Rencontrer | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Intention | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Consentement | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Toi-plus | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Dispos | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Dispos-semaines | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Eviter | 10 | Empreintes comparées puis effacées, opt-in, désactivable. | — |
| V5-Erreur-age | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Trouvee | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Trouvee-lyon | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Sortie-lyon | 9 | « « Je connais quelqu'un ici » : 1 fois par mois, place remboursée » s'arrête là : la 2e rencontre d'un ex dans le mois lit qu'elle n'a plus de recours, alors que concept A.1 / spec §2.7 (D-073) en font une sortie pour sécurité. | Ajouter « au-delà : c'est une sortie pour ta sécurité, examinée par l'équipe, sans pénalité » à `facts.regles.connais`. |
| V5-Confirmation-lyon | 9 | « « Je connais quelqu'un ici » : 1 fois par mois, place remboursée » s'arrête là : la 2e rencontre d'un ex dans le mois lit qu'elle n'a plus de recours, alors que concept A.1 / spec §2.7 (D-073) en font une sortie pour sécurité. | Ajouter « au-delà : c'est une sortie pour ta sécurité, examinée par l'équipe, sans pénalité » à `facts.regles.connais`. |
| V5-Trouvee-banlieue | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Sortie-banlieue | 9 | « « Je connais quelqu'un ici » : 1 fois par mois, place remboursée » s'arrête là : la 2e rencontre d'un ex dans le mois lit qu'elle n'a plus de recours, alors que concept A.1 / spec §2.7 (D-073) en font une sortie pour sécurité. | Ajouter « au-delà : c'est une sortie pour ta sécurité, examinée par l'équipe, sans pénalité » à `facts.regles.connais`. |
| V5-Confirmation-banlieue | 9 | « « Je connais quelqu'un ici » : 1 fois par mois, place remboursée » s'arrête là : la 2e rencontre d'un ex dans le mois lit qu'elle n'a plus de recours, alors que concept A.1 / spec §2.7 (D-073) en font une sortie pour sécurité. | Ajouter « au-delà : c'est une sortie pour ta sécurité, examinée par l'équipe, sans pénalité » à `facts.regles.connais`. |
| V5-Pas-encore | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Ville-nantes | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Trouvee-nantes | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Sortie-nantes | 9 | « « Je connais quelqu'un ici » : 1 fois par mois, place remboursée » s'arrête là : la 2e rencontre d'un ex dans le mois lit qu'elle n'a plus de recours, alors que concept A.1 / spec §2.7 (D-073) en font une sortie pour sécurité. | Ajouter « au-delà : c'est une sortie pour ta sécurité, examinée par l'équipe, sans pénalité » à `facts.regles.connais`. |
| V5-Pas-encore-nantes | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Sortie | 9 | « « Je connais quelqu'un ici » : 1 fois par mois, place remboursée » s'arrête là : la 2e rencontre d'un ex dans le mois lit qu'elle n'a plus de recours, alors que concept A.1 / spec §2.7 (D-073) en font une sortie pour sécurité. | Ajouter « au-delà : c'est une sortie pour ta sécurité, examinée par l'équipe, sans pénalité » à `facts.regles.connais`. |
| V5-Team | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Partage-invitation | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Invite | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Compte | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Verif | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Notifs | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Sortie-inscrit | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Accueil | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Accueil-discret | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Accueil-duo | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Pause | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Chats | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Groupe | 10 | « seulement dans un chat à deux, après vos deux oui » : réglé. | — |
| V5-Groupe-menu | 9 | « moins d'1 h pendant toute ta sortie » et « Pour ta sécurité : toujours possible » : réglé. « Quitter la sortie » ne montre pas le choix « pour ma sécurité » qui rend la place remboursée. | Feuille « Quitter » avec les trois cas, sécurité en premier. |
| V5-Attente | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Partage-ville | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Amorcage | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Amorcage-solo | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Sortie-complete | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Sortie-annulee | 9 | Fiabilité intacte, Tom prévenu. Compensation lieu « à la confirmation » contredit spec §2.6 (aucune compensation à `lockAt`). | Trancher en spec. |
| V5-Affiner | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Affiner-histoire | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Affiner-age | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Affiner-ambiance | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Confirmation | 9 | Règle juste (sécurité hors quota, remboursée). Mais à 18 h, le seul bouton est « Je connais quelqu'un ici · examiné en privé » : rien pour « un prénom m'inquiète » sans connaître la personne, et la limite « 1 fois par mois » sans suite. | Bouton « Je ne veux pas y aller pour ma sécurité » → `seat.cancel {kind:SAFETY}` ; suite « au-delà » sur la ligne connais. |
| V5-Partage-confirmation | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Revelation | 7 | À J − 3 h, voir un visage qui fait peur n'a que deux boutons : « Je connais quelqu'un ici » (quota) et « Je ne le sens pas · imprévu » (place **non remboursée**). La sortie pour sécurité, promise juste en dessous, n'a pas de bouton ; or « partir mal à l'aise » sur place est remboursé : on pousse à venir pour repartir. « Les captures sont détectées et signalées » reste absolu. | Troisième bouton « Je ne viens pas, pour ma sécurité » (remboursé, sans pénalité, sans motif à donner, revue humaine) ; « Les captures d'écran iOS sont signalées à l'équipe ». |
| V5-Partage-checkin | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Ange | 9 | « Ta position n'est jamais demandée » : réglé. Liste « Ton ange verra seulement » encore propre à l'écran, au lieu de la ligne « Ton ange gardien » de Confidentialité. | Reprendre mot pour mot la ligne de Confidentialité. |
| W-Ange | 9 | « · lieu public » accolé au Café des Oiseaux : vague pour un ange qui doit agir. | « bar partenaire, table Blowy ». |
| W-Ange-aide | 7 | « appelle Alex sous 5 min » : aucun `[T]` en spec (60 min partout), aucun effectif dans business-model (2 personnes × 12 h pour toute la France, deux alertes simultanées = un des deux attend). Et « pendant toute **ta** sortie » sur la page de l'ange, qui ne sort pas. | `[T] safety.alertCallbackMinutes = 5` en spec, effectif d'astreinte dimensionné sur ce délai ; « pendant toute la sortie d'Alex ». |
| V5-Checkin | 10 | Code seul, position jamais demandée. | — |
| V5-Checkin-ok | 9 | « Partir mal à l'aise compte comme une sortie pour ta sécurité » : bon. Mais cette règle n'existe que sur place, pas avant (voir Les visages). | Même bouton avant l'arrivée. |
| V5-Souvenir | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Apres | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Apres-resultats | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Partage-jeudi | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Partage | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Partage-dimanche | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Apres-aucun | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Bande | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Partage-bande | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Rue | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Duo | 9 | Espèce + initiale : bon. « le prénom, aux visages » contredit spec §2.13 / §3.2 (prénom dès `EXCHANGE`) : un dev montrera le prénom 48 h plus tôt que promis. | Spec alignée sur l'écran (prénom aux visages). |
| V5-Lien | 10 | Étape 3 « lieu partenaire, heure couverte » : réglé. | — |
| V5-Duo-hh-proposition | 10 | Espèce + initiale, rien d'autre. | — |
| V5-Duo-hh | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Duo-hh-visages | 9 | « les captures sont détectées et signalées » : absolu (Android, 2e téléphone). | « Les captures d'écran iOS sont signalées à l'équipe ». |
| V5-Duo-hh-rdv | 8 | « Une personne de l'équipe est joignable pendant toute ta sortie » sur un rendez-vous à deux : concept A.5 et glossaire spec disent « ta sortie ou ton rendez-vous » ; la promesse ne nomme pas le moment où elle s'applique. | Phrase canonique « pendant tout ton rendez-vous » pour les écrans Duo, contrôlée par check-facts. |
| V5-Lien-debloque | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-RdvDuo | 8 | « Une personne de l'équipe est joignable pendant toute ta sortie » sur un rendez-vous à deux : concept A.5 et glossaire spec disent « ta sortie ou ton rendez-vous » ; la promesse ne nomme pas le moment où elle s'applique. | Phrase canonique « pendant tout ton rendez-vous » pour les écrans Duo, contrôlée par check-facts. |
| V5-Chat | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-RdvDuo-lea | 8 | « Une personne de l'équipe est joignable pendant toute ta sortie » sur un rendez-vous à deux : concept A.5 et glossaire spec disent « ta sortie ou ton rendez-vous » ; la promesse ne nomme pas le moment où elle s'applique. | Phrase canonique « pendant tout ton rendez-vous » pour les écrans Duo, contrôlée par check-facts. |
| V5-Oeuf | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Rupture | 10 | « Partir sans message · si tu ne te sens pas en sécurité » : bon. | — |
| V5-Cartes | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Story | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| W-Repondre | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Profil | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Fiche | 9 | Fiabilité privée : réglé, spec §2.15 alignée. Reste la ligne connais sans suite ; et le code expose encore la fiabilité (E24 à faire). | Suite « au-delà » ; fermer E24 avant toute bêta. |
| V5-Tarifs | 9 | « « Je connais quelqu'un ici » : 1 fois par mois, place remboursée » s'arrête là : la 2e rencontre d'un ex dans le mois lit qu'elle n'a plus de recours, alors que concept A.1 / spec §2.7 (D-073) en font une sortie pour sécurité. | Ajouter « au-delà : c'est une sortie pour ta sécurité, examinée par l'équipe, sans pénalité » à `facts.regles.connais`. |
| V5-Abonnement | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Paiement | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Paiement-ok | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Reglages | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Confidentialite | 9 | Lignes Duo et Ange : réglé. Manquent « fiabilité : toi seul » (alors que c'est la donnée la plus sensible côté réputation), « contacts évités » et « cartes de partage » exigés par spec §2.16. | Trois lignes de plus, générées depuis §3. |
| V5-Signaler | 9 | « moins d'1 h pendant toute ta sortie » : réglé. « Être rappelé » dans l'encart rouge « En danger maintenant ? » mélange l'urgence (17/112) et un rappel à 1 h, sans renvoyer au bouton « Besoin d'aide » (5 min sur W-Ange-aide). | Dans l'encart rouge : « Pendant la sortie : Besoin d'aide (appui long) » ; le rappel 1 h sous l'encart. |
| V5-Supprimer | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Chargement | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Erreur-reseau | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Paiement-echec | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Verif-echec | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Notifs-refus | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| V5-Chats-vide | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| L-Effectif | 9 | « l'équipe rappelle sous 1 h » pour un participant qui menace en salle : le lieu n'a pas de canal rapide propre. | Bouton « incident en cours » = même file que « Besoin d'aide ». |
| L-Creneaux | 10 | Rien qui limite, retarde ou fasse payer une sortie pour sécurité sur cet écran. | — |
| L-Contrat | 8 | Art. 3 ne nomme ni la sortie pour sécurité ni l'imprévu : une place payée quittée pour sécurité est « payée » au sens du contrat (4,16 € HT) mais vaut 3 € HT en spec §6.5 ; et le code ne compense rien (E22). | Art. 3 : « sortie pour raison de sécurité, retrait, je connais quelqu'un : 3 € HT par Blowy » ; fermer E22. |

## Les 3 changements qui feraient monter ma note le plus

1. Un bouton « Je ne viens pas, pour ma sécurité » (remboursé, sans motif, revue humaine) sur Les visages, Confirmation et la feuille « Quitter », pour que la règle affichée ait une porte d'entrée avant l'arrivée.
2. Un seul jeu de délais : `[T]` pour l'alerte (5 min) et le rappel (1 h) en spec, effectif d'astreinte dimensionné sur 5 min dans business-model, « pendant tout ton rendez-vous » sur les écrans Duo, « pendant la sortie d'Alex » sur la page de l'ange.
3. Fermer E22, E23, E24 (compensation sécurité, « je connais quelqu'un » hors quota = absence dans le code, fiabilité exposée) et écrire la suite « au-delà » de la ligne « je connais quelqu'un » ; contrat lieu art. 3 qui nomme la sortie pour sécurité.

## Je mets 10 si…

Je mets 10 si la sortie pour sécurité a un bouton à chaque moment où on peut vouloir partir (Les visages, Confirmation, Quitter, sur place), remboursée et sans motif ; si chaque délai d'intervention affiché (5 min, 1 h) a sa valeur `[T]` en spec et son effectif chiffré ; si les écrans Duo disent « ton rendez-vous » ; si Confidentialité a les lignes fiabilité, contacts évités et cartes ; et si E22, E23 et E24 sont fermés dans le code.
