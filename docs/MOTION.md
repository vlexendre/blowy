# Mouvement — règles et inventaire

Minimoa est une app de peluches vivantes : tout ce qui est touché répond, et les pets jouent avec l'écran.
Le mouvement sert à trois choses : **répondre** (j'ai bien appuyé), **expliquer** (d'où ça vient, où ça va),
**donner vie** (le pet existe même quand on ne fait rien). Rien d'autre.

## Règles
1. **Jamais bloquant.** Aucune animation ne retarde une action ; tout reste touchable pendant qu'elle joue.
2. **Court.** Interface : 90 à 320 ms. Seuls les moments de fête (objet débloqué, niveau, lien créé) durent plus,
   et se coupent d'un tap.
3. **Du poids.** Une peluche s'écrase et rebondit : ressorts pour ce qui a une masse (pets, objets, feuilles,
   boutons), courbes simples pour le reste (fondus, glissements).
4. **Une vedette par écran.** Un seul mouvement attire l'œil à la fois ; le reste est discret et décalé (cascade).
5. **Fil natif.** Uniquement `transform` et `opacity`, via Reanimated (worklets). Pas de `setState` par image.
   Les boucles s'arrêtent quand l'écran n'est pas au premier plan ou que l'app passe en arrière-plan
   (`useLoop`, `useMotionActive`). Une ligne de liste ne s'anime qu'à sa première apparition (`Appear once`).
   Les gestes (Gesture Handler) ont des réglages stables (`useMemo`) : un geste recréé pendant un appui est annulé.
6. **« Réduire les animations »** : plus de déplacements ni de boucles ; on garde des fondus courts et les
   changements d'état. Aucun contenu ne doit dépendre d'une animation pour être lisible. Lire le réglage avec
   `useReducedMotion` de `@blowy/ui` (réglage du système, forçable par `MotionHost`/`MotionProvider`), et faire les
   fondus avec `fadeTo` (sinon Reanimated saute directement à la fin quand le système réduit les animations).
7. **Le toucher va avec.** Chaque retour visuel important a son retour haptique (léger pour un appui,
   moyen pour une réussite, notification pour une fête ou une erreur).
8. **Déterministe.** Les comportements « au hasard » des pets suivent une graine (id du pet + minute courante) :
   même rendu aux tests, jamais deux fois de suite la même blague.

## Jetons (`packages/ui/src/theme.ts` → `motion`)
| Nom | Valeur | Usage |
|---|---|---|
| `instant` | 90 ms | retour d'appui, bascule |
| `fast` | 160 ms | fondus, petites apparitions |
| `base` | 240 ms | entrées de cartes, changements d'onglet |
| `slow` | 420 ms | barres, compteurs, révélations |
| `scene` | 700 ms | fêtes, entrées de pet |
| `stagger` | 45 ms | décalage entre deux éléments d'une cascade (8 éléments max, le reste arrive d'un bloc) |
| ressort `spring.press` (= `press`) | raide, sans rebond (amort. 30, raideur 520, masse 0,6) | boutons |
| ressort `spring.pop` (= `pop`) | un rebond (14 / 180) | pastilles, tuiles, bulles |
| ressort `spring.soft` | lent, sans rebond (20 / 110) | feuilles, panneaux |
| ressort `spring.plush` | deux rebonds amortis (8 / 170 / 0,9) | pets et objets |
| courbes `curve.standard` · `out` · `in` · `inOut` | Bézier `[x1, y1, x2, y2]` | glissements · entrées · sorties · boucles (`ease.*` de `lib/motion`) |

Les noms historiques (`motion.press`, `motion.pop`, `fast`, `base`, `slow`, `breath`) restent valables.

