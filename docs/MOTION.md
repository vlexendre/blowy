# Mouvement — règles et inventaire

Blowy est une app de peluches vivantes : tout ce qui est touché répond, et les pets jouent avec l'écran.
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
   Les boucles s'arrêtent quand l'écran n'est pas au premier plan ou que l'app passe en arrière-plan.
6. **« Réduire les animations »** : plus de déplacements ni de boucles ; on garde des fondus courts et les
   changements d'état. Aucun contenu ne doit dépendre d'une animation pour être lisible.
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
| ressort `press` | raide, sans rebond | boutons |
| ressort `pop` | un rebond | pastilles, tuiles, bulles |
| ressort `soft` | lent, sans rebond | feuilles, panneaux |
| ressort `plush` | deux rebonds amortis | pets et objets |

## Primitives (`packages/ui/src/motion/`)
`Appear` (fondu + montée + légère échelle, `delay`), `Stagger` (cascade d'enfants), `PopIn`, `Shake` (erreur),
`Pulse` (attirer l'œil, 2 battements puis repos), `CountUp` (nombre qui défile), barre de progression animée,
`Shimmer` (squelettes), `Burst` (cœurs, étoiles, confettis en vues simples), `TypingDots`, `FlyTo` (un objet vole d'un
point à un autre), `SpringSheet`, interrupteur à ressort, indicateur d'onglet glissant.

## Les pets jouent avec l'écran (`PetActor`, `PetPeek`)
- **Au repos** : respiration (écrasement léger), petit saut de temps en temps, changement d'expression bref
  (les 9 émotions de chaque espèce servent à ça), regard vers ce qu'on vient de toucher.
- **Touché** : s'écrase, sourit, un cœur s'envole. Deux taps : saute. Appui long : se blottit.
- **Attrapé** : on peut le prendre et le déplacer ; il s'étire, a l'air surpris, revient en rebondissant quand on
  le lâche ; lancé vers un bord, il rebondit sur le cadre de l'écran.
- **Cache-cache** (`PetPeek`) : le pet sort d'un bord de l'écran (coin bas, côté, suspendu en haut), regarde,
  se cache si on le touche et ressort ailleurs. Utilisé pour : états vides, erreurs (triste), hors ligne,
  tirer pour rafraîchir (il grimpe à mesure qu'on tire), fin de liste (il sort quand on tire trop loin),
  clavier ouvert (il regarde par-dessus le clavier), changement d'onglet (il passe la tête au-dessus de la barre),
  retour dans l'app (il salue).
- **Il s'endort** : 25 s sans toucher l'accueil, ou la nuit (22 h – 7 h) : il dort, des « z » montent ; un tap le
  réveille en sursaut.
- **Jamais gênant** : un pet ne recouvre ni un bouton, ni un champ, ni du texte utile ; il ne capture pas les
  touches destinées à ce qu'il y a dessous (sauf sur lui-même).

## Inventaire par écran
| Écran | Vedette | Micro-interactions |
|---|---|---|
| Lancement | le pet entre en courant et se pose | fond qui s'éclaire |
| Bienvenue | les bulles du chat s'écrivent une à une | bouton qui respire une fois, pet qui passe la tête |
| Créer son pet | le pet choisi saute au centre | les autres se penchent pour regarder ; le nom tapé fait hocher le pet |
| Caractère (quiz) | la carte choisie s'incline et part | jauge qui glisse avec dépassement ; résultat compté |
| Compte (code) | chaque chiffre fait « pop » | secousse sur code faux ; coche dessinée sur code bon ; le pet regarde par-dessus le clavier |
| Profil / 18+ | — | champs qui s'allument au focus ; pet triste qui se retourne si trop jeune |
| Accueil (pet) | réaction au soin (croque, saute, dort, cœurs) | barres qui se remplissent avec dépassement, nombres comptés ; bouton conseillé qui pulse ; bulle qui s'écrit ; pet attrapable |
| Garde-robe | l'objet vole de sa tuile jusqu'au pet, qui rebondit | tuiles en cascade ; cadenas qui se secoue ; indicateur d'emplacement glissant ; « nouveau » qui scintille |
| Objet débloqué | l'objet tombe, rebondit, confettis | titre mot à mot ; tap pour passer |
| Chats | bandeau « ton pet a croisé quelqu'un » qui s'ouvre | lignes en cascade ; pastille non-lu qui rebondit ; cœurs qui battent quand une vie est en danger |
| Chat | la bulle envoyée monte depuis le champ | « … » avant un message de pet ; tête du pet qui sort avec sa bulle ; bouton envoyer qui se transforme ; cœur qui se brise ou revient |
| Aujourd'hui | la photo de l'autre se dévoile (flou qui se lève) quand les deux ont posté | flamme de série qui grandit ; jours de la semaine cochés un à un |
| Souvenirs | photos qui se posent comme des cartes | compteurs |
| Niveaux | la marche atteinte s'allume | barre vers le niveau suivant ; confettis au passage |
| Lien fantôme | le pet devient transparent et flotte | ranimer : les cœurs reviennent un à un |
| Rencontres | les cartes arrivent en éventail | « saluer » : le pet fait signe, onde autour du bouton ; accepté : les deux pets se courent dessus et se cognent |
| Carte | les pets se posent en cercle, du centre vers l'extérieur | le pet touché sautille |
| Moi / réglages | — | interrupteurs à ressort ; lignes qui s'enfoncent ; copie du lien : coche ; suppression : pet qui fait non |
| Barre d'onglets | l'icône active rebondit, la pastille jaune glisse | pastilles qui « pop » à l'arrivée d'un message |
| Feuilles | montée à ressort, fond qui s'assombrit | se ferment en glissant vers le bas, suivent le doigt |
