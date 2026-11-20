# Animations de minimoas à bas coût (Seedance via treg)

Alternative à Masko pour animer les minimoas : on part d'une pose existante
(`packages/ui/assets/pets/<espèce>_corps_<pose>.webp`), Seedance l'anime sur
un fond uni, ffmpeg retire le fond et écrit des fichiers que le lecteur open
source de Masko (`@masko/player-react-native`) sait jouer sans compte Masko.

Aucune vidéo n'est versionnée : les fichiers sortent dans
`/tmp/mascottes/sortie/<espèce>_<réaction>/` (option `--sortie`).

## Utilisation

Prérequis : `ffmpeg` (libx264, libaom-av1, libvpx-vp9), `node`, `python3` avec
Pillow, la CLI `treg` connectée (`treg balance`). Aucune clé dans le script.

```bash
# Réaction (joue une fois)
tools/mascottes/animer.sh --espece nino --pose neutre --nom rire \
  --prompt "The fluffy lime-green creature bursts into a happy laugh: it gives a small hop, eyes squeeze shut, little hands go to its belly, then it settles back to its starting pose. Static camera, locked-off shot, the creature stays centered with its feet on the ground, the plain solid blue background never changes, no other objects."

# Boucle de repos (raccord fin → début par fondu)
tools/mascottes/animer.sh --espece nino --pose neutre --nom repos --boucle \
  --prompt "The fluffy lime-green creature stands still and breathes very gently, its tuft of orange hair sways softly, it blinks once, its smile stays the same. Subtle idle animation, it ends exactly in its starting pose. Static camera, locked-off shot, the creature stays centered with its feet on the ground, the plain solid blue background never changes, no other objects."

# Régler le détourage sans repayer : repartir de la vidéo déjà générée
tools/mascottes/animer.sh --espece nino --pose neutre --nom rire \
  --video /chemin/source.mp4 --similarite 0.26 --erosion 1
```

Le script affiche le prix attendu et demande confirmation (`--oui` pour
sauter la question). `--help` liste toutes les options.

### Étapes

1. **Composition** : la pose 900×1000 est posée au centre d'un carré
   1200×1200 (100 px au-dessus, 140 px sous les pieds) sur la couleur de fond
   de l'espèce, loin de sa teinte :

   | Espèce | Teinte | Fond | Despill |
   | --- | --- | --- | --- |
   | nino | vert anis | bleu `#0047FF` | blue |
   | gaston | orange | bleu `#0047FF` | blue |
   | suzie | rose | vert `#00B140` | green |
   | pia | violet | vert `#00B140` | green |

2. **Génération** : `treg host` rend l'image publique (7 jours), puis
   `treg call replicate.video-gen.seedance-1-lite --await` (4 s, 720p, 1:1).
   Le coût annoncé par treg (« generation reservation ») et le coût réel
   (écart de solde avant/après) sont écrits dans `journal.txt`. La vidéo
   (1440×1440, 24 i/s, 97 images) est gardée en `source.mp4`.
3. **Boucle** (`--boucle`) : les `--fondu` dernières secondes (0,5 s par
   défaut) se fondent dans les premières ; la vidéo commence à l'image F et
   finit sur F−1, donc le raccord est une transition entre deux images
   voisines. Le journal donne le SSIM du raccord et celui de deux images
   voisines, pour comparer. La boucle dure `durée − fondu` (3,54 s pour 4 s).
4. **Détourage** en taille d'origine :
   `chromakey=<fond>:0.24:0.06, despill=type=<blue|green>:mix=1:expand=0.3`,
   puis le masque est rongé de 2 px (`erosion`, sur 1440 px, soit < 1 px à
   l'écran), puis réduction à `--taille` (540 par défaut, Lanczos).
5. **Fichiers livrés** (`<espèce>_<réaction>.*`) :
   - `.stacked.mp4` : vidéo empilée H.264 (Android, et repli partout) ;
   - `.av1.mp4` : la même en AV1 (iPhone, iPad, Mac, Android 10+), ~40 % plus
     légère ;
   - `.webm` : VP9 avec alpha (Chrome, Firefox, Edge) ;
   - `.png` : première image, transparente (affiche, ou image fixe de repli) ;
   - `_planche.png` : 5 images sur fond sombre (haut) et clair (bas) ;
   - `_zoom.png` : crops 1:1 en taille d'origine (houppette et flanc, sur
     blanc et sur noir) pour chasser un liseré de la couleur du fond.

