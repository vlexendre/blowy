/**
 * Molécules V5 : classes communes des maquettes (design/v5/project, CSS partagé) traduites
 * propriété par propriété. Chaque composant cite la classe CSS qu'il reproduit.
 */
import type { ReactNode } from 'react';
import { Pressable, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { v5, v5Alpha } from '../foundations/theme';
import { displayFont } from '../foundations/typography';
import { BodyText } from '../atoms/BodyText';
import { DisplayText } from '../atoms/DisplayText';
import { Glyph, type GlyphName } from '../atoms/Glyph';
import { Sprite } from '../atoms/Sprite';
import { Switch } from '../atoms/Switch';

const hardShadow = (y: number, c: string): ViewStyle => ({
  boxShadow: [{ offsetX: 0, offsetY: y, blurRadius: 0, spreadDistance: 0, color: c }],
});
export const v5Shadow = hardShadow;

/** Zone pressable générique : appui = descente de `pressDepth` px et perte de l'ombre (`:active`). */
export function Tap({
  onPress,
  onLongPress,
  delayLongPress,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityState,
  style,
  children,
  testID,
  disabled,
  pressDepth = 3,
}: {
  onPress?: () => void;
  onLongPress?: () => void;
  delayLongPress?: number;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link' | 'radio' | 'checkbox' | 'switch' | 'tab';
  accessibilityState?: { selected?: boolean; checked?: boolean; disabled?: boolean };
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  testID?: string;
  disabled?: boolean;
  pressDepth?: number;
}) {
  if (!onPress && !onLongPress) return <View style={style}>{children}</View>;
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={delayLongPress}
      disabled={disabled}
      testID={testID}
      style={({ pressed }) => [
        style,
        pressed && pressDepth ? { transform: [{ translateY: pressDepth }], boxShadow: [] } : null,
      ]}
    >
      {children}
    </Pressable>
  );
}

/** `.back` : 44×44, rayon 14, blanc, ombre `0 3px 0 #EEDFCB`, chevron 16. */
export function BackButton({
  onPress,
  label,
  testID,
}: {
  onPress: () => void;
  label: string;
  testID?: string;
}) {
  return (
    <Tap
      onPress={onPress}
      accessibilityLabel={label}
      testID={testID ?? 'back'}
      style={[
        {
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: v5.white,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        },
        hardShadow(3, v5.shadowCream),
      ]}
    >
      <Glyph name="back" size={16} />
    </Tap>
  );
}

/** `.icb` : bouton carré 44×44 rayon 14 (fond et ombre selon l'écran). */
export function IconAction({
  glyph,
  onPress,
  label,
  background = v5.white,
  shadow,
  glyphColor = v5.ink,
  glyphColor2,
  glyphSize = 18,
  size = 44,
  radius = 14,
  testID,
}: {
  glyph: GlyphName;
  onPress?: () => void;
  label: string;
  background?: string;
  shadow?: string | null;
  glyphColor?: string;
  glyphColor2?: string;
  glyphSize?: number;
  size?: number;
  radius?: number;
  testID?: string;
}) {
  return (
    <Tap
      onPress={onPress}
      accessibilityLabel={label}
      testID={testID}
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: background,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        },
        shadow ? hardShadow(3, shadow) : null,
      ]}
    >
      <Glyph name={glyph} size={glyphSize} color={glyphColor} color2={glyphColor2} />
    </Tap>
  );
}

/**
 * `.tag` d'étape : blanc, rayon 999, marges 5/12/5/5, ombre `0 2px 0 rgba(0,0,0,.07)`, Inter 12 700 ;
 * `b` = pastille encre 22 px texte lime 10 px ; barre 70×6 #EEDFCB remplie en #D93A1C.
 */
