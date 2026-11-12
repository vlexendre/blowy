# @blowy/ui — design system Blowy V6

Composants React Native (Expo SDK 58, RN 0.88, Reanimated 4) en design atomique. Nuit `#0B0A14`, grands panneaux
en dégradé, titres Anton en capitales avec partie estompée, corps Bricolage Grotesque, accent jaune (texte sombre dessus).

```ts
import { Button, LinkRow, TodayCard, ScreenTemplate } from '@blowy/ui';
```

## Règles
- **Niveaux** : `atoms` → `molecules` → `organisms` → `templates`. Un niveau n'importe que les niveaux inférieurs
  (plus `lib/`, `theme.ts`, `types.ts`, `assets/`). Un composant par fichier, exports nommés.
  `motion/` (primitives d'animation) n'importe que `lib/`, `theme.ts` et l'atome `Text` : utilisable partout (sauf
  `CountUp` dans les atomes) ; `motion/pets/` (pets vivants) s'appuie sur les atomes : utilisable dès les molécules.
- **Aucun texte en dur** : tout libellé arrive en prop (seuls quelques libellés d'accessibilité ont un repli, ex. « Retour »).
  Les objets de `@blowy/content` (`gaugeLabel`, `levelLabel`, `eventLabel`…) se passent tels quels.
- **Données** : les organismes prennent des formes structurelles (`types.ts`) qui reprennent les champs du contrat :
  un `Link`, `Person`, `PublicPet`, `Message`, `Suggestion`, `Incoming`, `Memories`, `PetEvent` se passe directement.
  Aucun appel réseau, aucune navigation : des callbacks.
- **Couleurs** : uniquement `@blowy/tokens` + `src/theme.ts` (extensions locales : `extra.heart`, `extra.sky`, voiles `veil.*`,
  `onGradient`, `alpha()`). L'encre (couleur du texte) suit le conteneur : un `Panel` clair passe ses enfants en sombre.
- **Accessibilité** : tout élément touchable a un rôle et un libellé, une zone de toucher ≥ 44 pt, et toutes les animations
  se coupent avec « réduire les animations » (`useReducedMotion` de `@blowy/ui`, voir « Mouvement »).
- Pictogrammes : `Glyph` dessinés en vues ; pictos SVG (`react-native-svg`) pour la barre d'onglets et les soins (`CareIcon`) ; les icônes 3D sont des images (`Icon`).

## Images (`src/assets/pets.ts`)
Chaque espèce (`nino`, `suzie`, `gaston`, `pia`) a le même jeu : bustes d'humeur, corps entiers, visage, fantôme, malade, formes.
```ts
type Src = number;                                    // asset Metro
type PetPose = Mood | 'colere' | 'dodo' | 'fantome' | 'malade' | 'debout' | 'trois_quarts' | 'cote' | 'dos' | 'face';
const PET_POSES; const FULL_BODY_POSES;               // corps entiers : debout, trois_quarts, cote, dos
type PetTrait = 'douce' | 'pose' | 'calme' | 'bavard'; // suzie douce · gaston pose/calme · pia bavard
type CraftColour = 'corail' | 'lime' | 'menthe' | 'orange' | 'rose' | 'violet';
type IconName = 'balle' | 'cadeau' | 'coeurs' | 'confettis' | 'eclair' | 'etoiles' | 'flamme' | 'gel' | 'piece';
type ArtName = 'oeuf' | 'bebe' | 'bande' | 'duo_gaston_pia' | 'duo_nino_suzie';
petImage(species: Species, pose?: PetPose | string): Src      // pose inconnue → neutre
petFormImage(species: Species, form: PetForm): Src
petTraitImage(species: Species, trait: PetTrait): Src | undefined
isFullBody(pose: PetPose): boolean
craftImage(colour: CraftColour): Src · iconImage(name: IconName): Src · artImage(name: ArtName): Src
RENDER_RATIO = 0.9 (900×1000) · ART_RATIO: Record<ArtName, number>
```
Corps entiers pour les grands affichages (`PetHero`, `SpeciesPicker` : `debout` par défaut), bustes pour les expressions.

## Garde-robe (`src/assets/items.ts`, `src/assets/fit.ts`, `src/assets/fit.json`)
Les 64 objets (`ITEM_IDS` du domaine) sont des détourés `assets/items/<id>.webp` (tailles variées).
```ts
itemImage(id: string): Src | undefined · hasItemImage(id): id is ItemId · type ItemId   // registre (require statiques)
FIT_CANVAS = { width: 900, height: 1000 }                                              // toile de la pose debout
placeItem(species, id): ItemPlacement | null       // { id, slot, left, top, width, height, rotate, scaleY, originX, originY, back } en px de la toile
outfitLayers(species, outfit, slots?): { back: ItemPlacement[]; front: ItemPlacement[] }   // ordre : tenue, visage, tête, objet au sol
hasOutfit(outfit): boolean                         // au moins un objet dessinable
badgeFrame(species): { cx, cy, side }              // cadre du médaillon (tête + épaules)
```
**Placement piloté par les données** (`fit.json`, lu par `fit.ts` et par le script de calibration) :
- `species.<s>.points` : ancres mesurées sur `<s>_debout.webp`, en `[x/900, y/1000]` : `headTop`, `crown` (ligne où reposent
  les chapeaux, au-dessus des sourcils), `eyes` (centre des yeux), `eyeL`/`eyeR`, `nose`, `lip` (lèvre du haut), `mouth`, `cheeks`,
  `neck` (juste sous la bouche : col des vêtements), `torso`, `ground`, `toy` (sol, à droite des pieds).
- `species.<s>.sizes` : mesures en largeur/900 : `head` (largeur à la ligne des yeux), `crown`, `eyes` (étendue des deux yeux),
  `eye`, `mouth`, `cheeks`, `neck`, `torso`, `body`. `badge` : `[cx, cy, côté]` du médaillon.
- `items.<id>` : `anchor` (point), `size` (mesure), `w` (largeur = w × mesure), `pivot` (point de l'image posé sur l'ancre),
  `dx`/`dy` (décalage en unités de la mesure), `rot` (degrés, horaire), `sy` (écrasement vertical), `z: 'back'` (derrière le pet :
  ailes, cape, sac à dos, serre-têtes à oreilles/antennes/cornes, auréole), `ratio` (largeur/hauteur de l'image).
- `overrides.<espèce>.<id>` : seulement quand c'est nécessaire (Gaston n'a qu'un œil : lunettes agrandies et centrées sur
  l'œil, masque, cache-œil recentré ; la houppe de Nino : chapeaux un peu plus larges ; casque audio remonté chez Nino et Pia).

Les vêtements (`sweat`, `salopette`, `teddy`, `tablier`, `bretelles`, `tutu`) partent du col (`neck`) et sont écrasés (`sy`)
parce que ces pets sont surtout une tête : il n'y a que ~250 px entre la bouche et les pieds.

Pour régler un objet : modifier `fit.json`, régénérer les planches (script Python/PIL hors dépôt qui applique exactement le même
calcul : `W = w·M`, `P = ancre + (dx,dy)·M`, image posée par son `pivot`, puis `rotate` et `scaleY` autour du pivot) et vérifier
la section « garde-robe » de `/dev/gallery`. Un objet ajouté au domaine doit être ajouté dans `items.ts` et `fit.json`
(sinon il n'est pas dessiné).

## Types partagés (`src/types.ts`)
```ts
PetLook = { name: string; species: Species; form?: PetForm; mood?: Mood; outfit?: Outfit } // ⊇ PublicPet
// outfit : avec au moins un objet, Avatar / LinkRow / AvatarPair / MessageBubble / IncomingCard / SuggestionCard /
// LinkTemplate montrent le médaillon habillé, PetHero le pet habillé. Sans objet : rendu inchangé.
PersonLook = { displayName: string; pet: PetLook; face: FaceVisibility; avatarUrl: string | null }   // ⊇ Person
type MessageAuthor = 'me' | 'other' | 'my_pet' | 'other_pet' | 'system'; type MessageKind = 'text' | 'photo' | 'event'
MessageLook = { id: string; author: MessageAuthor; kind: MessageKind; body: string | null; mediaUrl: string | null; at: string }
TodayLook = { mine: boolean; theirs: boolean; myPhotoUrl: string | null; theirPhotoUrl: string | null }
LinkLook = { other: PersonLook; myPet: PetLook; status: LinkStatus; lives: number; level: number; unread: number; lastMessage: { preview: string; at: string } | null }
PetEventLook = { id: string; kind: PetEventKind; delta: Partial<Gauges>; at: string }
MemoryDayLook = { day: string; myPhotoUrl: string | null; theirPhotoUrl: string | null }
MemoryStatsLook = { messages: number; photos: number; daysTogether: number; bestStreak: number }
SuggestionLook = { user: PersonLook; compatibility: number; intro: string; waved: boolean }
IncomingLook = { from: PersonLook; compatibility: number; intro: string }
type WardrobeItemState = 'owned' | 'locked' | 'premium'
WardrobeItemLook = { id: string; slot: ItemSlot; state: WardrobeItemState; goal: { stat: string; have: number; need: number } | null }   // ⊇ WardrobeItem
TitleSegment = { text: string; dim?: boolean }; type TitleContent = string | readonly TitleSegment[]   // « \n » = retour à la ligne
```
Exports utilitaires : `alpha(hex, a)`, `extra`, `onGradient`.

## Composants (props exactes)
### Atomes
#### `Avatar` — `src/atoms/Avatar.tsx`
```ts
AvatarProps = { size?: number; uri?: string | null; name?: string; pet?: PetLook; face?: FaceVisibility; blurred?: boolean; hidden?: boolean; pose?: PetPose; ring?: string; cutout?: boolean; dimmed?: boolean; dressed?: boolean; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; }
// dressed (défaut vrai) : pet affiché + pose `face` + `pet.outfit` non vide + pas `blurred` → PetBadge (médaillon habillé)
```
#### `Badge` — `src/atoms/Badge.tsx`
```ts
BadgeProps = { count: number; max?: number; tone?: 'heart' | 'accent'; size?: 'sm' | 'md'; popOnMount?: boolean; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; }
// « pop » à chaque changement du nombre ; popOnMount (barre d'onglets, boutons) : aussi à l'apparition (0 → 1)
```
#### `Button` — `src/atoms/Button.tsx`
```ts
ButtonProps = { label: string; onPress?: () => void; variant?: ButtonVariant; size?: ButtonSize; icon?: GlyphName | ReactNode; iconRight?: GlyphName; hint?: string; loading?: boolean; disabled?: boolean; block?: boolean; accessibilityLabel?: string; accessibilityHint?: string; style?: StyleProp<ViewStyle>; }
type ButtonVariant = 'accent' | 'white' | 'dark' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'
```
#### `Card` — `src/atoms/Card.tsx`
```ts
CardProps = { children?: ReactNode; tone?: 'panel' | 'raised' | 'outline'; highlight?: string; padding?: 'none' | 'sm' | 'md' | 'lg'; onPress?: () => void; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; }
```
#### `CareIcon` — `src/atoms/CareIcon.tsx`
```ts
CareIconProps = { name: CareIconName; size?: number; color?: string; }
type CareIconName = 'feed' | 'play' | 'nap' | 'cuddle' | 'door'   // SVG, viewBox 24, trait 2,2 (famille des pictos de la barre d'onglets)
```
#### `Chip` — `src/atoms/Chip.tsx`
```ts
ChipProps = { label: string; onPress?: () => void; selected?: boolean; tone?: ChipTone; left?: ReactNode; size?: 'sm' | 'md' | 'lg'; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; }
type ChipTone = 'glass' | 'accent' | 'dark' | 'light' | 'coral' | 'rose' | 'orange' | 'violet'
```
#### `DressedPet` — `src/atoms/DressedPet.tsx`
```ts
DressedPetProps = { species: Species; outfit?: Outfit | null; size: number; mood?: Mood; pose?: PetPose; animated?: boolean; slots?: readonly ItemSlot[]; delay?: number; hidden?: readonly string[]; headStyle?: AnimatedViewStyle; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; }
// hidden : objets dessinés invisibles (en vol vers le pet) ; headStyle : style animé des objets tête + visage (retard des chapeaux, PetActor)
// pose `debout` + objets de fit.json ; size = largeur de la toile (hauteur size/0,9) ; mood/pose seulement sans objet.
// Ailes, objet au sol et chapeaux hauts débordent un peu de la boîte (pas de rognage).
```
#### `Divider` — `src/atoms/Divider.tsx`
```ts
DividerProps = { inset?: keyof typeof space; vertical?: boolean; color?: string; style?: StyleProp<ViewStyle>; }
```
#### `Glyph` — `src/atoms/Glyph.tsx`
```ts
GlyphProps = { name: GlyphName; size?: number; color?: string; filled?: boolean; style?: StyleProp<ViewStyle>; }
type GlyphName = (typeof GLYPHS)[number]
const GLYPHS = [ 'back', 'chevron', 'down', 'plus', 'close', 'check', 'send', 'arrow', 'lock', 'heart', 'chat', 'person', 'people', 'play', 'share', 'camera', 'dot', 'more', ] as const
```
#### `Icon` — `src/atoms/Icon.tsx`
```ts
IconProps = { name: IconName; size?: number; accessibilityLabel?: string; style?: StyleProp<ImageStyle>; }
```
#### `IconButton` — `src/atoms/IconButton.tsx`
```ts
IconButtonProps = { label: string; onPress?: () => void; glyph?: GlyphName; icon?: ReactNode; variant?: IconButtonVariant; size?: number; badge?: number; disabled?: boolean; style?: StyleProp<ViewStyle>; }
type IconButtonVariant = 'glass' | 'accent' | 'dark' | 'white' | 'plain'
```
#### `ItemImage` — `src/atoms/ItemImage.tsx`
```ts
ItemImageProps = { id: string; size?: number; accessibilityLabel?: string; style?: StyleProp<ImageStyle>; }
```
#### `Panel` — `src/atoms/Panel.tsx`
```ts
PanelProps = { children?: ReactNode; gradient?: GradientName; radius?: 'md' | 'lg' | 'xl'; padding?: 'none' | 'md' | 'lg' | 'xl'; overflow?: boolean; ink?: string; style?: StyleProp<ViewStyle>; }
```
#### `PetBadge` — `src/atoms/PetBadge.tsx`
```ts
PetBadgeProps = { species: Species; outfit?: Outfit | null; size?: number; background?: string; ring?: string; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; }
// disque : recadrage tête + épaules (badgeFrame) du DressedPet, sans l'objet au sol
```
#### `PetImage` — `src/atoms/PetImage.tsx`
```ts
PetImageProps = { species?: Species; mood?: Mood | PetPose; trait?: PetTrait; form?: PetForm; art?: ArtName; craft?: CraftColour; source?: Src | { uri: string }; size: number; animation?: PetAnimation; outline?: boolean; rotate?: number; delay?: number; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; }
type PetAnimation = 'none' | 'breathe' | 'bob'
```
#### `Pressable` — `src/atoms/Pressable.tsx`
```ts
PressableProps extends Omit<RNPressableProps, 'style' | 'children'> = { children?: ReactNode; style?: StyleProp<ViewStyle>; scaleTo?: number | 'auto'; dimTo?: number; bounceKey?: string | number | boolean | null; haptic?: HapticKind | false; }
// scaleTo 'auto' (défaut) : enfoncement adapté à la taille mesurée (0,9 → 0,985) ; dimTo : opacité pendant l'appui (lignes : 0,72)
// relâchement en ressort avec un soupçon de rebond ; désactivé = aucun mouvement ; bounceKey : petit rebond quand la valeur change
```
#### `ProgressBar` — `src/atoms/ProgressBar.tsx`
```ts
ProgressBarProps = { value: number; color?: string; trackColor?: string; height?: number; fillOnMount?: boolean; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; }
// remplissage glissé (transformations) avec léger dépassement ; depuis 0 à l'apparition (fillOnMount, défaut vrai)
```
#### `Skeleton` — `src/atoms/Skeleton.tsx`
```ts
SkeletonProps = { width?: DimensionValue; height?: number; radius?: keyof typeof radii | 'circle'; delay?: number; style?: StyleProp<ViewStyle>; }
// = Shimmer : un reflet glisse dessus (fixe si animations réduites ou écran quitté)
```
#### `Spacer` — `src/atoms/Spacer.tsx`
```ts
SpacerProps = { size?: keyof typeof space; horizontal?: boolean; flex?: boolean; }
```
#### `Sticker` — `src/atoms/Sticker.tsx`
```ts
StickerProps = { label: string; tone?: StickerTone; rotate?: number; font?: 'display' | 'body'; size?: 'sm' | 'md'; style?: StyleProp<ViewStyle>; }
type StickerTone = 'accent' | 'white' | 'coral' | 'dark' | 'rose' | 'violet'
```
#### `Text` — `src/atoms/Text.tsx`
```ts
TextProps extends RNTextProps = { variant?: TypeName; color?: string; dim?: boolean; muted?: boolean; center?: boolean; size?: number; }
```
#### `TextField` — `src/atoms/TextField.tsx`
```ts
TextFieldProps extends Omit<TextInputProps, 'style'> = { label?: string; hint?: string; error?: string | null; right?: ReactNode; large?: boolean; style?: StyleProp<ViewStyle>; ref?: Ref<ComponentRef<typeof TextInput>>; }
```
#### `Title` — `src/atoms/Title.tsx`
```ts
TitleProps = { text: TitleContent; variant?: 'hero' | 'h1' | 'h2' | 'h3'; size?: number; color?: string; center?: boolean; numberOfLines?: number; style?: StyleProp<TextStyle>; accessibilityLabel?: string; reveal?: number; }
countWords(text: TitleContent): number   // reveal = nombre de mots montrés (les suivants gardent leur place, encre transparente)
```
### Molécules
#### `AvatarPair` — `src/molecules/AvatarPair.tsx`
```ts
AvatarPairProps = { first: Omit<AvatarProps, 'size' | 'cutout'>; second: Omit<AvatarProps, 'size' | 'cutout'>; size?: number; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; }
```
#### `Banner` — `src/molecules/Banner.tsx`
```ts
BannerProps = { text: string; title?: string; tone?: BannerTone; actionLabel?: string; onAction?: () => void; onClose?: () => void; closeLabel?: string; style?: StyleProp<ViewStyle>; }
type BannerTone = 'error' | 'info' | 'success'
```
#### `CareButton` — `src/molecules/CareButton.tsx`
```ts
CareButtonProps = { label: string; icon: ReactNode; onPress?: () => void; hot?: boolean; refused?: boolean; refusedLabel?: string; onRefusedPress?: () => void; loading?: boolean; disabled?: boolean; size?: number; accessibilityHint?: string; style?: StyleProp<ViewStyle>; }
// `.care` de V6-Accueil : disque 64 #221E3C ; hot = disque jaune qui brille ; refusé = estompé (.38), un appui le fait « non de la tête »
// l'icône prend l'encre du disque (sombre sur jaune, blanche sinon)
```
#### `ChoiceCard` — `src/molecules/ChoiceCard.tsx`
```ts
ChoiceCardProps = { title: string; caption?: string; icon?: IconName | ReactNode; gradient?: GradientName; selected?: boolean; faded?: boolean; disabled?: boolean; onPress?: () => void; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; }
```
#### `DayChip` — `src/molecules/DayChip.tsx`
```ts
DayChipProps = { label: string; }
```
#### `EntryCard` — `src/molecules/EntryCard.tsx`
```ts
EntryCardProps = { title: string; text?: string; left?: ReactNode; badge?: string; chevron?: boolean; tone?: 'default' | 'alert'; onPress?: () => void; accessibilityLabel?: string; accessibilityHint?: string; style?: StyleProp<ViewStyle>; }
// `.card.row` de V6-Accueil (garde-robe, caractère) ; alert : filet rouge (« il ne sort plus »)
```
#### `EmptyState` — `src/molecules/EmptyState.tsx`
```ts
EmptyStateProps = { species?: Species; mood?: Mood | PetPose; title: TitleContent; text?: string; actionLabel?: string; onAction?: () => void; peek?: boolean; seed?: string; style?: StyleProp<ViewStyle>; }
// peek : le pet passe la tête au-dessus du titre (cache-cache) au lieu de respirer au centre
```
#### `FeatureRow` — `src/molecules/FeatureRow.tsx`
```ts
FeatureRowProps = { icon: IconName; title: string; text?: string; style?: StyleProp<ViewStyle>; }
```
#### `GaugeBar` — `src/molecules/GaugeBar.tsx`
```ts
GaugeBarProps = { value: number; low: string; high: string; caption?: string; target?: number; color?: string; compact?: boolean; selected?: boolean; onPress?: () => void; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; }
// le curseur et le remplissage glissent depuis le centre avec un léger dépassement (transformations seulement)
```
#### `Header` — `src/molecules/Header.tsx`
```ts
HeaderProps = { onBack?: () => void; backLabel?: string; backGlyph?: 'back' | 'close'; title?: string; subtitle?: string; center?: ReactNode; right?: ReactNode; style?: StyleProp<ViewStyle>; }
```
#### `Hearts` — `src/molecules/Hearts.tsx`
```ts
HeartsProps = { lives: number; max?: number; size?: number; ghost?: boolean; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; }
```
#### `ItemTile` — `src/molecules/ItemTile.tsx`
```ts
ItemTileProps = { id: string; label: string; state: ItemTileState; goalText?: string; progress?: { have: number; need: number }; premiumLabel?: string; newLabel?: string; wornLabel?: string; imageSize?: number; onPress?: () => void; accessibilityHint?: string; imageRef?: RefObject<View | null>; landKey?: number; style?: StyleProp<ViewStyle>; }
// verrouillé / premium : l'objet tremble au toucher ; « bientôt » : reflet ; « nouveau » : pop + étincelles une fois ; landKey : rebond au retour d'un objet
type ItemTileState = 'owned' | 'worn' | 'locked' | 'premium'
// `.tile` de V6-GardeRobe : verrouillé = image à 32 %, étape courte à la place du nom + mini barre ; étiquettes « porté », « nouveau », « bientôt »
```
#### `LevelPill` — `src/molecules/LevelPill.tsx`
```ts
LevelPillProps = { label: string; tone?: 'accent' | 'glass'; size?: 'sm' | 'md'; onPress?: () => void; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; }
```
#### `ListRow` — `src/molecules/ListRow.tsx`
```ts
ListRowProps = { title: string; subtitle?: string; onPress?: () => void; destructive?: boolean; left?: ReactNode; right?: ReactNode; chevron?: boolean; switchValue?: boolean; onSwitchChange?: (value: boolean) => void; divider?: boolean; disabled?: boolean; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; }
```
#### `MessageBubble` — `src/molecules/MessageBubble.tsx`
```ts
MessageBubbleProps = { message: Pick<MessageLook, 'author' | 'kind' | 'body' | 'mediaUrl'>; name?: string; pet?: PetLook; person?: Pick<PersonLook, 'avatarUrl' | 'face' | 'pet' | 'displayName'>; continued?: boolean; photoLabel?: string; onPhotoPress?: () => void; lockedPhotoLabel?: string; }
```
#### `NeedMeter` — `src/molecules/NeedMeter.tsx`
```ts
NeedMeterProps = { label: string; value: number; lowText?: string; lowAt?: number; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; }
// la barre se remplit avec dépassement et la valeur défile (CountUp), depuis 0 à l'apparition puis à chaque soin
needColor(value, lowAt = 40): string     // jaune, rouge (pulsation) sous lowAt — tuile `.need` de V6-Accueil
```
#### `OtpInput` — `src/molecules/OtpInput.tsx`
```ts
OtpInputProps = { value: string; onChange: (value: string) => void; onComplete?: (value: string) => void; length?: number; error?: string | null; autoFocus?: boolean; disabled?: boolean; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; }
```
#### `PhotoTile` — `src/molecules/PhotoTile.tsx`
```ts
PhotoTileProps = { state: PhotoTileState; uri?: string | null; label?: string; badge?: string; title?: string; caption?: string; species?: Species; blurred?: boolean; height?: DimensionValue; children?: ReactNode; onPress?: () => void; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; }
type PhotoTileState = 'photo' | 'pending' | 'locked' | 'empty'
```
#### `SegmentedTabs` — `src/molecules/SegmentedTabs.tsx`
```ts
SegmentedTabItem<K extends string = string> = { key: K; label: string; badge?: boolean; }
SegmentedTabsProps<K extends string = string> = { items: readonly SegmentedTabItem<K>[]; activeKey: K; onChange: (key: K) => void; style?: StyleProp<ViewStyle>; }
// la pastille blanche glisse en ressort (et s'étire), les libellés changent d'encre en fondu croisé
```
#### `SlotTabs` — `src/molecules/SlotTabs.tsx`
```ts
SlotTabsProps = { labels: Record<ItemSlot, string>; active: ItemSlot; onChange: (slot: ItemSlot) => void; badges?: Partial<Record<ItemSlot, boolean>>; slots?: readonly ItemSlot[]; style?: StyleProp<ViewStyle>; }
// idem : pilule blanche glissante
// `.slots` : pilule, onglet actif blanc
```
#### `SpeechBubble` — `src/molecules/SpeechBubble.tsx`
```ts
SpeechBubbleProps = { text: string; highlight?: string; highlightColor?: string; tone?: 'dark' | 'light'; tail?: 'left' | 'right' | 'none'; rotate?: number; compact?: boolean; chat?: boolean; typing?: boolean; style?: StyleProp<ViewStyle>; }
// typing : « … » puis la phrase mot à mot (taille fixe dès le départ), rejoué quand text change
```
#### `StatTile` — `src/molecules/StatTile.tsx`
```ts
StatTileProps = { value: string; label: string; color?: string; onPress?: () => void; style?: StyleProp<ViewStyle>; }
```
#### `StepProgress` — `src/molecules/StepProgress.tsx`
```ts
StepProgressProps = { step: number; total: number; showCount?: boolean; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; }
```
#### `StreakPill` — `src/molecules/StreakPill.tsx`
```ts
StreakPillProps = { count: number; label: string; variant?: 'pill' | 'stack'; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; }
```
#### `TabBarItem` — `src/molecules/TabBarItem.tsx`
```ts
TabBarItemProps = { label: string; glyph: GlyphName; active?: boolean; badge?: number; onPress?: () => void; onLongPress?: () => void; accessibilityLabel?: string; indicator?: Indicator; index?: number; }
// devenu actif : le picto rebondit ; avec indicator (pilule glissante de BottomTabBar) : encre en fondu croisé
```
### Organismes
#### `BottomTabBar` — `src/organisms/BottomTabBar.tsx`
```ts
BottomTabItem<K extends string = string> = { key: K; label: string; glyph: GlyphName; badge?: number; }
BottomTabBarProps<K extends string = string> = { items: readonly BottomTabItem<K>[]; activeKey: K; onPress: (key: K) => void; onLongPress?: (key: K) => void; floating?: boolean; peek?: { species: Species; mood?: Mood | PetPose }; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; }
// la pilule jaune glisse en ressort (et s'étire) ; peek : le pet passe la tête au-dessus de l'onglet choisi
const TAB_BAR_SPACE = size.tabBar + space.lg + space.sm
```
#### `CareBar` — `src/organisms/CareBar.tsx`
```ts
CareBarProps = { labels: Record<CareAction, { action: string; refused: string }>; available: Record<CareAction, boolean>; onCare: (action: CareAction) => void; onRefused?: (action: CareAction) => void; hot?: Partial<Record<CareAction, boolean>>; busy?: CareAction | null; icons?: Partial<Record<CareAction, ReactNode>>; style?: StyleProp<ViewStyle>; }
// labels : careLabel tel quel ; available : canCare(needs, action) ; pictos par défaut : CareIcon
```
#### `ChallengeCard` — `src/organisms/ChallengeCard.tsx`
```ts
ChallengeCardProps = { label: string; question: string; choices: readonly [string, string] | readonly string[]; done: boolean; picked?: number | null; doneLabel?: string; onChoose?: (choice: 0 | 1) => void; loading?: boolean; streak?: number; streakUnit?: string; gradient?: GradientName; }
// réponse choisie : la carte s'incline et grandit pendant l'envoi ; résolue : elle se redresse en jaune, coche en pop
```
#### `ChatThread` — `src/organisms/ChatThread.tsx`
```ts
ChatThreadProps = { messages: readonly MessageLook[]; myPet: PetLook; other: Pick<PersonLook, 'displayName' | 'avatarUrl' | 'face' | 'pet'>; otherName?: string; dayLabel: (day: string) => string; dayKey?: (at: string) => string; onEndReached?: () => void; loadingOlder?: boolean; onPhotoPress?: (message: MessageLook) => void; lockedPhotoLabel?: string; header?: ReactElement; empty?: ReactElement; contentStyle?: StyleProp<ViewStyle>; }
```
#### `Composer` — `src/organisms/Composer.tsx`
```ts
ComposerProps = { value: string; onChangeText: (text: string) => void; onSend: () => void; placeholder: string; disabled?: boolean; disabledText?: string; sending?: boolean; tone?: ComposerTone | null; onToneChange?: (tone: ComposerTone | null) => void; toneLabels?: Record<ComposerTone, string>; onAttach?: () => void; attachLabel?: string; sendLabel?: string; maxLength?: number; }
type ComposerTone = 'sweet' | 'tease'
```
#### `EvolutionTimeline` — `src/organisms/EvolutionTimeline.tsx`
```ts
EvolutionTimelineProps = { events: readonly PetEventLook[]; eventLabels: Record<PetEventKind, string>; gaugeLabels: Record<GaugeKey, { low: string; high: string }>; dateLabel: (at: string) => string; emptyText?: string; }
```
#### `GaugePanel` — `src/organisms/GaugePanel.tsx`
```ts
GaugePanelProps = { gauges: Gauges; labels: Record<GaugeKey, { low: string; high: string }>; names?: Partial<Record<GaugeKey, string>>; title?: string; hint?: string; selected?: GaugeKey | null; onSelect?: (key: GaugeKey) => void; footer?: ReactNode; }
```
#### `GhostPanel` — `src/organisms/GhostPanel.tsx`
```ts
GhostPanelProps = { pet: PetLook; title: TitleContent; text?: string; speech?: string; speakerLabel?: string; canRevive: boolean; reviveLabel: string; reviveHint?: string; alreadyRevivedLabel: string; leaveLabel?: string; onRevive?: () => void; onLeave?: () => void; reviving?: boolean; }
```
#### `IncomingCard` — `src/organisms/IncomingCard.tsx`
```ts
IncomingCardProps = { incoming: IncomingLook; title: string; ownerLabel?: string; compatLabel?: string; acceptLabel: string; declineLabel: string; onAccept: () => void; onDecline: () => void; accepting?: boolean; declining?: boolean; openLabel?: string; onOpen?: () => void; }
```
#### `LevelLadder` — `src/organisms/LevelLadder.tsx`
```ts
LevelLadderProps = { level: number; labels: Record<LevelKey, { title: string; text: string }>; ratio?: number; currentLabel?: string; nextLabel?: string; tint?: string; }
```
#### `LinkRow` — `src/organisms/LinkRow.tsx`
```ts
LinkRowProps = { link: LinkLook; timeLabel?: string; levelLabel: string; previewAuthor?: string; previewAuthorColor?: string; emptyPreview?: string; ghostLabel?: string; newLabel?: string; highlight?: boolean; onPress: () => void; onLongPress?: () => void; accessibilityLabel?: string; }
```
#### `LivesPanel` — `src/organisms/LivesPanel.tsx`
```ts
LivesPanelProps = { lives: number; max?: number; title: TitleContent; text?: string; streak?: number; streakUnit?: string; week?: readonly { day: string; state: WeekDayState; mark?: string }[]; weekTitle?: string; accessibilityLabel?: string; }
type WeekDayState = 'done' | 'half' | 'none'
```
#### `MemoryGrid` — `src/organisms/MemoryGrid.tsx`
```ts
MemoryGridProps = { days: readonly MemoryDayLook[]; stats?: MemoryStatsLook; statLabels?: Record<keyof MemoryStatsLook, string>; dayLabel: (day: string) => string; blurred?: boolean; columns?: number; onDayPress?: (day: MemoryDayLook) => void; emptyText?: string; }
```
#### `NeedsPanel` — `src/organisms/NeedsPanel.tsx`
```ts
NeedsPanelProps = { needs: Needs; labels: Record<NeedKey, { name: string; low: string }>; lowAt?: number; style?: StyleProp<ViewStyle>; }
// trois tuiles NeedMeter côte à côte ; labels : needLabel tel quel
```
#### `OutfitPreview` — `src/organisms/OutfitPreview.tsx`
```ts
OutfitPreviewProps = { species: Species; outfit: Outfit; slotLabels: Record<ItemSlot, string>; itemLabels: Record<string, string>; emptyLabel: string; activeSlot?: ItemSlot; onSlotPress?: (slot: ItemSlot) => void; gradient?: GradientName; petLabel?: string; hiddenItems?: readonly string[]; seed?: string; previewRef?: Ref<OutfitPreviewHandle>; }
OutfitPreviewHandle = { itemRect(id): Promise<Rect | null>; react(kind: PetActorReaction): void }   // où atterrit un objet sur le pet
// V6-GardeRobe : panneau 178, pet habillé à gauche, 2 × 2 cases (objet porté ou « + »)
```
#### `PetHero` — `src/organisms/PetHero.tsx`
```ts
PetHeroProps = { pet: PetLook; title: TitleContent; moodLabel?: string; formLabel?: string; speech?: string; gradient?: GradientName; pose?: PetPose; showForm?: boolean; onPetPress?: () => void; petLabel?: string; }
// pet.outfit non vide (et pas showForm) → DressedPet à la place de PetImage
```
#### `PetStage` — `src/organisms/PetStage.tsx`
```ts
PetStageAction = { label: string; onPress: () => void; accessibilityLabel?: string; }
PetStageProps = { pet: PetLook & { id?: string }; title?: TitleContent; shape?: Shape; shapeLabel?: string; speech?: string; action?: PetStageAction; reaction?: PetReaction | null; reactionKey?: number; gradient?: GradientName; petSize?: number; height?: number; grabbable?: boolean; onPetPress?: () => void; onPetTouch?: (t: PetTouch) => void; petLabel?: string; style?: StyleProp<ViewStyle>; }
type PetReaction = PetActorReaction   // feed : fraise croquée · play : balle et sauts · nap : lumière baissée + z · cuddle : cœurs · joy · no · wave · surprise
// le pet est un PetActor (attrapable par défaut : le panneau passe devant et ne le rogne plus pendant le geste) ; la bulle s'écrit
// V6-Accueil : panneau 318, nom Anton 40 + puce de forme, bouton blanc (garde-robe), bulle, pet habillé en bas à droite
// shape `boude` : panneau lie-de-vin et pet éteint (V6-Boude) ; tout coupé si « réduire les animations »
```
#### `PlanPicker` — `src/organisms/PlanPicker.tsx`
```ts
Plan<K extends string = string> = { key: K; title: string; price: string; unit?: string; caption?: string; badge?: string; }
PlanPickerProps<K extends string = string> = { plans: readonly Plan<K>[]; value: K; onChange: (key: K) => void; }
```
#### `QuizStep` — `src/organisms/QuizStep.tsx`
```ts
QuizChoice<K extends string = string> = { key: K; title: string; caption?: string; icon?: IconName | ReactNode; }
QuizStepProps<K extends string = string> = { kicker?: string; title: TitleContent; text?: string; choices: readonly QuizChoice<K>[]; selectedKey?: K | null; onChoose: (key: K) => void; preview?: { pet: PetLook; gauges: Gauges; labels: Record<GaugeKey, { low: string; high: string }> }; }
```
#### `SettingsSection` — `src/organisms/SettingsSection.tsx`
```ts
SettingsSectionProps = { title?: string; rows?: readonly (ListRowProps & { key: string })[]; children?: ReactNode; footer?: string; style?: StyleProp<ViewStyle>; }
```
#### `SpeciesPicker` — `src/organisms/SpeciesPicker.tsx`
```ts
SpeciesPickerProps = { value: Species; onChange: (species: Species) => void; species?: readonly Species[]; names: Record<Species, string>; speech?: string; speechHighlight?: string; badge?: string; pose?: PetPose; }
```
#### `SuggestionCard` — `src/organisms/SuggestionCard.tsx`
```ts
SuggestionCardProps = { suggestion: SuggestionLook; ownerLabel: string; viaLabel?: string; viaPet?: PetLook; badgeLabel?: string; compatLabel: string; tagline?: string; introLabel?: string; waveLabel: string; wavedLabel: string; onWave?: () => void; waving?: boolean; locked?: boolean; lockedCaption?: string; onLockedPress?: () => void; openLabel?: string; onOpen?: () => void; }
```
#### `TodayCard` — `src/organisms/TodayCard.tsx`
```ts
TodayCardLabels = { title: TitleContent; streakUnit: string; hint: string; mine: { label?: string; badge?: string; emptyTitle: string; emptyCaption?: string }; theirs: { waitingTitle: string; waitingCaption?: string; lockedTitle: string; lockedCaption?: string; label?: string }; cta: string; }
TodayCardProps = { today: TodayLook; otherPet: PetLook; streak: number; labels: TodayCardLabels; onCta?: () => void; ctaLoading?: boolean; onMinePress?: () => void; gradient?: GradientName; }
```
#### `UnlockSheet` — `src/organisms/UnlockSheet.tsx`
```ts
UnlockSheetProps = { visible: boolean; itemId: string; itemName: string; pet: { species: Species; outfit?: Outfit | null; name?: string }; kicker: string; title: TitleContent; text?: string; wearLabel: string; onWear: () => void; wearing?: boolean; closeLabel: string; onClose: () => void; }
// l'objet tombe dans sa bulle, rebondit, confettis, apparaît sur le pet qui saute ; titre mot à mot ; un tap n'importe où passe à la fin
// V6-Debloque : plein écran jaune, le pet qui porte déjà l'objet (aperçu), « il le porte » / « ranger »
```
#### `ItemDetail` — `src/organisms/ItemDetail.tsx`
```ts
ItemDetailProps = { id: string; title: TitleContent; text?: string; goal?: { text: string; have: number; need: number; hint?: string }; note?: string; action?: { label: string; onPress: () => void }; closeLabel: string; onClose: () => void; }
// V6-Objet : à poser dans SheetTemplate (prop `header`) — visuel 112, nom, étape + barre, raccourci et « fermer »
```
#### `UnlockToast` — `src/organisms/UnlockToast.tsx`
```ts
UnlockToastProps = { visible: boolean; itemId: string; name: string; kicker: string; text?: string; onPress?: () => void; onClose?: () => void; closeLabel?: string; style?: StyleProp<ViewStyle>; }
```
#### `WardrobeGrid` — `src/organisms/WardrobeGrid.tsx`
```ts
WardrobeGridProps<T extends WardrobeItemLook> = { items: readonly T[]; slot?: ItemSlot; worn?: string | null; itemLabels: Record<string, string>; goalLabels: Record<string, (n: number) => string>; premiumLabel: string; wornLabel?: string; onSelect?: (item: T) => void; newIds?: readonly string[]; newLabel?: string; hints?: Partial<Record<ItemTileState, string>>; columns?: number; gridRef?: Ref<WardrobeGridHandle>; }
WardrobeGridHandle = { tileRect(id): Promise<Rect | null>; land(id): void }   // cases en cascade à chaque emplacement
// goalLabels : étapes courtes (« 2 jours de soins »), appelées avec goal.need
```
#### `WordsShareCard` — `src/organisms/WordsShareCard.tsx`
```ts
WordsShareCardProps = { title: string; countLabel?: string; words: readonly { label: string; count?: number }[]; url: string; copyLabel: string; copiedLabel?: string; copied?: boolean; shareLabel: string; onCopy: () => void; onShare: () => void; emptyText?: string; }
```
### Gabarits
#### `LinkTemplate` — `src/templates/LinkTemplate.tsx`
```ts
LinkTemplateProps<K extends string = string> = { other: PersonLook; myPet: PetLook; lives: number; ghost?: boolean; levelLabel: string; onLevelPress?: () => void; onBack: () => void; backLabel?: string; livesLabel?: string; tabs: readonly SegmentedTabItem<K>[]; activeTab: K; onTabChange: (key: K) => void; children?: ReactNode; footer?: ReactNode; scroll?: boolean; onOptions?: () => void; optionsLabel?: string; refreshControl?: ReactElement<RefreshControlProps>; }
```
#### `OnboardingTemplate` — `src/templates/OnboardingTemplate.tsx`
```ts
OnboardingTemplateProps = { step?: number; total?: number; onBack?: () => void; backLabel?: string; kicker?: string; title?: TitleContent; text?: string; children?: ReactNode; primaryLabel: string; onPrimary: () => void; primaryDisabled?: boolean; primaryLoading?: boolean; primaryIcon?: 'arrow' | null; secondaryLabel?: string; onSecondary?: () => void; footnote?: ReactNode; scroll?: boolean; }
```
#### `ScreenTemplate` — `src/templates/ScreenTemplate.tsx`
```ts
ScreenTemplateProps = { children?: ReactNode; header?: ReactNode; footer?: ReactNode; scroll?: boolean; background?: GradientName | 'night'; padded?: boolean; gutter?: number; headerStyle?: StyleProp<ViewStyle>; edges?: readonly ('top' | 'bottom')[]; bottomSpace?: number; keyboard?: boolean; refreshControl?: ReactElement<RefreshControlProps>; scrollRef?: Ref<ComponentRef<typeof ScrollView>>; onScroll?: ((e) => void) | AnimatedScrollHandler; scrollEventThrottle?: number; contentStyle?: StyleProp<ViewStyle>; }
// Animated.ScrollView ; fournit le verrou de défilement (useScrollLock) : un pet tenu bloque le défilement le temps du geste
```
#### `SheetTemplate` — `src/templates/SheetTemplate.tsx`
```ts
SheetTemplateProps = { visible: boolean; onClose: () => void; title?: TitleContent; children?: ReactNode; footer?: ReactNode; closeLabel?: string; header?: ReactNode; asScreen?: boolean; }
// monte en ressort, voile en fondu ; se tire vers le bas (suit le doigt, ferme si assez bas ou assez vite) ; redescend à la fermeture
```
#### `TabTemplate` — `src/templates/TabTemplate.tsx`
```ts
TabTemplateProps = { brand?: string; title?: TitleContent; right?: ReactNode; children?: ReactNode; scroll?: boolean; refreshControl?: ReactElement<RefreshControlProps>; gutter?: number; gap?: number; top?: number; onScroll?: ScreenTemplateProps['onScroll']; scrollEventThrottle?: number; }
```

## Mouvement (`src/motion/`, `src/lib/motion.ts`)
Règles, jetons et inventaire par écran : `docs/MOTION.md`. Banc d'essai : `/dev/motion` (`apps/mobile/app/dev/motion.tsx`).
Tout s'importe depuis `@blowy/ui`.

### Mise en place (déjà faite)
- `app/_layout.tsx` : `<MotionHost>` autour du `Stack` (calque des vols, explosions et pets qui passent la tête ; pause
  des boucles quand l'app passe en arrière-plan ; annonce du retour au premier plan).
- Chaque écran : `<ScreenMotion>` de `@/core` autour du gabarit (coupe ses boucles quand l'écran n'est plus au premier
  plan : onglet quitté, écran recouvert). **À ajouter sur chaque écran que vous animez.**

### Jetons (`theme.ts` → `motion`)
```ts
motion.instant 90 · fast 160 · base 240 · slow 420 · scene 700 · stagger 45 · staggerMax 8 · breath 1300   // ms
motion.spring.press | pop | soft | plush     // { damping, stiffness, mass } pour withSpring (alias : motion.press, motion.pop)
motion.curve.standard | out | in | inOut     // Bézier ; prêtes à l'emploi : ease.standard / ease.out / ease.in / ease.inOut
```

### Crochets et outils
```ts
useReducedMotion(): boolean            // système, ou forçage de MotionHost / MotionProvider (prop reduced)
useMotionActive(): boolean             // faux si l'écran n'est pas au premier plan ou l'app en arrière-plan
useFocusPause(): boolean               // l'inverse
useLoop(duration?, enabled?, delay?): SharedValue<number>   // 0 → 1 → 0, en pause hors écran, 0 si animations réduites
useAnimatedNumber(target, number | { duration?; overshoot?; from? }): SharedValue<number>   // overshoot 0,08 = 8 % de dépassement
usePressFeedback(to: number | 'auto', baseOpacity?, dimTo?)   // { animatedStyle, onLayout, pressIn, pressOut, bounce }
fadeTo(to, duration?)                  // fondu qui joue même avec « réduire les animations » (worklet)
ease, springs                          // courbes et ressorts des jetons
useSeed(petId, salt?): Seed            // { next, range(a, b), pick(items, avoid?), chance(p) } — graine = id + minute courante
makeSeed(n), hashString(s), isNight(date?)   // nuit = 22 h – 7 h
useReveal(total, { step?: 70; delay?: 0; enabled?: true; key? }): number   // mots montrés (un rendu par mot)
hapticFor('press' | 'select' | 'land' | 'success' | 'celebrate' | 'error')   // vibration associée à un moment
useForeground(cb)                      // appelé à chaque retour de l'app au premier plan
useScrollLock(): { locked; setLocked(on) }   // fourni par ScreenTemplate
MotionFocus { active: boolean; children }    // ScreenMotion le pose pour vous
MotionProvider { reduced?: boolean | null; children }   // déjà dans MotionHost ; imbriqué : force « réduire » sur une zone (banc d'essai)
```

### Primitives (props exactes)
```ts
Appear  { children; delay?: 0; from?: 'below' | 'above' | 'left' | 'right' | 'none'; distance?: 12; scale?: 0.98; duration?: 240;
          once?: string /* clé : n'anime qu'à la 1re apparition (listes recyclées) */; replay?: string | number; style?; pointerEvents? }
Stagger { children; step?: 45; max?: 8; delay?; onceKey?: string; itemStyle?; …les props d'Appear sauf once }   // une enveloppe par enfant
staggerDelay(index, step?, max?): number
PopIn   { children; delay?; from?: 0.4; trigger?: string | number /* re-pop */; onMount?: true; style?; pointerEvents? }
Shake   { children; trigger?: number; distance?: 8; haptic?: HapticMoment | false /* 'error' */; style? }   ref: ShakeHandle { shake() }
Pulse   { children; active?: true; beats?: 2; scale?: 1.07; delay?: 500; trigger?; style? }   // battements puis repos, jamais en boucle
CountUp { value: number; from?: number; variant?: TypeName; size?; color?; muted?; prefix?; suffix?; duration?: 420; accessibilityLabel?; style? }
Shimmer { width?; height?: 16; radius?: 8; base?; shine?; duration?: 1300; delay?; style? }
Burst   { kind: 'hearts' | 'stars' | 'sparkles' | 'confetti' | 'zzz'; trigger?: number; loop?: boolean; count?; spread?; size?; seed?;
          colors?; onDone?; style /* vue de taille nulle : la placer en absolu à l'origine */ }
TypingDots { color?; size?: 7; accessibilityLabel?; style? }
PillSpan { from: SharedValue; to: SharedValue; height; color; span }   // pilule de longueur animée (jauges)
useIndicator(index) → Indicator · useIndicatorStyle(indicator, step, stretch?) · useActiveInk(indicator, index)   // onglets glissants
```

### Calque, vols, explosions (`MotionHost`)
```ts
MotionHost { children; reduced?: boolean | null }
HostPortal { children }                       // rend dans le calque, en coordonnées de la fenêtre
useMotionHost(): { registry; mount(node) => unmount } | null
measureInWindow(ref): Promise<Rect | null>    // Rect = { x, y, width, height } (fenêtre)
useFlyTo(): (o: FlightOptions) => Promise<void>
FlightOptions = { from: RefObject | Rect; to: RefObject | Rect; render: ({ width, height }) => ReactNode; arc?: number; duration?: 560;
                  spin?: number; haptic?: HapticMoment | false /* 'land' */; onLand?: () => void }
useBurst(): ({ kind, x, y, count?, spread?, size?, seed? }) => void   // explosion au-dessus de tout
```
Une modale native (`Modal` : `SheetTemplate`, `UnlockSheet`) passe au-dessus du calque : à l'intérieur, rendre `Burst` sur place.

### Les pets
```ts
PetActor   { species; outfit?; size; mood?: Mood | PetPose /* repos sans tenue, défaut 'debout' */; seed?: string /* id du pet */;
             sulking?; idle?: true; touch?: true; grabbable?: false; sleepAfter?: number | null /* 25 000 */; shadow?: true;
             hiddenItems?: readonly string[]; onTouch?: (t: 'tap' | 'double' | 'snuggle' | 'grab' | 'throw') => void;
             onGrabChange?: (grabbed: boolean) => void; accessibilityLabel?; accessibilityHint?; style? }
           ref: PetActorHandle { react(kind: 'feed' | 'play' | 'nap' | 'cuddle' | 'joy' | 'no' | 'wave' | 'surprise'); wake() }
PetPeek    { species; mood?: 'neutre'; edges?: PeekEdge[] /* ['bottom-right','bottom-left'] */; visible?: true; size?: 92; along?: 0.6;
             safe?: { top?; bottom?; left?; right? }; hideAndSeek?: true; seed?; duration?: number; onPress?; onHidden?;
             inline?: boolean; accessibilityLabel?; style? }
           PeekEdge = 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'top'
PetRefresh { species; mood?: 'surpris'; refreshing; onRefresh; children: (scroll: { refreshControl; onScroll; scrollEventThrottle }) => ReactNode;
             top?: number /* zone sûre du haut */; bottomPeek?: true; bottomInset?: 0; size?: 64 }
KeyboardPeek { species; mood?: 'joie'; side?: 'left' | 'right'; size?: 72; seed? }
HelloPeek  { species; seed?; safe?; duration?: 2400 }   // salut au retour dans l'app (posé dans (tabs)/_layout)
PetEntrance { species; mood?: 'debout'; size?: 180; glow?; accessibilityLabel?; style? }   // arrive en courant (lancement)
fitAnchor(species, 'headTop' | 'eyes' | 'mouth' | 'ground' | …): { x, y }   // ancres de fit.json en fraction de la toile
```
- **Déclencher une réaction** : `const pet = useRef<PetActorHandle>(null)` puis `pet.current?.react('joy')`. Sur l'accueil,
  passer par `PetStage` : `reaction` + `reactionKey` (à incrémenter, même réaction rejouée). Dans la garde-robe :
  `OutfitPreviewHandle.react`.
- **Zones sûres** : `PetPeek` reste dans la fenêtre moins `safe` ; défaut haut = zone sûre + 60 (en-tête), bas = au-dessus
  de la barre d'onglets. Sur un écran sans onglets avec un bouton en pied, passer `safe={{ bottom: hauteurDuPied }}`.
  Préférer `inline` (dans un état vide) ou les coins bas ; jamais sur un champ, un bouton ou un texte utile.
- **Gestes** : `PetActor` gère seul l'arbitrage avec le défilement (horizontal : on l'attrape ; vertical : la page défile ;
  appui long : on le tient) et bloque le défilement de son `ScreenTemplate` pendant qu'on le tient. Le conteneur qui le
  rogne doit cesser de le rogner pendant le geste (`onGrabChange`, comme `PetStage`).

### À faire / à éviter
- **Oui** : `transform` et `opacity` seulement ; `useAnimatedStyle` + valeurs partagées ; une seule vedette par écran ;
  `Appear once="liste:id"` dans une liste ; `Stagger` (8 au plus) pour une cascade ; `ScreenMotion` sur l'écran ;
  `useReducedMotion` de `@blowy/ui` puis `fadeTo` pour l'alternative ; `hapticFor` avec chaque retour important ;
  décor (`Burst`, signes) `pointerEvents="none"` et masqué au lecteur d'écran ; réglages de geste stables (`useMemo`).
- **Non** : animer `width` / `height` / `left` / `top` (utiliser `translate`, `scale`, `PillSpan`) ; `setState` à chaque
  image ; boucle sans pause (passer par `useLoop` / `useMotionActive`) ; retarder une action jusqu'à la fin d'une
  animation (mutez d'abord, animez ensuite : voir la garde-robe) ; cacher du contenu au lecteur d'écran derrière une
  animation ; changer la mise en page au repos ; `Math.random` (utiliser `useSeed`).
- **Web** : pas de tirage élastique (pas de pet dans `PetRefresh`, liste normale), pas de clavier (`KeyboardPeek` absent),
  pas de vibration. Les images du pet sont `pointerEvents: none` pour éviter le glisser-déposer d'image du navigateur.

### Inscription et Moi (ajouts)
```ts
DrawnCheck { size?: 20; color? /* encre du contexte */; strokeWidth?; delay?; trigger?: string | number /* retrace */;
             haptic?: HapticMoment | false; style? }   // coche qui se dessine (copié, code bon) ; fondu si animations réduites
KeyboardPeek { …; above?: number }        // hauteur laissée libre au-dessus du clavier (pied collé au clavier)
OnboardingTemplate { …; keyboardPeek?: { species; seed?; mood? } }   // pet par-dessus le clavier, au-dessus du pied (mesuré)
OtpInput   { …; success?: boolean }       // chiffre en « pop », curseur qui clignote, secousse à chaque nouvelle `error`,
                                          // code bon : vague verte, les cases se rejoignent et deviennent une coche
SpeciesPicker { …; nodKey?: string }      // le nom tapé : le pet hoche la tête
InvitePanel { …; copied?: boolean; copiedLabel?: string }   // coche dessinée à la place du pictogramme
PetTip     { …; actor?: Ref<PetActorHandle>; seed? }        // pet vivant qu'on fait réagir (`react('no')`)
StatTile   { …; count?: number; suffix?: string }           // la valeur défile (CountUp) ; `value` reste le libellé lu
```
- `TextField` et `InlineField` « s'allument » au focus (`FocusRing` : bordure jaune en fondu + halo qui se resserre).
- `StepProgress` remplit le segment de l'étape où l'on arrive ; `OnboardingTemplate` fait entrer titre, contenu puis pied
  (cascade courte, rien n'est bloqué) ; sa barre continue (`progress`) avance depuis l'étape d'avant (`PillSpan`).
- `QuizStep` : jauges en transformations (`PillSpan` + pastille en `translateX`, dépassement), la réponse choisie
  s'incline puis part de son côté, la question suivante arrive de la droite (de la gauche en revenant).
  Garder `QuizPreview` au même endroit entre questions et résultat (voir `app/(onboarding)/caractere.tsx`).
- Un changement de phase sur la même route : donner une `key` au gabarit pour rejouer l'entrée (`compte.tsx` : e-mail → code).

### Recettes
**1. Une liste qui arrive en cascade, une seule fois**
```tsx
<FlatList data={links} renderItem={({ item, index }) => (
  <Appear once={`chats:${item.id}`} delay={staggerDelay(index)}>
    <LinkRow link={item} … />
  </Appear>
)} />
```
**2. Secouer un champ en cas d'erreur**
```tsx
const [failed, setFailed] = useState(0);
<Shake trigger={failed}><OtpInput … error={error} /></Shake>
// dans onError : setFailed((n) => n + 1)   (la vibration « erreur » est incluse)
```
**3. Compter une statistique**
```tsx
<CountUp value={stats.messages} from={0} variant="h1" accessibilityLabel={`${stats.messages} messages`} />
```
**4. Faire voler un objet** (rien n'attend le vol : l'action part avant)
```tsx
const fly = useFlyTo(); const from = useRef<ComponentRef<typeof View>>(null); const to = useRef<ComponentRef<typeof View>>(null);
const send = () => {
  mutate();
  void fly({ from, to, render: ({ width }) => <Icon name="coeurs" size={width} />, onLand: () => setLanded((n) => n + 1) });
};
```
**5. Fêter quelque chose**
```tsx
const burst = useBurst();
ref.current?.measureInWindow((x, y, w, h) => burst({ kind: 'confetti', x: x + w / 2, y: y + h / 2 }));
hapticFor('celebrate');
// dans une Modal : <Burst kind="confetti" trigger={n} style={{ position: 'absolute', left: 120, top: 80 }} />
```
**6. Un pet qui passe la tête dans un état vide (ou une erreur)**
```tsx
<EmptyState peek species={pet.species} seed={pet.id} mood="triste" title={t.emptyTitle} text={t.emptyText} />
// ou, au bord de l'écran au-dessus de la barre d'onglets :
<PetPeek species={pet.species} seed={pet.id} mood="smug" edges={['bottom-right', 'bottom-left']} />
```
**7. Tirer pour rafraîchir avec le pet (iOS)**
```tsx
<PetRefresh species={pet.species} refreshing={refreshing} onRefresh={refresh}>
  {(scroll) => <TabTemplate {...scroll}>…</TabTemplate>}
</PetRefresh>
```

## Galerie
Banc d'essai du mouvement : `apps/mobile/app/dev/motion.tsx` (route `/dev/motion`).
`apps/mobile/app/dev/gallery.tsx` (route `/dev/gallery`) montre chaque composant avec des données d'exemple
(toi + Nino, Léa + Suzie, Malo + Gaston, Sasha + Pia ; Nino, Suzie et Pia portent une tenue, Gaston et Bob non).
La section « SOINS & GARDE-ROBE » (en tête) contient une démo interactive (soins → réactions, garde-robe → tenue), chaque
état des composants de soin et de garde-robe, et la matrice des 64 objets sur les 4 pets.

## Exemple : barre d'onglets expo-router
```tsx
<Tabs tabBar={(p) => (
  <BottomTabBar items={items} activeKey={p.state.routes[p.state.index]?.name ?? 'chats'} onPress={(k) => p.navigation.navigate(k)} />
)} />
// et dans chaque écran d'onglet : <TabTemplate …> (réserve TAB_BAR_SPACE en bas)
```
