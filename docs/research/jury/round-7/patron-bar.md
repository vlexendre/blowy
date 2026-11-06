# Jury tour 7 — patron-bar (Patron de bar (Paris 11e))

**Verdict** : Mon relevé est enfin en HT et retombe sur le contrat (7,16 € HT), « place réservée » est le seul mot, mes tables de 2 comptent dans le plafond et mon message d'accueil existe : je signe ; il reste un relevé de « novembre » qui commence le 29 octobre, un effectif qui ne montre qu'un créneau sur cinq, un contrat muet sur la sortie pour sécurité, et une spec qui ne connaît ni mon message ni la compensation quand la sortie tombe à 18 h.

**Note globale : 9/10** (T1 4 · T2 6 · T3 7 · T4 8 · T5 9 · T6 9 · T7 9)

| Critère | Note |
|---|---|
| Compréhension | 9 |
| Charge cognitive | 9 |
| Envie | 9 |
| Vraie rencontre | 9 |
| Sécurité et confiance | 9 |
| Viralité | 8 |
| Argent | 9 |
| Finition visuelle | 9 |

## Suivi de mes reproches du tour 6

- **Relevé en HT, au centime du contrat (T6 n° 1)** : fait (4,16 € HT + 3 € HT = 7,16 € HT, TVA en sus). Période du relevé fausse (29 oct. dans « novembre »).
- **Un seul mot « place réservée »** : fait (L-Effectif, L-Contrat, Sortie-annulee, spec).
- **Ce que je touche quand la sortie tombe à 18 h** : dit côté client et contrat (« à la confirmation ou après : 3 € HT ») ; **contredit par la spec** §2.6 / §6.5.
- **Message d'accueil (T3 → T6)** : fait côté lieu et annoncé dans le chat ; absent de V5-Confirmation et de la spec.
- **Tous mes créneaux dans l'effectif** : pas fait.
- **Rappel rapide pour un incident en salle** : pas fait (« sous 1 h »).
- **« 3 € HT » et imprévu nommé au contrat** : « 3 € HT » fait ; imprévu et sécurité non nommés.

## Contrôles