export function StepTag({
  step,
  total,
  label,
  accessibilityLabel,
  badge,
  progress,
}: {
  step: number;
  total: number;
  label: string;
  accessibilityLabel: string;
  badge?: string;
  progress?: number | null;
}) {
  const pct = Math.round((progress ?? step / total) * 100);
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: v5.white,
          borderRadius: 999,
          paddingTop: 5,
          paddingBottom: 5,
          paddingLeft: 5,
          paddingRight: 12,
        },
        hardShadow(2, v5Alpha.black07),
      ]}
    >
      <View
        style={{
          minWidth: 22,
          height: 22,
          paddingHorizontal: 6,
          borderRadius: 999,
          backgroundColor: v5.ink,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <BodyText size={10} weight={800} color={v5.lime}>
          {badge ?? `${step}/${total}`}
        </BodyText>
      </View>
      <BodyText size={12} weight={700} nowrap>
        {label}
      </BodyText>
      {progress === null ? null : (
        <View
          style={{
            marginLeft: 'auto',
            width: 70,
            height: 6,
            borderRadius: 999,
            backgroundColor: v5.shadowCream,
            overflow: 'hidden',
          }}
        >
          <View style={{ height: '100%', width: `${pct}%`, backgroundColor: v5.coralBtn }} />
        </View>
      )}
    </View>
  );
}

/** `.chip` V5 : rayon 999, marges 5/10, Inter 12 800 (rendu 700), écart 6. */
export function Pill({
  label,
  background = v5.white,
  color = v5.ink,
  leading,
  padding,
  fontSize = 12,
  shadow,
  family,
  style,
  accessibilityLabel,
}: {
  label: string;
  background?: string;
  color?: string;
  leading?: ReactNode;
  padding?: [number, number] | [number, number, number, number];
  fontSize?: number;
  shadow?: string;
  family?: 'display';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const [pt, pr, pb, pl] = padding
    ? padding.length === 2
      ? [padding[0], padding[1], padding[0], padding[1]]
      : padding
    : [5, 10, 5, 10];
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? label}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          borderRadius: 999,
          backgroundColor: background,
          paddingTop: pt,
          paddingRight: pr,
          paddingBottom: pb,
          paddingLeft: pl,
        },
        shadow ? hardShadow(2, shadow) : null,
        style,
      ]}
    >
      {leading}
      {family === 'display' ? (
        <DisplayText
          size={fontSize}
          color={color}
          lineHeight={1.2}
          letterSpacingEm={0}
          heading={false}
          numberOfLines={1}
        >
          {label}
        </DisplayText>
      ) : (
        <BodyText size={fontSize} weight={800} color={color} nowrap>
          {label}
        </BodyText>
      )}
    </View>
  );
}

/** `.lbl` V5 : Inter 11 800 (700), interlettrage .14em, capitales, #6F6458. */
export function SectionLabel({
  children,
  color = v5.grey,
  style,
}: {
  children: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      <BodyText size={11} weight={800} ls={0.14} upper color={color}>
        {children}
      </BodyText>
    </View>
  );
}

/** `.grp` : blanc, rayon 20, ombre `0 4px 0 #EEDFCB`, contenu rogné. */
export function RowGroup({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        { backgroundColor: v5.white, borderRadius: 20, overflow: 'hidden' },
        hardShadow(4, v5.shadowCream),
        style,
      ]}
    >
      {children}
    </View>
  );
}

export interface RowProps {
  label: string;
  /** Sous-texte sous le libellé (colonne). */
  sub?: string;
  subColor?: string;
  /** `.val` : à droite, Inter 12 600 #6F6458. */
  value?: string;
  valueColor?: string;
  /** Graisse de la valeur (600 par défaut ; 700/800 quand la maquette force `font-weight`). */
  valueWeight?: 600 | 700 | 800;
  leading?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  first?: boolean;
  color?: string;
  background?: string;
  minHeight?: number;
  /** `white-space: normal` (libellés longs). */
  wrap?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  fontSize?: number;
}

