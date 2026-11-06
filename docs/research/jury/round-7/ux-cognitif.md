# Jury tour 7 — ux-cognitif (Chercheuse en UX cognitive)

**Verdict** : Les règles affichées ont enfin une seule formulation sur les écrans (sécurité, imprévu, fiabilité, astreinte, Blowy+, « Blowy annule »), contrôlée mot pour mot ; mais la spec en garde une autre pour quatre d'entre elles, « Je ne le sens pas » (imprévu payé) et « mal à l'aise » (sécurité remboursée) se ressemblent trop pour deux règles opposées, et trois dates sont encore écrites en dur à côté de la règle J − 3.

**Note globale : 9/10** (T1 5 · T2 7 · T3 8 · T4 8 · T5 9 · T6 9 · T7 9)

| Critère | Note |
|---|---|
| Compréhension | 9 |
| Charge cognitive | 8 |
| Envie | 9 |
| Vraie rencontre | 9 |
| Sécurité et confiance | 9 |
| Viralité | 9 |
| Argent | 9 |
| Finition visuelle | 9 |

## Suivi de mes reproches du tour 6

- **Règle d'annulation à une version (T6 n° 1)** : fait sur les écrans (phrases `facts.regles`, contrôle mot pour mot). **Pas fait côté spec** : §2.7 cite un autre texte comme « affiché à l'identique partout ».
- **« soirs de sortie »** : fait.
- **Spec ↔ écrans** : fiabilité (fait), Blowy+ 3e sortie (fait), quartiers dérivés (fait) ; vote « Non par défaut » (**pas fait**), prénom du duo (**nouvel écart repéré**), « Blowy annule » (**deux versions**), astreinte « ton rendez-vous » (**pas fait**).
- **Confidentialité liste unique** : Duo et Ange faits ; V5-Ange garde sa liste ; fiabilité, contacts évités et cartes manquent.
- **Reliquats T6** : Groupe « accords mutuels », Chats-vide, Chats « Lieu révélé », Chargement calculé, « déc.… », Lien étape 3, Attente sans tranche étrangère : faits. Team plein bord : pas fait. Trajet « ≈ 8 min depuis Paris 11e » : pas fait.
- **2e test 5 secondes (Chats, Chargement)** : pas fait (seul `test-5-secondes-r5.md` existe).

## Contrôles