## Format « stacked » du lecteur Masko (vérifié dans son code)

Sources lues dans https://github.com/masko-ai/masko-player (version RN 0.1.21) :

- `spec/player.md`, « The file and the size » : *« `stacked` and `av1` are
  the same picture: colour above, transparency below, drawn with a shader;
  `stacked` is encoded with H.264, `av1` with AV1 »*. Android joue `av1` sinon
  `stacked` ; iPhone/iPad/Mac jouent `av1` sinon `hevc` (HEVC alpha).
- `apple/Sources/MaskoPlayer/AV1Slot.swift` (`StackedRenderer`) : la couleur
  est lue dans la moitié haute (`uv.y * 0.5`), la transparence dans la
  **luminance** de la moitié basse (`0.5 + uv.y * 0.5`), *« colour
  premultiplied by it, BT.709 limited range as the files are made »* : le
  shader fait `rgb * a`, donc la couleur du fichier n'est **pas**
  prémultipliée.
- `android/.../StackedVideoView.kt` : même disposition (le tampon fait deux
  fois la hauteur de la mascotte), alpha = luminance BT.709 du gris du bas,
  `gl_FragColor = vec4(colour * alpha, alpha)`.
- `apple/.../Stage.swift` (`ClipSlot.load`) : le lecteur Apple choisit le
  décodeur **d'après le codec du fichier** (`AV1Clip.isAV1` lit l'entrée
  `av01` du MP4) ; le fichier doit être un MP4 dont la piste vidéo est `av01`.
- Les fabriques de fichiers de test du dépôt
  (`apple/tools/make-av1-test-clips.sh`,
  `android/player/src/androidTest/make-clips.sh`,
  `examples/react-native/server/make-clips.sh`) font exactement :
  `[couleur][masque gris]vstack,format=yuv420p`, `libx264` ou
  `libaom-av1 -crf 30`, `-movflags +faststart`, sans son.
- Un clip seul, sans compte ni release : `spec/player.md`, « One clip », et
  `react-native/src/types.ts` (`clip: { hevc?, stacked? }`) : de simples
  liens (https, `file://`, `asset:///` sur Android) ; le lecteur lit la durée
  dans le fichier et le joue en boucle comme une pose. Aucune clé Masko.

Ce que produit le script, donc : largeur L, hauteur 2L (540×1080), couleur en
haut aplatie sur la teinte de la fourrure (pour qu'un bord semi-transparent
tire vers la fourrure et jamais vers le fond), masque en gris en bas (blanc =
opaque), YUV 4:2:0, BT.709 plage limitée (balisé dans le fichier), 24 i/s,
sans son, `faststart`. H.264 profil High, AV1 libaom (`-cpu-used 6 -crf 32`).

Vérifié en reconstruisant des images depuis les deux fichiers livrés avec le
calcul du shader (couleur × luminance du bas, sur blanc et sur sombre) : pas
de liseré.

## Coûts mesurés (20/11/2026)

| | Seedance 1 lite via treg | Masko |
| --- | --- | --- |
| Tarif | 0,036 $/s en 720p (0,018 $/s en 480p) | 0,25 $/s |
| Clip de 4 s | **0,144 $** (mesuré 2 fois : réservation 0,144 $, écart de solde 0,1440 $) | 1,00 $ |
| Essai complet (rire + repos) | 0,288 $ | 2,00 $ |

Soit environ 7 fois moins cher. L'hébergement de l'image par `treg host` est
gratuit. La génération prend ~40 s.

Poids à 540 px pour 4 s : 440 Ko en H.264 empilé, 260 Ko en AV1 empilé,
430 Ko en WebM (repos 3,5 s : 300 / 180 / 290 Ko).

## Limites

