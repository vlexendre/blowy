import { type ReactNode, useEffect, useState } from 'react';
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
  /** Lien affiché sans protocole (« minimoa.app/i/CODE ») ; la fin est mise en couleur. Absent : chargement. */
  url?: string;
  copyLabel: string;
  /** Juste après la copie : libellé (« copié ») et coche qui se dessine à la place du pictogramme. */
  copied?: boolean;
  copiedLabel?: string;
  onCopy: () => void;
  shareLabel: string;
  onShare: () => void;
  /** L'image de la story se prépare : le bouton montre son chargement. */
  sharing?: boolean;
}

/**
 * Panneau violet d'invitation (V6-Invite) : promesse, pet qui salue, lien à copier et bouton de partage.
 * Le pet entre par la droite et fait coucou ; copier le lien dessine une coche. Animations réduites : fondus.
 * Mise en page : le minimoa est à côté du texte, au-dessus de la pilule (jamais dessous) ; « Copier » est centré dans
 * la pilule avec la même marge en haut, en bas et à droite ; une adresse trop longue rapetisse (12 pt au moins) puis se coupe au milieu.
 */
export function InvitePanel({ title, text, pet, url, copyLabel, copied, copiedLabel, onCopy, shareLabel, onShare, sharing }: InvitePanelProps) {
  const cut = url ? url.lastIndexOf('/') + 1 : 0;
  // Taille du lien d'après la place laissée par « Copier » / « Copié » (toutes langues) : l'adresse entière reste
  // lisible, code compris ; sous 12 pt, elle se coupe au milieu.
  const [room, setRoom] = useState(0);
  const urlSize = url && room ? Math.max(URL_MIN_SIZE, Math.min(URL_SIZE, Math.floor(room / (url.length * URL_EM)))) : URL_SIZE;
  return (
    <Panel gradient="violet" radius={32} padding="none" style={styles.panel}>
      <Title text={title} size={58} />
      {/* Le texte et le minimoa côte à côte, au-dessus du lien : le minimoa ne passe jamais sous l'adresse ni sous les boutons. */}
      <View style={[layout.row, styles.intro]}>
        <Text variant="bodyBold" size={15} style={[layout.grow, styles.text]}>
          {text}
        </Text>
        {pet ? (
          <View pointerEvents="none" style={styles.pet}>
            <WavingIn>
              <PetImage species={pet.species} mood="salut" size={PET_SIZE} rotate={8} animation="bob" outline accessibilityLabel={pet.name} />
            </WavingIn>
          </View>
        ) : null}
      </View>
      {url ? (
        <Appear key="link" distance={8} duration={200}>
          <View style={[layout.row, styles.link]}>
            <View style={layout.grow} onLayout={(e) => setRoom(e.nativeEvent.layout.width)}>
              <Text variant="bodyHeavy" size={urlSize} color={color.dark} numberOfLines={1} ellipsizeMode="middle" adjustsFontSizeToFit minimumFontScale={0.8}>
                {url.slice(0, cut)}
                <Text variant="bodyHeavy" size={urlSize} color={gradient.violet[0]}>
                  {url.slice(cut)}
                </Text>
              </Text>
            </View>
            <Button
              label={copied && copiedLabel ? copiedLabel : copyLabel}
              icon={copied ? <DrawnCheck key="check" size={14} haptic="success" /> : 'copy'}
              variant="dark"
              size="sm"
              onPress={onCopy}
              style={styles.copy}
            />
          </View>
          <Button label={shareLabel} variant="dark" onPress={onShare} loading={sharing} style={styles.share} />
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

/** Hauteur de la pilule du lien et marge (égale en haut, en bas et à droite) autour du bouton « Copier ». */
const LINK_HEIGHT = 56;
const LINK_INSET = 6;
const PET_SIZE = 108;
/** Lien : 17 pt au mieux, 12 au moins ; largeur moyenne d'un caractère (police grasse) en em, un peu large par prudence. */
const URL_SIZE = 17;
const URL_MIN_SIZE = 12;
const URL_EM = 0.64;

const styles = StyleSheet.create({
  feet: { transformOrigin: '50% 90%' },
  panel: { paddingTop: 22, paddingHorizontal: 20, paddingBottom: 20 },
  intro: { marginTop: 2, gap: space.sm },
  text: { maxWidth: 220, lineHeight: 20 },
  // Le minimoa déborde un peu à droite (dans la marge du panneau), jamais sur la pilule.
  pet: { width: PET_SIZE, height: PET_SIZE, marginRight: -10 },
  link: {
    marginTop: space.md,
    height: LINK_HEIGHT,
    gap: space.md,
    paddingLeft: space.lg,
    paddingRight: LINK_INSET,
    borderRadius: radius.pill,
    backgroundColor: color.white,
  },
  linkGap: { marginTop: space.md },
  // Centré dans la pilule, même marge en haut, en bas et à droite ; jamais rétréci par une adresse longue.
  copy: { height: LINK_HEIGHT - 2 * LINK_INSET, alignSelf: 'center', flexShrink: 0 },
  share: { marginTop: 10 },
});
