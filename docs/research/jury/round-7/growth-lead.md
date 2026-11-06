# Jury tour 7 — growth-lead (Growth lead (ex-Hinge, ex-BeReal))

**Verdict** : Mes trois demandes du tour 6 sont faites à l'écran (Chargement calculé, Mes cartes en vraies miniatures, plus de « Viens jeudi prochain »), mais l'écran qui pousse à recruter (Bordeaux) donne une date limite postérieure à la composition, quatre écrans proposent une sortie précise avant qu'elle soit composée, le Duo est toujours à égalité au 5/9, et rien n'est encore mesuré.

**Note globale : 9/10** (T1 5 · T2 7 · T3 8 · T4 9 · T5 9 · T6 9 · T7 9)

| Critère | Note |
|---|---|
| Compréhension | 9 |
| Charge cognitive | 9 |
| Envie | 9 |
| Vraie rencontre | 9 |
| Sécurité et confiance | 9 |
| Viralité | 9 |
| Argent | 9 |
| Finition visuelle | 9 |

## Suivi de mes reproches du tour 6

- **Heure de proposition calculée (T6 n° 1)** : fait sur V5-Chargement et dans la spec (D-075, E1 fermé côté serveur). **Pas fait** sur V5-Pas-encore(-nantes) (« mardi à 21 h » en dur) ; reste E26 (contenus) à faire.
- **Mes cartes : vraies miniatures + slug (T6 n° 2)** : fait.
- **« Viens jeudi prochain »** : fait (« Trouve ta sortie »).
- **Duo hors du point de décision (T6 n° 3)** : pas fait, 5e tour.
- **Bordeaux « inscrits » → « vérifiées »** : pas fait.
- **Lyon « semaine d'après » promise avant composition** : pas fait, et précisé (heure, quartier) : la promesse est plus forte.
- **Mesures (Welcome → 1re sortie, selfie, slug, parrainage)** : rien de publié ; business-model V5.6 fixe enfin les seuils et le coût du parrainage (≈ 1,15 € par sortie).

## Contrôles

