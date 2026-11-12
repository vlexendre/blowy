import { type ComponentRef, memo, type RefObject, useEffect, useRef } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { ItemImage } from '../atoms/ItemImage';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { ease, useMotionActive, useReducedMotion } from '../lib/motion';
import { Burst } from '../motion/Burst';
import { PopIn, Shake, type ShakeHandle } from '../motion/PopIn';
import { alpha, color, radius, size as sizes, veil } from '../theme';

export type ItemTileState = 'owned' | 'worn' | 'locked' | 'premium';

export interface ItemTileProps {
  /** Identifiant de l'objet (`ITEM_IDS`). */
  id: string;
  /** Nom lu et affiché (`itemLabel[id]`). */
  label: string;
  /** `owned` dans la garde-robe · `worn` porté (cadre jaune) · `locked` à gagner · `premium` à acheter. */
  state: ItemTileState;
  /** Objet à gagner : étape courte (« 2 jours de soins »), affichée à la place du nom. */
  goalText?: string;
  /** Objet à gagner : avancement (mini barre). */
  progress?: { have: number; need: number };
  /** Étiquette des objets premium (« bientôt »). */
  premiumLabel?: string;
  /** Étiquette d'un objet tout juste débloqué (« nouveau »). */
  newLabel?: string;
  /** Étiquette de l'objet porté (« porté »). */
  wornLabel?: string;
  /** Côté de l'image. Défaut 72. */
  imageSize?: number;
  onPress?: () => void;
  accessibilityHint?: string;
  /** Ref de l'image (mesurée pour faire voler l'objet vers le pet, `useFlyTo`). */
  imageRef?: RefObject<ComponentRef<typeof View> | null>;
  /** À incrémenter quand l'objet revient se poser dans sa case (petit rebond). */
  landKey?: number;
  style?: StyleProp<ViewStyle>;
}

/** Reflet qui passe de temps en temps sur l'étiquette « bientôt » (boucle douce, coupée hors écran). */
function Shine() {
  const reduced = useReducedMotion();
  const active = useMotionActive();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduced || !active) {
      cancelAnimation(t);
      t.value = 0;
      return;
    }
    t.value = withRepeat(withSequence(withTiming(1, { duration: 900, easing: ease.inOut }), withDelay(1800, withTiming(0, { duration: 0 }))), -1);
    return () => cancelAnimation(t);
  }, [reduced, active, t]);
  const band = useAnimatedStyle(() => ({ opacity: t.value > 0 && t.value < 1 ? 1 : 0, transform: [{ translateX: -24 + t.value * 90 }, { rotate: '20deg' }] }));
  return <Animated.View pointerEvents="none" style={[styles.shine, band]} />;
}

/**
 * Case d'un objet (`.tile` de V6-GardeRobe) : porté, possédé, à gagner (étape + mini barre) ou premium (« bientôt »).
 * Verrouillé : l'objet tremble au toucher. Premium : un reflet passe sur « bientôt ». Nouveau : l'étiquette arrive
 * en « pop » avec des étincelles, une fois. Porté / retiré : petit rebond.
 */
export const ItemTile = memo(function ItemTile({
  id,
  label,
  state,
  goalText,
  progress,
  premiumLabel,
  newLabel,
  wornLabel,
  imageSize = 72,
  onPress,
  accessibilityHint,
  imageRef,
  landKey = 0,
  style,
}: ItemTileProps) {
  const worn = state === 'worn';
  const locked = state === 'locked';
  const premium = state === 'premium';
  const isNew = !premium && !worn && !!newLabel;
  const tag = premium ? premiumLabel : worn ? wornLabel : newLabel;
  const caption = locked && goalText ? goalText : label;
  const ratio = progress && progress.need > 0 ? Math.max(0, Math.min(1, progress.have / progress.need)) : 0;
  const shake = useRef<ShakeHandle>(null);
  const a11y = [
    label,
    worn ? wornLabel : undefined,
    locked ? goalText : undefined,
    premium ? premiumLabel : undefined,
    progress && locked ? `${progress.have}/${progress.need}` : undefined,
    !premium && !worn ? newLabel : undefined,
  ]
    .filter(Boolean)
    .join(', ');
  const press = onPress
    ? () => {
        if (locked || premium) shake.current?.shake();
        onPress();
      }
    : undefined;
  return (
    <Pressable
      onPress={press}
      disabled={!onPress}
      haptic={locked || premium ? false : 'selection'}
      scaleTo={0.95}
      bounceKey={`${state}:${landKey}`}
      accessibilityLabel={a11y}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected: worn, disabled: !onPress }}
      style={[styles.tile, worn && styles.worn, style]}
    >
      <Shake ref={shake} distance={5} haptic={locked || premium ? 'error' : false}>
        <View ref={imageRef} collapsable={false}>
          <ItemImage id={id} size={imageSize} style={locked ? styles.locked : undefined} />
        </View>
      </Shake>
      <Text variant="bodyBold" size={10.5} muted center numberOfLines={2} style={styles.caption}>
        {caption}
      </Text>
      {locked && progress ? (
        <View style={styles.mini}>
          <View style={[styles.miniFill, { width: `${ratio * 100}%` }]} />
        </View>
      ) : null}
      {tag ? (
        <PopIn onMount={isNew} delay={isNew ? 380 : 0} style={styles.tagBox} pointerEvents="none">
          <View style={[styles.tag, premium && styles.tagPremium]}>
            <Text variant="bodyHeavy" size={9} color={premium ? color.white : color.dark} numberOfLines={1} style={styles.tagText}>
              {tag}
            </Text>
            {premium ? <Shine /> : null}
          </View>
          {isNew ? <Burst kind="sparkles" trigger={1} seed={id} count={5} spread={22} size={9} style={styles.sparkle} /> : null}
        </PopIn>
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  // `.tile` : 1/1.08, #17142A, filet 8 %, rayon 22, padding 8 6 6, écart 2.
  tile: {
    flex: 1,
    minWidth: sizes.touch,
    aspectRatio: 1 / 1.08,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingTop: 8,
    paddingHorizontal: 6,
    paddingBottom: 6,
    borderRadius: 22,
    backgroundColor: color.panel,
    borderWidth: sizes.border,
    borderColor: veil.line,
  },
  // `.tile.on` : filet jaune 2, fond un cran plus clair.
  worn: { borderWidth: 2, borderColor: color.accent, backgroundColor: color.line },
  // `.tile.lock img` : opacité .32.
  locked: { opacity: 0.32 },
  caption: { lineHeight: 12 },
  // `.mini` : 70 % de large, 4 de haut.
  mini: { width: '70%', height: 4, marginTop: 2, borderRadius: radius.pill, backgroundColor: veil.glassStrong, overflow: 'hidden' },
  miniFill: { height: '100%', backgroundColor: color.accent },
  // `.tag` : en haut à droite, 9/800, pilule jaune (violette pour « bientôt »).
  tagBox: { position: 'absolute', top: 7, right: 7 },
  tag: { paddingVertical: 3, paddingHorizontal: 7, borderRadius: radius.pill, backgroundColor: color.accent, overflow: 'hidden' },
  tagPremium: { backgroundColor: color.violet },
  tagText: { letterSpacing: 0.36, lineHeight: 11 },
  shine: { position: 'absolute', top: -6, bottom: -6, left: 0, width: 12, backgroundColor: alpha(color.white, 0.45) },
  sparkle: { position: 'absolute', left: '50%', top: '50%' },
});
