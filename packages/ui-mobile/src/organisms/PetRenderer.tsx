/**
 * PetRenderer : empilement couche sprite + accessoires + effets, posé sur une ligne de sol
 * stable (manifest @blowy/sprites). Respiration squash/stretch, marche/saut sur frames,
 * réaction au tap, overlay d'état quand la pose exacte n'est pas dessinée.
 * Réduire les animations : aucune boucle (respiration, marche), confirmations conservées.
 */
import type { PetPose, Species, Stage } from '@blowy/domain';
import {
  EFFECTS,
  PLACEHOLDER_META,
  framesFor,
  layoutAccessory,
  layoutSprite,
  resolveSprite,
  type AccessoryId,
  type EffectId,
  type StateOverlay,
} from '@blowy/sprites';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useA11yPrefs } from '../foundations/accessibility';
import { BREATH, breathAt, frameIndexAt } from '../foundations/motion';
import { color, radius, scrim } from '../foundations/theme';
import { Icon, type IconName } from '../atoms/Icon';
import { Sprite } from '../atoms/Sprite';

export type PetMotion = 'idle' | 'walk' | 'jump';

export interface PetRendererProps {
  species: Species;
  stage: Stage;
  pose: PetPose;
  /** Hauteur du corps d'un pet jeune en pose neutre (pt). */
  bodyHeight: number;
  accessories?: readonly AccessoryId[];
  effect?: EffectId | null;
  motion?: PetMotion;
  /** Regarde vers la gauche (partenaire). */
  flip?: boolean;
  /** Libellé VoiceOver complet (petAccessibilityLabel). */
  accessibilityLabel: string;
  accessibilityHint?: string;
  onTap?: () => void;
  /** Décalage de phase de respiration (deux pets non synchronisés). */
  phaseMs?: number;
  testID?: string;
  /** Initiale pour le placeholder déclaré. */
  initial?: string;
}

const OVERLAY_ICON: Record<StateOverlay, IconName> = {
  sick: 'warning',
  sleep: 'pause',
  hungry: 'star',
  sad: 'heart',
};

