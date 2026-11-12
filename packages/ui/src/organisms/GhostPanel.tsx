import { MAX_LIVES } from '@blowy/domain';
import type { Species } from '@blowy/domain';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '../atoms/Avatar';
import { Button } from '../atoms/Button';
import { Chip } from '../atoms/Chip';
import { IconButton } from '../atoms/IconButton';
import { PetImage } from '../atoms/PetImage';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { Banner } from '../molecules/Banner';
import { Hearts } from '../molecules/Hearts';
import { InkProvider } from '../lib/ink';
import { ease, fadeTo, springs, useLoop, useReducedMotion } from '../lib/motion';
import { Appear } from '../motion/Appear';
import { Shake, type ShakeHandle } from '../motion/PopIn';
import { useFirstTime } from '../motion/once';
import { layout } from '../lib/styles';
import { color, extra, motion, space, veil } from '../theme';
import type { PetLook, TitleContent } from '../types';

export interface GhostPanelProps {
  /** Ton pet, en version fantôme. */
  pet: PetLook;
  /** « TU L'AS / GHOSTÉ. » */
  title: TitleContent;
  text?: string;
  /** Ce que dit ton pet, et le nom au-dessus (« nino, version fantôme »). */
  speech?: string;
  speakerLabel?: string;
  /** Le lien peut encore être ranimé (une seule fois). */
  canRevive: boolean;
  reviveLabel: string;
  /** Complément estompé (« (une seule fois) »). */
  reviveHint?: string;
  /** Affiché quand le lien a déjà été ranimé (« déjà ranimé une fois »). */
  alreadyRevivedLabel: string;
  leaveLabel?: string;
  onRevive?: () => void;
  onLeave?: () => void;
  reviving?: boolean;
  leaving?: boolean;
  /** Erreur de la dernière action (ranimer, partir). */
  error?: string | null;
  /** Retour aux chats (en-tête de l'écran). */
  onBack?: () => void;
  backLabel?: string;
  /** Puce de l'en-tête (« Tom · lien fantôme »). */
  badge?: string;
  /** Libellé lu des cœurs (« 0 vie sur 7 »). */
  livesLabel?: string;
  /**
   * Clé du lien : à la première visite, ton pet perd ses couleurs sous tes yeux (il devient transparent et
   * s'envole un peu) ; ensuite il flotte, déjà fantôme.
   */
  revealKey?: string;
}

/**
 * Lien fantôme en plein écran (V6-Fantome) : fond lie-de-vin, grand titre, ton pet transparent qui parle,
 * ranimer (une fois) ou laisser partir.
 */
export function GhostPanel({
  pet,
  title,
  text,
  speech,
  speakerLabel,
  canRevive,
  reviveLabel,
  reviveHint,
  alreadyRevivedLabel,
  leaveLabel,
  onRevive,
  onLeave,
  reviving,
  leaving,
  error,
  onBack,
  backLabel = 'Retour',
  badge,
  livesLabel,
  revealKey,
}: GhostPanelProps) {
  const insets = useSafeAreaInsets();
  const first = useFirstTime(revealKey ? `ghost:${revealKey}` : undefined);
  const fading = !!revealKey && first;
  // Le texte arrive une fois le pet devenu fantôme (vedette d'abord).
  const after = fading ? 900 : 0;
  // Chaque nouvelle erreur secoue le bandeau (et vibre).
  const failures = useFailures(error);
  const shake = useRef<ShakeHandle>(null);
  useEffect(() => {
    if (failures) shake.current?.shake();
  }, [failures]);
  return (
    <View style={[styles.root, { paddingTop: insets.top + 6, paddingBottom: Math.max(insets.bottom, 26) }]}>
      <LinearGradient colors={extra.ghost} style={StyleSheet.absoluteFill} />
      <InkProvider value={color.white}>
        <View style={[layout.row, styles.head]}>
          {onBack ? <IconButton glyph="back" label={backLabel} onPress={onBack} size={40} style={styles.back} /> : null}
          {badge ? <Chip label={badge} tone="glass" /> : null}
          <Hearts lives={0} max={MAX_LIVES} ghost size={14} accessibilityLabel={livesLabel} style={styles.hearts} />
        </View>
        <Appear delay={60}>
          <Title text={title} size={76} style={styles.title} />
        </Appear>
        {text ? (
          <Appear delay={120}>
            <Text variant="bodyBold" size={16} style={styles.text}>
              {text}
            </Text>
          </Appear>
        ) : null}
        <View style={styles.stage}>
          <GhostPet species={pet.species} fading={fading} reviving={!!reviving} />
          {speech ? (
            <Appear delay={after + 120} from="left" style={[layout.row, styles.speech]}>
              <View style={styles.avatar}>
                <Avatar size={30} pet={pet} hidden pose="fantome" bg={extra.ghostDisc} />
              </View>
              <View style={layout.shrink}>
                {speakerLabel ? (
                  <Text variant="bodyHeavy" size={11} color={extra.ghostInk} style={styles.who}>
                    {speakerLabel}
                  </Text>
                ) : null}
                <View style={styles.bubble}>
                  <Text variant="body" size={14} style={styles.bubbleText}>
                    {speech}
                  </Text>
                </View>
              </View>
            </Appear>
          ) : null}
        </View>
        <Appear delay={after + 220} style={styles.actions}>
          {error ? (
            <Shake ref={shake}>
              <Banner tone="error" text={error} />
            </Shake>
          ) : null}
          {canRevive ? (
            <Button label={reviveLabel} hint={reviveHint} variant="white" onPress={onRevive} loading={reviving} />
          ) : (
            <Chip label={alreadyRevivedLabel} tone="glass" size="lg" style={styles.done} />
          )}
          {leaveLabel && onLeave ? <Button label={leaveLabel} variant="ghost" onPress={onLeave} loading={leaving} /> : null}
        </Appear>
      </InkProvider>
    </View>
  );
}