/** `.row` : min 52, marges 0 14, écart 12, Inter 14 700, filet haut 1 px #F4EADC (sauf la première). */
export function Row({
  label,
  sub,
  subColor = v5.grey,
  value,
  valueColor = v5.grey,
  valueWeight = 600,
  leading,
  trailing,
  chevron,
  onPress,
  first,
  color = v5.ink,
  background,
  minHeight = 52,
  wrap,
  accessibilityLabel,
  testID,
  fontSize = 14,
}: RowProps) {
  const title = (
    <BodyText
      size={fontSize}
      weight={700}
      color={color}
      numberOfLines={wrap ? undefined : 1}
      style={wrap ? { flexShrink: 1 } : null}
    >
      {label}
    </BodyText>
  );
  return (
    <Tap
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? [label, sub, value].filter(Boolean).join(', ')}
      accessibilityRole={onPress ? 'link' : undefined}
      testID={testID}
      pressDepth={0}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight,
        paddingHorizontal: 14,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: v5.line,
        backgroundColor: background,
      }}
    >
      {leading}
      {sub ? (
        <View style={{ flexDirection: 'column', gap: 2, flexShrink: 1 }}>
          {title}
          <BodyText size={12} weight={600} color={subColor}>
            {sub}
          </BodyText>
        </View>
      ) : (
        title
      )}
      {value ? (
        <BodyText
          size={12}
          weight={valueWeight}
          color={valueColor}
          align="right"
          style={{ marginLeft: 'auto', flexShrink: 1 }}
          numberOfLines={wrap ? undefined : 1}
        >
          {value}
        </BodyText>
      ) : null}
      {trailing}
      {chevron ? (
        <View style={{ marginLeft: value ? 6 : 'auto', flexShrink: 0 }}>
          <Glyph name="chevron" size={14} />
        </View>
      ) : null}
    </Tap>
  );
}

/** `.ico` : pastille d'icône 30×30 rayon 10. */
export function IconBadge({
  glyph,
  background,
  color,
  color2,
  size = 30,
  radius = 10,
  glyphSize = 16,
}: {
  glyph: GlyphName;
  background: string;
  color: string;
  color2?: string;
  size?: number;
  radius?: number;
  glyphSize?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: background,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Glyph name={glyph} size={glyphSize} color={color} color2={color2} />
    </View>
  );
}

/**
 * Carte de choix radio (Genre, Rencontrer, Tu cherches…) : min 58, marges 0 16, rayon 18, ombre
 * `0 4px 0 #EEDFCB` ; anneau 22 bord 3 (OFF #8C7B66 vide, ON lime plein), titre `.d` 21, sous-titre 12 600.
 * Sélection : fond encre, texte blanc, sous-titre #E3D9CF.
 */
export function ChoiceCard({
  title,
  sub,
  selected,
  onPress,
  testID,
  kind = 'radio',
}: {
  title: string;
  sub?: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
  kind?: 'radio' | 'checkbox';
}) {
  return (
    <Tap
      onPress={onPress}
      accessibilityRole={kind}
      accessibilityState={{ checked: selected }}
      accessibilityLabel={[title, sub].filter(Boolean).join(', ')}
      testID={testID}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          minHeight: 58,
          paddingHorizontal: 16,
          borderRadius: 18,
          backgroundColor: selected ? v5.ink : v5.white,
        },
        hardShadow(4, v5.shadowCream),
      ]}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: kind === 'radio' ? 11 : 7,
          borderWidth: 3,
          borderColor: selected ? v5.lime : v5.greyWarm,
          backgroundColor: selected ? v5.lime : 'transparent',
          flexShrink: 0,
        }}
      />
      <View style={{ flexDirection: 'column', gap: 2, flexShrink: 1 }}>
        <DisplayText size={21} color={selected ? v5.white : v5.ink} heading={false}>
          {title}
        </DisplayText>
        {sub ? (
          <BodyText size={12} weight={600} color={selected ? v5.mist : v5.inkSoft}>
            {sub}
          </BodyText>
        ) : null}
      </View>
    </Tap>
  );
}

/** Vignette de pet : carré arrondi coloré + sprite centré (`object-fit: contain`). */
export function PetTile({
  path,
  size,
  spriteSize,
  radius,
  background,
  label,
  style,
}: {
  path: string | null;
  size: number;
  spriteSize: number;
  radius: number;
  background?: string;
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      accessible={!!label}
      accessibilityLabel={label}
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: background,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        },
        style,
      ]}
    >
      <Sprite path={path} size={spriteSize} />
    </View>
  );
}