`node design/v5/check-facts.mjs` : 104 fichiers, 6 925 vérifications, 0 contradiction. `a11y-audit.mjs` lancé comme le README l'indique (`.local/dc-runtime.js`) : 104 écrans, 1 520 textes, 564 cibles, 1 569 blocs, 0 problème, contraste min 4,53:1 (lancé sans argument, il sort 3 « problèmes » d'outillage : `{{blockMark}}` non résolu sur V5-Signaler, « Voir ma ville » à 888 px sur W-Repondre ; les rendus PNG sont propres). `tooling/qa/layout/overflow.mjs` : aucun signalement. Les 104 rendus ouverts (planches 4 par 4, lieu en taille réelle). Ce que les outils ne voient pas, relevé à la main : (1) **V5-Revelation** n'a aucun bouton « je pars pour ma sécurité » : les deux sorties proposées sont « Je connais quelqu'un ici » (1 fois par mois) et « Je ne le sens pas · imprévu » (place **non remboursée**), alors que « partir mal à l'aise » sur place (V5-Checkin-ok) est une sortie pour sécurité **remboursée** : ne pas venir coûte, venir puis partir ne coûte rien ; (2) « « Je connais quelqu'un ici » : 1 fois par mois, place remboursée » sur 10 écrans, sans la suite du concept A.1 / spec §2.7 (D-073) : « au-delà, sortie pour ta sécurité, sans pénalité » ; (3) W-Ange-aide « appelle Alex sous 5 min » : `facts.sla.aide` = 5 min, mais spec `[T] safety.humanResponseMinutes` = 60, §7.4 `responseMinutes:60`, et business-model ne dimensionne aucun délai de 5 min ; la même page, adressée à l'ange, dit « pendant toute **ta** sortie » ; (4) V5-RdvDuo, V5-RdvDuo-lea, V5-Duo-hh-rdv : « joignable pendant toute ta sortie » sur un rendez-vous, alors que concept A.5 et le glossaire de la spec disent « ta sortie ou ton rendez-vous » (la phrase canonique de `facts.regles.astreinte` a gardé la moitié) ; (5) spec §2.7 cite comme phrase « affichée à l'identique partout » « …sauf si tu pars pour ta sécurité (toujours possible, remboursé) ou pour un imprévu (1 fois par mois, non remboursé) », texte qu'aucun écran n'affiche ; spec §6.5 et §10.2 : « Si Blowy annule une sortie confirmée, le lieu reçoit 3 € par place réservée », écrans et contrat : « Sortie annulée par Blowy à la confirmation ou après : 3 € HT… » ; et spec §2.6 (`→ CANCELLED` à `lockAt` si < 4 : remboursements, aucune compensation ; §6.5 « avant la confirmation : 0 ») contre V5-Sortie-annulee (annulée à 18 h à la confirmation → 3 € HT au lieu) ; (6) spec §2.11 « **Non par défaut** » contre V5-Apres (aucune pastille cochée) ; spec §2.13 / §3.2 (prénom dès `EXCHANGE`) contre V5-Duo, V5-Lien et Confidentialité (« le prénom, aux visages ») ; (7) business-model V5.6 : le tableau d'astreinte calcule un point mort à 80 sorties/jour avec 7,59 €, le texte en dessous à 134 avec 4,49 € ; « Duo à une table de 2 : sans garantie ni compensation pour le lieu, 0 € » contre spec §2.13 / §6.5 et L-Creneaux (« même règle de compensation ») ; spec §10.1 « volume national **du soir** » ; (8) L-Effectif : « Relevé de novembre » qui commence au « jeu. 29 oct. » ; effectif limité au jeudi alors que L-Creneaux ouvre mardi, samedi, dimanche et une table de 2 ; L-Contrat art. 3 ne nomme ni la sortie pour sécurité ni l'imprévu (une place **payée** libérée pour sécurité vaut 4,16 € HT d'après le contrat, 3 € HT d'après la spec §6.5) ; le message d'accueil n'existe dans aucune section de la spec et n'apparaît pas sur V5-Confirmation ; (9) V5-Attente : « Si elles arrivent d'ici le jeu. 19 nov. » pour le sam. 21 nov., composé le mer. 18 nov. 21 h (J − 3) ; V5-Pas-encore et V5-Pas-encore-nantes : « On te prévient mardi à 21 h » (`facts.nantes.prevenu` en dur) alors que la spec calcule l'état honnête le vendredi 21 h W−1 et que le jeudi de Nantes se compose le lundi ; (10) V5-Trouvee : « Lieu calme, comme demandé dans Affiner » sur la 1re Trouvée, juste après l'onboarding (Affiner est « plus tard », écran 26) ; V5-Welcome « 60 ans et plus » contre la grille « 50 ans et plus » ; (11) Confidentialité n'a pas de ligne fiabilité (« Personne : tes votes, ta position, ton âge exact, ce que tu cherches »), ni contacts évités ni cartes (spec §2.16) ; V5-Ange garde sa propre liste ; (12) V5-Cartes : « Chaque carte … s'exporte en vidéo de 5 s » alors que « 3 mots » (V5-Story) et « Inviter » n'ont pas ce bouton ; aucun aperçu vidéo nulle part ; (13) spec §11.4 : E22 (sortie pour sécurité non compensée au lieu), E23 (« je connais quelqu'un » hors quota = **absence** dans le code), E24 (fiabilité exposée aux autres dans les contrats) sont « à faire » ; (14) V5-Team « GARDER LA PLACE DE TOM (30 MIN) » toujours plein bord ; V5-Revelation et V5-Duo-hh-visages « les captures sont détectées et signalées » (absolu).

## Écran par écran