- **Fidélité** : Seedance réinterprète le personnage (yeux un peu plus
  grands, bouche différente, houppette qui bouge). « Revient à sa pose de
  départ » est approximatif : la dernière image d'une réaction ne colle pas
  exactement à la pose fixe de l'app. Toujours relire la planche.
- **Durée minimale 4 s** chez Seedance (4 à 12 s) : une réaction courte se
  coupe ensuite (`ffmpeg -t`), mais on paie 4 s.
- **Boucles** : Seedance ne boucle pas de lui-même ; le fondu de 0,5 s
  rend le raccord aussi doux qu'une image ordinaire (SSIM 0,92 contre 0,94
  entre images voisines pour le repos), mais un mouvement ample peut laisser
  voir un léger « fantôme » pendant le fondu. Prompts calmes pour le repos.
- **Détourage de la fourrure** : la fourrure fine se mélange au fond ; avec
  les réglages par défaut le bord est net (pas de liseré bleu aux crops 1:1),
  au prix d'un contour un peu plus lisse que la fourrure d'origine. Une
  espèce sur fond vert (suzie, pia) n'a pas encore été essayée : vérifier
  son zoom et ajuster `--similarite` / `--erosion`.
- La caméra peut bouger malgré la consigne ; le cadre de la vidéo est fixe
  (1:1), le minimoa peut donc se décaler un peu d'un clip à l'autre.

## Héberger les fichiers (proposition, rien n'est créé)

- **Bucket Supabase `media` public** : déjà dans la pile, CDN inclus,
  URL stable `https://<projet>.supabase.co/storage/v1/object/public/media/mascottes/<espèce>/<réaction>.av1.mp4`.
  Envoi par l'API (seule à écrire) ou à la main depuis le tableau de bord.
- **Cloudflare R2 (+ domaine public) ou Pages** : pas de frais de sortie,
  bien si le volume de lecture grandit. Pages suffit pour quelques dizaines
  de fichiers versionnés hors de ce dépôt.
- Nommer les fichiers avec une version (`nino_rire.v1.av1.mp4`) et les
  servir avec un long `Cache-Control` : le lecteur les garde en cache.
- Alternative sans réseau : embarquer les fichiers dans l'app
  (`asset:///` sur Android, fichier du bundle sur iOS) ; ~0,3 Mo par clip en AV1.

## Brancher dans l'app

`@masko/player-react-native` (module Expo, iOS 15.1+, Android minSdk 24) :

```tsx
import { MaskoView } from '@masko/player-react-native';

<MaskoView
  style={{ width: 180, height: 180 }}
  clip={{
    // iOS : le prop s'appelle `hevc`, mais le lecteur Apple choisit d'après
    // le codec du fichier : un MP4 AV1 empilé y est joué par AV1Slot
    // (décodeur matériel ou dav1d embarqué).
    hevc: 'https://…/nino_repos.av1.mp4',
    // Android : le H.264 empilé marche partout (l'AV1 seulement là où
    // l'appareil a un décodeur AV1, Android 10+).
    stacked: 'https://…/nino_repos.stacked.mp4',
  }}
  onError={(e) => {/* repli : afficher nino_repos.png */}}
/>
```

- Un `clip` se joue en boucle : parfait pour le repos. Pour une réaction
  jouée une fois, remplacer le `clip` par celui du repos à la fin (événement
  `onClip` à chaque tour de boucle) ; si on veut des transitions et des
  réactions déclenchées (`fire`), il faut une « delivery » (graphe
  `runtimeGraph`, `spec/release.schema.json`) qu'on peut écrire nous-mêmes en
  JSON avec nos propres URL (`delivery={…}`), sans passer par l'API Masko.
- Le lecteur web (`@masko/player`) prend `webm` et `hevc` : sur Safari il
  faudrait du HEVC alpha (encodeur Apple uniquement) ; en attendant, le site
  peut lire le `.webm` dans une balise `<video>` et afficher le `.png` sur Safari.
- Taille : 540 px couvre une mascotte de 180 pt en @3x ; prendre
  `--taille 720` pour un affichage plein écran.
- Penser à faire passer les URL par la configuration (contrat Zod si elles
  viennent de l'API) plutôt qu'en dur dans un écran.