`node design/v5/check-facts.mjs` : 104 fichiers, 6 925 vérifications, 0 contradiction. `a11y-audit.mjs` lancé comme le README l'indique (`.local/dc-runtime.js`) : 104 écrans, 1 520 textes, 564 cibles, 1 569 blocs, 0 problème, contraste min 4,53:1 (lancé sans argument, il sort 3 « problèmes » d'outillage : `{{blockMark}}` non résolu sur V5-Signaler, « Voir ma ville » à 888 px sur W-Repondre ; les rendus PNG sont propres). `tooling/qa/layout/overflow.mjs` : aucun signalement. Les 104 rendus ouverts (planches 4 par 4, lieu en taille réelle). Ce que les outils ne voient pas, relevé à la main : (1) **V5-Revelation** n'a aucun bouton « je pars pour ma sécurité » : les deux sorties proposées sont « Je connais quelqu'un ici » (1 fois par mois) et « Je ne le sens pas · imprévu » (place **non remboursée**), alors que « partir mal à l'aise » sur place (V5-Checkin-ok) est une sortie pour sécurité **remboursée** : ne pas venir coûte, venir puis partir ne coûte rien ; (2) « « Je connais quelqu'un ici » : 1 fois par mois, place remboursée » sur 10 écrans, sans la suite du concept A.1 / spec §2.7 (D-073) : « au-delà, sortie pour ta sécurité, sans pénalité » ; (3) W-Ange-aide « appelle Alex sous 5 min » : `facts.sla.aide` = 5 min, mais spec `[T] safety.humanResponseMinutes` = 60, §7.4 `responseMinutes:60`, et business-model ne dimensionne aucun délai de 5 min ; la même page, adressée à l'ange, dit « pendant toute **ta** sortie » ; (4) V5-RdvDuo, V5-RdvDuo-lea, V5-Duo-hh-rdv : « joignable pendant toute ta sortie » sur un rendez-vous, alors que concept A.5 et le glossaire de la spec disent « ta sortie ou ton rendez-vous » (la phrase canonique de `facts.regles.astreinte` a gardé la moitié) ; (5) spec §2.7 cite comme phrase « affichée à l'identique partout » « …sauf si tu pars pour ta sécurité (toujours possible, remboursé) ou pour un imprévu (1 fois par mois, non remboursé) », texte qu'aucun écran n'affiche ; spec §6.5 et §10.2 : « Si Blowy annule une sortie confirmée, le lieu reçoit 3 € par place réservée », écrans et contrat : « Sortie annulée par Blowy à la confirmation ou après : 3 € HT… » ; et spec §2.6 (`→ CANCELLED` à `lockAt` si < 4 : remboursements, aucune compensation ; §6.5 « avant la confirmation : 0 ») contre V5-Sortie-annulee (annulée à 18 h à la confirmation → 3 € HT au lieu) ; (6) spec §2.11 « **Non par défaut** » contre V5-Apres (aucune pastille cochée) ; spec §2.13 / §3.2 (prénom dès `EXCHANGE`) contre V5-Duo, V5-Lien et Confidentialité (« le prénom, aux visages ») ; (7) business-model V5.6 : le tableau d'astreinte calcule un point mort à 80 sorties/jour avec 7,59 €, le texte en dessous à 134 avec 4,49 € ; « Duo à une table de 2 : sans garantie ni compensation pour le lieu, 0 € » contre spec §2.13 / §6.5 et L-Creneaux (« même règle de compensation ») ; spec §10.1 « volume national **du soir** » ; (8) L-Effectif : « Relevé de novembre » qui commence au « jeu. 29 oct. » ; effectif limité au jeudi alors que L-Creneaux ouvre mardi, samedi, dimanche et une table de 2 ; L-Contrat art. 3 ne nomme ni la sortie pour sécurité ni l'imprévu (une place **payée** libérée pour sécurité vaut 4,16 € HT d'après le contrat, 3 € HT d'après la spec §6.5) ; le message d'accueil n'existe dans aucune section de la spec et n'apparaît pas sur V5-Confirmation ; (9) V5-Attente : « Si elles arrivent d'ici le jeu. 19 nov. » pour le sam. 21 nov., composé le mer. 18 nov. 21 h (J − 3) ; V5-Pas-encore et V5-Pas-encore-nantes : « On te prévient mardi à 21 h » (`facts.nantes.prevenu` en dur) alors que la spec calcule l'état honnête le vendredi 21 h W−1 et que le jeudi de Nantes se compose le lundi ; (10) V5-Trouvee : « Lieu calme, comme demandé dans Affiner » sur la 1re Trouvée, juste après l'onboarding (Affiner est « plus tard », écran 26) ; V5-Welcome « 60 ans et plus » contre la grille « 50 ans et plus » ; (11) Confidentialité n'a pas de ligne fiabilité (« Personne : tes votes, ta position, ton âge exact, ce que tu cherches »), ni contacts évités ni cartes (spec §2.16) ; V5-Ange garde sa propre liste ; (12) V5-Cartes : « Chaque carte … s'exporte en vidéo de 5 s » alors que « 3 mots » (V5-Story) et « Inviter » n'ont pas ce bouton ; aucun aperçu vidéo nulle part ; (13) spec §11.4 : E22 (sortie pour sécurité non compensée au lieu), E23 (« je connais quelqu'un » hors quota = **absence** dans le code), E24 (fiabilité exposée aux autres dans les contrats) sont « à faire » ; (14) V5-Team « GARDER LA PLACE DE TOM (30 MIN) » toujours plein bord ; V5-Revelation et V5-Duo-hh-visages « les captures sont détectées et signalées » (absolu).

## Écran par écran