| Écran | Note | Ce qui empêche le 10 | Correction attendue |
|---|---|---|---|
| V5-Welcome | 9 | « De 18 à 60 ans et plus » alors que la grille partout s'arrête à « 50 ans et plus ». | « De 18 à 50 ans et plus ». |
| V5-Ville | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Ville-bordeaux | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Toi | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Genre | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Pet | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Rencontrer | 9 | Trois formats à égalité au 5/9 (« Groupe et duo · les deux, sans priorité ») : une décision de plus dans un onboarding de 9 questions. | Défaut « En petit groupe », Duo proposé après la 1re sortie. |
| V5-Intention | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Consentement | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Toi-plus | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Dispos | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Dispos-semaines | 10 | « déc. … », week-end sur deux daté : réglé. | — |
| V5-Eviter | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Erreur-age | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Trouvee | 8 | « Lieu calme, comme demandé dans Affiner » : Alex arrive ici juste après le 9/9, il n'a jamais vu Affiner (écran 26, « plus tard ») ; « ≈ 8 min depuis Paris 11e » pour un bar du 11e (T6, non traité). | Retirer la phrase de la 1re Trouvée (ou « Lieu calme, comme tu l'as choisi » si l'ambiance est demandée dans le parcours) ; « dans ton quartier » sous 10 min. |
| V5-Trouvee-lyon | 9 | « Et la semaine d'après : mar. 24 nov. · 19 h 30 · Atelier céramique » annoncé avant la composition de cette semaine-là : promesse que la règle J − 3 ne permet pas. | « Prochaine composition : sam. 21 nov. 21 h ». |
| V5-Sortie-lyon | 9 | Règle unique, mot pour mot, lisible : bien. Mais « « Je connais quelqu'un ici » : 1 fois par mois » laisse sans réponse « et la 2e fois ? » ; et elle ne correspond pas au texte que spec §2.7 dit « affiché à l'identique partout ». | Suite « au-delà : sortie pour ta sécurité » ; spec §2.7 recopie `facts.annulation.regle`. |
| V5-Confirmation-lyon | 9 | Règle unique, mot pour mot, lisible : bien. Mais « « Je connais quelqu'un ici » : 1 fois par mois » laisse sans réponse « et la 2e fois ? » ; et elle ne correspond pas au texte que spec §2.7 dit « affiché à l'identique partout ». | Suite « au-delà : sortie pour ta sécurité » ; spec §2.7 recopie `facts.annulation.regle`. |
| V5-Trouvee-banlieue | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Sortie-banlieue | 9 | Règle unique, mot pour mot, lisible : bien. Mais « « Je connais quelqu'un ici » : 1 fois par mois » laisse sans réponse « et la 2e fois ? » ; et elle ne correspond pas au texte que spec §2.7 dit « affiché à l'identique partout ». | Suite « au-delà : sortie pour ta sécurité » ; spec §2.7 recopie `facts.annulation.regle`. |
| V5-Confirmation-banlieue | 9 | Règle unique, mot pour mot, lisible : bien. Mais « « Je connais quelqu'un ici » : 1 fois par mois » laisse sans réponse « et la 2e fois ? » ; et elle ne correspond pas au texte que spec §2.7 dit « affiché à l'identique partout ». | Suite « au-delà : sortie pour ta sécurité » ; spec §2.7 recopie `facts.annulation.regle`. |
| V5-Pas-encore | 9 | « On te prévient mardi à 21 h pour la semaine prochaine » : jour codé en dur (`facts.nantes.prevenu`), alors que spec §1.1/§2.4 calcule l'état honnête le vendredi 21 h W−1 et D-075 interdit le jour générique. | Jour calculé depuis `requestOpensAt`. |
| V5-Ville-nantes | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Trouvee-nantes | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Sortie-nantes | 9 | Règle unique, mot pour mot, lisible : bien. Mais « « Je connais quelqu'un ici » : 1 fois par mois » laisse sans réponse « et la 2e fois ? » ; et elle ne correspond pas au texte que spec §2.7 dit « affiché à l'identique partout ». | Suite « au-delà : sortie pour ta sécurité » ; spec §2.7 recopie `facts.annulation.regle`. |
| V5-Pas-encore-nantes | 8 | Même « mardi à 21 h » ; or le créneau de Camille à Nantes est le jeudi (composé le lundi 21 h, V5-Trouvee-nantes) : deux heures pour la même personne. | Jour calculé. |
| V5-Sortie | 9 | Règle unique, mot pour mot, lisible : bien. Mais « « Je connais quelqu'un ici » : 1 fois par mois » laisse sans réponse « et la 2e fois ? » ; et elle ne correspond pas au texte que spec §2.7 dit « affiché à l'identique partout ». | Suite « au-delà : sortie pour ta sécurité » ; spec §2.7 recopie `facts.annulation.regle`. |
| V5-Team | 9 | « GARDER LA PLACE DE TOM (30 MIN) » toujours plein bord (≈ 8 pt de marge), T6 non traité. | « Garder sa place 30 min ». |
| V5-Partage-invitation | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Invite | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Compte | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Verif | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Notifs | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Sortie-inscrit | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Accueil | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Accueil-discret | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Accueil-duo | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Pause | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Chats | 10 | « Lieu révélé mer. 11 nov. 18 h » : réglé. | — |
| V5-Groupe | 10 | « seulement dans un chat à deux, après vos deux oui » : réglé. | — |
| V5-Groupe-menu | 10 | Une règle, une version : réglé. | — |
| V5-Attente | 8 | « Si elles arrivent d'ici le jeu. 19 nov., elle a lieu » pour le sam. 21 nov. : la composition est le mer. 18 nov. 21 h (J − 3). Deux dates pour le même verrou. | « d'ici le mer. 18 nov. 21 h ». |
| V5-Partage-ville | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Amorcage | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Amorcage-solo | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Sortie-complete | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Sortie-annulee | 9 | La phrase canonique « à la confirmation ou après : 3 € HT » couvre enfin ce cas ; mais spec §2.6 / §6.5 dit l'inverse (rien à `lockAt` si < 4, phrase « sortie confirmée »). | Spec alignée sur l'écran. |
| V5-Affiner | 10 | Résumé exact (30–34 coché, ambiance calme). | — |
| V5-Affiner-histoire | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Affiner-age | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Affiner-ambiance | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Confirmation | 9 | Règle unique : réglé. « ≈ 8 min depuis Paris 11e » pour le 11e. Pas de « message du lieu » à 18 h alors que le chat l'annonce « à la révélation ». | Trajet « dans ton quartier » ; afficher le message d'accueil ici. |
| V5-Partage-confirmation | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Revelation | 8 | « Je ne le sens pas » = imprévu non remboursé ; « partir mal à l'aise » (Check-in fait) = sécurité remboursée. Deux étiquettes presque synonymes, deux règles opposées : l'utilisateur ne peut pas prédire laquelle s'applique. | Un seul vocabulaire : « Je ne viens pas, pour ma sécurité » (remboursé) / « Imprévu » (non remboursé), les deux sur cet écran. |
| V5-Partage-checkin | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Ange | 9 | Liste « Ton ange verra seulement » encore propre à l'écran (2e source « qui voit quoi »). | Reprendre la ligne « Ton ange gardien » de Confidentialité, mot pour mot. |
| W-Ange | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| W-Ange-aide | 8 | « sous 5 min » ici, « moins d'1 h » sur Signaler et Réglages, 60 en spec : trois chiffres d'aide sans dire lequel vaut pour quoi. « pendant toute ta sortie » adressé à l'ange. | « Alerte : rappel sous 5 min » / « Signalement : sous 1 h », les deux en `[T]` ; « la sortie d'Alex ». |
| V5-Checkin | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Checkin-ok | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Souvenir | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Apres | 9 | Écran sans défaut coché ; spec §2.11 : « **Non par défaut** » (T6, non traité). | Spec §2.11 : « aucune pastille cochée ; sans réponse = non à la clôture ». |
| V5-Apres-resultats | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Partage-jeudi | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Partage | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Partage-dimanche | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Apres-aucun | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Bande | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Partage-bande | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Rue | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Duo | 9 | « le prénom, aux visages » ; spec §2.13 et §3.2 : prénom dès `EXCHANGE`. Deux versions. | Spec alignée. |
| V5-Lien | 10 | Étape 3 unique avec Duo-hh : réglé. | — |
| V5-Duo-hh-proposition | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Duo-hh | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Duo-hh-visages | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Duo-hh-rdv | 9 | « joignable pendant toute ta **sortie** » sur un rendez-vous : un mot pour un autre concept (concept A.5 : « ta sortie ou ton rendez-vous »). | « pendant tout ton rendez-vous ». |
| V5-Lien-debloque | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-RdvDuo | 9 | « joignable pendant toute ta **sortie** » sur un rendez-vous : un mot pour un autre concept (concept A.5 : « ta sortie ou ton rendez-vous »). | « pendant tout ton rendez-vous ». |
| V5-Chat | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-RdvDuo-lea | 9 | « joignable pendant toute ta **sortie** » sur un rendez-vous : un mot pour un autre concept (concept A.5 : « ta sortie ou ton rendez-vous »). | « pendant tout ton rendez-vous ». |
| V5-Oeuf | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Rupture | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Cartes | 9 | Neuf vraies miniatures : réglé. « Chaque carte … s'exporte en vidéo de 5 s » est faux pour « 3 mots » et « Inviter ». | « Les cartes publiques s'exportent en vidéo de 5 s ». |
| V5-Story | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| W-Repondre | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Profil | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Fiche | 9 | Règle unique, mot pour mot, lisible : bien. Mais « « Je connais quelqu'un ici » : 1 fois par mois » laisse sans réponse « et la 2e fois ? » ; et elle ne correspond pas au texte que spec §2.7 dit « affiché à l'identique partout ». | Suite « au-delà : sortie pour ta sécurité » ; spec §2.7 recopie `facts.annulation.regle`. |
| V5-Tarifs | 9 | Règle unique, mot pour mot, lisible : bien. Mais « « Je connais quelqu'un ici » : 1 fois par mois » laisse sans réponse « et la 2e fois ? » ; et elle ne correspond pas au texte que spec §2.7 dit « affiché à l'identique partout ». | Suite « au-delà : sortie pour ta sécurité » ; spec §2.7 recopie `facts.annulation.regle`. |
| V5-Abonnement | 10 | « Rentable dès la 3e sortie du mois », spec §6.2 alignée. | — |
| V5-Paiement | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Paiement-ok | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Reglages | 10 | « Mes quartiers » retiré, trajet seul : réglé. | — |
| V5-Confidentialite | 9 | Duo et Ange : réglé. Pas de ligne fiabilité, contacts évités, cartes (spec §2.16) : pas encore « la » liste. | Trois lignes générées depuis §3. |
| V5-Signaler | 9 | « moins d'1 h pendant toute ta sortie » : réglé. Le chiffre 1 h coexiste avec 5 min (W-Ange-aide) sans distinction alerte/rappel. | Légende commune des deux délais. |
| V5-Supprimer | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Chargement | 10 | Jour calculé par créneau (jeudi → lundi, samedi → mercredi) : réglé. | — |
| V5-Erreur-reseau | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Paiement-echec | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Verif-echec | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Notifs-refus | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| V5-Chats-vide | 10 | « Voir quand arrive ma proposition » : réglé. | — |
| L-Effectif | 9 | Un seul mot (« place réservée ») et une base (HT) : réglé. « Relevé de novembre » qui liste le jeu. 29 oct. | Période du relevé juste (« 29 oct. – 25 nov. ») ou mois calendaire. |
| L-Creneaux | 10 | Une action claire, vocabulaire constant, rien à mémoriser. | — |
| L-Contrat | 9 | « 4,99 € TTC (4,16 € HT) » puis « 3 € HT » : une base de plus que nécessaire ; imprévu et sécurité non nommés. | « 4,16 € HT » seul ; nommer imprévu et sécurité. |