## Primitives (`packages/ui/src/motion/`, exportées par `@blowy/ui`)
`Appear` (fondu + montée + légère échelle, `delay`, `once` pour les listes), `Stagger` (cascade d'enfants), `PopIn`,
`Shake` (erreur), `Pulse` (attirer l'œil, 2 battements puis repos), `CountUp` (nombre qui défile comme un compteur
mécanique), barres animées (`ProgressBar`, `NeedMeter`, `GaugeBar` : dépassement léger, transformations seulement),
`Shimmer` (squelettes, `Skeleton`), `Loader` (chargement en ligne : trois boules de poils qui rebondissent), `Burst` (cœurs — seulement pour l'affection envers son propre minimoa, jamais pour une relation (spéc. §27) —, étoiles, étincelles, confettis, « z » en vues simples),
`TypingDots`, `useFlyTo` (un objet vole d'un point à un autre), `useBurst` (explosion au-dessus de tout), `useReveal`
(mot à mot : bulles, titres), feuille à ressort (`SheetTemplate`), interrupteur à ressort (`Toggle`), indicateur d'onglet
glissant (`SegmentedTabs`, `SlotTabs`, `BottomTabBar`), petite scène en plusieurs temps (`useSceneSteps`), bouton à
maintenir à anneau (`HoldButton`). Tout élément touchable passe par `Pressable` (enfoncement
adapté à la taille, rebond au relâchement, `bounceKey` pour confirmer un changement d'état).

**Racine** : `MotionHost` (une fois, dans `app/_layout.tsx`) fournit le calque des vols, explosions et pets qui passent
la tête, et met les boucles en pause quand l'app passe en arrière-plan. Chaque écran s'enveloppe dans `ScreenMotion`
(`src/core/motion.tsx`, `useIsFocused` d'expo-router → `MotionFocus`) pour couper ses boucles quand il n'est plus au
premier plan. Mode d'emploi détaillé et recettes : `packages/ui/README.md` → « Mouvement ».

## Les pets jouent avec l'écran (`PetActor`, `PetPeek`, `PetRefresh`, `KeyboardPeek`, `HelloPeek`, `PetEntrance`, `PetRise`)
- **Poses du pack** (`PetActor` dès 96 pt ou habillé) : chaque humeur est une pose en pied (même ligne de sol) ; on
  passe de l'une à l'autre en fondu-enchaîné de 130 ms au creux d'un petit rebond (fondu seul en animations réduites).
  Soins : `mange` (il croque la pomme), `joue` (il attrape la balle et la garde), `dodo`, câlin `joie` ; refus `boude` ;
  `arrive` (il entre en marchant, de profil), `check`, `think` (`pense`), `wave` (`coucou`) ; `strike(pose)` en tient une.
  Accueil, un moment par ouverture : il arrive en marchant, ou fait coucou après plus de 12 h ; la nuit il dort, quand il
  boude il garde les bras croisés. Réponse à la sortie : « pas encore » → il réfléchit ; sorti → il rentre en marchant
  puis saute de joie.
- **Au repos** : respiration (écrasement léger), petit saut de temps en temps, changement d'expression bref
  (les 9 émotions de chaque espèce servent à ça ; habillé, il s'exprime par le corps et de petits signes : étincelles,
  goutte, « ! », « z »), regard vers ce qu'on vient de toucher. L'humeur change au creux d'un petit écrasement
  (jamais deux poses superposées). Chapeaux et signes suivent le corps avec un temps de retard.
- **Touché** : s'écrase, sourit, un cœur s'envole. Deux taps : saute. Appui long : se blottit.
- **Attrapé** : on peut le prendre et le déplacer ; il s'étire, a l'air surpris, revient en rebondissant quand on
  le lâche ; lancé vers un bord, il rebondit sur le cadre de l'écran (écrasé contre le bord). Arbitrage : un glissé
  d'abord horizontal l'attrape, un glissé d'abord vertical fait défiler l'écran ; après un appui de 0,35 s on le tient
  dans tous les sens (sans bouger : il se blottit). Tant qu'on le tient, l'écran ne défile plus.
- **Soins** : `feed` une fraise tombe dans sa bouche ouverte, il croque ; `play` une balle rebondit, il saute après ;
  `nap` la lumière baisse, il dort, des « z » montent, il s'étire au réveil ; `cuddle` il se serre, cœurs. Refus : `no`
  (il fait non de la tête, goutte de sueur). Aussi `joy`, `wave`, `surprise`.
- **Il sort du bas** (`PetRise`) : grand, rogné par le bord bas de l'écran, il monte, cligne des yeux ou regarde
  autour de lui, et redescend s'y cacher ; décor sans toucher (temps fort du caractère).
- **Cache-cache** (`PetPeek`) : le pet sort d'un bord de l'écran (coin bas, côté, suspendu en haut), regarde,
  se cache si on le touche et ressort ailleurs. Utilisé pour : états vides, erreurs (triste), hors ligne,
  tirer pour rafraîchir (il grimpe à mesure qu'on tire), fin de liste (il sort quand on tire trop loin),
  clavier ouvert (il regarde par-dessus le clavier), changement d'onglet (il passe la tête au-dessus de la barre),
  retour dans l'app (il salue).
- **Têtes surprises : rares** (`peekBudget`, partagé par la barre d'onglets et `HelloPeek`). Changement d'onglet : environ
  une fois sur dix (tirage déterministe : id du pet + n° du changement + minute) ; jamais deux têtes à moins de 3 min ;
  rien dans les 20 premières secondes de la session. Retour dans l'app : après au moins 1 min d'absence, au plus une fois
  par session (une chance sur deux). Uniquement sur un écran à onglets au premier plan (barre visible) et jamais par-dessus
  une feuille (`useOverlay`) : rien sur un écran poussé, l'inscription ou une modale. Les `PetPeek` liés à un état (état
  vide, hors ligne, page inconnue, lien disparu, clavier) restent tels quels : ils sont sur place (`inline`) ou suivent leur écran.
- **Il s'endort** : 25 s sans toucher l'accueil, ou la nuit (22 h – 7 h) : il dort, des « z » montent ; un tap le
  réveille en sursaut.
- **Jamais gênant** : un pet ne recouvre ni un bouton, ni un champ, ni du texte utile ; il ne capture pas les
  touches destinées à ce qu'il y a dessous (sauf sur lui-même). `PetPeek` reste hors des zones sûres (`safe` : sous
  l'en-tête, au-dessus de la barre d'onglets ou du clavier) ; par défaut seulement dans les coins bas.
- **Soin glissé** (accueil) : appuyer 0,14 s sur un soin puis glisser soulève son picto (jeton rond, au-dessus du doigt) ;
  le pet le suit des yeux en se penchant, prend un air gourmand, puis ouvre la bouche (`surpris`) quand il arrive tout
  près ; lâché sur le pet, le picto entre dans sa bouche et le soin part (même mutation qu'un tap) ; lâché ailleurs, il
  revient en ressort. Le tap reste identique ; un soin refusé ou inactif ne se glisse pas (il tremble au tap). Un glissé
  immédiat fait défiler la page ; une fois le picto soulevé, la page ne défile plus.
- **Chargements** : jamais de roue. Écran ou liste : squelettes (`Skeleton`, reflet `Shimmer`) à la forme du contenu ;
  bouton ou soin : `Loader` (trois boules qui rebondissent, à l'encre du bouton, libellé gardé en place) ; tirer pour
  rafraîchir : le pet qui grimpe (`PetRefresh`, accueil) ou trois boules jaunes qui se remplissent puis rebondissent
  (`ScreenTemplate`). Animations réduites : boules fixes, reflet arrêté.
- **En-têtes** : corps défilant en pleine hauteur ; barre du haut collée, verre flouté qui s'allume dès qu'on défile (le
  contenu passe dessous, rien n'est caché au repos) ; petit titre qui apparaît quand le grand titre d'un onglet sort.
- **Sur le web** : pas de tirage élastique (donc pas de pet dans `PetRefresh`), pas d'événement clavier (`KeyboardPeek`
  n'apparaît pas), pas de vibration. Tout le reste fonctionne.

## Inventaire par écran
| Écran | Vedette | Micro-interactions |
|---|---|---|
| Lancement | le pet entre en courant et se pose (`PetEntrance`) | fond qui s'éclaire |
| Bienvenue | les bulles du chat s'écrivent une à une | bouton qui respire une fois, pet qui passe la tête |
| Entrée en scène | les quatre pets sortent du bas de l'écran l'un après l'autre (`PetRise`) | grande ligne qui monte à chaque pet ; clin d'œil ou regard autour ; tap = ligne suivante |
| Créer son pet | le pet choisi saute au centre | les autres se penchent pour regarder ; le nom tapé fait hocher le pet |
| Questions (hôte) | la bulle de l'hôte s'écrit (« … » puis mot à mot) | petit pet qui fait « pop » à l'arrivée ; barre continue qui avance d'un cran depuis l'étape d'avant |
| Caractère (quiz) | la carte choisie s'incline et part | la jauge de la question file vers le pôle choisi et s'éclaire dès le toucher ; 1re question sans toucher : les deux cartes se soulèvent l'une après l'autre (deux fois, une fois par session) ; l'hôte saute de joie à chaque réponse ; la bulle se réécrit |
| Caractère (temps fort) | le pet sort du bas de l'écran dans des étoiles | verdict mot à mot ; puces des deux traits en « pop » ; il regarde autour |
| Prénom / date / ville | — | grand champ souligné qui s'allume au focus ; date fausse : secousse ; trop jeune : pet triste qui se retourne |
| Promesse | l'anneau se remplit autour de « promis » (`HoldButton`) | le bouton s'enfonce pendant l'appui ; plein : coche dessinée, le pet saute de joie, étoiles |
| Compte (code) | chaque chiffre fait « pop » | secousse sur code faux ; coche dessinée sur code bon ; connexion : le pet regarde par-dessus le clavier |
| Préparation | les lignes se cochent une à une (`PrepChecklist`) | pourcentage qui défile, barre avec dépassement ; erreur : tout s'arrête, le pet s'inquiète |
| Tout est prêt | le pet saute de joie, confettis (`ReadyHero`) | titre mot à mot puis la phrase |
| Accueil (pet) | réaction au soin (croque, saute, dort, cœurs) ; défi relevé : `StreakCelebration` (le chiffre défile d'un cran, la mèche se rallume plus grande, il saute de joie, confettis ; tap pour fermer) | mèche (`StreakFlame`) qui vacille sur sa tête et le suit (sauts, buste quand il dort), plus basse tant que le défi n'est pas fait ; jauge de sociabilité (`HeroMeter`) : chiffre compté, barre avec dépassement ; réponses de sortie qui rebondissent, réponse du minimoa qui monte ; puce de série qui bat deux fois ; barres, bulle qui s'écrit ; pet attrapable ; il s'endort ; tirer pour rafraîchir ; soin glissé jusqu'au pet |
| Défi du jour | la carte monte du bas en ressort, le minimoa jaillit derrière son bord haut (mèche allumée) | puce inclinée en « pop », tuiles de ce que ça rapporte en cascade ; réponse choisie qui s'incline ; voile qui s'assombrit |
| Série | la mèche se rallume (braise → jaillit → se pose, étincelles) à la 1re visite, chiffre qui défile depuis 0 ; record : confettis | jours faits cochés un à un ; prochain objet qui bat deux fois ; objets en cascade |
| Preuve | le verdict monte sur la photo, le minimoa en autocollant saute de joie (ou fait non, gentiment), étoiles | bulle de la demande qui s'écrit ; trois boules pendant la vérification |
| Habitudes | — | cartes en cascade (une fois) ; pastille de rythme qui glisse au toucher (rebond de confirmation) |
| Bilan | — | chiffres qui défilent, cartes en cascade (une fois par bilan) |
| Son caractère | les barres de la vision se remplissent depuis le centre, l'une après l'autre | jauges du style en petit, même mouvement ; entrées en cascade |
| Garde-robe | l'objet vole de sa tuile jusqu'au pet, qui rebondit | tuiles en cascade ; objet verrouillé qui tremble ; « bientôt » qui brille ; indicateur d'emplacement glissant ; « nouveau » qui scintille ; retirer : l'objet saute du pet et rentre dans sa case |
| Objet débloqué | l'objet tombe, rebondit, confettis | titre mot à mot ; tap pour passer |
| Chats | bandeau « Nino a croisé quelqu’un » qui s'ouvre | lignes en cascade ; pastille non-lu qui rebondit ; étincelles de vie qui palpitent quand une vie est en danger ; bandeau « Série en jeu » qui arrive après celui des rencontres |
| Chat | la bulle envoyée monte depuis le champ | « … » avant un message de minimoa ; tête du minimoa qui sort avec sa bulle ; bouton envoyer qui se transforme ; étincelle de vie qui se brise ou revient ; interrupteur des minimoas (en-tête) qui fait « pop » et pâlit quand on les coupe ; accord de lecture : feuille à ressort, les deux minimoas montent du bas du panneau rose ; appui long sur un message : la bulle s'enfonce, la feuille « signaler » monte |
| Le lien | la série avance sous tes yeux quand le deuxième écrit : le chiffre défile d'un cran, la flamme saute (ressort `plush`), confettis depuis elle, vibration de fête (`LinkTodayHero`) | à la 1re visite, la flamme grandit et le chiffre défile depuis 0 ; jours de la semaine cochés un à un ; cartes en cascade (une fois par lien) |
| Le lien : étapes | — | étapes en cascade ; photos d'avant qui se posent comme des cartes |
| Niveaux | la marche atteinte s'allume | barre vers le niveau suivant ; confettis au passage |
| Lien fantôme | le pet devient transparent et flotte | ranimer : les étincelles de vie se rallument une à une |
| Rencontres | les cartes arrivent en éventail | « saluer » : le minimoa fait signe, onde autour du bouton ; accepté : les deux minimoas se courent dessus et se cognent |
| Une rencontre | les deux minimoas entrent par leur côté | les repères « toi » et l'autre glissent du centre de chaque piste vers leur tiers, l'un après l'autre (ressort `pop`) ; « saluer » : ton minimoa fait signe, onde |
| Carte | les minimoas se posent dans la zone, du centre vers l'extérieur (une fois par session) | au repos, chaque autocollant flotte doucement (décalés) ; touché, il sautille et sa fiche glisse de la droite ; onde jaune autour de toi ; silhouettes floues qui respirent lentement ; « saluer » : onde depuis le bouton ; la puce « plus loin » et le pied arrivent après la carte |
| Moi / réglages | — | interrupteurs à ressort ; lignes qui s'enfoncent ; copie du lien : coche ; suppression : minimoa qui fait non ; notifications : l'heure choisie passe en jaune avec un petit rebond |
| Barre d'onglets | l'icône active rebondit, la pastille jaune glisse | pastilles qui « pop » à l'arrivée d'un message ; rarement (≈ 1 fois sur 10, 3 min de pause), le pet passe la tête au-dessus de l'onglet choisi ; retour dans l'app : parfois, il salue (une fois par session au plus) |
| Feuilles | montée à ressort, fond qui s'assombrit | se ferment en glissant vers le bas, suivent le doigt ; Minimoa+ : feuille haute (`bare`), on la tire par sa barre du haut ou en tirant le contenu au-delà du haut (iOS), la croix la fait redescendre |

### Détail : inscription et Moi
- **Bienvenue** : le panneau se pose, le pet glisse depuis le bord droit (rogné par le panneau : la coupe du buste ne se
  voit jamais) et salue ; « … » puis chaque message ; le bouton respire une fois. Touché : il s'écrase, des étincelles s'envolent.
- **Entrée en scène** (`StageTemplate` + `PetRise` + `useSceneSteps`) : nino, suzie, gaston puis pia montent du bord bas
  (ressort `plush`, rognés par le bord : la coupe du buste reste sous l'écran), clignent des yeux (l'image « dodo » posée
  par-dessus, opacité seule) ou regardent autour d'eux, puis redescendent quand le suivant arrive ; une grande ligne par
  pet. 1,15 s par pet (≈ 4,6 s sans toucher) ; un tap passe à la ligne suivante, « passer » va au choix. Rien n'attend.
- **Créer son pet** : un calque par espèce toujours monté (aucune image à charger au moment du saut) ; le choisi bondit de
  sa pastille et s'écrase en se posant, l'ancien rentre dans la sienne, le fond change en fondu, puis les trois autres
  passent la tête par les bords (gauche, haut, droite) en se penchant. Le nom tapé le fait hocher la tête.
- **Hôte** (`HostBubble`, tous les écrans de questions) : le petit pet vivant (`PetActor`) fait « pop », puis la bulle
  écrit sa question ; une nouvelle question réécrit la bulle (même taille dès le départ, rien ne saute).
- **Caractère** : une question par écran ; la réponse choisie s'incline et part, l'hôte saute de joie, la question
  suivante arrive (0,42 s, l'action n'attend pas). Temps fort : le pet monte du bas (1/3 de l'écran au plus : il ne
  touche jamais les puces), étoiles en se posant, verdict mot à mot, puces en « pop », « touche pour continuer ».
- **Promesse** : maintenir « promis » remplit l'anneau en 1,1 s (deux demi-disques qui tournent : rotations seules) ;
  un simple tap le termine seul en 0,28 s (accessibilité). Plein : vibration « fête », coche, le pet saute dans des
  étoiles, la suite arrive 1,4 s plus tard (toucher le bouton plein y va tout de suite). Animations réduites : plein d'un
  coup, en fondu.
- **Préparation** : **seule exception** à « jamais retarder une action », dans ces limites : une ligne cochée toutes les
  0,52 s, la dernière (et 100 %) seulement après la réussite de la création, 2,5 s au plus de plus que le serveur, un tap
  passe le reste ; erreur : arrêt sur place, pas de faux 100 %.
- **Tout est prêt** : le pet saute de joie (`react('joy')`), confettis depuis lui, titre mot à mot.
- **Compte** : chaque case gonfle quand un chiffre y tombe ; code bon : vague verte, les cases se rejoignent en coche
  (pendant que l'aiguillage cherche la suite : la navigation n'attend pas).
- **Date / 18+** : date fausse : secousse ; trop jeune : le pet, triste, soupire, se retourne (de dos) et flotte.
- **Moi** : cascade à la 1re visite (`onceKey`), chiffres qui défilent, pastille du pet en « pop », copie : coche ;
  supprimer : le pet (vivant, boudeur) fait non quand « supprimer » est écrit, et encore à la confirmation.
- **Page inconnue** : le pet surpris passe la tête au-dessus du titre (`EmptyState peek`).

### Détail : rencontres, chat, carte (V7)
- **Pourquoi** (`AxisCompare`, `VisionMatch`) : à l'apparition, les deux repères partent du centre de la piste et glissent
  vers leur tiers (ressort `pop`, 90 ms de décalage par axe). Deux repères au même tiers restent côte à côte. Animations
  réduites : fondu, repères déjà posés.
- **Interrupteur des minimoas** (`MinimoaSwitch`) : au changement, le visage s'écrase puis rebondit (`pop`) ; coupé, il
  pâlit et une pastille rouge apparaît. L'appel part tout de suite (optimiste), un refus le remet.
- **Accord de lecture** (`MinimoaConsent`) : les deux minimoas montent du bas du panneau rose, décalés de 120 ms ; la feuille
  défile sur un petit écran (`SheetTemplate scroll`), la poignée reste dans la barre du haut.
- **Répliques des minimoas** : même entrée que les autres bulles (« … » puis texte en « pop ») ; leur style (voile coloré,
  pointillés pour une relance, cadenas pour un garde-fou) est statique.
- **Carte** (`ZoneMap`, `MapSticker`, `MapBlob`) : les autocollants atterrissent (ressort `plush`) du plus proche au plus
  loin, 110 ms d'écart, une fois par session (`useFirstTime('carte:land')`) ; au repos, flottement de 3 pt (boucle
  `useLoop`, coupée hors écran et en animations réduites) ; les silhouettes floues respirent (opacité, échelle). Sur iPhone,
  la carte Apple garde les mêmes autocollants dans ses annotations ; gratuit, elle ne bouge pas (gestes coupés).

## Banc d'essai
`apps/mobile/app/dev/motion.tsx` (route `/dev/motion`) : chaque primitive et chaque comportement des pets, avec des
boutons pour les déclencher et un interrupteur « réduire les animations ».

### Détail : la mèche (`StreakFlame`)
- Posée par `crest` sur `PetActor` / `PetStage` (au-dessus de la tête, ancre `headTop`) : elle suit le corps ; en humeur
  « buste » (sommeil…), elle descend avec la tête. Taille : 62 % à 1 jour, pleine à 100 jours (log) ; rien à 0.
- Vacille en boucle (`useLoop`, en pause hors écran) ; `igniteKey` change → rallumage (braise, jaillit à 135 %, ressort
  `plush`, étincelles, vibration « réussite »). Animations réduites : flamme fixe, rallumage en fondu.