| Écran | Note | Ce qui empêche le 10 | Correction attendue |
|---|---|---|---|
| V5-Welcome | 9 | « Une sortie dès 5 personnes, partout » : promesse d'acquisition que business-model finance à 134 sorties/jour au niveau national (≈ 670 participants/jour) ; avant ce volume, chaque sortie coûte. | Garder, mais le test de 8 semaines doit mesurer le volume national, pas Paris 11e seul. |
| V5-Ville | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Ville-bordeaux | 9 | « Environ 60 inscrits » : la spec compte des personnes **vérifiées** actives (`facts` : 64 vérifiées) ; un inscrit sans selfie ne forme pas de sortie (T6, non traité). | « Environ 60 personnes vérifiées ». |
| V5-Toi | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Genre | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Pet | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Rencontrer | 8 | 5e tour : « À deux, par écrit » et « Groupe et duo » à égalité avec « En petit groupe » au 5/9 ; la voie Duo n'invite personne (pas de « venir avec », pas de carte), donc chaque inscrit qui la prend sort du canal viral. | Duo proposé après la 1re sortie vécue, ou A/B mesuré sur cet écran. |
| V5-Intention | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Consentement | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Toi-plus | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Dispos | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Dispos-semaines | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Eviter | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Erreur-age | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Trouvee | 9 | Écran juste. « Lieu calme, comme demandé dans Affiner » sur la 1re Trouvée, avant qu'Affiner existe pour Alex ; invitation toujours en lien texte sous le bouton. | Retirer la phrase ; invitation en carte. |
| V5-Trouvee-lyon | 8 | « Et la semaine d'après : mar. 24 nov. · 19 h 30 · Atelier céramique, Lyon 1er » : composée le sam. 21 nov. 21 h au plus tôt. Si elle n'a pas lieu, promesse cassée dans la ville d'amorçage (T6, aggravé : heure et quartier ajoutés). | « Prochaine composition sam. 21 nov. 21 h, sur tes créneaux ». |
| V5-Sortie-lyon | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Confirmation-lyon | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Trouvee-banlieue | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Sortie-banlieue | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Confirmation-banlieue | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Pas-encore | 9 | « On te prévient mardi à 21 h » codé en dur (D-075 l'interdit) ; « La voie Duo » est l'issue proposée, pas « inviter quelqu'un de compatible ». | Jour calculé ; mesurer la part qui choisit « Sortir quand même ». |
| V5-Ville-nantes | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Trouvee-nantes | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Sortie-nantes | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Pas-encore-nantes | 8 | « mardi à 21 h » alors que le jeudi de Nantes se compose le lundi 21 h (V5-Trouvee-nantes) : deux heures pour Camille. | Jour calculé depuis le créneau. |
| V5-Sortie | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Team | 9 | Parrainage clair. Bouton « GARDER LA PLACE DE TOM (30 MIN) » plein bord (T6, non traité). | Libellé court. |
| V5-Partage-invitation | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Invite | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Compte | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Verif | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Notifs | 9 | « lun. 21:00 · Une sortie pour toi cette semaine » : juste pour le jeudi seulement ; Alex a aussi le samedi (Réglages). | Deux exemples ou l'heure du 1er créneau. |
| V5-Sortie-inscrit | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Accueil | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Accueil-discret | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Accueil-duo | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Pause | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Chats | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Groupe | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Groupe-menu | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Attente | 8 | « Si elles arrivent d'ici le jeu. 19 nov., elle a lieu » : le sam. 21 nov. est composé le mer. 18 nov. 21 h ; quelqu'un qui recrute le jeudi pense avoir sauvé la sortie et elle n'a pas lieu. C'est l'écran qui pousse à inviter : la date fausse casse la boucle. | « d'ici le mer. 18 nov. 21 h ». |
| V5-Partage-ville | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Amorcage | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Amorcage-solo | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Sortie-complete | 9 | « On te propose jeu. 19 nov., Bloc d'escalade, salle du 11e » le 9 nov., une semaine avant sa composition (lun. 16 nov. 21 h) : le moteur ne peut pas tenir cette offre telle quelle. | « Ton créneau du jeu. 19 nov. est retenu : réponse lun. 16 nov. 21 h ». |
| V5-Sortie-annulee | 9 | Même proposition datée (jeu. 19 nov., activité, quartier) avant composition. | Idem. |
| V5-Affiner | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Affiner-histoire | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Affiner-age | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Affiner-ambiance | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Confirmation | 10 | Partage retiré (Sarah), photo du lieu annoncée honnêtement. | — |
| V5-Partage-confirmation | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Revelation | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Partage-checkin | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Ange | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| W-Ange | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| W-Ange-aide | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Checkin | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Checkin-ok | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Souvenir | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Apres | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Apres-resultats | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Partage-jeudi | 9 | « Vidéo 5 s » sans aperçu avant export. | Aperçu jouable. |
| V5-Partage | 10 | « Trouve ta sortie » au lieu de « Viens jeudi prochain », verres dessinés sans légende : réglé. | — |
| V5-Partage-dimanche | 10 | Porte ouverte : carte distincte de « Ma bande ». | — |
| V5-Apres-aucun | 9 | « Voir le jeu. 19 nov. » : même sortie promise avant composition. | Idem. |
| V5-Bande | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Partage-bande | 9 | Idem : pas d'aperçu. | Aperçu jouable. |
| V5-Rue | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Duo | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Lien | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Duo-hh-proposition | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Duo-hh | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Duo-hh-visages | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Duo-hh-rdv | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Lien-debloque | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-RdvDuo | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Chat | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-RdvDuo-lea | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Oeuf | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Rupture | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Cartes | 9 | Neuf vraies miniatures, slugs visibles : réglé (T6 n° 2). « Chaque carte s'exporte en vidéo » faux pour 3 mots et Inviter. | Corriger la phrase ; « Vidéo 5 s » sur 3 mots. |
| V5-Story | 9 | Seule carte publique sans « Vidéo 5 s ». | Ajouter. |
| W-Repondre | 9 | « Et toi, tu sors où ? » sans le slug d'attribution visible : la page 3 mots est le seul point d'entrée d'un non-inscrit qui ne dit pas qu'elle compte pour le parrainage d'Alex. | « Alex t'offre ta 1re sortie » si le parrainage s'applique. |
| V5-Profil | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Fiche | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Tarifs | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Abonnement | 10 | « Rentable dès la 3e sortie du mois », spec alignée. | — |
| V5-Paiement | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Paiement-ok | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Reglages | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Confidentialite | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Signaler | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Supprimer | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Chargement | 10 | Heure calculée par créneau (jeudi → lundi 21 h, samedi → mercredi 21 h) : réglé (T6 n° 1). | — |
| V5-Erreur-reseau | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Paiement-echec | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Verif-echec | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Notifs-refus | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| V5-Chats-vide | 10 | « Voir quand arrive ma proposition » : réglé. | — |
| L-Effectif | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| L-Creneaux | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |
| L-Contrat | 10 | Rien qui freine l'acquisition ou la boucle hebdo sur cet écran. | — |

## Les 3 changements qui feraient monter ma note le plus

1. Aucune date proposée avant la composition : Attente (« d'ici le mer. 18 nov. 21 h »), Pas-encore (jour calculé), Trouvée-Lyon, Sortie-complete, Sortie-annulee et Pas d'accord annoncent le créneau retenu et l'heure de réponse, pas une sortie déjà décrite.
2. Duo sorti du 5/9 (proposé après la 1re sortie vécue), ou A/B mesuré : chaque inscrit passe d'abord par le canal qui invite.
3. Lancer le test de 8 semaines avec l'attribution par slug (E16) et publier : Welcome → 1re sortie, chute au selfie, inscrits vérifiés par sortie vécue, part des 1res sorties venues par un lien.

## Je mets 10 si…

Je mets 10 si le test de 8 semaines mesure dans le 11e Welcome → 1re sortie vécue ≥ 25 % et une chute au selfie < 30 %, si chaque sortie vécue produit ≥ 0,3 inscrit vérifié attribué par slug, si le parrainage « sortie offerte » est mesuré, si Bordeaux passe de « il manque 2 » à une sortie vécue en moins de 3 semaines, et si aucun écran ne promet une date ou une sortie que la composition J − 3 21 h ne garantit pas (Attente, Pas-encore, Trouvée-Lyon, propositions de remplacement).
