# Jury V5.2 · tour 3 · Responsable Trust & Safety

**Verdict.** Mes trois bloquants du tour 2 sont levés (grille d'âge fixe, carte d'accords supprimée, visages à J −3 h avec filigrane), mais la garantie « au moins 2 personnes compatibles », affichée à côté de « 2 femmes, 3 hommes », désigne exactement qui cherche une histoire, et la spec dit toujours 9 h pour les visages.

**Note globale : 7/10** (tour 1 : 4/10 · tour 2 : 6/10)

| Critère | Note | Pourquoi |
|---|---|---|
| Compréhension (5 s) | 9 | Promesses dites une fois, au bon moment (Consentement avant la question, Confidentialité « Qui voit quoi »). |
| Charge cognitive | 8 | Sécurité en 4 gestes : ange facultatif, code, besoin d'aide en appui long, Signaler en en-tête. |
| Envie (J+1/J+7/J+30) | 8 | La couche confiance visible reste l'argument pour les femmes. |
| Vraie rencontre (2 semaines) | 8 | Lieu public, table nommée, code, « Je connais quelqu'un ici » : le meilleur format du marché. |
| Sécurité et confiance | 6 | Garantie qui désigne les personnes (art. 9) ; position affichée malgré « jamais stockée » ; Nils nommé avant le oui ; duo avant consentement ; spec à 9 h. |
| Viralité / distribution | 7 | Cartes anonymes ; restent la Story pour une place et « J'y suis, ce soir » en direct. |
| Argent | 8 | Aucun dark pattern ; résiliation en 1 tap ; remboursement automatique. |
| Finition visuelle | 8 | Écrans d'urgence lisibles ; « Être rappelé » toujours collé au bord de son fond. |

## Outils de cohérence

Exécutés le 6 nov. 2026 : `node design/v5/check-facts.mjs` → « 75 fichiers, 2480 vérifications, 0 contradiction(s) » ; `NODE_PATH=$(npm root -g) node design/v5/a11y-audit.mjs .local/dc-runtime.js` → « 75 écrans, 1038 textes, 420 cibles, 0 problème(s), contraste minimum 4.53:1 ». J'ai aussi re-rendu les 75 sources (Playwright, @2x) et comparé aux PNG livrés : identiques au texte près (7 écrans diffèrent de quelques centaines de pixels d'illustration). Les deux outils passent. Ils ne voient pas ce qui suit, trouvé à la main :

- **Garantie « au moins 2 » + composition** (Trouvée, Sortie, Sortie-inscrit, Confirmation) : « 2 femmes, 3 hommes » et « Au moins 2 personnes du groupe cherchent aussi une histoire compatible avec la tienne ». Alex (il) cherche des femmes (ses duos : Jade, Léa) ; il n'y a que 2 femmes : ce sont forcément elles. check-facts vérifie « au moins N = garantie », pas que N reste inférieur à l'effectif du genre recherché.
- **Consentement après le duo** : Lien « Depuis dimanche 8 novembre, 21 h » (duo Jade) ; Confidentialité et Affiner-histoire « Accord donné le lundi 9 novembre ». La chronologie de facts.json ne contient pas la date d'accord.
- **Un seul lien pour deux promesses** : `blowy.app/i/r8Tz4w` est imprimé sur les 4 cartes publiques (Partage-confirmation, Partage-checkin, Partage, Partage-invitation), alors que V5-Invite dit « Lien à usage unique, réservé à toi ».
- **Position** : W-Ange-aide affiche « Position au moment de la demande · 21:04 · 12 rue Oberkampf » ; Confidentialité dit « Position · jamais stockée » et Check-in « Ta position n'est jamais demandée si tu tapes le code ».
- **Prénom avant le oui** : V5-Duo, carte « avec N. », pied de page « Dire oui à Nils ouvrirait un 2e duo ».
- **spec-v5.md non mise à jour** (en-tête : 2026-11-06, source `concept-v5.md`) : `photoRevealAt = min(9 h, startsAt − 3 h)` (= 9 h pour 19 h 30) et parcours J2 « 9 h photos simultanées » ; précondition « quartier `LIVE` », seuil 120, erreur `NEIGHBORHOOD_NOT_LIVE` ; `duo.maxActive` 3 ; place en placeholder 12 € « conso incluse » ; Blowy+ 19,99 € = 2 crédits + 1 accessoire mensuel ; annulation ≥ 24 h → crédit 90 j. Les écrans disent : visages à J −3 h, partout dès 5 personnes, 1 duo actif, 4,99 € conso non incluse, 9,99 € toutes les sorties, accessoires jamais vendus, annulation gratuite jusqu'aux visages.
- **Défauts de pixel du tour 2 toujours là** : légende chevauchée par l'ombre du bouton (Apres y≈1600–1625 @2x ; Abonnement y≈1615–1640) ; « Être rappelé par l'équipe… » collé au bord gauche de son fond (Signaler) ; chips inclinées (W-Repondre) ; titre bicolore (Souvenir) ; deux interrupteurs indépendants (Oeuf) ; 5 actions sous stress (Check-in-ok). Nouveaux : heures et dates coupées (« 21 / h. » Lien, « 10 / min. » Erreur-reseau, « mar. 10 / nov. » Accueil, « nov. / 21 h » Duo et Accueil-duo), « ; pour ta sécurité » en début de ligne (Groupe-menu), « Tom vient avec / toi » et « + 1 place pour un / pote » (Sortie, Sortie-inscrit), « nouvelle » ×3 sous les « ? » alors qu'un des trois est Malo.