`node design/v5/check-facts.mjs` : 104 fichiers, 6 925 vérifications, 0 contradiction. `a11y-audit.mjs` lancé comme le README l'indique (`.local/dc-runtime.js`) : 104 écrans, 1 520 textes, 564 cibles, 1 569 blocs, 0 problème, contraste min 4,53:1 (lancé sans argument, il sort 3 « problèmes » d'outillage : `{{blockMark}}` non résolu sur V5-Signaler, « Voir ma ville » à 888 px sur W-Repondre ; les rendus PNG sont propres). `tooling/qa/layout/overflow.mjs` : aucun signalement. Les 104 rendus ouverts (planches 4 par 4, lieu en taille réelle). Ce que les outils ne voient pas, relevé à la main : (1) **V5-Revelation** n'a aucun bouton « je pars pour ma sécurité » : les deux sorties proposées sont « Je connais quelqu'un ici » (1 fois par mois) et « Je ne le sens pas · imprévu » (place **non remboursée**), alors que « partir mal à l'aise » sur place (V5-Checkin-ok) est une sortie pour sécurité **remboursée** : ne pas venir coûte, venir puis partir ne coûte rien ; (2) « « Je connais quelqu'un ici » : 1 fois par mois, place remboursée » sur 10 écrans, sans la suite du concept A.1 / spec §2.7 (D-073) : « au-delà, sortie pour ta sécurité, sans pénalité » ; (3) W-Ange-aide « appelle Alex sous 5 min » : `facts.sla.aide` = 5 min, mais spec `[T] safety.humanResponseMinutes` = 60, §7.4 `responseMinutes:60`, et business-model ne dimensionne aucun délai de 5 min ; la même page, adressée à l'ange, dit « pendant toute **ta** sortie » ; (4) V5-RdvDuo, V5-RdvDuo-lea, V5-Duo-hh-rdv : « joignable pendant toute ta sortie » sur un rendez-vous, alors que concept A.5 et le glossaire de la spec disent « ta sortie ou ton rendez-vous » (la phrase canonique de `facts.regles.astreinte` a gardé la moitié) ; (5) spec §2.7 cite comme phrase « affichée à l'identique partout » « …sauf si tu pars pour ta sécurité (toujours possible, remboursé) ou pour un imprévu (1 fois par mois, non remboursé) », texte qu'aucun écran n'affiche ; spec §6.5 et §10.2 : « Si Blowy annule une sortie confirmée, le lieu reçoit 3 € par place réservée », écrans et contrat : « Sortie annulée par Blowy à la confirmation ou après : 3 € HT… » ; et spec §2.6 (`→ CANCELLED` à `lockAt` si < 4 : remboursements, aucune compensation ; §6.5 « avant la confirmation : 0 ») contre V5-Sortie-annulee (annulée à 18 h à la confirmation → 3 € HT au lieu) ; (6) spec §2.11 « **Non par défaut** » contre V5-Apres (aucune pastille cochée) ; spec §2.13 / §3.2 (prénom dès `EXCHANGE`) contre V5-Duo, V5-Lien et Confidentialité (« le prénom, aux visages ») ; (7) business-model V5.6 : le tableau d'astreinte calcule un point mort à 80 sorties/jour avec 7,59 €, le texte en dessous à 134 avec 4,49 € ; « Duo à une table de 2 : sans garantie ni compensation pour le lieu, 0 € » contre spec §2.13 / §6.5 et L-Creneaux (« même règle de compensation ») ; spec §10.1 « volume national **du soir** » ; (8) L-Effectif : « Relevé de novembre » qui commence au « jeu. 29 oct. » ; effectif limité au jeudi alors que L-Creneaux ouvre mardi, samedi, dimanche et une table de 2 ; L-Contrat art. 3 ne nomme ni la sortie pour sécurité ni l'imprévu (une place **payée** libérée pour sécurité vaut 4,16 € HT d'après le contrat, 3 € HT d'après la spec §6.5) ; le message d'accueil n'existe dans aucune section de la spec et n'apparaît pas sur V5-Confirmation ; (9) V5-Attente : « Si elles arrivent d'ici le jeu. 19 nov. » pour le sam. 21 nov., composé le mer. 18 nov. 21 h (J − 3) ; V5-Pas-encore et V5-Pas-encore-nantes : « On te prévient mardi à 21 h » (`facts.nantes.prevenu` en dur) alors que la spec calcule l'état honnête le vendredi 21 h W−1 et que le jeudi de Nantes se compose le lundi ; (10) V5-Trouvee : « Lieu calme, comme demandé dans Affiner » sur la 1re Trouvée, juste après l'onboarding (Affiner est « plus tard », écran 26) ; V5-Welcome « 60 ans et plus » contre la grille « 50 ans et plus » ; (11) Confidentialité n'a pas de ligne fiabilité (« Personne : tes votes, ta position, ton âge exact, ce que tu cherches »), ni contacts évités ni cartes (spec §2.16) ; V5-Ange garde sa propre liste ; (12) V5-Cartes : « Chaque carte … s'exporte en vidéo de 5 s » alors que « 3 mots » (V5-Story) et « Inviter » n'ont pas ce bouton ; aucun aperçu vidéo nulle part ; (13) spec §11.4 : E22 (sortie pour sécurité non compensée au lieu), E23 (« je connais quelqu'un » hors quota = **absence** dans le code), E24 (fiabilité exposée aux autres dans les contrats) sont « à faire » ; (14) V5-Team « GARDER LA PLACE DE TOM (30 MIN) » toujours plein bord ; V5-Revelation et V5-Duo-hh-visages « les captures sont détectées et signalées » (absolu).

## Écran par écran