function useFailures(error: string | null | undefined): number {
  const count = useRef(0);
  const last = useRef(error);
  if (error && error !== last.current) count.current += 1;
  last.current = error;
  return count.current;
}

const GHOST = 290;

/**
 * Ton pet en fantôme. Vedette (première visite) : il est triste et en couleurs, puis ses couleurs s'en vont (fondu
 * vers le rendu fantôme, transparent) pendant qu'il décolle. Ensuite il flotte en se balançant, sa transparence
 * respire. Pendant « ranimer », il reprend ses couleurs et sourit ; si ça échoue, il redevient fantôme.
 * Animations réduites : fondus seuls, pas de flottement.
 */
function GhostPet({ species, fading, reviving }: { species: Species; fading: boolean; reviving: boolean }) {
  const reduced = useReducedMotion();
  const solid = useSharedValue(fading ? 1 : 0);
  const lift = useSharedValue(fading ? 0 : 1);
  const alive = useSharedValue(0);
  const hop = useSharedValue(0);
  const t = useLoop(2200);
  useEffect(() => {
    if (!fading) return;
    if (reduced) {
      lift.value = 1;
      solid.value = withDelay(motion.base, fadeTo(0, motion.slow));
      return;
    }
    solid.value = withDelay(motion.base, withTiming(0, { duration: 900, easing: ease.inOut }));
    lift.value = withDelay(motion.base + 150, withSpring(1, springs.soft));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (reduced) {
      alive.value = fadeTo(reviving ? 1 : 0, motion.base);
      return;
    }
    alive.value = withTiming(reviving ? 1 : 0, { duration: reviving ? motion.slow : motion.scene, easing: ease.inOut });
    if (reviving) hop.value = withSequence(withTiming(1, { duration: 180, easing: ease.out }), withSpring(0, springs.plush));
  }, [reviving, reduced, alive, hop]);
  const float = useAnimatedStyle(() => {
    const air = lift.value * (1 - alive.value);
    return {
      transform: [
        { translateY: -air * (3 + 9 * t.value) - hop.value * 26 },
        { rotate: `${air * (t.value - 0.5) * 5}deg` },
        { scale: 1 + 0.03 * hop.value },
      ],
    };
  });
  const sad = useAnimatedStyle(() => ({ opacity: solid.value * (1 - alive.value) }));
  const ghost = useAnimatedStyle(() => ({ opacity: (1 - solid.value) * (1 - alive.value) * (0.74 + 0.18 * (1 - t.value)) }));
  const happy = useAnimatedStyle(() => ({ opacity: alive.value }));
  return (
    <Animated.View pointerEvents="none" style={[styles.ghost, float]}>
      <Animated.View style={[StyleSheet.absoluteFill, sad]}>
        <PetImage species={species} mood="triste" size={GHOST} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, ghost]}>
        <PetImage species={species} mood="fantome" size={GHOST} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, happy]}>
        <PetImage species={species} mood="joie" size={GHOST} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 640, paddingHorizontal: 18 },
  head: { gap: 10 },
  back: { backgroundColor: veil.track },
  hearts: { marginLeft: 'auto' },
  title: { marginTop: 22 },
  text: { marginTop: 10, maxWidth: 300 },
  // Scène de 270 : le fantôme (290, 18 sous le haut) et sa bulle en haut à gauche.
  stage: { height: 270, marginTop: 2, alignItems: 'center' },
  // Le rendu du fantôme a plus de marge haute que celui de la maquette : on le remonte pour caler le pelage.
  ghost: { marginTop: -24, width: GHOST, height: Math.round(GHOST / 0.9) },
  speech: { position: 'absolute', left: 0, top: 4, maxWidth: 210, gap: space.sm, alignItems: 'flex-end' },
  avatar: { alignSelf: 'flex-end' },
  who: { marginLeft: space.xs, marginBottom: 3 },
  bubble: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: veil.glass,
  },
  bubbleText: { lineHeight: 18 },
  actions: { marginTop: 'auto', gap: 10 },
  done: { alignSelf: 'stretch', justifyContent: 'center' },
});