## Mes exigences du tour 2 : vérification point par point

- **Grille d'âge fixe** : réglé (8 tranches, Tom 30–34 dans « 26–34 », plus aucun âge déductible ; l'outil le vérifie).
- **Date de naissance avant toute donnée sensible** : réglé (2/8, après la ville seule).
- **Consentement avant les sous-choix d'intention** : réglé (sous-choix déplacés dans Affiner, « Couvert par ton accord du lundi 9 novembre »).
- **Cartes sans pets réels ni prénom de tiers** : réglé (silhouettes, « Ni visages, ni prénoms, ni pets des autres », carte d'accords supprimée).
- **Pas de Story pour une place de team** : non réglé (Partage-invitation garde Story).
- **« Citer le lieu » après la sortie** : réglé (ven. 13 nov. 9 h 30).
- **Visages à J −3 h avec filigrane du regardeur** : réglé (Révélation, Lien-debloque).
- **Spec et concept d'accord sur `photoRevealAt`** : non. spec-v5 §1 : `min(jour J 9 h, startsAt − 3 h)`, soit 9 h pour une sortie à 19 h 30 (10 h 30 d'exposition) ; parcours J2 « 9 h photos simultanées ». Une équipe qui code depuis la spec livre l'ancien comportement.
- **114, Bloquer décoché, Erreur-age** : réglés. **18+ déclaratif sur W-Repondre** : non.
- **Composition anonyme de la sortie d'amorçage** : non (Amorçage n'a que « 5 personnes · 22–29 ans »).

**Ma condition du 10 au tour 2** : audit croisé sans donnée déductible ; date de naissance avant le sensible ; visages ≤ 3 h + filigrane ; spec = concept.
**Statut** : 2 sur 4. Date et visages : oui. Audit : non (intention de deux tiers déductible par la garantie, prénom de Nils avant le oui, position affichée malgré « jamais stockée »). Spec : non.

## Lecture d'ensemble

**Inférence d'intention (nouveau, bloquant).** La garantie B.5 est affichée sur la même carte que la composition par genre. Dès que l'effectif du genre recherché égale la garantie (2 femmes pour un homme qui cherche des femmes, cas de la démo), « jamais qui » devient « exactement elles ». À Paris, avec « jamais plus de 3 du même genre », ce cas sera fréquent ; et il touche d'abord les minorités (un homme gay dans un groupe à 2 hommes compatibles apprend l'orientation des deux). C'est la même classe de fuite que la carte d'accords du tour 2, déplacée de la Story vers la fiche de sortie.