export function PetRenderer({
  species,
  stage,
  pose,
  bodyHeight,
  accessories = [],
  effect,
  motion = 'idle',
  flip,
  accessibilityLabel,
  accessibilityHint,
  onTap,
  phaseMs = 0,
  testID,
  initial,
}: PetRendererProps) {
  const { reduceMotion } = useA11yPrefs();
  const resolved = useMemo(() => resolveSprite(species, stage, pose), [species, stage, pose]);
  const meta = resolved.meta ?? PLACEHOLDER_META;
  const layout = useMemo(
    () => layoutSprite(meta, bodyHeight, resolved.stageScale, resolved.heightRatio),
    [meta, bodyHeight, resolved.stageScale, resolved.heightRatio],
  );

  const seq = motion === 'idle' ? null : framesFor(species, motion);
  const frames = seq && seq.source !== 'procedural' ? seq.frames : null;
  const [frame, setFrame] = useState(0);

  // Respiration (boucle) — coupée si Réduire les animations.
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion || motion !== 'idle') {
      cancelAnimation(t);
      t.value = 0;
      return;
    }
    t.value = (phaseMs % BREATH.periodMs) / BREATH.periodMs;
    t.value = withRepeat(
      withTiming(t.value + 1, { duration: BREATH.periodMs, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(t);
  }, [reduceMotion, motion, phaseMs, t]);

  // Frames de marche/saut au rythme du manifest (marche en boucle, saut joué une fois).
  useEffect(() => {
    if (!frames || reduceMotion || !seq) {
      setFrame(0);
      return;
    }
    const started = Date.now();
    const id = setInterval(
      () =>
        setFrame(frameIndexAt(Date.now() - started, seq.frameMs, frames.length, motion === 'walk')),
      seq.frameMs / 2,
    );
    return () => clearInterval(id);
  }, [frames, reduceMotion, seq, motion]);

  // Rebond procédural pour les espèces sans frames de marche ; saut au tap.
  const hop = useSharedValue(0);
  const tapScale = useSharedValue(1);
  useEffect(() => {
    if (reduceMotion || motion !== 'walk' || frames) {
      hop.value = 0;
      return;
    }
    hop.value = withRepeat(
      withSequence(withTiming(-8, { duration: 140 }), withTiming(0, { duration: 140 })),
      -1,
      false,
    );
    return () => cancelAnimation(hop);
  }, [reduceMotion, motion, frames, hop]);

  /** Amplitude 40 % : « respiration subtile ». */
  const body = useAnimatedStyle(() => {
    const b = breathAt(t.value, 0.4);
    return {
      transform: [
        { translateY: b.translateY + hop.value },
        { scaleX: b.scaleX * tapScale.value * (flip ? -1 : 1) },
        { scaleY: b.scaleY * tapScale.value },
      ],
    };
  });

  const handleTap = () => {
    // Confirmation tactile conservée même en mouvement réduit (un seul pop, sans boucle).
    tapScale.value = reduceMotion
      ? withSequence(withTiming(1.04, { duration: 80 }), withTiming(1, { duration: 80 }))
      : withSequence(
          withSpring(0.9, { damping: 6 }),
          withSpring(1.08, { damping: 5 }),
          withSpring(1),
        );
    onTap?.();
  };

  const framePath = frames ? ((frames[frame] ?? frames[0])?.path ?? resolved.path) : resolved.path;
  const accLayouts = accessories
    .map((id) => layoutAccessory(id, species, stage, resolved.resolvedPose, layout))
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // Boîte du composant : largeur = largeur image, hauteur = image ; origine (0,0) au sol, centre.
  const boxW = Math.max(layout.width, layout.body.width * 1.6);
  const boxH = -layout.top + 4;
  const ox = boxW / 2;
  const oy = boxH;

  return (
    <Pressable
      onPress={onTap ? handleTap : undefined}
      disabled={!onTap}
      accessible
      accessibilityRole={onTap ? 'button' : 'image'}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      testID={testID}
      style={{ width: boxW, height: boxH }}
    >
      <View
        style={[
          styles.shadow,
          { left: ox - layout.body.width * 0.35, top: oy - 8, width: layout.body.width * 0.7 },
        ]}
      />
      <Animated.View
        style={[
          styles.abs,
          { left: 0, top: 0, width: boxW, height: boxH, transformOrigin: `${ox}px ${oy}px 0px` },
          body,
        ]}
      >
        {accLayouts
          .filter((a) => a.behind)
          .map((a) => (
            <Sprite
              key={a.id}
              path={a.path}
              size={a.width}
              height={a.height}
              style={[styles.abs, { left: ox + a.left, top: oy + a.top }]}
            />
          ))}
        <Sprite
          path={framePath}
          size={layout.width}
          height={layout.height}
          style={[styles.abs, { left: ox + layout.left, top: oy + layout.top }]}
          placeholderInitial={initial}
        />
        {accLayouts
          .filter((a) => !a.behind)
          .map((a) => (
            <Sprite
              key={a.id}
              path={a.path}
              size={a.width}
              height={a.height}
              style={[
                styles.abs,
                { left: ox + a.left, top: oy + a.top, transform: [{ rotate: `${a.rotation}deg` }] },
              ]}
            />
          ))}
      </Animated.View>
      {resolved.overlay ? (
        <View
          style={[
            styles.overlay,
            { left: ox + layout.body.left + layout.body.width - 14, top: oy + layout.body.top },
          ]}
        >
          <Icon name={OVERLAY_ICON[resolved.overlay]} size={16} tint={color.white} />
        </View>
      ) : null}
      {effect ? (
        <EffectLayer
          effect={effect}
          cx={ox}
          top={oy + layout.body.top}
          size={layout.body.width}
          reduceMotion={reduceMotion}
        />
      ) : null}
    </Pressable>
  );
}

function EffectLayer({
  effect,
  cx,
  top,
  size,
  reduceMotion,
}: {
  effect: EffectId;
  cx: number;
  top: number;
  size: number;
  reduceMotion: boolean;
}) {
  const y = useSharedValue(0);
  const o = useSharedValue(1);
  useEffect(() => {
    if (reduceMotion) {
      o.value = 1;
      return;
    }
    y.value = withRepeat(
      withTiming(-60, { duration: 1600, easing: Easing.out(Easing.quad) }),
      effect === 'hearts' ? -1 : 1,
      false,
    );
    o.value = withRepeat(withTiming(0, { duration: 1600 }), effect === 'hearts' ? -1 : 1, false);
  }, [effect, reduceMotion, y, o]);
  const s = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }], opacity: o.value }));
  const w = effect === 'confetti' ? size * 2 : size * 0.6;
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.abs, { left: cx - w / 2, top: top - w * 0.4, width: w, height: w }, s]}
    >
      <Sprite path={EFFECTS[effect]} size={w} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  shadow: {
    position: 'absolute',
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: scrim.ground,
  },
  overlay: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: color.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
