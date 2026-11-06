# Jury tour 6 — createrice-tiktok (Créatrice TikTok (lifestyle, 180 k abonnés))

**Verdict** : Je peux enfin filmer « ALORS, JEUDI ? » et ma bande sans flouter (mode capture, pets génériques) et exporter 5 s de vidéo, mais « Mes cartes » montre 9 rectangles de couleur vides, la carte du vendredi a toujours besoin d'écrire « 5 verres, 1 table » dans son dessin, et la vidéo n'existe que sur 3 cartes, sans aperçu.

**Note globale : 9/10** (T1 5 · T2 7 · T3 8 · T4 9 · T5 9 · T6 9)

| Critère | Note |
|---|---|
| Compréhension | 9 |
| Charge cognitive | 9 |
| Envie | 9 |
| Vraie rencontre | 8 |
| Sécurité et confiance | 9 |
| Viralité | 9 |
| Argent | 8 |
| Finition visuelle | 9 |

## Suivi de mes reproches du tour 5

- **Mode capture sur Apres et Bande (T5 n° 1)** : fait par cartes dédiées (V5-Partage-jeudi, V5-Partage-bande : « ni prénoms, ni votes, ni pets des autres »).
- **Export vidéo (T5 n° 2)** : fait (« Vidéo 5 s » sur Alors jeudi, On était 5, Ma bande) ; aucun aperçu, absent des cartes du lundi, du jeudi et du dimanche.
- **Mes cartes en vignettes 9:16 (T5 n° 3)** : grille faite, **contenu absent** (dégradés vides).
- **Verres vraiment dessinés sur « On était 5 »** : **pas fait** : toujours 5 ronds colorés et la légende « 5 verres, 1 table » au centre, alors que V5-Souvenir dessine de vrais verres à moitié pleins.
- **Objet du dimanche** : pas fait : « Ma bande s'agrandit » et « Ma bande » ont la même composition (rangée de blobs à deux yeux), seule la couleur change.

## Contrôles

`node design/v5/check-facts.mjs` : 97 fichiers, 6 039 vérifications, 0 contradiction. `a11y-audit.mjs` : 97 écrans, 1 423 textes, 538 cibles, 1 462 blocs mesurés, 0 problème, contraste min 4,53:1. `tooling/qa/layout/overflow.mjs` : aucun signalement (ni texte hors cadre, ni plage coupée). Ce que ces outils ne voient pas, relevé à la main sur les rendus et les sources : (1) la règle d'annulation canonique, présente sur 8 écrans, met « ta sécurité » sous la parenthèse « chacun 1 fois par mois, sans pénalité, place non remboursée », alors que spec §2.7 dit `SAFETY_EXIT` « à tout moment, remboursée » et que V5-Groupe-menu dit « Pour ta sécurité, toujours » ; (2) « les soirs de sortie » subsiste pour le délai d'1 h (V5-Groupe-menu, V5-Signaler) alors que l'astreinte couvre maintenant samedi 15 h, dimanche 11 h et les rendez-vous ; (3) spec révision 5 ≠ écrans sur la fiabilité (§3.1 et §2.13 : visible du groupe et du duo ; V5-Fiche : « Toi seul vois ce chiffre »), le vote (§2.11 « Non par défaut » ; V5-Apres : aucun état), Blowy+ (§6.2 « rentable dès la 2ᵉ sortie » ; V5-Abonnement : « 3 sorties par mois », et 2 × 4,99 = 9,98 < 9,99) ; (4) `business-model.md` est encore titré V5.4 : astreinte « 18 h à 2 h … par soir et par ville », point mort par ville, aucune ligne tables à deux, parrainage, imprévu ni « Blowy annule », alors que concept-v5.5 §D.13 et spec §10.1 renvoient à un calcul national qui n'existe pas ; (5) V5-Chargement promet « lundi à 21 h » quel que soit le créneau (samedi composé le mercredi 21 h, spec §1.1) ; (6) L-Effectif additionne 4,99 € (TTC) et 3 € = 7,99 €, le contrat dit 4,16 € HT, la spec §6.5 un « total HT » ; « par place réservée » (L-Effectif, spec) contre « par place prévue » (L-Contrat, V5-Sortie-annulee) ; (7) V5-Lien : rendez-vous « Quand vous voulez » contre V5-Duo-hh « Dans un lieu partenaire, à une heure couverte par l'équipe » ; (8) V5-Dispos-semaines « 28 déc.... » (quatre points).

## Écran par écran

