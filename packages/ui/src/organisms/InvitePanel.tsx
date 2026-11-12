import { type ReactNode, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { Button } from '../atoms/Button';
import { Panel } from '../atoms/Panel';
import { PetImage } from '../atoms/PetImage';
import { Skeleton } from '../atoms/Skeleton';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { ease, springs, useReducedMotion } from '../lib/motion';
import { layout } from '../lib/styles';
import { Appear } from '../motion/Appear';
import { DrawnCheck } from '../motion/DrawnCheck';
import { color, gradient, radius, space } from '../theme';
import type { PetLook, TitleContent } from '../types';

export interface InvitePanelProps {
  title: TitleContent;
  text: string;
  pet?: PetLook;
  /** Lien affiché sans protocole (« blowy.app/i/CODE ») ; la fin est mise en couleur. Absent : chargement. */
  url?: string;
  copyLabel: string;
  /** Juste après la copie : libellé (« copié ») et coche qui se dessine à la place du pictogramme. */
  copied?: boolean;
  copiedLabel?: string;
  onCopy: () => void;
  shareLabel: string;
  onShare: () => void;
}

/**
 * Panneau violet d'invitation (V6-Invite) : promesse, pet qui salue, lien à copier et bouton de partage.
 * Le pet entre par la droite et fait coucou ; copier le lien dessine une coche. Animations réduites : fondus.
 */
export function InvitePanel({ title, text, pet, url, copyLabel, copied, copiedLabel, onCopy, shareLabel, onShare }: InvitePanelProps) {
  const cut = url ? url.lastIndexOf('/') + 1 : 0;
  return (
    <Panel gradient="violet" radius={32} padding="none" style={styles.panel}>
      {pet ? (
        <View pointerEvents="none" style={styles.pet}>
          <WavingIn>
            <PetImage species={pet.species} mood="salut" size={180} rotate={8} animation="bob" outline accessibilityLabel={pet.name} />
          </WavingIn>
        </View>
      ) : null}
      <Title text={title} size={58} />
      <Text variant="bodyBold" size={15} style={styles.text}>
        {text}
      </Text>
      {url ? (
        <Appear key="link" distance={8} duration={200}>
          <View style={[layout.row, styles.link]}>
            <Text variant="bodyHeavy" size={17} color={color.dark} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={layout.grow}>
              {url.slice(0, cut)}
              <Text variant="bodyHeavy" size={17} color={gradient.violet[0]}>
                {url.slice(cut)}
              </Text>
            </Text>
            <Button
              label={copied && copiedLabel ? copiedLabel : copyLabel}
              icon={copied ? <DrawnCheck key="check" size={14} haptic="success" /> : 'copy'}
              variant="dark"
              size="sm"
              onPress={onCopy}
              style={styles.copy}
            />
          </View>
          <Button label={shareLabel} variant="dark" onPress={onShare} style={styles.share} />
        </Appear>
      ) : (
        <>
          <Skeleton height={56} radius="pill" style={styles.linkGap} />
          <Skeleton height={56} radius="pill" style={styles.share} />
        </>
      )}
    </Panel>
  );
}

/** Entre par la droite en rebondissant, puis fait coucou (balancement). */
function WavingIn({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const x = useSharedValue(reduced ? 0 : 1);
  const rot = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    x.value = withDelay(220, withSpring(0, springs.plush));
    const w = (v: number) => withTiming(v, { duration: 220, easing: ease.inOut });
    rot.value = withDelay(760, withSequence(w(-8), w(7), w(-5), w(3), withSpring(0, springs.plush)));
  }, [reduced, x, rot]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * 200 }, { rotate: `${x.value * 20 + rot.value}deg` }] }));
  return <Animated.View style={[styles.feet, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  feet: { transformOrigin: '50% 90%' },
  panel: { paddingTop: 22, paddingHorizontal: 20, paddingBottom: 20 },
  pet: { position: 'absolute', right: -44, top: 96 },
  text: { marginTop: 10, maxWidth: 200, lineHeight: 20 },
  link: { marginTop: space.lg, height: 56, gap: space.sm, paddingLeft: space.lg, paddingRight: 6, borderRadius: radius.pill, backgroundColor: color.white },
  linkGap: { marginTop: space.lg },
  copy: { height: 44 },
  share: { marginTop: 10 },
});