/** Place « à découvrir » : carré pointillé #8C7B66 bord 2, « ? » `.d` 20 #5A5047. */
export function UnknownTile({
  size = 48,
  radius = 15,
  label,
}: {
  size?: number;
  radius?: number;
  label: string;
}) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: v5.greyWarm,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <DisplayText size={20} color={v5.inkSoft} heading={false}>
        ?
      </DisplayText>
    </View>
  );
}

/** `.them` / `.me` : bulles de chat (max 270, rayons 20/20/20/6 ou 20/20/6/20, Inter 14 interligne 1,4). */
export function Bubble({
  text,
  mine,
  author,
  maxWidth = 270,
}: {
  text: string;
  mine?: boolean;
  author?: ReactNode;
  maxWidth?: number;
}) {
  return (
    <View
      style={[
        {
          alignSelf: mine ? 'flex-end' : 'flex-start',
          maxWidth,
          paddingVertical: 10,
          paddingHorizontal: 14,
        },
        mine
          ? {
              backgroundImage: `linear-gradient(135deg, ${v5.rose}, ${v5.coralText})`,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              borderBottomRightRadius: 6,
              borderBottomLeftRadius: 20,
              ...hardShadow(3, v5.coralDeepShadow),
            }
          : {
              backgroundColor: v5.white,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              borderBottomRightRadius: 20,
              borderBottomLeftRadius: 6,
              ...hardShadow(3, v5.shadowCream),
            },
      ]}
    >
      {author}
      <BodyText size={14} weight={400} lh={1.4} color={mine ? v5.white : v5.ink}>
        {text}
      </BodyText>
    </View>
  );
}

/** Ligne de navigation discrète (« Tom vient avec toi › ») : min 44, Inter 13 700 #5A5047. */
export function InlineLink({
  label,
  leading,
  onPress,
  color = v5.inkSoft,
  testID,
}: {
  label: string;
  leading?: ReactNode;
  onPress?: () => void;
  color?: string;
  testID?: string;
}) {
  return (
    <Tap
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={label}
      testID={testID}
      pressDepth={0}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minHeight: 44,
        paddingHorizontal: 6,
      }}
    >
      {leading}
      <BodyText size={13} weight={700} color={color}>
        {label}
      </BodyText>
      <View style={{ marginLeft: 'auto' }}>
        <Glyph name="chevron" size={14} color={color} />
      </View>
    </Tap>
  );
}

/** Carte blanche `.card` V5 (rayon 22, ombre 4 #EEDFCB) avec marges libres. */
export function CardV5({
  children,
  style,
  radius = 22,
  shadow = v5.shadowCream,
  depth = 4,
  onPress,
  accessibilityLabel,
  testID,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  shadow?: string;
  depth?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
}) {
  return (
    <Tap
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={onPress ? 'link' : undefined}
      testID={testID}
      style={[
        { backgroundColor: v5.white, borderRadius: radius },
        hardShadow(depth, shadow),
        style,
      ]}
    >
      {children}
    </Tap>
  );
}

/** Puce de liste cochée (coche 13 verte + texte 12 600 #5A5047, interligne 1,4). */
export function CheckLine({
  text,
  color = v5.inkSoft,
  checkColor = v5.green,
  size = 12,
  checkSize = 13,
  gap = 8,
}: {
  text: string;
  color?: string;
  checkColor?: string;
  size?: number;
  checkSize?: number;
  gap?: number;
}) {
  return (
    <View style={{ flexDirection: 'row', gap, alignItems: 'flex-start' }}>
      <View style={{ marginTop: (size * 1.4 - checkSize) / 2 }}>
        <Glyph name="check" size={checkSize} color={checkColor} />
      </View>
      <BodyText size={size} weight={600} lh={1.4} color={color} style={{ flexShrink: 1 }}>
        {text}
      </BodyText>
    </View>
  );
}

/**
 * Encart « promesses » : cadenas 22 + liste de coches 12 600 (`dark` : fond encre, texte #EDE6DE,
 * coches lime — Tarifs, Une histoire ; `light` : carte blanche, texte #5A5047, coches vertes — Éviter).
 */
