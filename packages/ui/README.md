# @blowy/ui — design system Blowy V6

Composants React Native (Expo SDK 58, RN 0.88, Reanimated 4) en design atomique. Nuit `#0B0A14`, grands panneaux
en dégradé, titres Anton en capitales avec partie estompée, corps Bricolage Grotesque, accent jaune (texte sombre dessus).

```ts
import { Button, LinkRow, TodayCard, ScreenTemplate } from '@blowy/ui';
```

## Règles
- **Niveaux** : `atoms` → `molecules` → `organisms` → `templates`. Un niveau n'importe que les niveaux inférieurs
  (plus `lib/`, `theme.ts`, `types.ts`, `assets/`). Un composant par fichier, exports nommés.
- **Aucun texte en dur** : tout libellé arrive en prop (seuls quelques libellés d'accessibilité ont un repli, ex. « Retour »).
  Les objets de `@blowy/content` (`gaugeLabel`, `levelLabel`, `eventLabel`…) se passent tels quels.
- **Données** : les organismes prennent des formes structurelles (`types.ts`) qui reprennent les champs du contrat :
  un `Link`, `Person`, `PublicPet`, `Message`, `Suggestion`, `Incoming`, `Memories`, `PetEvent` se passe directement.
  Aucun appel réseau, aucune navigation : des callbacks.
- **Couleurs** : uniquement `@blowy/tokens` + `src/theme.ts` (extensions locales : `extra.heart`, `extra.sky`, voiles `veil.*`,
  `onGradient`, `alpha()`). L'encre (couleur du texte) suit le conteneur : un `Panel` clair passe ses enfants en sombre.
- **Accessibilité** : tout élément touchable a un rôle et un libellé, une zone de toucher ≥ 44 pt, et toutes les animations
  se coupent avec « réduire les animations » (`useReducedMotion`).
- Pas de dépendance SVG : les pictogrammes d'interface (`Glyph`) sont dessinés en vues ; les icônes 3D sont des images (`Icon`).

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

## Types partagés (`src/types.ts`)
```ts
PetLook = { name: string; species: Species; form?: PetForm; mood?: Mood }                 // ⊇ PublicPet
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
TitleSegment = { text: string; dim?: boolean }; type TitleContent = string | readonly TitleSegment[]   // « \n » = retour à la ligne
```
Exports utilitaires : `alpha(hex, a)`, `extra`, `onGradient`.

## Composants (props exactes)
### Atomes
#### `Avatar` — `src/atoms/Avatar.tsx`
```ts
AvatarProps = { size?: number; uri?: string | null; name?: string; pet?: PetLook; face?: FaceVisibility; blurred?: boolean; hidden?: boolean; pose?: PetPose; ring?: string; cutout?: boolean; dimmed?: boolean; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; }
```
#### `Badge` — `src/atoms/Badge.tsx`
```ts
BadgeProps = { count: number; max?: number; tone?: 'heart' | 'accent'; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; }
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
#### `Chip` — `src/atoms/Chip.tsx`
```ts
ChipProps = { label: string; onPress?: () => void; selected?: boolean; tone?: ChipTone; left?: ReactNode; size?: 'sm' | 'md' | 'lg'; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; }
type ChipTone = 'glass' | 'accent' | 'dark' | 'light' | 'coral' | 'rose' | 'orange' | 'violet'
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
#### `Panel` — `src/atoms/Panel.tsx`
```ts
PanelProps = { children?: ReactNode; gradient?: GradientName; radius?: 'md' | 'lg' | 'xl'; padding?: 'none' | 'md' | 'lg' | 'xl'; overflow?: boolean; ink?: string; style?: StyleProp<ViewStyle>; }
```
#### `PetImage` — `src/atoms/PetImage.tsx`
```ts
PetImageProps = { species?: Species; mood?: Mood | PetPose; trait?: PetTrait; form?: PetForm; art?: ArtName; craft?: CraftColour; source?: Src | { uri: string }; size: number; animation?: PetAnimation; outline?: boolean; rotate?: number; delay?: number; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; }
type PetAnimation = 'none' | 'breathe' | 'bob'
```
#### `Pressable` — `src/atoms/Pressable.tsx`
```ts
PressableProps extends Omit<RNPressableProps, 'style' | 'children'> = { children?: ReactNode; style?: StyleProp<ViewStyle>; scaleTo?: number; haptic?: HapticKind | false; }
```
#### `ProgressBar` — `src/atoms/ProgressBar.tsx`
```ts
ProgressBarProps = { value: number; color?: string; trackColor?: string; height?: number; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; }
```
#### `Skeleton` — `src/atoms/Skeleton.tsx`
```ts
SkeletonProps = { width?: DimensionValue; height?: number; radius?: keyof typeof radii | 'circle'; style?: StyleProp<ViewStyle>; }
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
TitleProps = { text: TitleContent; variant?: 'hero' | 'h1' | 'h2' | 'h3'; size?: number; color?: string; center?: boolean; numberOfLines?: number; style?: StyleProp<TextStyle>; accessibilityLabel?: string; }
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
#### `ChoiceCard` — `src/molecules/ChoiceCard.tsx`
```ts
ChoiceCardProps = { title: string; caption?: string; icon?: IconName | ReactNode; gradient?: GradientName; selected?: boolean; faded?: boolean; disabled?: boolean; onPress?: () => void; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; }
```
#### `DayChip` — `src/molecules/DayChip.tsx`
```ts
DayChipProps = { label: string; }
```
#### `EmptyState` — `src/molecules/EmptyState.tsx`
```ts
EmptyStateProps = { species?: Species; mood?: Mood | PetPose; title: TitleContent; text?: string; actionLabel?: string; onAction?: () => void; style?: StyleProp<ViewStyle>; }
```
#### `FeatureRow` — `src/molecules/FeatureRow.tsx`
```ts
FeatureRowProps = { icon: IconName; title: string; text?: string; style?: StyleProp<ViewStyle>; }
```
#### `GaugeBar` — `src/molecules/GaugeBar.tsx`
```ts
GaugeBarProps = { value: number; low: string; high: string; caption?: string; target?: number; color?: string; compact?: boolean; selected?: boolean; onPress?: () => void; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; }
```
#### `Header` — `src/molecules/Header.tsx`
```ts
HeaderProps = { onBack?: () => void; backLabel?: string; backGlyph?: 'back' | 'close'; title?: string; subtitle?: string; center?: ReactNode; right?: ReactNode; style?: StyleProp<ViewStyle>; }
```
#### `Hearts` — `src/molecules/Hearts.tsx`
```ts
HeartsProps = { lives: number; max?: number; size?: number; ghost?: boolean; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; }
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
```
#### `SpeechBubble` — `src/molecules/SpeechBubble.tsx`
```ts
SpeechBubbleProps = { text: string; highlight?: string; highlightColor?: string; tone?: 'dark' | 'light'; tail?: 'left' | 'right' | 'none'; rotate?: number; style?: StyleProp<ViewStyle>; }
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
TabBarItemProps = { label: string; glyph: GlyphName; active?: boolean; badge?: number; onPress?: () => void; onLongPress?: () => void; accessibilityLabel?: string; }
```
### Organismes
#### `BottomTabBar` — `src/organisms/BottomTabBar.tsx`
```ts
BottomTabItem<K extends string = string> = { key: K; label: string; glyph: GlyphName; badge?: number; }
BottomTabBarProps<K extends string = string> = { items: readonly BottomTabItem<K>[]; activeKey: K; onPress: (key: K) => void; onLongPress?: (key: K) => void; floating?: boolean; accessibilityLabel?: string; style?: StyleProp<ViewStyle>; }
const TAB_BAR_SPACE = size.tabBar + space.lg + space.sm
```
#### `ChallengeCard` — `src/organisms/ChallengeCard.tsx`
```ts
ChallengeCardProps = { label: string; question: string; choices: readonly [string, string] | readonly string[]; done: boolean; picked?: number | null; doneLabel?: string; onChoose?: (choice: 0 | 1) => void; loading?: boolean; streak?: number; streakUnit?: string; gradient?: GradientName; }
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
#### `PetHero` — `src/organisms/PetHero.tsx`
```ts
PetHeroProps = { pet: PetLook; title: TitleContent; moodLabel?: string; formLabel?: string; speech?: string; gradient?: GradientName; pose?: PetPose; showForm?: boolean; onPetPress?: () => void; petLabel?: string; }
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
ScreenTemplateProps = { children?: ReactNode; header?: ReactNode; footer?: ReactNode; scroll?: boolean; background?: GradientName | 'night'; padded?: boolean; edges?: readonly ('top' | 'bottom')[]; bottomSpace?: number; keyboard?: boolean; refreshControl?: ReactElement<RefreshControlProps>; scrollRef?: Ref<ComponentRef<typeof ScrollView>>; contentStyle?: StyleProp<ViewStyle>; }
```
#### `SheetTemplate` — `src/templates/SheetTemplate.tsx`
```ts
SheetTemplateProps = { visible: boolean; onClose: () => void; title?: TitleContent; children?: ReactNode; footer?: ReactNode; closeLabel?: string; }
```
#### `TabTemplate` — `src/templates/TabTemplate.tsx`
```ts
TabTemplateProps = { brand?: string; title?: TitleContent; right?: ReactNode; children?: ReactNode; scroll?: boolean; refreshControl?: ReactElement<RefreshControlProps>; }
```

## Galerie
`apps/mobile/app/dev/gallery.tsx` (route `/dev/gallery`) montre chaque composant avec des données d'exemple
(toi + Nino, Léa + Suzie, Malo + Gaston, Sasha + Pia).

## Exemple : barre d'onglets expo-router
```tsx
<Tabs tabBar={(p) => (
  <BottomTabBar items={items} activeKey={p.state.routes[p.state.index]?.name ?? 'chats'} onPress={(k) => p.navigation.navigate(k)} />
)} />
// et dans chaque écran d'onglet : <TabTemplate …> (réserve TAB_BAR_SPACE en bas)
```