## Les 3 changements qui feraient monter ma note le plus

1. Spec §2.7, §2.11, §2.13, §6.5, §10.2 recopient `facts.regles` (annulation, vote sans défaut, prénom aux visages, « à la confirmation ou après », « ton rendez-vous »), et check-facts compare aussi la spec.
2. Deux étiquettes, deux règles, partout : « Pour ma sécurité » (remboursé) et « Imprévu » (non remboursé) ; « Je ne le sens pas » et « mal à l'aise » rangés explicitement dans l'une des deux.
3. Plus aucune date en dur : Attente (mer. 18 nov. 21 h), Pas-encore (jour calculé), Trouvée-Lyon (pas de sortie promise avant sa composition), Trouvée sans « comme demandé dans Affiner » ; puis un 2e test 5 secondes sur Chats, Chargement et Les visages.

## Je mets 10 si…

Je mets 10 si un diff automatique écrans ↔ spec-v5 ne trouve plus aucune règle à deux versions (annulation, vote, prénom du duo, « Blowy annule », astreinte de rendez-vous, délais 5 min / 1 h), si les écrans n'utilisent que deux étiquettes pour annuler après 18 h (sécurité / imprévu), si Confidentialité est la seule liste « qui voit quoi » (V5-Ange y renvoie ; fiabilité, contacts, cartes compris), si aucune date de composition n'est écrite en dur, et si un 2e test 5 secondes répond juste sur Chats, Chargement et Les visages.