export function NoteCard({
  lines,
  tone = 'dark',
  style,
}: {
  lines: string[];
  tone?: 'dark' | 'light';
  style?: StyleProp<ViewStyle>;
}) {
  const dark = tone === 'dark';
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          gap: 12,
          alignItems: 'flex-start',
          backgroundColor: dark ? v5.ink : v5.white,
          borderRadius: 18,
          paddingVertical: 12,
          paddingHorizontal: 14,
        },
        dark ? null : hardShadow(4, v5.shadowCream),
        style,
      ]}
    >
      <Glyph
        name="lock"
        size={22}
        color={dark ? v5.lime : v5.green}
        color2={dark ? v5.ink : v5.white}
      />
      <View style={{ flex: 1, gap: 5 }}>
        {lines.map((l) => (
          <CheckLine
            key={l}
            text={l}
            color={dark ? '#EDE6DE' : v5.inkSoft}
            checkColor={dark ? v5.lime : v5.green}
          />
        ))}
      </View>
    </View>
  );
}

/** Encart encre « secret » : cadenas lime 24 + texte 12 600 (strong lime). */
export function SecretNote({
  strong,
  text,
  style,
  glyphSize = 24,
  padding = [12, 14],
}: {
  strong: string;
  text: string;
  style?: StyleProp<ViewStyle>;
  glyphSize?: number;
  padding?: [number, number];
}) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          gap: 10,
          alignItems: 'center',
          backgroundColor: v5.ink,
          borderRadius: 18,
          paddingVertical: padding[0],
          paddingHorizontal: padding[1],
        },
        style,
      ]}
    >
      <Glyph name="lock" size={glyphSize} color={v5.lime} color2={v5.ink} />
      <BodyText size={12} weight={600} lh={1.4} color={v5.white} style={{ flexShrink: 1 }}>
        <BodyText size={12} weight={700} color={v5.lime}>
          {strong}
        </BodyText>
        {text ? ` ${text}` : ''}
      </BodyText>
    </View>
  );
}

/** Champ de saisie V5 (`label` encadré encre bord 2, ombre `0 3px 0 #16110D`). */
export function FieldFrame({
  children,
  minHeight = 56,
  radius = 18,
  style,
}: {
  children: ReactNode;
  minHeight?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          minHeight,
          paddingHorizontal: 14,
          borderRadius: radius,
          backgroundColor: v5.white,
          borderWidth: 2,
          borderColor: v5.ink,
        },
        hardShadow(3, v5.ink),
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Barre de progression fine (piste + remplissage). */
export function ThinBar({
  value,
  width,
  height = 6,
  track = v5.shadowCream,
  fill = v5.coralBtn,
}: {
  value: number;
  width: DimensionValue;
  height?: number;
  track?: string;
  fill?: string;
}) {
  return (
    <View style={{ width, height, borderRadius: 999, backgroundColor: track, overflow: 'hidden' }}>
      <View
        style={{
          height: '100%',
          width: `${Math.max(0, Math.min(1, value)) * 100}%`,
          backgroundColor: fill,
        }}
      />
    </View>
  );
}

/** Pastille ronde de compteur (non lus) : 26 px rose, Inter 12 800. */
export function CountDot({
  count,
  label,
  size = 26,
}: {
  count: number;
  label: string;
  size?: number;
}) {
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: v5.rose,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <BodyText size={12} weight={800} color={v5.white}>
        {String(count)}
      </BodyText>
    </View>
  );
}

/** Titre `.d` capitales des écrans (taille et interligne de la maquette). */
export function ScreenTitle({
  children,
  size,
  lineHeight,
  color = v5.ink,
  style,
  nowrap,
}: {
  children: ReactNode;
  size: number;
  lineHeight?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  nowrap?: boolean;
}) {
  return (
    <View style={style}>
      <DisplayText
        size={size}
        lineHeight={lineHeight}
        color={color}
        numberOfLines={nowrap ? 1 : undefined}
      >
        {children}
      </DisplayText>
    </View>
  );
}