| Écran | Note | Ce qui empêche le 10 | Correction attendue |
|---|---|---|---|
| V5-Welcome | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Ville | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Ville-bordeaux | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Toi | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Genre | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Pet | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Rencontrer | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Intention | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Consentement | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Toi-plus | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Dispos | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Dispos-semaines | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Eviter | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Erreur-age | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Trouvee | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Trouvee-lyon | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Sortie-lyon | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Confirmation-lyon | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Trouvee-banlieue | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Sortie-banlieue | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Confirmation-banlieue | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Pas-encore | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Sortie | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Team | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Partage-invitation | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Invite | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Compte | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Verif | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Notifs | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Sortie-inscrit | 8 | « Tu y vas. » : toujours pas de micro-animation exportable (T3–T5). | Animation 1 s exportable. |
| V5-Accueil | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Accueil-discret | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Accueil-duo | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Pause | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Chats | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Groupe | 8 | « Ton dimanche idéal, en 3 mots » : les réponses des autres ne m'appartiennent pas (T3–T5). | Export « mes 3 mots » seuls. |
| V5-Groupe-menu | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Attente | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Partage-ville | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Amorcage | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Amorcage-solo | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Sortie-complete | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Sortie-annulee | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Affiner | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Affiner-histoire | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Affiner-age | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Affiner-ambiance | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Confirmation | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Partage-confirmation | 9 | Enveloppe scellée lisible ; pas de vidéo pour le lundi, le jour où j'annonce. | « Vidéo 5 s ». |
| V5-Revelation | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Partage-checkin | 9 | Chevalet lisible sans légende ; pas de vidéo. | « Vidéo 5 s ». |
| V5-Ange | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| W-Ange | 8 | Adresse à flouter : contenu sécurité, pas à filmer. | — |
| W-Ange-aide | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Checkin | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Checkin-ok | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Souvenir | 9 | Les verres sont enfin dessinés ici : il faut les reprendre sur la carte du vendredi. | — |
| V5-Apres | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Apres-resultats | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Partage-jeudi | 9 | Mon plan storytime est enfin filmable ; « Vidéo 5 s » sans aperçu ni choix de durée. | Aperçu jouable. |
| V5-Partage | 8 | « 5 verres, 1 table » écrit dans le dessin ; les 5 ronds sont les pastilles du Welcome, pas des verres (T5 non traité). « Viens jeudi prochain » : je ne peux pas promettre ça à mes abonnés. | Reprendre les verres de V5-Souvenir, sans légende ; « Trouve ta sortie ». |
| V5-Partage-dimanche | 8 | Même rangée de blobs que « Ma bande » (4 au lieu de 3) : deux cartes jumelles ; pas d'export vidéo pour le jour du résultat. | Un objet propre au dimanche (enveloppe ouverte, porte de Ta rue) ; « Vidéo 5 s ». |
| V5-Apres-aucun | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Bande | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Partage-bande | 9 | Mode capture fait ; vidéo sans aperçu. | Aperçu 5 s. |
| V5-Rue | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Duo | 8 | La voie Duo ressemble encore à une app de dating : pas mon contenu. | — |
| V5-Lien | 8 | Messages privés, voulu. | — |
| V5-Duo-hh | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Lien-debloque | 8 | Visage et vocal d'une autre : privé, et c'est voulu. | — |
| V5-RdvDuo | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Chat | 8 | Messages privés, voulu. | — |
| V5-RdvDuo-lea | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Oeuf | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Rupture | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Cartes | 7 | 9 vignettes = 9 dégradés vides : je ne reconnais aucune de mes cartes, impossible de choisir la bonne en 1 s. | Miniature réelle de chaque carte. |
| V5-Story | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| W-Repondre | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Profil | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Fiche | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Tarifs | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Abonnement | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Paiement | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Paiement-ok | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Reglages | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Confidentialite | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Signaler | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Supprimer | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Chargement | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Erreur-reseau | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Paiement-echec | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Verif-echec | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Notifs-refus | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Chats-vide | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| L-Effectif | 8 | « Le bar qui reçoit 5 inconnus » : bon sujet, mais prénoms à l'écran. | Vue sans prénoms pour la presse. |
| L-Creneaux | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| L-Contrat | 9 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |

## Les 3 changements qui feraient monter ma note le plus

1. Mes cartes avec les vraies miniatures de mes cartes.
2. Carte du vendredi : les verres de V5-Souvenir, sans légende ; carte du dimanche avec son propre objet.
3. « Vidéo 5 s » avec aperçu sur toutes les cartes publiques (lundi, jeudi, dimanche compris).

## Je mets 10 si…

Je mets 10 si je tourne lundi → dimanche entièrement depuis des exports de l'app, sans flouter, avec sept cartes dont chaque dessin se comprend sans légende et ne ressemble à aucune autre, si Mes cartes me montre ces sept cartes en miniature, et si chacune s'exporte en vidéo de 5 s avec un aperçu avant de publier.
