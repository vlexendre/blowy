# Jury tour 7 — createrice-tiktok (Créatrice TikTok (lifestyle, 180 k abonnés))

**Verdict** : Je peux maintenant tourner lundi → dimanche depuis l'app : sept cartes distinctes qui se lisent sans légende (les verres du vendredi, la porte du dimanche), toutes avec « Vidéo 5 s », et Mes cartes montre les vraies miniatures ; il me manque l'aperçu de la vidéo avant de publier, la vidéo sur la carte « 3 mots », et les deux petits moments que je demande depuis le tour 3 (« Tu y vas. » animé, mes 3 mots seuls).

**Note globale : 9/10** (T1 5 · T2 7 · T3 8 · T4 9 · T5 9 · T6 9 · T7 9)

| Critère | Note |
|---|---|
| Compréhension | 9 |
| Charge cognitive | 9 |
| Envie | 9 |
| Vraie rencontre | 8 |
| Sécurité et confiance | 9 |
| Viralité | 9 |
| Argent | 9 |
| Finition visuelle | 9 |

## Suivi de mes reproches du tour 6

- **Mes cartes en vraies miniatures (T6 n° 1)** : fait, neuf miniatures lisibles.
- **Verres du vendredi sans légende, objet propre au dimanche (T6 n° 2)** : faits (verres autour de la table, porte entrouverte).
- **Vidéo 5 s avec aperçu sur toutes les cartes publiques (T6 n° 3)** : vidéo faite sur lundi, jeudi, vendredi, dimanche, bande, ville ; **pas sur 3 mots** ; **aucun aperçu**.
- **« Tu y vas. » animé, « mes 3 mots » exportables** : pas faits (5e tour).

## Contrôles

`node design/v5/check-facts.mjs` : 104 fichiers, 6 925 vérifications, 0 contradiction. `a11y-audit.mjs` lancé comme le README l'indique (`.local/dc-runtime.js`) : 104 écrans, 1 520 textes, 564 cibles, 1 569 blocs, 0 problème, contraste min 4,53:1 (lancé sans argument, il sort 3 « problèmes » d'outillage : `{{blockMark}}` non résolu sur V5-Signaler, « Voir ma ville » à 888 px sur W-Repondre ; les rendus PNG sont propres). `tooling/qa/layout/overflow.mjs` : aucun signalement. Les 104 rendus ouverts (planches 4 par 4, lieu en taille réelle). Ce que les outils ne voient pas, relevé à la main : (1) **V5-Revelation** n'a aucun bouton « je pars pour ma sécurité » : les deux sorties proposées sont « Je connais quelqu'un ici » (1 fois par mois) et « Je ne le sens pas · imprévu » (place **non remboursée**), alors que « partir mal à l'aise » sur place (V5-Checkin-ok) est une sortie pour sécurité **remboursée** : ne pas venir coûte, venir puis partir ne coûte rien ; (2) « « Je connais quelqu'un ici » : 1 fois par mois, place remboursée » sur 10 écrans, sans la suite du concept A.1 / spec §2.7 (D-073) : « au-delà, sortie pour ta sécurité, sans pénalité » ; (3) W-Ange-aide « appelle Alex sous 5 min » : `facts.sla.aide` = 5 min, mais spec `[T] safety.humanResponseMinutes` = 60, §7.4 `responseMinutes:60`, et business-model ne dimensionne aucun délai de 5 min ; la même page, adressée à l'ange, dit « pendant toute **ta** sortie » ; (4) V5-RdvDuo, V5-RdvDuo-lea, V5-Duo-hh-rdv : « joignable pendant toute ta sortie » sur un rendez-vous, alors que concept A.5 et le glossaire de la spec disent « ta sortie ou ton rendez-vous » (la phrase canonique de `facts.regles.astreinte` a gardé la moitié) ; (5) spec §2.7 cite comme phrase « affichée à l'identique partout » « …sauf si tu pars pour ta sécurité (toujours possible, remboursé) ou pour un imprévu (1 fois par mois, non remboursé) », texte qu'aucun écran n'affiche ; spec §6.5 et §10.2 : « Si Blowy annule une sortie confirmée, le lieu reçoit 3 € par place réservée », écrans et contrat : « Sortie annulée par Blowy à la confirmation ou après : 3 € HT… » ; et spec §2.6 (`→ CANCELLED` à `lockAt` si < 4 : remboursements, aucune compensation ; §6.5 « avant la confirmation : 0 ») contre V5-Sortie-annulee (annulée à 18 h à la confirmation → 3 € HT au lieu) ; (6) spec §2.11 « **Non par défaut** » contre V5-Apres (aucune pastille cochée) ; spec §2.13 / §3.2 (prénom dès `EXCHANGE`) contre V5-Duo, V5-Lien et Confidentialité (« le prénom, aux visages ») ; (7) business-model V5.6 : le tableau d'astreinte calcule un point mort à 80 sorties/jour avec 7,59 €, le texte en dessous à 134 avec 4,49 € ; « Duo à une table de 2 : sans garantie ni compensation pour le lieu, 0 € » contre spec §2.13 / §6.5 et L-Creneaux (« même règle de compensation ») ; spec §10.1 « volume national **du soir** » ; (8) L-Effectif : « Relevé de novembre » qui commence au « jeu. 29 oct. » ; effectif limité au jeudi alors que L-Creneaux ouvre mardi, samedi, dimanche et une table de 2 ; L-Contrat art. 3 ne nomme ni la sortie pour sécurité ni l'imprévu (une place **payée** libérée pour sécurité vaut 4,16 € HT d'après le contrat, 3 € HT d'après la spec §6.5) ; le message d'accueil n'existe dans aucune section de la spec et n'apparaît pas sur V5-Confirmation ; (9) V5-Attente : « Si elles arrivent d'ici le jeu. 19 nov. » pour le sam. 21 nov., composé le mer. 18 nov. 21 h (J − 3) ; V5-Pas-encore et V5-Pas-encore-nantes : « On te prévient mardi à 21 h » (`facts.nantes.prevenu` en dur) alors que la spec calcule l'état honnête le vendredi 21 h W−1 et que le jeudi de Nantes se compose le lundi ; (10) V5-Trouvee : « Lieu calme, comme demandé dans Affiner » sur la 1re Trouvée, juste après l'onboarding (Affiner est « plus tard », écran 26) ; V5-Welcome « 60 ans et plus » contre la grille « 50 ans et plus » ; (11) Confidentialité n'a pas de ligne fiabilité (« Personne : tes votes, ta position, ton âge exact, ce que tu cherches »), ni contacts évités ni cartes (spec §2.16) ; V5-Ange garde sa propre liste ; (12) V5-Cartes : « Chaque carte … s'exporte en vidéo de 5 s » alors que « 3 mots » (V5-Story) et « Inviter » n'ont pas ce bouton ; aucun aperçu vidéo nulle part ; (13) spec §11.4 : E22 (sortie pour sécurité non compensée au lieu), E23 (« je connais quelqu'un » hors quota = **absence** dans le code), E24 (fiabilité exposée aux autres dans les contrats) sont « à faire » ; (14) V5-Team « GARDER LA PLACE DE TOM (30 MIN) » toujours plein bord ; V5-Revelation et V5-Duo-hh-visages « les captures sont détectées et signalées » (absolu).