export const displayStyle = displayFont;

/** Boutons d'identité (Compte) : « Continuer avec Apple » (noir, ombre #3A3029, 19 600) et Google (blanc, 17 700). */
export function AuthButton({
  provider,
  label,
  onPress,
  loading,
  disabled,
  testID,
}: {
  provider: 'apple' | 'google';
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
}) {
  const apple = provider === 'apple';
  return (
    <Tap
      onPress={loading || disabled ? undefined : onPress}
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      testID={testID}
      pressDepth={4}
      style={[
        {
          opacity: disabled ? 0.5 : 1,
          minHeight: 56,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 20,
          backgroundColor: apple ? v5.black : v5.white,
        },
        hardShadow(5, apple ? v5.wood : v5.shadowCream),
      ]}
    >
      <BodyText
        size={apple ? 19 : 17}
        weight={apple ? 600 : 700}
        color={apple ? v5.white : v5.ink}
        ls={0.01}
        nowrap
      >
        {label}
      </BodyText>
    </Tap>
  );
}

/** Carte réglage à interrupteur (Compte, Notifications) : titre 14–15 800, état 12 600 #6F6458, `.sw`. */
export function SwitchCard({
  title,
  sub,
  value,
  onChange,
  a11y,
  titleSize = 14,
}: {
  title: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
  a11y: string;
  titleSize?: number;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: v5.white,
          borderRadius: 22,
          paddingVertical: 4,
          paddingHorizontal: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          minHeight: 64,
        },
        hardShadow(4, v5.shadowCream),
      ]}
    >
      <View style={{ gap: 2, flexShrink: 1 }}>
        <BodyText size={titleSize} weight={800}>
          {title}
        </BodyText>
        <BodyText size={12} weight={600} color={v5.grey}>
          {sub}
        </BodyText>
      </View>
      <Switch value={value} onValueChange={onChange} accessibilityLabel={a11y} />
    </View>
  );
}

/**
 * `.pill` en choix unique (role radio) : grille de N colonnes, 44 px, rayon 14, 13 800 ; choisi =
 * encre/blanc ; ombre 3 px #E3D3BE. Aucun choix présélectionné tant que `value` est null.
 */
export function ChoicePills<K extends string>({
  options,
  value,
  onChange,
  columns = 2,
  label,
  minHeight = 44,
  shadow = '#E3D3BE',
  keepGrid = false,
}: {
  options: readonly { key: K; label: string; disabled?: boolean }[];
  value: K | null;
  onChange: (k: K) => void;
  columns?: number;
  label?: string;
  minHeight?: number;
  shadow?: string;
  /** Dernière ligne incomplète : garder la largeur de colonne au lieu d'étirer. */ keepGrid?: boolean;
}) {
  const rows: (typeof options)[number][][] = [];
  options.forEach((o, i) => (i % columns === 0 ? rows.push([o]) : rows[rows.length - 1]!.push(o)));
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ gap: 8 }}>
      {rows.map((row) => (
        <View key={row[0]!.key} style={{ flexDirection: 'row', gap: 8 }}>
          {row.map((o) => {
            const on = value === o.key;
            return (
              <Tap
                key={o.key}
                onPress={o.disabled ? undefined : () => onChange(o.key)}
                accessibilityRole="radio"
                accessibilityState={{ checked: on, disabled: !!o.disabled }}
                accessibilityLabel={o.label}
                pressDepth={0}
                style={[
                  {
                    flex: 1,
                    minHeight,
                    borderRadius: 14,
                    paddingHorizontal: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: on ? v5.ink : v5.white,
                    opacity: o.disabled ? 0.55 : 1,
                  },
                  hardShadow(3, shadow),
                ]}
              >
                <BodyText size={13} weight={800} color={on ? v5.white : v5.ink} nowrap>
                  {o.label}
                </BodyText>
              </Tap>
            );
          })}
          {keepGrid
            ? Array.from({ length: columns - row.length }, (_, i) => (
                <View key={`pad-${i}`} style={{ flex: 1 }} />
              ))
            : null}
        </View>
      ))}
    </View>
  );
}
