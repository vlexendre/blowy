import type { Outfit, Species } from '@blowy/domain';
import { type ReactNode, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PetBadge } from '../atoms/PetBadge';
import { Glyph } from '../atoms/Glyph';
import { IconButton } from '../atoms/IconButton';
import { Loader } from '../atoms/Loader';
import { Panel } from '../atoms/Panel';
import { Sticker } from '../atoms/Sticker';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { hapticFor } from '../lib/haptics';
import { fadeTo, springs, useReducedMotion } from '../lib/motion';
import { layout } from '../lib/styles';
import { SpeechBubble } from '../molecules/SpeechBubble';
import { TipRow } from '../molecules/TipRow';
import { Burst } from '../motion/Burst';
import { PetActor, type PetActorHandle } from '../motion/pets/PetActor';
import { alpha, color, motion, radius, space } from '../theme';

export type ProofTone = 'yes' | 'unsure' | 'no';

export interface ProofVerdictLook {
  tone: ProofTone;
  /** « VALIDÉ ! », « ÇA COMPTE. », « PAS CETTE FOIS. » */
  title: string;
  /** Puce à côté du titre (« +1 jour · série 10 »). */
  badge?: string | null;
  /** Phrase gentille du minimoa (servie par l'API). */
  text: string;
}

export interface ProofStageProps {
  pet: { species: Species; outfit?: Outfit | null; name: string; id?: string };
  /** Puce inclinée en haut (« Marcher »). */
  chip?: string;
  /** Ce que demande le minimoa (« Montre-moi tes baskets. »), et le mot mis en couleur. */
  ask: string;
  askHighlight?: string;
  /** Le viseur (caméra en direct) ou la photo prise ; il remplit le cadre. */
  viewfinder: ReactNode;
  /** Envoi et vérification en cours : voile et trois boules sur le cadre. */
  busy?: boolean;
  busyLabel?: string;
  verdict?: ProofVerdictLook | null;
  /** Ligne de confidentialité (cadenas) sous le cadre. */
  privacy: string;
  /** Boutons du bas (déclencheur, continuer, garder). */
  footer?: ReactNode;
  onClose: () => void;
  closeLabel: string;
}

/**
 * La preuve en photo (V6-GPreuve) : le minimoa demande dans sa bulle, le viseur dans un cadre à coins, puis le verdict
 * monte sur le bas de la photo avec le minimoa qui réagit (joie, ou petit « non » gentil). Prise dans l'app seulement.
 */
export function ProofStage({ pet, chip, ask, askHighlight, viewfinder, busy = false, busyLabel, verdict, privacy, footer, onClose, closeLabel }: ProofStageProps) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const actor = useRef<PetActorHandle>(null);
  const up = useSharedValue(0);
  const tone = verdict?.tone ?? null;

  useEffect(() => {
    if (!tone) {
      up.value = 0;
      return;
    }
    up.value = reduced ? fadeTo(1, motion.base) : withSpring(1, springs.pop);
    hapticFor(tone === 'no' ? 'error' : 'celebrate');
    const t = setTimeout(() => actor.current?.react(tone === 'no' ? 'no' : 'joy'), 160);
    return () => clearTimeout(t);
  }, [tone, reduced, up]);

  const card = useAnimatedStyle(() => ({ opacity: Math.min(1, up.value * 1.5), transform: [{ translateY: reduced ? 0 : (1 - up.value) * 80 }] }));
  const sticker = useAnimatedStyle(() => ({ opacity: up.value, transform: [{ scale: reduced ? 1 : 0.4 + 0.6 * up.value }, { rotate: `${(1 - up.value) * 20}deg` }] }));

  return (
    <View style={[styles.root, { paddingTop: insets.top + 6, paddingBottom: Math.max(insets.bottom, 14) }]}>
      <View style={[layout.rowBetween, styles.top]}>
        <IconButton label={closeLabel} glyph="close" variant="glass" onPress={onClose} />
        {chip ? <Sticker label={chip} tone="white" font="body" rotate={-3} /> : null}
        <View style={styles.spacer} />
      </View>
      <View style={[layout.row, styles.host]}>
        <PetBadge species={pet.species} outfit={pet.outfit} size={52} accessibilityLabel={pet.name} />
        <SpeechBubble text={ask} highlight={askHighlight} highlightColor={color.accent} tone="dark" tail="left" size="lg" typing style={layout.shrink} />
      </View>
      <View style={styles.frame}>
        <View style={StyleSheet.absoluteFill}>{viewfinder}</View>
        <Corner style={styles.tl} />
        <Corner style={[styles.tr, { transform: [{ scaleX: -1 }] }]} />
        {busy ? (
          <View style={[StyleSheet.absoluteFill, styles.busy]} accessible accessibilityLabel={busyLabel} accessibilityState={{ busy: true }}>
            <Loader color="accent" size={10} />
            {busyLabel ? (
              <Text variant="bodyHeavy" size={15}>
                {busyLabel}
              </Text>
            ) : null}
          </View>
        ) : null}
        {verdict ? (
          <>
            <Animated.View style={[styles.sticker, sticker]} pointerEvents="none">
              <PetActor ref={actor} species={pet.species} outfit={pet.outfit} size={120} seed={pet.id ?? pet.name} shadow={false} sleepAfter={null} touch={false} accessibilityLabel={pet.name} />
            </Animated.View>
            <Animated.View style={[styles.verdict, card]} accessibilityLiveRegion="polite">
              <Panel gradient={verdict.tone === 'no' ? 'rose' : 'accent'} radius={22} padding="md" style={styles.verdictPanel}>
                <View style={[layout.row, styles.verdictHead]}>
                  <Title text={verdict.title} size={34} />
                  {verdict.badge ? <Sticker label={verdict.badge} tone="dark" font="body" size="sm" rotate={-4} /> : null}
                </View>
                <Text variant="bodyBold" size={15}>
                  {verdict.text}
                </Text>
              </Panel>
              {verdict.tone !== 'no' ? <Burst kind="stars" trigger={1} count={7} size={14} spread={150} seed="proof" style={styles.burst} /> : null}
            </Animated.View>
          </>
        ) : null}
      </View>
      <TipRow icon={<Glyph name="lock" size={16} color={color.mute} />} discSize={0} text={privacy} style={styles.privacy} />
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

function Corner({ style }: { style: object }) {
  return <View pointerEvents="none" style={[styles.corner, style]} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.night, paddingHorizontal: space.lg + 4, gap: space.md },
  top: { minHeight: 44 },
  spacer: { width: 44 },
  host: { gap: space.md },
  // Cadre de la photo : V6-GPreuve, rayon 28, coins blancs.
  frame: { flex: 1, minHeight: 220, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: color.panel },
  corner: { position: 'absolute', width: 34, height: 34, borderColor: color.white, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
  tl: { top: 22, left: 22 },
  tr: { top: 22, right: 22 },
  busy: { alignItems: 'center', justifyContent: 'center', gap: space.md, backgroundColor: alpha(color.night, 0.55) },
  sticker: { position: 'absolute', right: 6, bottom: 96 },
  verdict: { position: 'absolute', left: 12, right: 12, bottom: 12 },
  verdictPanel: { gap: space.xs },
  verdictHead: { gap: space.sm, flexWrap: 'wrap' },
  burst: { position: 'absolute', left: '30%', top: 10 },
  privacy: { paddingHorizontal: space.xs },
  footer: { gap: space.sm },
});
