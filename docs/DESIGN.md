# Blowy — règles de design (app)

Ce que la passe de finition V7 a fixé, pour que l'app reste une seule app. Le look est celui de V6 : le minimoa dans son
panneau de couleur, autocollants et puces inclinées, grands titres Anton avec une seconde ligne estompée, barre d'onglets
flottante en verre, minimoas habillés, animations (`docs/MOTION.md`). On affine, on ne redessine pas.

## Texte
| Rôle | Taille | Graisse | Exemple |
|---|---|---|---|
| Grand titre d'écran | Anton 40–64 (onglets 48–64, écrans poussés 40) | `Title`, capitales, 2ᵉ ligne `dim` | « SES / BILANS » |
| Titre de carte, de ligne | 16 | `bodyHeavy` / `bodyBold` | « Ses habitudes » |
| Corps | 17 | `body` | une phrase de l'API |
| Secondaire | 13–15 (13 dans les cartes et lignes) | `body`, `muted` | « Rien à faire aujourd'hui. » |
| Petite mention, légende, intertitre en capitales | 13 (jamais moins) | `small` / `label` | « CONFIDENTIALITÉ » |

- **Plancher 13 pt** dans l'atome `Text` (`MIN_TEXT_SIZE`) : une taille plus petite est relevée, interlignage compris.
  Seule exception : les libellés de la barre d'onglets (`tabLabel`, 10 pt comme iOS, toujours avec une icône).
- Un titre Anton ne coupe jamais un mot : devant un minimoa, `fitTitleSize` réduit le corps pour que le mot le plus long
  tienne (`PetHero`). Pas de mot orphelin dans un grand titre : couper avec `\n` dans la source.
- Typographie française : `’`, `« »`, espaces insécables (`docs/I18N.md`).

## Espacements, rayons, cibles
- Échelle : 4 · 8 · 12 · 16 · 24 · 32 · 48 (`space`). Marges latérales d'écran 14–16 (accueil : 14, comme la maquette).
- **Densité** (passe « affiner », `density` dans `packages/ui/src/theme.ts`, appliquée par les composants partagés — un
  écran ne remet pas de marges à lui) : intérieur d'une carte 12–14 (`cardPad` 14), écart entre cartes 8 (`gap`, défaut de
  `TabTemplate` et `SettingsTemplate`), ligne d'entrée 56 (`EntryCard`), ligne de liste 52 (`ListRow`), titre de carte 16,
  secondaire 13 ; grand titre d'onglet 56, d'écran poussé 40.
- Rayons : panneaux de couleur 32–36 (la scène du minimoa garde 32), cartes ordinaires 22 (`radius.card`), tuiles 18,
  pilules 999 (`radius`). `radius.lg` (28) reste celui du site et de la barre d'onglets.
- Toute cible touchable fait au moins 44 × 44 pt (`size.touch`) ; boutons 40 / 48 / 52 de haut.
- Un écran = un travail, faisable dans le premier écran (390×844 et 375×667) ; une carte = un titre et au plus une ligne
  grise ; les entrées secondaires deviennent des tuiles (`ShortcutTile` : picto + un mot, pastille ou point) ou passent
  derrière un tap.

## Couleurs (rôles)
- Fond `night`, cartes `panel` (un cran : `card`), filets `line` / `veil.hairline`.
- Texte : blanc ; secondaire `mute` (7,4:1 sur `panel`).
- Action principale : jaune `accent` avec encre sombre (10,8:1). Une seule par écran.
- Danger `danger` (et `dangerSoft` pour une ligne destructive), succès `ok`, Blowy+ violet → corail.
- Panneaux : dégradé de l'espèce (`speciesGradient`). Encre : `onGradient` (sombre sur jaune, orange, rose ; blanc sur
  corail, violet, lie-de-vin). **Petits textes sur le corail : encre sombre** (le blanc n'y tient pas 4,5:1). Le violet
  finit sur `#8253F4` pour que le blanc y tienne 4,5:1 partout.
- Couleurs seulement depuis `@blowy/tokens` / `theme.ts`.

## Motifs
- **Titre d'écran** : `Title` avec seconde ligne estompée ; écran poussé : bouton retour rond à gauche du titre
  (`SettingsTemplate`, `ScreenTemplate`) ; feuille : croix en haut à droite.
- **Entrées vers d'autres écrans** : plusieurs à la suite → une seule carte `EntryGroup` de `EntryCard inGroup` (filet entre
  les lignes) plutôt qu'une pile de cartes, ou des tuiles `ShortcutRow` quand le libellé suffit. Une entrée seule et urgente
  (test de vision, bilan non lu) reste une `EntryCard` ; à l'accueil, une seule à la fois.
- **Listes de réglages et d'historique** : `SettingsSection` (carte groupée, titre de section en capitales 13).
- **Puces** : `Chip` ; puces d'étiquette inclinées sur les panneaux (−6° / +5°) ; jamais de puce translucide posée sur
  un minimoa (fond sombre opaque).
- **Boutons** : `Button` ; deux boutons côte à côte = deux moitiés égales (`flexBasis: 0`) ; un état « déjà fait » est un
  bouton calme désactivé avec coche (« En attente »), pas un bouton jaune.
- **Compatibilité** : le pourquoi d'abord (`MatchWhy` : une ligne « 3 points communs · 1 différence à explorer », puis les
  axes, pleins en commun, cerclé à explorer), le chiffre ensuite en petit (`CompatPill inline`), jamais seul.
- **Feuilles** : `SheetTemplate` ; une feuille d'achat garde son action dans une barre fixe en bas (Blowy+ : bouton,
  ligne de renouvellement, « Restaurer mes achats · Conditions · Confidentialité »), le reste défile au-dessus.
- **Chargement** : squelettes à la forme du contenu (`Skeleton`), `Loader` dans un bouton ; jamais de roue.
- **Vide / erreur** : `EmptyState peek` (minimoa qui passe la tête, titre Anton court, une phrase, une action) ;
  erreur de requête : `Banner tone="error"` avec « Réessayer ».
- **Navigation** : depuis un écran poussé ou une modale vers un onglet, `router.dismissTo('/(tabs)/…')` (jamais `push`
  d'une route d'onglet : on empilerait une seconde barre d'onglets).
- **Mouvement** : une vedette par écran ; rien ne retarde une action ; le minimoa ne couvre jamais du contenu (le salut
  au retour dans l'app est joué par le minimoa de l'accueil, `useHelloWave`).

## À faire / à ne pas faire
- Faire : une action principale jaune par écran ; dire la conséquence avant de demander (autorisations) ; textes courts,
  adultes, au tutoiement, sans genre supposé ; les avantages Blowy+ lus d'une seule source (`usePlusPerks`).
- Ne pas faire : texte sous 13 pt ; texte blanc fin sur corail ; pourcentage sans explication ; empiler des cartes d'entrée ;
  `push` vers un onglet ; animation qui bloque ; un minimoa par-dessus une carte ; un prix écrit dans une phrase.
