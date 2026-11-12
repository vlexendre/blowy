import type { Species } from '@blowy/domain';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { type DimensionValue, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Chip } from '../atoms/Chip';
import { Glyph } from '../atoms/Glyph';
import { PetImage } from '../atoms/PetImage';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { useInk } from '../lib/ink';
import { alpha, color, extra, gradient, radius, space, veil } from '../theme';

/** `photo` : image ; `pending` : en attente (pet qui patiente) ; `locked` : posée mais cachée ; `empty` : à prendre. */
export type PhotoTileState = 'photo' | 'pending' | 'locked' | 'empty';

export interface PhotoTileProps {
  state: PhotoTileState;
  uri?: string | null;
  /** Étiquette en bas à gauche (« ta photo · 9:12 », « 12 oct. »). */
  label?: string;
  /** Puce en haut à gauche (« posté ✓ »). */
  badge?: string;
  /** Texte principal des états sans image (« léa : en attente »). */
  title?: string;
  /** Texte secondaire (« elle a jusqu'à minuit »). */
  caption?: string;
  /** Pet qui patiente (état `pending`). */
  species?: Species;
  /** Photo floutée (visages pas encore nets). */
  blurred?: boolean;
  height?: DimensionValue;
  /** Contenu libre en surimpression. */
  children?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Vignette de photo du jour et de souvenir, avec ses états d'attente. */
export function PhotoTile({ state, uri, label, badge, title, caption, species = 'suzie', blurred, height = 124, children, onPress, accessibilityLabel, style }: PhotoTileProps) {
  const ink = useInk();
  const hasImage = state === 'photo' || (state === 'locked' && !!uri);
  const body = (
    <>
      {hasImage && uri ? (
        <Image source={{ uri }} contentFit="cover" blurRadius={blurred || state === 'locked' ? 24 : 0} transition={150} style={StyleSheet.absoluteFill} />
      ) : hasImage || state === 'locked' ? (
        <LinearGradient colors={[extra.sky, gradient.violet[0]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      ) : null}
      {state === 'pending' ? <PetImage species={species} mood="triste" size={70} animation="breathe" style={styles.pet} /> : null}
      {state === 'empty' ? <Glyph name="camera" size={30} /> : null}
      {state === 'locked' ? (
        <View style={styles.lock}>
          <Glyph name="lock" size={18} color={ink} />
        </View>
      ) : null}
      {title ? (
        <Text variant="bodyHeavy" size={13} center numberOfLines={1}>
          {title}
        </Text>
      ) : null}
      {caption ? (
        <Text variant="body" size={11} center numberOfLines={1} style={styles.caption}>
          {caption}
        </Text>
      ) : null}
      {badge ? <Chip label={badge} tone="accent" style={styles.badge} /> : null}
      {label ? (
        <View style={styles.label}>
          <Text variant="bodyHeavy" size={11} color={color.white} numberOfLines={1}>
            {label}
          </Text>
        </View>
      ) : null}
      {children}
    </>
  );
  const s = [
    styles.base,
    { height, justifyContent: state === 'pending' ? ('flex-end' as const) : ('center' as const) },
    !hasImage && styles.placeholder,
    // Maquette : fond encre à 12 %, liseré intérieur de 2 à 35 %.
    !hasImage && { borderColor: alpha(ink, 0.35), backgroundColor: alpha(ink, 0.12) },
    style,
  ];
  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityLabel={accessibilityLabel ?? [label, title].filter(Boolean).join(', ')} scaleTo={0.97} style={s}>
        {body}
      </Pressable>
    );
  }
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel ?? [label, title, caption].filter(Boolean).join(', ')} style={s}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.md + 4, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: space.md - 2 },
  placeholder: { borderWidth: 2 },
  pet: { marginBottom: -space.xs },
  caption: { opacity: 0.7 },
  lock: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: veil.darkGlass },
  badge: { position: 'absolute', top: space.md - 2, left: space.md - 2 },
  label: { position: 'absolute', left: space.md - 2, bottom: space.md - 2, paddingHorizontal: space.sm + 1, paddingVertical: space.xs, borderRadius: radius.pill, backgroundColor: veil.darkLabel },
});
