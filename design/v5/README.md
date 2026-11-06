# Maquettes V5.8 « Ton pet te trouve une bande »

Ces maquettes servent de référence pixel-perfect au développement. Les règles produit viennent de neuf documents, du plus ancien au plus récent :

- `docs/product/concept-v5.md` ;
- `concept-v5.1.md` ;
- `concept-v5.2.md` ;
- `concept-v5.3.md` ;
- `concept-v5.4.md` ;
- `concept-v5.5.md` ;
- `concept-v5.6.md` ;
- `concept-v5.7.md` ;
- **`docs/product/concept-v5.8.md`** (règles 1–7, corrections 8–15), qui prime sur tous les autres.

Le tour 9 répond au jury tour 8 (`docs/research/jury/round-8/`, Camille, Mehdi et Thomas à 10, les autres à 9, zéro bloquant). Le tour 8 répondait au jury tour 7 (`docs/research/jury/round-7/`, 15 membres à 9, zéro bloquant : chaque « ce qui empêche le 10 » est traité ci-dessous). Le tour 7 répondait au jury tour 6 (`docs/research/jury/round-6/`, bloquant trust-safety : la sortie pour sécurité n'est jamais limitée ni non remboursée). Le tour 6 répondait au jury tour 5 (`docs/research/jury/round-5/`, bloquant : rendez-vous Duo de jour sans astreinte) et au test des 5 secondes (`docs/research/jury/test-5-secondes-r5.md`).

## Contenu

- **107 artboards** dans `project/` :
  - 100 écrans d'app et 3 pages web, en 390 × 844 ;
  - **3 écrans côté lieu** (web admin) en 1280 × 800 : `L-Effectif`, `L-Creneaux`, `L-Contrat`.
- **`project/canvas.json`** : la page « v5 — Bande » compte 10 rangées (A, B, B', C à H, L), avec des titres de 01 à 62 (variantes en b, c, d…), plus 4 notes.
- **`facts.json`** : source unique des chiffres, dates et règles. Il contient :
  - le calendrier B : `annulationGratuiteIso` = lieu de la veille à 18 h ;
  - l'heure de l'accord (art. 9), avant tout duo ;
  - la règle d'équilibre. La garantie n'y est plus.
  - Bordeaux, Lyon et Lille en solo ;
  - un lien par carte (`slugs`, `slugParFichier`, `slugsPrives`).
- **`check-facts.mjs`** : `node design/v5/check-facts.mjs [filtre]`.
  - Résultat : **107 fichiers, 9 711 vérifications, 0 contradiction**.
- **`a11y-audit.mjs`** : `NODE_PATH=$(npm root -g) node design/v5/a11y-audit.mjs .local/dc-runtime.js [filtre]`.
  - Il audite le contraste, les cibles de 44 pt et **la mise en page sur le DOM rendu**.
  - Résultat : **107 écrans, 1 730 textes, 595 cibles, 1 815 blocs de texte mesurés, 0 problème, contraste minimum 4,53:1**.
  - Les miniatures de « Mes cartes » (`data-miniature`, images réduites de cartes auditées en taille réelle) sont exclues des contrôles de mise en page.
  - L'outil du jury `tooling/qa/layout/overflow.mjs` ne signale plus rien. Ses contrôles (texte hors cadre, plages « 26–29 ans » ou « 3 hommes » coupées) sont repris dans `a11y-audit`.
  - Les écrans qui défilent ont, dans `canvas.json`, la hauteur de leur rendu.
- **`render-v5.mjs`** : c'est la même logique que `tooling/design-render/render.mjs`, qui reste inchangé, mais chaque écran est rendu à sa taille (390 × 844 @2x, lieu en 1280 × 800 @1x ; les écrans lieu défilent au-delà de 800 px et le canvas prend leur hauteur rendue).
  - Commande : `DESIGN_ROOT=design/v5 NODE_PATH=$(npm root -g) node design/v5/render-v5.mjs .local/dc-runtime.js design/v5/renders [filtre]`.
  - Les 107 rendus de `renders/` ont été régénérés ; tous les écrans modifiés ou nouveaux ont été relus en planches.

### Contrôles ajoutés au tour 9 (`check-facts`)

1. **Frise = carte** : l'heure du jalon « La sortie » est celle de la carte (« 15 h – 17 h » à Lille).
2. **Aucune sortie promise avant composition** (`facts.ecransAttente` : Attente, Pas-encore, Sortie annulée, Sortie complète, Pas d'accord, Trouvée-Lyon) : phrases interdites (« une sortie a lieu le », « Nino te propose le », « Ta prochaine sortie », « On te propose ») et toute date de sortie dans une phrase avec « si un groupe se forme », « reste ouvert » ou « réponse le ».
3. **Prénom du duo au double oui** : aucun prénom sur la proposition (`facts.ecransAvantOui`) ; « le prénom, aux visages » banni.
4. **Tournures uniques** : « oui tous les deux » seulement dans « quand vous avez dit oui tous les deux » ; « intéressant dès la 3e sortie du mois » ; « ≈ N min depuis <quartier de facts.quartiers> » ; « vos deux oui », « double oui », « dans ton quartier », « Rentable » bannis ; numéros : « Les numéros restent masqués jusqu'aux visages. »
5. **Fiabilité** : toute mention (« fiabilité », « sortie honorée », « Venu à N sortie ») est suivie de « visible par toi seulement ».
6. **Tranche des personas dans leur groupe** : « 5 personnes · NN–NN ans » contient la tranche du persona de l'écran ; chaque membre du groupe de Lyon a sa tranche (`facts.groupesTranches`).
7. **Ratons des écrans d'échec** (`facts.ecransEchec`) : 64 pt au plus (`facts.ratonMax`).

## Suivi tour 10 (utilisateurs)

Règle : un point n'est coché qu'après avoir été vu dans le PNG rendu.

- [x] Ratons de V5-Sortie-complete (« 24 », 110 pt) et V5-Apres-aucun (« 34d », 130 pt) remplacés par une pastille de 64 pt ; vus dans les rendus. Les deux écrans (et Sortie annulée, Pas-encore, Pas-encore-nantes) sont ajoutés à `facts.ecransEchec`. Test sur une copie piégée (raton remis à 120 pt dans une copie de `project/`) : check-facts signale les deux écrans.
- [x] V5-Bande : le banc du décor dépassait au-dessus de « TA BANDE ». Mesure dans le rendu (pixels corail du banc dans la zone du titre) : 1 760 avant, 0 après. Le titre est remonté de 16 pt et couvre le banc.
- [x] V5-Duo-hh-proposition : même structure que V5-Duo (étapes, carte « Un pigeon · K. », encadré « À Marseille… », « Ou viens en groupe › ») ; vu dans le rendu.
- [x] Bonus : V5-Groupe-calme, le chat du groupe avec la puce « calme » à côté du pet de M. ; vu dans le rendu.

### Points des experts du tour 9 (vus dans les PNG rendus)

- [x] (a) Prénom complet après le double oui : « DUO AVEC JADE », « Répondre à Jade », « Caramel · Jade », « DUO AVEC KARIM », Chats et Accueil « Jade · Caramel ». check-facts : initiale interdite sur `facts.ecransApresOui`, prénom interdit avant (`ecransAvantOui`) ; test piégé (« DUO AVEC J. ») signalé.
- [x] (b) « quand vous avez dit oui tous les deux » réservé au duo ; rendez-vous : « réservée quand vous avez tous les deux accepté le créneau » (contrôlé).
- [x] (c) Jalon de la veille 18 h : « Confirmation · lieu et prénoms » (frises), « Confirmation (lieu et prénoms) le … » (Trouvées), « Confirmation : lieu et prénoms » (Lieu confirmé), « à la confirmation » (chat) ; « lieu révélé », « Lieu et prénoms · », « à la révélation » bannis (test piégé signalé). Sur la puce de Chats, faute de place : « Confirmation mer. 11 nov. 18 h ».
- [x] (d) RdvDuo, RdvDuo-lea, Duo-hh-rdv : tuile « Sam ✓ » sélectionnée (fond encre, contour citron) avant « Proposer à … ».
- [x] (e) Confidentialité, ligne Duo = spec §2.16 : « initiale et espèce avant le double oui, puis prénom, visages à 48 h. Seule une personne avec qui tu as un duo sait que vous avez dit oui tous les deux. » (contrôlé).
- [x] (f) L-Effectif : une seule puce le sam. 14 nov. 15 h (« aucune table de 5 · 1 table de 2 ») ; Lille : « L’atelier est mené par la céramiste du lieu ».
- [x] (g) Aperçus vidéo des 8 écrans de partage : éléments révélés au fil du temps (titre entier à 0 s, dessin à 2,5 s, lien à 5 s) ; a11y-audit a un contrôle dédié `[data-video-vignette]` (carte entière dans sa vignette, aucun texte rogné), qui a d’abord trouvé le lien coupé (marge de 12 px), corrigé.
- [x] (h) Attente : « IL MANQUE 2 PERSONNES POUR UN GROUPE LE SAMEDI 21 NOVEMBRE », « un groupe peut se former… : réponse ce soir-là » ; « elle a lieu » banni sur les écrans d’attente.

## Suivi jury tour 8 (concept-v5.8)

- [x] R1 prénom du duo au double oui : V5-Duo, Duo-hh-proposition, Confidentialité (« ta carte et ton prénom quand vous avez dit oui tous les deux ; ton visage, aux visages »).
- [x] R2 sortie tombée à la confirmation = « Blowy annule », 3 € HT par place réservée : écran client, Tarifs et contrat disent la même chose (la spec et le code restent à aligner hors maquettes).
- [x] R3 numéros : « Les numéros restent masqués jusqu'aux visages. » dans le chat du groupe, le menu, le chat avec J. et le chat avec K. (même ligne « Messages filtrés »).
- [x] R4 fiabilité « visible par toi seulement » : Profil (tuile et en-tête), Fiche, Confidentialité, Sortie annulée, Rupture.
- [x] R5 Blowy+ : « Intéressant dès la 3e sortie du mois » ; l'écran Blowy+ reprend « Tu sors 2 fois par mois ? Paie à la place. »
- [x] R6 trajet « ≈ 8 min depuis Paris 11e » partout (Trouvée, Confirmation, Sortie, Tu y vas).
- [x] R7 « quand vous avez dit oui tous les deux » : Duo, Chats vide, Confidentialité, Consentement, RdvDuo.
- [x] 8 Lille : frise à 15 h ; Amorçage (avec Jules et Lou) et Amorçage-solo au gabarit commun de Sortie, comme V5-Sortie-lille.
- [x] 9 Attente (« si un groupe se forme pour le ven. 13 nov., réponse le mar. 10 nov. 21 h » ; « ton créneau du sam. 28 nov. reste ouvert ») et Trouvée-Lyon (« Ton créneau du mar. 24 nov. : si un groupe se forme… »).
- [x] 10 promesse « vidéo 1 s » retirée ; vignettes 0 s · titre, 2,5 s · dessin, 5 s · lien, visiblement différentes.
- [x] 11 W-Repondre « comment ses proches le décrivent », ratons de 56 et 64 pt ; écrans d'échec en pastille de 64 pt ; raton du Welcome assis à la 5e place. *(Coché à tort au tour 9 : Pas de place (24) et Pas d'accord (34d) gardaient 110 et 130 pt ; corrigé au tour 10.)*
- [x] 12 Lyon : Hugo (persona, 22–25) dans un groupe 22–29 ans, le membre « Hugo » devient Théo ; Trouvée-weekend = proposition de Claire à Lyon, 35–44 ans, sam. 21 nov. 15 h.
- [x] 13 Duo-hh-rdv au gabarit RdvDuo (3 tuiles d'ange, autre lieu ou autre heure, astreinte « pendant tout ton rendez-vous ») ; ligne « Messages filtrés » dans le chat avec K.
- [x] 14 contrat : article 3 en liste HT au vouvoiement, règles client en annexe ; effectif : semaine suivante (17–21 nov.) ajoutée.
- [x] 15 Ta bande : titre détaché du liseré du banc. *(Coché à tort au tour 9 : le banc dépassait au-dessus du titre ; corrigé et mesuré au tour 10.)*
- [x] Fiche : « Venu à 1 sortie sur 1 » reste affiché, suivi de « Ta fiabilité est visible par toi seulement. » (le README V5.7 disait à tort « plus de N sur M » : il s'agit de la formule générique « N sur M », remplacée par les vrais chiffres).

### Contrôles ajoutés au tour 8 (`check-facts`)

1. **Échéances dérivées** : `facts.calendrier.sorties` liste les sorties ; « <date> 21 h » doit être une composition (J−3 21 h), « <date> 18 h » une confirmation (veille 18 h), « <jour> à 21 h » un jour de composition réel ; toute date courte affichée vient de `facts.json` (aucune date en dur).
2. **« personnes vérifiées »**, jamais « inscrits ».
3. **Pets propres à chaque groupe** (`facts.groupes`, `groupeParFichier`) : chaque personne affiche son pet ; aucun pet partagé entre Paris, Lyon, Saint-Denis, Nantes, Lille.
4. **Aucun lien de partage** sur Les visages, Duo-hh-visages et Souvenir (`facts.ecransVisages`).
5. **TTC côté client, HT côté lieu** : aucun « HT » sur un écran client ; tout montant d'un écran `L-*` est suivi de « HT ».
6. **Tarifs = contrat = écran client** : V5-Tarifs et L-Contrat contiennent mot pour mot les phrases canoniques annulation, sécurité, connais, imprévu, place vide, Blowy annule (`facts.tarifsContrat`).
7. **« ton rendez-vous » / « la sortie d'Alex »** : écrans de rendez-vous Duo sur `regles.astreinteRdv`, page de l'ange sans « ta sortie ».
8. Variantes canoniques (`facts.reglesVariantes`) : astreinte (sortie, rendez-vous, ange), aide (« te rappelle », « rappelle Alex », « vous rappelle » côté lieu) ; captures (« Les captures d'écran iOS sont signalées à l'équipe. »).

## Suivi jury tour 7 (concept-v5.7)

- [x] A1 Les visages et Confirmation : trois sorties distinctes avec leur phrase canonique (« Je ne viens pas, pour ma sécurité », « Je connais quelqu'un ici » avec la suite « au-delà : sortie pour ta sécurité », « Imprévu · je ne le sens pas ») ; plus de partage sur Les visages ; captures « iOS, signalées à l'équipe ».
- [x] A2 délai d'aide : `safety.helpCallbackTargetMinutes = 5` dans facts ; « Quelqu'un de l'équipe te rappelle en quelques minutes » (Signaler, W-Ange-aide, L-Effectif « incident en cours ») ; le signalement reste à 1 h, les deux délais légendés sur Signaler.
- [x] A3 « pendant tout ton rendez-vous » (RdvDuo, RdvDuo-lea, Duo-hh-rdv) ; « pendant toute la sortie d'Alex » (W-Ange-aide) ; W-Ange « bar partenaire, table Blowy ».
- [x] A4 Marseille : rendez-vous avec Karim, ange au choix et « Proposer un autre lieu ou une autre heure » ; filtrage identique au chat avec J.
- [x] B5 dates calculées : Attente « d'ici le mer. 18 nov. 21 h » ; Pas-encore « si un groupe se forme pour le jeu. 19 nov., réponse le lun. 16 nov. 21 h » ; Sortie-annulée, Sortie-complète, Pas d'accord : « ton créneau », plus de sortie promise ; Trouvée-Lyon « composée le sam. 21 nov. 21 h » ; Notifs « ta sortie de jeudi ».
- [x] B6 Ville-nantes : aucune promesse d'histoire à 1/9 (« Environ 90 personnes vérifiées, 4 lieux partenaires ») ; Pas-encore-nantes sans titres répétés.
- [x] C7 message d'accueil du lieu sur chaque Confirmation (Paris, Lyon, Saint-Denis), annoncé dans le chat ; L-Effectif dit où les participants le voient.
- [x] C8 relevé sur le mois civil (« 1er – 30 nov. », mar. 3 et jeu. 5 nov.) ; effectif de toute la semaine (mar., jeu., sam., table de 2, dim.) ; contrat qui nomme sécurité, imprévu, Blowy annule et table Duo 0 € HT sans garantie ; L-Créneaux aligné.
- [x] C9 Tarifs, contrat et écrans client : mêmes phrases canoniques, contrôlées.
- [x] D11 Tarifs : « Tu sors 2 fois par mois ? Paie à la place (2 × 4,99 €). Blowy+ devient intéressant dès la 3e sortie. » ; Abonnement sans HT.
- [x] E12 aperçu vidéo 5 s en trois vignettes (0 s, 2,5 s, 5 s) sur les 7 cartes animables et sur 3 mots (« Vidéo 5 s ») ; Mes cartes : pastille « vidéo », phrase juste, « 5 s » insécable.
- [x] E13 Souvenir : le vote d'abord, la carte arrive avec les résultats ; « Partager mes 3 mots, seuls » dans le chat ; « Tu y vas. » en vidéo 1 s dans Mes cartes.
- [x] F14 Thomas : « Montrer au groupe : je préfère le calme », désactivé par défaut ; la phrase « comme demandé dans Affiner » est retirée de la 1re Trouvée.
- [x] F15 Claire : V5-Trouvee-weekend (sam. 21 nov., week-end libre) ; Créneaux affiche « Un week-end sur deux · à partir du sam. 14 nov. » ; Semaines off liste les week-ends libres.
- [x] F16 Inès : « personnes vérifiées » partout ; la Fiche n'affiche plus « N sur M ».
- [x] F17 Hugo / Mehdi : légende « Illustration · dans l'app, la photo du lieu » ; pets propres à Lyon (Biscotte, Moka, Filou, Praline), Saint-Denis (Chouquette, Réglisse, Tic, Noisette), Nantes, Lille ; Inès de Lyon devient Clara ; raton réduit sur Welcome et W-Repondre.
- [x] F18 Léa : « Nino propose un duo avec toi et K. » et « K. n'a pas encore répondu » ; fiabilité « visible par toi seulement » partout ; Confidentialité : lignes fiabilité, contacts évités, cartes ; V5-Ange reprend la ligne de Confidentialité mot pour mot.
- [x] F19 voie Duo : voir ci-dessous.
- [x] G20 doublon « X vient avec toi » retiré des 4 Sortie (rangée « Inviter un 2e proche ») ; Lille au gabarit commun (V5-Sortie-lille, frise et prix) ; éclaboussures de Souvenir retirées ; titre de Ta bande détaché du banc ; HT retiré de Sortie annulée ; « pour ta sécurité » une seule fois sur Check-in fait ; « Pigeon » partout ; Team « Garder sa place 30 min » ; Welcome « 18 à 50 ans et plus » ; « dans ton quartier (≈ 8 min) ».

### Pourquoi la voie Duo reste une porte d'égale importance

La voie Duo n'invite personne et sort donc de la boucle virale du groupe (growth-lead, ux-cognitif). Le choix est assumé : pour les personnes que le groupe intimide (Thomas, Yanis), le duo est la seule porte qu'elles franchissent ; la mettre après la 1re sortie les perdrait avant. L'écran Rencontrer garde les trois formats à égalité ; le test de 8 semaines mesure la part qui choisit le duo et sa conversion en sortie de groupe.

### Contrôles ajoutés au tour 7 (`check-facts`)

1. **Une seule formulation par règle** : `facts.regles` donne la phrase canonique (sécurité, « je connais quelqu'un ici », imprévu, annulation, fiabilité, astreinte, rappel, Blowy+ « dès la 3e », annulation par Blowy) ; `facts.reglesSignatures` donne le motif qui repère la règle. Dès qu'un écran évoque une règle, la phrase canonique doit y figurer mot pour mot (la date de la veille est normalisée en « la veille 18 h »).
2. **Bannis** : « soirs de sortie », « position en continu », « Photo fournie par le lieu », « Rentable à partir de ».
3. **Âge du persona** (`facts.personas`) : « Toi · tranche » correspond au persona de l'écran (26–29 ans par défaut, 22–25 à Saint-Denis, 18–21 à Bordeaux) ; une sortie annoncée « en NN–NN ans » contient la tranche du persona.
4. « Mes cartes » montre les mêmes liens que les cartes : exclu du contrôle « un lien par carte ».

## Suivi jury tour 6 (concept-v5.6)

- [x] **Bloquant trust-safety** : la sortie pour sécurité est « toujours possible, sans pénalité, place remboursée », jamais comptée dans l'imprévu ; même phrase sur Sortie, Fiche, Confirmation, Tarifs, Les visages, Groupe-menu, Check-in fait.
- [x] A1 sécurité / « je connais quelqu'un ici » (1 fois par mois, remboursée) : phrases canoniques partout.
- [x] A2 imprévu : « 1 fois par mois, sans pénalité, place non remboursée », sous le bouton de Les visages.
- [x] A3 fiabilité visible par toi seul : Fiche, Réglages.
- [x] A4 Blowy+ « Rentable dès la 3e sortie du mois » : Abonnement.
- [x] A5 astreinte « pendant toute ta sortie » ; plus aucun « soirs de sortie » (Groupe-menu, Signaler corrigés) ni « position en continu » (Ange : « ta position n'est jamais demandée ») ; W-Ange-aide sur la phrase canonique.
- [x] A6 délais réels : Chargement (« jeudi : réponse lundi 21 h ; samedi : mercredi 21 h »), Chats-vide renvoie vers Chargement, Pas-encore « mardi à 21 h ».
- [x] A7 Confidentialité : lignes « Ton duo » et « Ton ange gardien ».
- [x] B8 grille d'âge complète (Affiner-âge, 8 tranches, 30–34 coché) ; Affiner résume exactement ; Saint-Denis 22–25 ; Bordeaux 18–25 pour le persona 18–21.
- [x] B9 Nantes : Ville, Pas-encore, Trouvée, Sortie.
- [x] B10 duo homme-homme : proposition (« Un pigeon · K. »), duo, visages (Karim, pet pigeon), rendez-vous Café Longchamp avec astreinte.
- [x] B11 « Pas encore » : quand on est prévenu + voie Duo.
- [x] B12 illustrations distinctes (Paris, Lyon, Saint-Denis, Nantes), légende « Illustration · la photo du lieu arrive la veille ».
- [x] B13 semaines off : « un week-end sur deux » / « une semaine sur deux », à partir du sam. 14 nov., dates calculées ; « J'en ai déjà » dans l'horizon enfants.
- [x] B14 Thomas : « Je ne le sens pas · imprévu, aucune raison demandée » ; ambiance « plutôt calme » cochée et dite sur la Trouvée (« Lieu calme, comme demandé dans Affiner »).
- [x] B15 Accueil-duo reformulé (« jeudi 12 novembre · 19 h 30 · facultatif »).
- [x] B16 Mes cartes : 9 vraies miniatures ; Ma bande et Dimanche distinctes ; vidéo 5 s.
- [x] B17 partage retiré de Confirmation et de « Pas d'accord cette fois » ; secondaire sur Les visages.
- [x] B18 relevé lieu en HT (4,16 € HT / 3 € HT, total 7,16 € HT), « place réservée », message d'accueil du lieu (L-Effectif ; annoncé dans le chat du groupe à la révélation) ; contrat en HT.
- [x] B19 coupures (Saint‑Denis, « ≈ 17 min », « tous les deux », « déc.… ») ; « Lieu révélé » dans Chats ; Chats-vide.
- [x] B20 Lyon : « Et la semaine d'après : mar. 24 nov. · 19 h 30 · Atelier céramique, Lyon 1er ».
- [x] Écrans signalés non corrigés au tour 6 : Accueil-duo, Groupe-menu, Signaler, Affiner-âge, Mes cartes — vérifiés un par un sur les rendus.

### Contrôles ajoutés au tour 6 (`check-facts`)

1. **Astreinte** : jamais restreinte à une plage horaire (« 18 h à 2 h » est banni).
2. **Rendez-vous Duo** : toujours dans un lieu partenaire, avec la phrase d'astreinte exacte ; « Lieu public » est banni.
3. **Check-in** : par code seulement ; « position une fois » et « vérifier ma position » sont bannis.
4. **Carte Duo** : jamais le nom du pet de N. avant le double oui.
5. **Indicateurs de ville** :
   - un nombre affiché vaut au moins 10, est arrondi à la dizaine et précédé de « environ » ;
   - « histoire compatible avec la tienne » n'apparaît que dans un indicateur de ville arrondi (« À Paris 11e, une trentaine… »).
6. **Imprévu** : une fois par mois (« trimestre » est banni). La règle canonique est mise à jour.

### Contrôles ajoutés au tour 5 (`check-facts`)

1. **Aucun signal de compatibilité** : sont bannis « sortie entre amis », « entre amis pour toi », « une histoire est possible », « vous vous plaisez » et « Personne ne le voit, ni ne peut le deviner ».
2. **Règle d'annulation unique** :
   - le texte canonique de `facts.annulation.regle` est présent sur Sortie, Fiche, Confirmation et Tarifs (une date peut remplacer « la veille 18 h ») ;
   - « 1 fois par mois » n'apparaît qu'avec « je connais quelqu'un ici », et « 1 fois par trimestre » qu'avec l'imprévu.
3. **Carte Duo** : avant le double oui, ni tranche, ni type, ni activités de N.
4. **Duos** : toute mention « N duos actifs » vaut 3 ; « duos illimités » et « duos sans limite » sont bannis.
5. **Blowy+** : il n'est jamais en achat intégré (terme banni), et l'écran Blowy+ dit « Apple Pay » et ne vend que des sorties.
6. **Liens** : au moins 8 caractères pour un lien public, 12 pour un lien nominatif.
7. **Contrôle des contrôles** : sur des copies piégées, check-facts a bien relevé le bandeau « entre amis », la tranche et le type sur la carte Duo, la règle d'annulation modifiée et Blowy+ en achat intégré.

### Contrôles ajoutés au tour 4

**`check-facts`** :

1. **Garantie jamais affichée** :
   - « au moins 2 personnes » et « histoire compatible avec la tienne » sont bannis ;
   - `facts.groupe` ne doit plus contenir la garantie.
2. **Calendrier B** :
   - toute « annulation gratuite jusqu'à … » de la sortie se termine le mer. 11 nov. 18 h (jamais aux visages) ;
   - la Confirmation contient les prénoms, les tranches et les pets des 4 autres, sans aucun « Visage de ».
3. **Chronologie des duos** : l'accord du lun. 9 nov. 20 h 50 précède le début du duo (21 h 30).
4. **Duo** : sur V5-Duo et V5-Duo-choix, le prénom de N. n'apparaît jamais avant le oui mutuel.
5. **Liens** :
   - chaque carte affiche son propre lien (`slugParFichier`) ;
   - aucun lien n'est réutilisé par deux cartes ;
   - un lien privé (invitation) n'est jamais à côté d'une cible « Story ».
6. **Vocabulaire** :
   - « pote » et « team » sont interdits dans les titres et les boutons ;
   - sont aussi bannis « Potes seulement », « Nouveaux potes », « captures d'écran sont bloquées », « Position au moment » et « résiliable ici ».
7. **Phrases dérivées** : sont maintenant reconnues « 3 personnes du même genre » (la règle), « à découvrir », « toi compris », et les comptes de l'amorçage.

Pour vérifier que ces contrôles fonctionnent, j'ai injecté des erreurs dans des copies de test : check-facts a relevé la garantie, le lien privé publiable en Story et la carte sans lien attribué.

**`a11y-audit`** : contrôles de mise en page, mesurés avec Playwright à partir des boîtes englobantes :

- **texte qui touche l'ombre d'un bouton** : texte placé à moins de 4 px sous le décalage plus le flou de l'ombre (sur la copie de test d'Abonnement : −3 px, détecté) ;
- **texte rogné** par un ancêtre en `overflow: hidden` ;
- **texte collé au bord** de son fond coloré : moins de 6 px à gauche ou 4 px à droite ;
- **date ou heure coupée** en fin de ligne : « mar. 10 nov. », « 21 h 30 », « 10 min ». En complément, le générateur pose des espaces insécables dans ces groupes.

## Jetons et accessibilité

Le langage visuel est celui de la V4 :

- crème `#FFF7EC`, encre `#16110D`, citron `#C8F542`, mangue, rose, violet ;
- Bricolage Grotesque 800 + Inter ;
- `.btn` à ombre portée, `.chip`, `.card`, `.grp/.row`.

Les jetons foncés pour l'AA sont ceux du tour 2 :

- bouton `#D93A1C` ;
- texte corail `#C4341B` ;
- rose `#C2185B` ;
- gris `#6F6458` / `#5A5047` ;
- vert `#1E7A47`.

Les interrupteurs montrent leur état réel : ON `#3F7A0B` à droite, OFF `#8C7B66` à gauche. Leur `aria-label` dit « activé » ou « désactivé ».

## Casting et données (extrait de `facts.json`)

- **Aujourd'hui** : lun. 9 nov. 2026. Alex (il, 26–29 ans, Paris 11e, Nino) donne son accord art. 9 à 20 h 50.
- **Sortie 1** : jeu. 12 nov. 19 h 30, Jeux de société.
  - **mer. 11 nov. 18 h** :
    - fin de l'annulation gratuite ;
    - le lieu (Café des Oiseaux, photo fournie par le lieu) ;
    - les prénoms, les tranches et les pets ;
    - l'effectif envoyé au lieu.
  - **jeu. 12 nov. 16 h 30** : les visages.
  - Votes jusqu'au dim. 15 nov. 21 h 30.
- **Groupe** : 5 personnes, 26–34 ans, 2 femmes et 3 hommes, Alex vient avec Tom, 3 nouvelles personnes. La seule règle affichée, comme règle générale : « Jamais plus de 3 personnes du même genre dans un groupe. »
- **Duo Jade** (pour une histoire, projet compatible activé par les deux) :
  - début : lun. 9 nov. 21 h 30 ;
  - visages : mer. 11 nov. 21 h 30 ;
  - rendez-vous : sam. 14 nov. 15 h.
- **Duo N.** (en amitié) : seulement l'initiale avant le oui.
- **Bordeaux** :
  - 64 personnes vérifiées, 3 lieux ;
  - il manque 2 personnes pour le sam. 21 nov., sinon sortie le sam. 28 nov. ;
  - carte « Aide Bordeaux à sortir ».
- **Lille** :
  - toi et 2 proches, plus 2 personnes de Lille : 2 femmes, 3 hommes, 22–29 ans ;
  - variante en solo : 3 femmes, 2 hommes ;
  - le lieu est nommé la veille, ven. 27 nov. 18 h.
- **Lyon** : Lyon 7e vers Lyon 4e (18 min), mar. 17 nov., Foot à 5.
- **Argent** :
  - places en Apple Pay ;
  - Blowy+ 9,99 €/mois : abonnement aux sorties, payé avec **Apple Pay**, résiliable dans l'app, rentable dès 3 sorties par mois ; Duo gratuit, 3 duos actifs au plus ;
  - une place vide après la veille 18 h : 4,99 € reversés au lieu, 3 € si elle était offerte ou dans Blowy+ ; 3 € par place si Blowy annule une sortie confirmée ; relevé mensuel.
- **Liens** :
  - `s/Hq3vT8` : cette semaine ;
  - `s/pL7c2N` : ce soir ;
  - `s/Zx9mQ4` : on était 5 ;
  - `s/aR5kW1` : ma bande s'agrandit ;
  - `v/bD8nY3` : Bordeaux ;
  - `i/r8Tz4w` : invitation personnelle, par message seulement ;
  - `m/k7f2q` : 3 mots ;
  - `a/…` : ange gardien.

## Changements du tour 6 (concept-v5.5 et test des 5 secondes)

- **Sécurité (bloquant)** :
  - l'astreinte couvre toutes les heures de créneaux ; partout, la phrase est « Une personne de l'équipe est joignable pendant toute ta sortie. » ;
  - le rendez-vous avec Léa passe au Café Ginette, avec une table à deux réservée après les deux oui ;
  - check-in par code seulement ;
  - proposition Duo : « Un capybara · N. », l'espèce et l'initiale, sans le nom du pet.
- **Imprévu** : une fois par mois, sans pénalité, place non remboursée. Les visages n'ont plus que 3 actions : je connais quelqu'un ici, je ne peux plus venir, partager.
- **Promesse vérifiable** :
  - Bordeaux : « environ 40 inscrits ont entre 18 et 25 ans » ;
  - Duo : « À Paris 11e, une trentaine de personnes cherchent une histoire compatible avec la tienne » ;
  - nouvel état « Cette semaine, pas encore » (Marseille) ;
  - Affiner : ambiance, âge pour une histoire, horizon pour les enfants ;
  - duo homme-homme (V5-Duo-hh).
- **Viralité** :
  - parrainage : une sortie offerte, une fois par mois au plus ;
  - partage sur Confirmation et sur les Trouvées de Lyon et Saint-Denis ;
  - cartes « Alors, jeudi ? » et « Ma bande » en mode capture, export « Vidéo 5 s » ;
  - « Mes cartes » en vignettes 9:16 ;
  - « Ma bande s'agrandit » sans mascotte.
- **Lieu** :
  - « Blowy annule » formulé à l'identique côté client et contrat ;
  - relevé détaillé par soirée ;
  - contrat signé par les deux parties, avec un article Responsabilité et les montants TTC/HT ;
  - astreinte « pendant tous vos créneaux ».
- **Gabarit unique** : Trouvée, Sortie et Confirmation sont générées par les mêmes fonctions pour Paris, Lyon et Saint-Denis (avec Yacine). Lyon a désormais un lieu cohérent avec l'activité.
- **Test des 5 secondes** :
  - frise de 3 jalons sur Sortie, règles derrière « Règles d'annulation › » ;
  - « Offerte (ta 1re sortie) · ensuite 4,99 € » sous le bouton ;
  - « Tom vient avec toi · 3 nouvelles personnes » ;
  - « à découvrir la veille » ;
  - « Nino (ton pet) t'a trouvé une sortie », et « Inviter quelqu'un à venir avec toi » ;
  - « Lieu révélé mer. 11 nov. 18 h », « Mettre en pause mes sorties » et « Taille du pet », partout où ces libellés apparaissent.
- **Phrases de Léa** :
  - « Personne ne voit que tu es en pause » ;
  - « Annulée le mer. 11 nov. à 18 h » ;
  - « Titre dans ton agenda : « Rendez-vous · 19 h 30 » » ;
  - « supprimée sous 48 h » ;
  - « Urgent pendant une sortie · < 1 h » ;
  - pastille grise dans Chats ;
  - Vérif « Alex · 26–29 ans ».
- **Finitions** :
  - Team : « selfie à faire » avec une horloge, bouton « Garder la place de Tom (30 min) » ;
  - Invite et Souvenir sans grande mascotte (Souvenir : 5 verres sur une table) ;
  - une seule liste « qui voit quoi » (Confidentialité, avec le pet et le nombre de femmes et d'hommes) ;
  - Affiner ne garde que les questions de rencontre ;
  - « Semaines off » coché dessiné ;
  - « Ne ressemble pas à ses photos » ;
  - apostrophes typographiques partout, insécables dans « 26–29 ans » et « d'ici là ».

## Changements du tour 5 (concept-v5.4)

- **A. Confidentialité** :
  - le bandeau « entre amis » est supprimé avec son écran ;
  - promesse générale sur Intention, Pour une histoire et Confidentialité : « Si tu cherches une histoire, Blowy compose tes groupes pour qu'elle soit possible. Il ne te dira jamais avec qui. » ;
  - proposition Duo : pet et initiale seulement ;
  - phrase « vous avez dit oui tous les deux » ;
  - Confidentialité : ligne « Le lieu : ton prénom et ton pet, la veille à 18 h » ;
  - mode discret choisi à l'inscription (« Discret » ou « Normal », aucun présélectionné) ;
  - écran « Éviter les personnes que tu connais » dans le parcours, avant la Trouvée ;
  - Welcome : « Toutes orientations · en groupe ou à deux », de 18 à 60 ans et plus, une table de 5.
- **B. Imprévus** :
  - une seule règle, écrite sur Sortie, Confirmation, Fiche, Tarifs et Sortie à Lyon ;
  - imprévu une fois par trimestre (lien sur Les visages) ;
  - « une semaine sur deux » expliqué sous les créneaux, avec la ligne « Semaines sans moi » dans Réglages.
- **C. Argent** :
  - Blowy+ est un abonnement aux sorties, payé avec Apple Pay et résiliable dans l'app ;
  - Duo gratuit, jusqu'à 3 duos actifs (l'écran « Un 2e duo ? » est supprimé) ;
  - lieu : 3 € par place si Blowy annule une sortie confirmée, relevé mensuel (novembre : 2 places vides, 7,99 €, versés le 5 décembre), bouton « Signaler un participant », SMS en cas de demande d'aide à sa table ;
  - contrat avec un article Données ; tables à deux dans la grille.
- **D. Finitions** :
  - « selfie à faire » au lieu de « vérifié » (Team) ;
  - temps de trajet sur toutes les Trouvées, et Saint-Denis vers Paris 18e ;
  - Lyon complet : Trouvée, Sortie, Confirmation, et la sortie de la semaine suivante ;
  - Lille en solo dans 5 jours, formulation épicène ;
  - Résultats : « Écrire à Léa » en action principale ;
  - « Partager Nino seul » ;
  - nouvel écran « Mes cartes » ;
  - Profil : « 1 / 1 » sur une ligne, pronom modifiable ;
  - interrupteurs de l'œuf liés ;
  - « Un jeu de cartes ? On est pile 5 ! » ;
  - Trouvée sur fond crème, raton réduit, activité « choisie selon le lieu et vos envies » ;
  - les « ? » du groupe portent une légende unique ;
  - insécables pour « 3 hommes », « du 11e », « toi compris », « check-in » ;
  - pages web sans villes codées en dur ;
  - case « J'ai 18 ans ou plus » ;
  - Chargement : « ta proposition arrive lundi à 21 h » ;
  - cartes « Cette semaine » (enveloppe scellée, choix « Demain » dessiné), « Je sors ce soir » (vert canard, chevalet) et « On était 5 » (5 verres, interrupteur « Sans logo ») : couleur et composition propres ;
  - invitation sans mascotte, avec « Texte + lien ».

## Changements du tour 4 (concept-v5.3, pour mémoire)

- **A. Confidentialité** :
  - plus aucune garantie affichée ;
  - les « ? » portent « à découvrir » (neutre) ;
  - Duo : N. avant le oui, carte montrée seulement après ton oui ;
  - W-Ange-aide : « Lieu de la sortie · pas de position » ;
  - « Je sors ce soir » sans lieu, sans quartier ni heure, proposé avant la sortie (depuis Les visages) et retiré du Check-in.
- **B. Calendrier** :
  - une seule règle partout : « Annulation gratuite jusqu'au mer. 11 nov. 18 h, autant de fois que nécessaire » ;
  - Confirmation avec la liste des prénoms et pets, plus « Je connais quelqu'un ici » ;
  - « Je pars, mal à l'aise » : sans pénalité, l'équipe est prévenue, rappel au bout de 3 fois.
- **C. Argent** (tour 4, remplacé au tour 5 : Blowy+ passe en Apple Pay) : Blowy+ en achat intégré, places en Apple Pay, compensation du lieu dite au client (Tarifs) et au lieu (L-Effectif, L-Contrat).
- **D. Onboarding** :
  - 9 écrans avant la Trouvée, une question chacun : Ville, Naissance, Genre, Pet, Rencontrer, Tu cherches, Consentement, Pour une histoire, Créneaux ;
  - les créneaux incluent les semaines d'absence et le trajet maximum (30 min par défaut) ;
  - le compte arrive après « Je viens » (« Ta place en 1 tap ») ;
  - « venir avec quelqu'un » et « proches » partout.
- **E. Viralité** :
  - 6 cartes visuellement distinctes (couleur et composition), chacune avec son lien ;
  - « Partager la soirée » est l'action principale de Résultats ;
  - nouvelle carte du dimanche, « Ma bande s'agrandit » ;
  - aucun duo proposé à l'inscription si l'on choisit le petit groupe.
- **F. Personas** :
  - portraits illustrés neutres à la place des lettres. **L'app montre les vraies photos vérifiées** ; la maquette ne montre jamais de vraie personne, et Vérif/Profil disent « ta photo ici » ;
  - Lyon et Lille en solo ;
  - « Réduire le pet » sur l'Accueil et « Taille du pet » dans Réglages ;
  - Ta rue : maisons, souvenirs dans le décor, « Offrir tes lunettes à Pépite » (facultatif) ;
  - Bordeaux daté ;
  - écran « Éviter les personnes que je connais » (empreintes chiffrées sur l'appareil, désactivé tant qu'on n'a pas dit oui).
- **Lieu** : 3 écrans web au même langage visuel, adapté au bureau (barre latérale encre, cartes crème) :
  - effectif de la veille 18 h, table Blowy avec prénoms seulement ;
  - créneaux et plafond de tables ;
  - contrat d'une page.
- **Défauts de pixel** :
  - légendes décalées de 14 px sous les boutons ;
  - « SORTIE VÉCUE » en encre pleine, au-dessus du flou ;
  - chips droites dans W-Repondre ;
  - marge du rappel dans Signaler, case « Bloquer aussi » au contour neutre ;
  - lignes « Tom vient · + 1 place » ;
  - plus aucune date coupée.

## Écarts au concept (et décisions tranchées)

| Sujet | Décision | Pourquoi |
|---|---|---|
| Réglage du Duo par carte | La carte « Un capybara · N. » montre une illustration de l'espèce, jamais le nom. | C.3. |
| Éviter | Écran facultatif sans numéro d'étape, entre Créneaux et Trouvée. | A.6 le veut avant la 1re composition ; il ne compte pas dans « ≤ 9 questions » car il n'en pose pas pour composer. |
| Mode discret de la démo | Alex a choisi « Normal » : Notifications montre l'icône blowy., Confidentialité dit « tu as choisi normal ». | Les exemples sont fidèles à l'état choisi. |
| Compte | Il est demandé après « Je viens », pas avant la Trouvée. | Il permet de tenir « ≤ 9 écrans, une question chacun » sans rien fusionner. La place est gardée 30 min. |
| Consentement | Il compte comme une étape (7/9) même s'il n'apparaît que pour « histoire ». | La pastille avance de façon régulière. Le parcours « amitiés » saute les étapes 7 et 8. |
| Trajet maximum | Il est sur l'écran des créneaux, avec 30 min présélectionné. | D.14 demande un défaut affiché ; c'est la seule présélection de l'onboarding. |
| Vote | Aucun état par défaut. « Sans réponse, c'est non, sans rien afficher. » | Le jury lisait le « Non » en contour comme un choix. |
| Vote et résultats | Les vignettes gardent l'initiale sur un dégradé. | Ce sont des listes jouables en Play (holes texte seulement). Les portraits sont sur Les visages, Lien, Chat, Profil et Vérif. |
| Tarif étudiant | Non maquetté. | Hors concept-v5.4 ; à trancher dans business-model. |
| Lien de la carte du jeudi | « Je sors ce soir » est proposé depuis Les visages (16 h 40), pas depuis le Check-in. | A.5 et « Range ton téléphone ». |
| Taille du pet | Le lien est sur l'Accueil, le réglage dans Réglages. | Un seul réglage (F.23). |

## Vocabulaire (un mot = un concept)

**sortie** · **groupe** (5 personnes) · **venir avec quelqu'un** / **tes proches** (« team » ne reste que dans des textes secondaires, jamais dans un titre ou un bouton) · **nouvelles personnes** · **à découvrir** · **bande** · **Ta rue** · **duo** (pet + initiale avant le double oui) · **confirmation** (veille 18 h : lieu, prénoms, pets) · **visages** (J −3 h) · **besoin d'aide** · **check-in**, **code du chevalet** · **ange gardien** · **pause** · **mode discret** · **fiabilité** · **souvenir** · **accord** · **Partir proprement** · **place** (Apple Pay) · **Blowy+** (abonnement aux sorties, Apple Pay) · vote **Amitié / Plus / Non**.

## Textes clés (i18n)

Phrases canoniques (V5.8, une par règle, à reprendre mot pour mot) :

- `regles.securite` : « Pour ta sécurité : toujours possible, sans pénalité, place remboursée. »
- `regles.connais` : « « Je connais quelqu’un ici » : 1 fois par mois, place remboursée ; au-delà, c’est une sortie pour ta sécurité, examinée par l’équipe, sans pénalité. »
- `regles.imprevu` : « Imprévu, sans raison à donner : 1 fois par mois, sans pénalité, place non remboursée. »
- `regles.annulation` : « Annulation gratuite jusqu’à la veille 18 h ; ensuite, c’est une absence. »
- `regles.fiabilite` : « Ta fiabilité est visible par toi seulement. »
- `regles.astreinte` : « Une personne de l’équipe est joignable pendant toute ta sortie. »
- `regles.rappel` : « Un signalement reçoit une réponse de l’équipe en moins d’1 h pendant toute ta sortie. »
- `regles.blowyPlus` : « Intéressant dès la 3e sortie du mois. »
- `regles.blowyAnnule` : « Sortie annulée par Blowy à la confirmation ou après : chaque place réservée est compensée au lieu par Blowy. »
- `regles.astreinteRdv` : « Une personne de l’équipe est joignable pendant tout ton rendez-vous. »
- `regles.astreinteAnge` : « Une personne de l’équipe est joignable pendant toute la sortie d’Alex. »
- `regles.aide` : « Quelqu’un de l’équipe te rappelle en quelques minutes. »
- `regles.aideAnge` : « Quelqu’un de l’équipe rappelle Alex en quelques minutes. »
- `regles.blowyPlusDeux` : « Tu sors 2 fois par mois ? Paie à la place (2 × 4,99 €). Blowy+ devient intéressant dès la 3e sortie du mois. »
- `regles.placeVide` : « Place laissée vide après la veille 18 h : le lieu est toujours payé ; par la place du participant en cas d’imprévu ou d’absence, par Blowy si elle est remboursée (sécurité, « je connais quelqu’un ici ») ou offerte. »
- `regles.captures` : « Les captures d’écran iOS sont signalées à l’équipe. »
- `regles.aideLieu` : « Quelqu’un de l’équipe vous rappelle en quelques minutes. »
- `regles.numero` : « Les numéros restent masqués jusqu’aux visages. »
- `regles.deuxOui` : « quand vous avez dit oui tous les deux »


| Clé | Texte |
|---|---|
| compo.regle | Règle de chaque groupe : jamais plus de 3 personnes du même genre dans un groupe. |
| compo.inconnu | à découvrir |
| promesse | Si tu cherches une histoire, Blowy compose tes groupes pour qu’elle soit possible. Il ne te dira jamais avec qui. |
| annulation | Annulation gratuite jusqu’à la veille 18 h. Ensuite, c’est une absence, sauf pour ta sécurité, « je connais quelqu’un ici » ou un imprévu (chacun 1 fois par mois, sans pénalité, place non remboursée). |
| astreinte | Une personne de l’équipe est joignable pendant toute ta sortie. |
| parrainage | Quand la personne que tu invites vient à sa 1re sortie, ta prochaine sortie est offerte (1 par mois au plus). |
| pas.encore | Cette semaine, pas encore assez de personnes compatibles avec ce que tu cherches sur tes créneaux. Tu peux sortir quand même (en amitié) ou attendre la semaine prochaine. |
| compte.mode | Sur ton téléphone, blowy. apparaît… Discret / Normal |
| confirmation.groupe | Ton groupe · sans visages jusqu’à J −3 h — {prénom} · {tranche} · {pet} |
| revelation.captures | Ton prénom est en filigrane sur chaque visage ; les captures sont détectées et signalées. |
| team.title | Viens avec quelqu’un. |
| invite.lien | Ce lien t’a été envoyé par message, à toi seul : il ne marche qu’une fois. |
| attente | Il manque {n} personnes pour ta sortie du {jour}. … Sinon, Nino te propose le {date}, même créneau. |
| carte.confirmation / checkin / soiree / dimanche / ville / invitation | Cette semaine, je sors avec 3 nouvelles personnes. / Je sors ce soir. / On était 5. / Ma bande s’agrandit. / Aide {ville} à sortir. / Viens avec moi. |
| duo.limite | Gratuit : jusqu’à 3 duos actifs. Une proposition reste 48 h. · Ou viens jeudi en groupe › |
| duo.avantOui | Avant vos deux oui, chacun ne voit que le pet et l’initiale de l’autre. Le reste de la carte, après ; le prénom, aux visages. |
| abonnement | Un abonnement aux sorties, payé avec Apple Pay. Sans engagement, résiliable ici à tout moment. Les duos restent gratuits pour tout le monde. |
| tarifs.lieu | Le lieu ne prend rien sur ta place. Si ta place reste vide après la confirmation de la veille, son prix est reversé au lieu (3 € si elle était offerte). |
| eviter | Ton téléphone transforme chaque numéro en empreinte chiffrée. On compare seulement les empreintes. |
| ange.aide | Alex a besoin d’aide. · Lieu de la sortie · pas de position |

## Générateur

Les écrans sont générés par des scripts Python, hors dépôt, qui lisent `facts.json` : base commune, A, B, C/D, E/F/G/H, lieu et `canvas.json`. Les `.dc.html` livrés sont autonomes et éditables à la main. Après toute modification, relancer `check-facts.mjs` et `a11y-audit.mjs`.