**Stalking.** Réglé pour l'essentiel : lieu J −1 18 h sans visages, visages J −3 h avec filigrane. Restent la carte « J'y suis… ce soir » publiée en direct, et la promesse « captures bloquées » intenable sur iPhone.

**Consentement.** La démo fait commencer un duo « histoire » le 8 novembre, avant l'accord du 9 : à corriger dans les données, et à interdire dans le domaine (aucune proposition DUO_LANE sans `ProcessingConsent` antérieur).

**Spec.** Les écrans sont désormais plus protecteurs que la spec. C'est la spec qu'on code.

## Écran par écran

Format : note · problème → correction attendue. `BLOQUANT` = suffit à me faire refuser.

- **V5-Welcome** · 9/10 · « 18 ans et plus · selfie vérifié » et « Ce que tu cherches reste secret » en tête. → —
- **V5-Ville** · 9/10 · « On ne demande jamais ta position » : tenu à l'onboarding. → —
- **V5-Ville-nantes** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Toi** · 9/10 · Date de naissance à 2/8, avant toute donnée sensible : ma demande T2 réglée. « Un autre mot » : champ libre, modération à préciser. → Filtre serveur du champ libre.
- **V5-Pet** · 9/10 · « Tu ne dis jamais son nom au bar ». → —
- **V5-Rencontrer** · 9/10 · « « Une histoire » ouvre d'abord un écran de consentement » : réglé. → —
- **V5-Consentement** · 9/10 · Avant la question sensible, « Potes seulement » de même poids, phrase F.17 : réglé. → —
- **V5-Toi-plus** · 8/10 · « Nino compose chaque groupe pour qu'au moins 2 personnes cherchent une histoire compatible » : la promesse elle-même est bonne ; c'est son affichage avec la composition qui désigne les personnes. → Voir Trouvée.
- **V5-Dispos** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Compte** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Erreur-age** · 8/10 · « Compris » principal, « Erreur de date ? » discret : réglé. La flèche retour ramène à la saisie de date, sans délai. → Retour = sortie de l'onboarding ; nouvelle saisie après 24 h ou par le selfie.
- **V5-Trouvee** · 4/10 · « 2 femmes, 3 hommes » + « Au moins 2 personnes du groupe cherchent aussi une histoire compatible avec la tienne. Jamais qui. » Alex (il) cherche des femmes (duos Jade, Léa) ; le groupe n'a que 2 femmes : ce sont forcément elles. Lundi 21 h, Alex sait que Léa et Sarah cherchent une histoire avec un homme de sa tranche : intention et orientation de deux tiers (art. 9), contre la phrase exacte de Confidentialité. → k-anonymat : n'afficher la garantie que si le groupe compte au moins (garantie + 1) personnes des genres recherchés ; sinon « Une histoire est possible dans ce groupe », sans nombre, jamais sur la même carte que la répartition par genre. Règle ajoutée à check-facts. · `BLOQUANT`
- **V5-Trouvee-potes** · 8/10 · Ne dit rien des autres ; renseigne seulement sur la rareté du créneau. → —
- **V5-Sortie** · 5/10 · Même carte « 2 femmes, 3 hommes » + « Au moins 2 personnes… compatible » que Trouvée : même inférence (voir Trouvée). → Même règle.
- **V5-Verif** · 9/10 · Vivacité, 18+, conservation 30 j, « 3 h avant » écrit. → —
- **V5-Notifs** · 9/10 · Discret désactivé par défaut mais état réel, aperçus masqués par défaut. → —
- **V5-Sortie-inscrit** · 5/10 · Même carte « 2 femmes, 3 hommes » + « Au moins 2 personnes… compatible » que Trouvée : même inférence (voir Trouvée). → Même règle.
- **V5-Team** · 9/10 · « Chacun passe le selfie vérifié et entre dans la tranche d'âge du groupe » : ma demande T2, réglée. → —
- **V5-Invite** · 7/10 · « Lien à usage unique, réservé à toi » ; or `blowy.app/i/r8Tz4w` est publié en Story sur 4 cartes. Si c'est le lien de team, le premier inconnu prend la place hors des filtres de composition ; sinon la promesse est fausse. → Lien de team nominatif, à usage unique, jamais imprimé sur une carte publique.
- **V5-Accueil** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Accueil-discret** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Accueil-duo** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Pause** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Chats** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Groupe** · 9/10 · « pas de numéro ni de réseau avant jeudi » ; et après jeudi ? → « Levé seulement entre accords mutuels ».
- **V5-Groupe-menu** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Attente** · 9/10 · Agrégats seulement (87 vérifiées, manque 2). → —
- **V5-Amorcage** · 7/10 · Aucune répartition par genre ni garantie pour la sortie d'amorçage ; « jamais plus de 3 du même genre » autorise 3 amis hommes + 2 femmes seules qui ne se connaissent pas : la configuration la plus risquée pour elles. → Afficher la composition (f/h) comme pour toute sortie ; prévenir les 2 personnes « 3 amis viennent ensemble ».
- **V5-Sortie-complete** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Sortie-annulee** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Affiner** · 9/10 · « Éviter mes contacts » existe (désactivé par défaut). → Le proposer à qui choisit « histoire ».
- **V5-Affiner-histoire** · 9/10 · Couvert par l'accord, rien de présélectionné. → —
- **V5-Confirmation** · 6/10 · Lieu à J −1 18 h, visages plus tard : réglé. Même carte « 2 femmes, 3 hommes » + « Au moins 2 personnes… compatible » que Trouvée : même inférence (voir Trouvée). → Même règle.
- **V5-Partage-confirmation** · 8/10 · Sans tiers, sans lieu : réglé. « Demain, je sors » + même lien partout = calendrier public d'Alex. → Publication différée, ou sans jour.
- **V5-Revelation** · 8/10 · J −3 h, filigrane « vu par Alex », grille fixe, « Je connais quelqu'un ici » : mes 3 demandes T2 réglées. « Les captures d'écran sont bloquées » est faux sur iPhone : iOS permet de détecter une capture, pas de l'empêcher. → « Les captures sont détectées et signalées ; ton prénom est en filigrane ».
- **V5-Ange** · 9/10 · Aucune présélection : réglé. → —
- **W-Ange** · 9/10 · « Ce lien ne m'est pas destiné » au-dessus de l'encart : réglé. → —
- **W-Ange-aide** · 5/10 · « Position au moment de la demande · 21:04 · 12 rue Oberkampf » : si le check-in s'est fait par code, aucune position n'existe, c'est l'adresse du lieu présentée comme une position ; si Alex demande de l'aide dans la rue, le proche et le 17 vont au mauvais endroit. Et si c'est une vraie position, Confidentialité (« Position · jamais stockée ») ment. → Soit « Lieu de la sortie (pas de position) », soit position prise à l'appui long, annoncée sur Check-in et dans Confidentialité (« sauf demande d'aide »).
- **V5-Checkin** · 9/10 · Code d'abord, position une fois en option : réglé. → —
- **V5-Checkin-ok** · 7/10 · « 4 sur 5 arrivés » sans dire qui : réglé. Le partage « « J'y suis » » est posé entre les boutons de sécurité : il pousse à annoncer en direct où l'on est. → Retirer le partage de cet écran ; le proposer à la fin.
- **V5-Partage-checkin** · 6/10 · « Une sortie à 5 à Paris 11e, ce soir » publié pendant la sortie : position en direct au quartier près. → Publication à la fin seulement, ou retirer « ce soir ».
- **V5-Souvenir** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Partage** · 9/10 · Silhouettes, aucun prénom, lieu cité après ven. 9 h 30 : réglé. → —
- **V5-Apres** · 9/10 · « Non » par défaut, rien de rempli : réglé. → —
- **V5-Apres-resultats** · 9/10 · Carte d'accords supprimée : le vote ne fuit plus. → —
- **V5-Apres-aucun** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Bande** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Rue** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Duo** · 6/10 · Carte « avec N. », mais pied de page « Dire oui à Nils ouvrirait un 2e duo » : prénom complet avant tout oui mutuel. → « N. » partout tant que le duo n'est pas ouvert.
- **V5-Lien** · 6/10 · « Depuis dimanche 8 novembre, 21 h » : un duo qui commence avant l'accord art. 9 « donné le lundi 9 novembre » (Confidentialité, Affiner-histoire). Dans la démo de référence, le matching a traité « qui tu veux rencontrer » sans consentement. → Duo daté après l'accord ; check-facts : accord < tout duo.
- **V5-Lien-debloque** · 9/10 · Filigrane sur le visage de Jade : réglé. → —
- **V5-RdvDuo** · 9/10 · Lieu public confirmé, ange facultatif. → —
- **V5-Chat** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-RdvDuo-lea** · 9/10 · Lieu public, ange facultatif. → —
- **V5-Oeuf** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Rupture** · 9/10 · « Partir sans message · si tu ne te sens pas en sécurité ». → —
- **V5-Partage-invitation** · 7/10 · Plus de prénom de tiers : réglé. « Ta place jeudi » encore publiable en Story (T2). → Message seulement.
- **V5-Story** · 9/10 · Slug aléatoire `k7f2q`, désactivable : réglé. → —
- **W-Repondre** · 8/10 · « 18 ans et plus » est un badge, pas une déclaration. → Case « J'ai 18 ans ou plus » avant les mots.
- **V5-Profil** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Fiche** · 9/10 · Fiabilité invisible du groupe. → —
- **V5-Tarifs** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Abonnement** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Paiement** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Paiement-ok** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Reglages** · 9/10 · « Aide (non urgent) » distincte de l'urgence. → —
- **V5-Confidentialite** · 6/10 · Phrase F.17 exacte, mais deux promesses sont démenties ailleurs : « ce que tu cherches ne [sont] montrés à personne » (déductible par la garantie, Trouvée) et « Position · jamais stockée » (affichée sur W-Ange-aide). → Corriger la garantie et la ligne Position (« sauf demande d'aide »).
- **V5-Signaler** · 9/10 · 114, « Incident sur place », « Bloquer aussi » décoché : réglé. → —
- **V5-Supprimer** · 9/10 · Signalements et vérification gardés le temps légal. → —
- **V5-Chargement** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Erreur-reseau** · 9/10 · Code hors ligne + 17 / 112. → —
- **V5-Paiement-echec** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Verif-echec** · 9/10 · Pièce d'identité vue par une personne puis supprimée. → —
- **V5-Notifs-refus** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Chats-vide** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —

## Les 3 changements qui feraient le plus monter ma note

1. Règle de k-anonymat sur toute phrase qui combine intention et composition : garantie affichée seulement si l'effectif des genres recherchés dépasse la garantie, sinon formulation sans nombre et sans répartition par genre ; testée dans check-facts.
2. Une seule vérité sur la position et les liens : W-Ange-aide « lieu de la sortie » (ou position annoncée et ajoutée à Confidentialité « sauf demande d'aide »), lien de team nominatif jamais publié en Story, « captures détectées » au lieu de « bloquées », « N. » jusqu'au oui mutuel.
3. Mettre spec-v5 d'accord avec concept-v5.2 : `photoRevealAt = startsAt − 3 h`, lieu à `lockAt`, grille d'âge fixe, « Je connais quelqu'un ici », annulation jusqu'aux visages, et aucune proposition de duo « histoire » avant la date d'accord art. 9.

## Je mets 10 si…

Je mets 10 si un audit croisé des 75 écrans et de spec-v5 contre « Qui voit quoi » ne trouve aucune donnée déductible au-delà de la promesse (intention d'un tiers par la garantie, prénom avant un oui mutuel, position), si spec-v5 dit `startsAt − 3 h` pour les visages, si aucun lien n'est à la fois « usage unique » et publié en Story, et si aucune donnée art. 9 n'est traitée avant la date d'accord.

## Sources

- [Apple — UIApplication.userDidTakeScreenshotNotification (détection après coup, pas de blocage)](https://developer.apple.com/documentation/uikit/uiapplication/userdidtakescreenshotnotification)
- [CNIL — données sensibles (art. 9 RGPD)](https://www.cnil.fr/fr/definition/donnee-sensible)