| Écran | Note | Ce qui empêche le 10 | Correction attendue |
|---|---|---|---|
| V5-Welcome | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Ville | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Ville-bordeaux | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Toi | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Genre | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Pet | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Rencontrer | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Intention | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Consentement | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Toi-plus | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Dispos | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Dispos-semaines | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Eviter | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Erreur-age | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Trouvee | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Trouvee-lyon | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Sortie-lyon | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Confirmation-lyon | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Trouvee-banlieue | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Sortie-banlieue | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Confirmation-banlieue | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Pas-encore | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Ville-nantes | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Trouvee-nantes | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Sortie-nantes | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Pas-encore-nantes | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Sortie | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Team | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Partage-invitation | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Invite | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Compte | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Verif | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Notifs | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Sortie-inscrit | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Accueil | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Accueil-discret | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Accueil-duo | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Pause | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Chats | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Groupe | 9 | « Le lieu partenaire vous écrira ici à la révélation » : bien annoncé. Mais la spec n'a aucun champ ni route pour ce message (§2.3, §10.2) : rien ne garantit qu'il sera codé. | Champ `Venue.welcomeMessage` + envoi à `lockAt` en spec. |
| V5-Groupe-menu | 10 | — | — |
| V5-Attente | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Partage-ville | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Amorcage | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Amorcage-solo | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Sortie-complete | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Sortie-annulee | 9 | Le client lit « à la confirmation ou après : 3 € HT par place réservée » : je touche donc quelque chose quand ça tombe à 18 h. La spec §2.6 et §6.5 dit 0 (« avant la confirmation »), la phrase de la spec dit « sortie confirmée ». Je ne sais pas laquelle Blowy appliquera. | Spec alignée sur l'écran et le contrat. |
| V5-Affiner | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Affiner-histoire | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Affiner-age | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Affiner-ambiance | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Confirmation | 9 | « Illustration · la photo du lieu arrive la veille » : honnête. Mon message d'accueil (« Demandez Sami ») n'apparaît pas ici, à 18 h, alors que L-Effectif dit « envoyé avec la confirmation ». | Bloc « Message du lieu » sous l'adresse. |
| V5-Partage-confirmation | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Revelation | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Partage-checkin | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Ange | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| W-Ange | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| W-Ange-aide | 10 | SMS au référent, « son personnel n'intervient pas à la place de l'équipe » : clair pour moi. | — |
| V5-Checkin | 10 | « Pas de chevalet ? Demande au comptoir la table Blowy » : mon personnel sait quoi faire. | — |
| V5-Checkin-ok | 9 | « 4 sur 5 arrivés » : la même présence doit arriver sur mon relevé, pas seulement « 1 absence ». | Présences horodatées dans le relevé détaillé. |
| V5-Souvenir | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Apres | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Apres-resultats | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Partage-jeudi | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Partage | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Partage-dimanche | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Apres-aucun | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Bande | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Partage-bande | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Rue | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Duo | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Lien | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Duo-hh-proposition | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Duo-hh | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Duo-hh-visages | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Duo-hh-rdv | 9 | Idem au Café Longchamp. | Idem. |
| V5-Lien-debloque | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-RdvDuo | 9 | Table à deux au Comptoir Gabriel : bon ; même règle de compensation côté lieu ; business-model dit l'inverse (« sans compensation, 0 € »). | Business-model aligné. |
| V5-Chat | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-RdvDuo-lea | 9 | Idem au Café Ginette. | Idem. |
| V5-Oeuf | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Rupture | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Cartes | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Story | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| W-Repondre | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Profil | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Fiche | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Tarifs | 10 | « son prix hors taxes est reversé au lieu (3 € HT si offerte ou Blowy+) » : réglé. | — |
| V5-Abonnement | 10 | « le lieu reçoit 3 € HT » : réglé. | — |
| V5-Paiement | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Paiement-ok | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Reglages | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Confidentialite | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Signaler | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Supprimer | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Chargement | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Erreur-reseau | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Paiement-echec | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Verif-echec | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Notifs-refus | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| V5-Chats-vide | 10 | Rien qui me concerne en tant que lieu sur cet écran. | — |
| L-Effectif | 8 | Relevé en HT (4,16 + 3 = 7,16 € HT, TVA en sus) et « place réservée » : réglé. Mais « Relevé de novembre » commence au **jeu. 29 oct.** : mon comptable ne rapproche pas. « Effectif de la semaine » ne montre que jeudi, alors que j'ai ouvert mardi, samedi, dimanche et une table de 2. « l'équipe rappelle sous 1 h » pour un refus de payer en plein service. Le message d'accueil est bien là, mais je ne vois pas ce que le client en reçoit. | Mois calendaire (ou période écrite) ; chaque créneau ouvert de la semaine avec « aucune table » si vide ; rappel < 15 min pour un incident en salle ; aperçu « ce que voient vos clients ». |
| L-Creneaux | 10 | Tables de 2 comprises dans le plafond, même règle : réglé. | — |
| L-Contrat | 8 | Art. 3 garde « 4,99 € TTC (4,16 € HT) » et ne nomme ni l'imprévu ni la sortie pour sécurité : un client payant qui part pour sa sécurité est « payé » au sens du contrat (4,16 €) mais la spec me donne 3 € HT ; et le code ne me verse rien dans ce cas (E22). | « 4,16 € HT si payée ; 3 € HT si offerte, Blowy+, imprévu remboursé ou non, sortie pour sécurité, je connais quelqu'un » ; E22 fermé. |

## Les 3 changements qui feraient monter ma note le plus

1. Contrat art. 3 et relevé qui nomment chaque cas (absence, imprévu, sortie pour sécurité, je connais quelqu'un, Blowy annule à 18 h) avec son montant HT, identiques à la spec §6.5, et E22 fermé.
2. Effectif de la semaine sur tous mes créneaux ouverts (tables de 2 comprises, « aucune table » si vide) et relevé sur une période juste.
3. Mon message d'accueil en spec (champ, envoi à 18 h) et visible sur la Confirmation du client ; une ligne « incident en salle » rappelée en moins de 15 min.

## Je mets 10 si…

Je mets 10 si mon relevé couvre exactement la période annoncée et retombe sur le contrat au centime, si le contrat, le relevé, l'écran client et la spec disent le même montant HT pour chaque cas (y compris sortie pour sécurité et sortie tombée à 18 h), si mon message d'accueil est en spec et s'affiche sur la Confirmation, et si l'effectif montre tous mes créneaux de la semaine.