## Écran par écran

| Écran | Note | Ce qui empêche le 10 | Correction attendue |
|---|---|---|---|
| V5-Welcome | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Ville | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Ville-bordeaux | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Toi | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Genre | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Pet | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Rencontrer | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Intention | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Consentement | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Toi-plus | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Dispos | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Dispos-semaines | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Eviter | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Erreur-age | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Trouvee | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Trouvee-lyon | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Sortie-lyon | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Confirmation-lyon | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Trouvee-banlieue | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Sortie-banlieue | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Confirmation-banlieue | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Pas-encore | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Ville-nantes | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Trouvee-nantes | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Sortie-nantes | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Pas-encore-nantes | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Sortie | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Team | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Partage-invitation | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Invite | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Compte | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Verif | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Notifs | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Sortie-inscrit | 8 | « Tu y vas. » : toujours aucune micro-animation exportable (T3 → T7) ; c'est le seul moment « j'ai réservé » de la semaine. | Animation 1 s exportable (Nino qui coche). |
| V5-Accueil | 10 | Nino dans le salon, « Jeudi, on joue. » : filmable tel quel. | — |
| V5-Accueil-discret | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Accueil-duo | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Pause | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Chats | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Groupe | 8 | « Ton dimanche idéal, en 3 mots » : les mots des autres ne m'appartiennent pas, je ne peux exporter les miens seuls (T3 → T7). | « Partager mes 3 mots » (les miens seuls, pet générique). |
| V5-Groupe-menu | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Attente | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Partage-ville | 9 | Carte ville exportable ; « Vidéo 5 s » est une icône de téléchargement : je ne vois pas la vidéo avant de l'exporter, ni sa durée réelle, ni le son. | Aperçu jouable 5 s (plein écran, boucle) avant « Enregistrer » ou « Story ». |
| V5-Amorcage | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Amorcage-solo | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Sortie-complete | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Sortie-annulee | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Affiner | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Affiner-histoire | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Affiner-age | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Affiner-ambiance | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Confirmation | 10 | Partage retiré, illustration honnête : rien à filmer, et c'est voulu. | — |
| V5-Partage-confirmation | 9 | Enveloppe scellée, lundi enfin exportable ; « Vidéo 5 s » est une icône de téléchargement : je ne vois pas la vidéo avant de l'exporter, ni sa durée réelle, ni le son. | Aperçu jouable 5 s (plein écran, boucle) avant « Enregistrer » ou « Story ». |
| V5-Revelation | 9 | « Partager « je sors ce soir » » en secondaire sous les visages : bien, mais l'écran contient des visages filigranés à mon prénom ; une créatrice filmera l'écran au lieu d'aller à la carte. | Mention « filme la carte, pas cet écran » ou flou automatique à l'enregistrement d'écran. |
| V5-Partage-checkin | 9 | Chevalet « Blowy », jeudi exportable ; « Vidéo 5 s » est une icône de téléchargement : je ne vois pas la vidéo avant de l'exporter, ni sa durée réelle, ni le son. | Aperçu jouable 5 s (plein écran, boucle) avant « Enregistrer » ou « Story ». |
| V5-Ange | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| W-Ange | 9 | Adresse en clair : contenu sécurité, pas à filmer. | — |
| W-Ange-aide | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Checkin | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Checkin-ok | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Souvenir | 10 | Table et verres dessinés, cohérents avec la carte du vendredi. | — |
| V5-Apres | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Apres-resultats | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Partage-jeudi | 9 | Mode capture parfait pour mon storytime ; « Vidéo 5 s » est une icône de téléchargement : je ne vois pas la vidéo avant de l'exporter, ni sa durée réelle, ni le son. | Aperçu jouable 5 s (plein écran, boucle) avant « Enregistrer » ou « Story ». |
| V5-Partage | 9 | Les 5 verres sont dessinés autour de la table, sans légende : réglé, la carte du vendredi se lit seule. Pas d'aperçu vidéo. | Aperçu jouable. |
| V5-Partage-dimanche | 9 | Porte entrouverte : enfin un objet propre au dimanche, plus de blobs jumeaux. Pas d'aperçu vidéo. | Aperçu jouable. |
| V5-Apres-aucun | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Bande | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Partage-bande | 9 | Blobs génériques, filmables ; « Vidéo 5 s » est une icône de téléchargement : je ne vois pas la vidéo avant de l'exporter, ni sa durée réelle, ni le son. | Aperçu jouable 5 s (plein écran, boucle) avant « Enregistrer » ou « Story ». |
| V5-Rue | 10 | Ta rue : décor filmable, pets de ma bande seulement chez moi. | — |
| V5-Duo | 9 | La voie Duo reste une app de dating : pas mon contenu, et c'est voulu. | — |
| V5-Lien | 9 | Messages privés, voulu. | — |
| V5-Duo-hh-proposition | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Duo-hh | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Duo-hh-visages | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Duo-hh-rdv | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Lien-debloque | 9 | Visage et vocal d'une autre : privé, voulu. | — |
| V5-RdvDuo | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Chat | 9 | Messages privés, voulu. | — |
| V5-RdvDuo-lea | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Oeuf | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Rupture | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Cartes | 9 | Neuf vraies miniatures, toutes distinctes, je reconnais chaque carte en 1 s : réglé. L'en-tête promet que « chaque carte s'exporte en vidéo de 5 s » : faux pour 3 mots et Inviter ; aucune miniature ne signale laquelle a une vidéo. | Pastille « vidéo » sur les miniatures concernées ; phrase juste. |
| V5-Story | 8 | La seule carte publique sans « Vidéo 5 s » (Story, Message, Enregistrer, Copier) alors que Mes cartes promet la vidéo pour chacune ; c'est la plus « participative » pour mes abonnés. | « Vidéo 5 s » avec les bulles de mots qui apparaissent une à une. |
| W-Repondre | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Profil | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Fiche | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Tarifs | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Abonnement | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Paiement | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Paiement-ok | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Reglages | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Confidentialite | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Signaler | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Supprimer | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Chargement | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Erreur-reseau | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Paiement-echec | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Verif-echec | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Notifs-refus | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| V5-Chats-vide | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| L-Effectif | 9 | « Le bar qui reçoit 5 inconnus » : bon sujet presse, mais prénoms et code du chevalet à l'écran. | Vue presse sans prénoms ni code. |
| L-Creneaux | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |
| L-Contrat | 10 | Rien à filmer ou rien qui gêne le tournage sur cet écran. | — |

## Les 3 changements qui feraient monter ma note le plus

1. Aperçu jouable de chaque « Vidéo 5 s » avant export, et vidéo aussi sur « 3 mots ».
2. « Tu y vas. » en animation de 1 s exportable : le moment « j'ai réservé » de la semaine.
3. « Partager mes 3 mots » depuis le chat du groupe : mes mots seuls, pet générique.

## Je mets 10 si…

Je mets 10 si chaque carte publique (y compris 3 mots) s'exporte en vidéo de 5 s avec un aperçu jouable avant de publier, si Mes cartes indique lesquelles ont une vidéo, et si « Tu y vas. » et mes 3 mots du groupe s'exportent sans personne d'autre. Les sept cartes distinctes sans légende et les miniatures sont faites.
