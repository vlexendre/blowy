import type { Outfit, Species } from '@blowy/domain';
import { type ReactNode, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';

import { Card } from '../atoms/Card';
import { Chip } from '../atoms/Chip';
import { Panel } from '../atoms/Panel';
import { hasOutfit } from '../assets/fit';
import { DressedPet } from '../atoms/DressedPet';
import { PetImage } from '../atoms/PetImage';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { fadeTo, springs, useReducedMotion } from '../lib/motion';
import { Appear } from '../motion/Appear';
import { PopIn } from '../motion/PopIn';
import { type GradientName, motion, speciesGradient } from '../theme';
import type { TitleContent } from '../types';

export interface InvitationPanelProps {
  /** Puce sombre au-dessus du titre (« invitation »). */
  kicker: string;
  /** « LÉA VEUT / TE PRÉSENTER SUZIE. » */
  title: TitleContent;
  /** Pet de la personne qui invite (à gauche). */
  theirs: Species;
  /** Ton pet (à droite), s'il est connu. */
  mine?: Species;
  /** Tenues portées (`PublicPet.outfit`, `Pet.outfit`) : le pet est montré habillé. */
  theirsOutfit?: Outfit | null;
  mineOutfit?: Outfit | null;
  gradient?: GradientName;
  /** Encadré sous le panneau : texte avec un passage en gras (« 7 vies »). */
  note?: { before: string; bold?: string; after?: string };
  accessibilityLabel?: string;
}

function InvitePet({ species, outfit, delay }: { species: Species; outfit?: Outfit | null; delay?: number }) {
  if (hasOutfit(outfit)) return <DressedPet species={species} outfit={outfit} size={176} animated delay={delay} />;
  return <PetImage species={species} mood="debout" size={190} animation="breathe" delay={delay} />;
}

/**
 * Un pet de l'invitation arrive par son côté en deux bonds (ressort de peluche) ; avec un seul pet, il tombe du
 * haut. Fondu si animations réduites.
 */
function Hop({ side, delay, children }: { side: -1 | 0 | 1; delay: number; children: ReactNode }) {
  const reduced = useReducedMotion();
  const p = useSharedValue(0);
  const o = useSharedValue(0);
  useEffect(() => {
    if (reduced) {
      p.value = 1;
      o.value = withDelay(Math.min(delay, motion.fast), fadeTo(1, motion.fast));
      return;
    }
    o.value = withDelay(delay, withTiming(1, { duration: motion.fast }));
    p.value = withDelay(delay, withSpring(1, springs.plush));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => {
    const k = 1 - p.value;
    const arc = Math.abs(Math.sin(Math.max(0, k) * Math.PI * 2)) * 30;
    return { opacity: o.value, transform: [{ translateX: side * 110 * k }, { translateY: side === 0 ? -60 * k : -arc }, { rotate: `${side * 8 * k}deg` }] };
  });
  return <Animated.View style={[styles.hop, style]}>{children}</Animated.View>;
}

/** Invitation reçue : les deux pets côte à côte sur le panneau de l'espèce qui invite, puis ce que ça ouvre. */
export function InvitationPanel({ kicker, title, theirs, mine, theirsOutfit, mineOutfit, gradient, note, accessibilityLabel }: InvitationPanelProps) {
  return (
    <View style={styles.wrap}>
      <Panel gradient={gradient ?? speciesGradient[theirs]} radius={32} padding="none" style={styles.panel}>
        <View style={styles.stage} accessible={!!accessibilityLabel} accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
          <View style={[styles.pet, mine ? styles.left : styles.solo]}>
            <Hop side={mine ? -1 : 0} delay={120}>
              <InvitePet species={theirs} outfit={theirsOutfit} />
            </Hop>
          </View>
          {mine ? (
            <View style={[styles.pet, styles.right]}>
              <Hop side={1} delay={300}>
                <InvitePet species={mine} outfit={mineOutfit} delay={600} />
              </Hop>
            </View>
          ) : null}
        </View>
        <PopIn delay={520} style={styles.kicker}>
          <Chip label={kicker} tone="dark" style={styles.kickerChip} />
        </PopIn>
        <Appear delay={560}>
          <Title text={title} size={50} center />
        </Appear>
      </Panel>
      {note ? (
        <Appear delay={680}>
        <Card padding="none" style={styles.note}>
          <Text size={14} style={styles.noteText}>
            {note.before}
            {note.bold ? (
              <Text variant="bodyBold" size={14} style={styles.noteText}>
                {note.bold}
              </Text>
            ) : null}
            {note.after}
          </Text>
        </Card>
        </Appear>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, gap: 12 },
  panel: { flexGrow: 1, alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 22 },
  stage: { height: 250, alignSelf: 'stretch', marginHorizontal: -20 },
  pet: { position: 'absolute', bottom: 0 },
  left: { left: 14 },
  right: { right: 14 },
  solo: { alignSelf: 'center', left: 0, right: 0, alignItems: 'center' },
  kicker: { alignSelf: 'center', marginBottom: 8 },
  kickerChip: { height: 26, paddingHorizontal: 11 },
  hop: { transformOrigin: '50% 100%' },
  note: { padding: 14, borderRadius: 24 },
  noteText: { lineHeight: 19 },
});
