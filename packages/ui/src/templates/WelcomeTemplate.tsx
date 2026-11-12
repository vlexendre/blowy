import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '../atoms/Avatar';
import { Button } from '../atoms/Button';
import { PetImage } from '../atoms/PetImage';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { MessageBubble } from '../molecules/MessageBubble';
import { InkProvider } from '../lib/ink';
import { hapticFor } from '../lib/haptics';
import { ease, springs, useReducedMotion } from '../lib/motion';
import { layout } from '../lib/styles';
import { Appear } from '../motion/Appear';
import { Burst } from '../motion/Burst';
import { Pulse } from '../motion/PopIn';
import { TypingDots } from '../motion/TypingDots';
import { alpha, color, gradient, motion, radius, shadow, size, space, veil } from '../theme';
import type { PetLook, TitleContent } from '../types';

export interface WelcomeTemplateProps {
  /** Marque (« blowy ») : le point jaune est ajouté. */
  brand: string;
  /** Puce à droite de la marque (« pas de swipe · pas de pub »). */
  tagline: string;
  title: TitleContent;
  /** Aperçu de conversation : le pet parle, la personne répond. */
  chat: readonly { from: 'pet' | 'me'; text: string }[];
  pet: PetLook;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel: string;
  onSecondary: () => void;
}

/** Hauteur du bas d'écran de la maquette : bouton (56) + 4 + lien (48), puis 32 jusqu'au panneau. */
const ACTIONS = size.button.lg + space.xs + 48;
/** Marge du panneau jaune autour de l'écran. */
const CLIP_TOP = space.xs + 2;
const PANEL_GAP = 32;
/** Positions de la maquette, mesurées depuis le bas du panneau jaune (V6-Welcome, panneau bas à 682). */
const CHAT_FROM_BOTTOM = [262, 188, 130] as const;
const CHAT_WIDTH = [230, 200, 236] as const;
const PET_FROM_BOTTOM = 326;
const PET_WIDTH = 380;

/**
 * Le chat s'écrit tout seul : pour chaque message, l'instant où il apparaît (ms depuis l'arrivée sur l'écran).
 * Un message du pet est précédé de « … » pendant `TYPING` ms. Après le dernier, le bouton respire une fois.
 */
const CHAT_AT = [1150, 2350, 3500] as const;
const TYPING = 750;
const PET_IN = 260;
/** Le pet entre en glissant depuis le bord droit du panneau (léger dépassement, pas de rebond). */
const SLIDE = { damping: 13, stiffness: 110, mass: 1 } as const;
/** Bas du buste (le reste de l'image est vide) : pivot des balancements, qui gardent la coupe hors du panneau. */
const BUST_BOTTOM = '50% 84%';

/** « … » dans une bulle de pet, à la place exacte du message qui arrive (même visage, même nom). */
function TypingBubble({ pet }: { pet: PetLook }) {
  return (
    <View style={styles.typingRow}>
      <Avatar size={30} pet={pet} hidden bg={color.accent} />
      <View>
        <Text variant="bodyHeavy" size={11} color={color.dark} style={styles.typingName}>
          {pet.name}
        </Text>
        <View style={styles.typingBubble}>
          <TypingDots size={6} />
        </View>
      </View>
    </View>
  );
}

/**
 * Écran d'accueil (V6-Welcome) : grand panneau jaune, promesse, aperçu de chat avec le pet, puis les deux actions.
 * Mouvement : le panneau se pose, le pet passe la tête par la droite et salue, puis le chat s'écrit message par
 * message (« … » avant ceux du pet) ; à la fin, le bouton respire une fois. Le pet se touche (cœurs) et s'attrape.
 * Rien n'attend : les boutons répondent tout de suite. Animations réduites : tout est là, en fondu.
 */
export function WelcomeTemplate({ brand, tagline, title, chat, pet, primaryLabel, onPrimary, secondaryLabel, onSecondary }: WelcomeTemplateProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const bottom = Math.max(insets.bottom, 22);
  const panelBottom = height - bottom - ACTIONS - PANEL_GAP;
  // Nombre de messages écrits, et message du pet en train de s'écrire (« … »).
  const [shown, setShown] = useState(reduced ? chat.length : 0);
  const [typing, setTyping] = useState<number | null>(null);
  const [hearts, setHearts] = useState(0);
  const enter = useSharedValue(reduced ? 0 : 1);
  const rot = useSharedValue(0);
  const sy = useSharedValue(1);
  const wave = () => {
    const w = (v: number) => withTiming(v, { duration: 230, easing: ease.inOut });
    rot.value = withSequence(w(-5), w(4), w(-3), w(2), withSpring(0, springs.soft));
  };
  // Touché : il s'écrase, rit, un cœur s'envole (il salue encore une fois sur deux).
  const touched = useRef(0);
  const touch = () => {
    hapticFor('press');
    setHearts((n) => n + 1);
    if (reduced) return;
    sy.value = withSequence(withTiming(0.93, { duration: motion.instant, easing: ease.out }), withSpring(1, springs.plush));
    touched.current += 1;
    if (touched.current % 2 === 0) wave();
  };
  useEffect(() => {
    if (reduced) {
      setShown(chat.length);
      setTyping(null);
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    // Le pet passe la tête par la droite, puis salue en se posant.
    enter.value = withDelay(PET_IN, withSpring(0, SLIDE));
    at(PET_IN + 520, wave);
    chat.forEach((m, i) => {
      const t = CHAT_AT[i] ?? 3500 + (i - CHAT_AT.length + 1) * 1100;
      if (m.from === 'pet') at(t - TYPING, () => setTyping(i));
      at(t, () => {
        setTyping((cur) => (cur === i ? null : cur));
        setShown(i + 1);
      });
    });
    return () => timers.forEach(clearTimeout);
    // Joué une fois, à l'arrivée sur l'écran.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);
  const peek = useAnimatedStyle(() => ({ transform: [{ translateX: enter.value * 240 }, { rotate: `${enter.value * 10 + rot.value}deg` }, { scaleY: sy.value }] }));
  const done = shown >= chat.length;
  return (
    <View style={styles.root}>
      <Appear from="none" scale={0.96} duration={320} style={[styles.panel, { height: panelBottom - space.xs - 2 }]}>
        <LinearGradient colors={gradient.accent} style={StyleSheet.absoluteFill} />
        <View style={[styles.disc, styles.discLight]} />
        <View style={[styles.disc, styles.discDark, { top: 300 - 44 + insets.top }]} />
      </Appear>

      <InkProvider value={color.dark}>
        <Appear from="above" distance={10} delay={80} style={[layout.rowBetween, styles.top, { paddingTop: insets.top + 10 }]}>
          <View style={styles.brand}>
            <Text variant="bodyHeavy" size={26} color={color.white} style={styles.brandText}>
              {brand}
              <Text variant="bodyHeavy" size={26} color={color.accent}>
                .
              </Text>
            </Text>
          </View>
          <View style={styles.tagline}>
            <Text variant="bodyHeavy" size={12} style={styles.taglineText}>
              {tagline}
            </Text>
          </View>
        </Appear>
        <Appear delay={160} distance={16} style={styles.title}>
          <Title text={title} size={58} />
        </Appear>
      </InkProvider>

      {/* Le pet est rogné par le panneau : il en sort comme d'une fenêtre, et la coupe du buste ne se voit jamais. */}
      <View pointerEvents="box-none" style={[styles.petClip, { height: panelBottom - space.xs - 2 }]}>
        <View pointerEvents="box-none" style={[styles.pet, { top: panelBottom - PET_FROM_BOTTOM - CLIP_TOP }]}>
          <Animated.View style={[styles.petPivot, peek]}>
            <Pressable onPress={touch} haptic={false} scaleTo={1} accessibilityRole="image" accessibilityLabel={pet.name}>
              <PetImage species={pet.species} mood="salut" size={PET_WIDTH} animation="breathe" style={shadow.lift} />
            </Pressable>
          </Animated.View>
          <Burst kind="hearts" trigger={hearts} seed={`welcome:${hearts % 3}`} count={hearts % 2 ? 3 : 4} spread={150} size={34} style={styles.hearts} />
        </View>
      </View>

      {chat.map((m, i) =>
        i < shown || typing === i ? (
          <View key={i} pointerEvents="none" style={[styles.chat, { top: panelBottom - (CHAT_FROM_BOTTOM[i] ?? 0), width: CHAT_WIDTH[i] }]}>
            {i < shown ? (
              <Appear key="msg" from={m.from === 'me' ? 'right' : 'below'} distance={m.from === 'me' ? 18 : 8} scale={0.92} duration={200}>
                <MessageBubble
                  message={{ author: m.from === 'pet' ? 'my_pet' : 'me', kind: 'text', body: m.text, mediaUrl: null }}
                  pet={m.from === 'pet' ? pet : undefined}
                  name={m.from === 'pet' ? pet.name : undefined}
                  nameColor={color.dark}
                  avatarBg={color.accent}
                />
              </Appear>
            ) : (
              <Appear key="typing" distance={6} scale={0.9} duration={160}>
                <TypingBubble pet={pet} />
              </Appear>
            )}
          </View>
        ) : null,
      )}

      <Appear delay={240} distance={14} style={[styles.actions, { bottom }]}>
        <Pulse active={done && !reduced} beats={1} scale={1.04} delay={350}>
          <Button label={primaryLabel} onPress={onPrimary} iconRight="arrow" />
        </Pulse>
        <Pressable onPress={onSecondary} accessibilityLabel={secondaryLabel} style={styles.secondary}>
          <Text variant="bodyBold" size={15} color={color.mute}>
            {secondaryLabel}
          </Text>
        </Pressable>
      </Appear>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.night },
  panel: { position: 'absolute', left: space.xs + 2, right: space.xs + 2, top: space.xs + 2, borderRadius: radius.xl + 4, overflow: 'hidden' },
  disc: { position: 'absolute', borderRadius: radius.pill },
  discLight: { width: 420, height: 420, right: -170, bottom: -150, backgroundColor: alpha(color.white, 0.28) },
  discDark: { width: 180, height: 180, left: -70, backgroundColor: alpha(color.dark, 0.06) },
  top: { paddingHorizontal: space.xl, zIndex: 2 },
  brand: { height: 42, paddingHorizontal: space.lg, borderRadius: radius.pill, backgroundColor: color.dark, justifyContent: 'center' },
  brandText: { lineHeight: 30, letterSpacing: -1.04 },
  tagline: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: alpha(color.dark, 0.1) },
  taglineText: { lineHeight: 16 },
  title: { marginTop: 22, marginHorizontal: space.xl, zIndex: 2 },
  petClip: { position: 'absolute', left: CLIP_TOP, right: CLIP_TOP, top: CLIP_TOP, borderRadius: radius.xl + 4, overflow: 'hidden', zIndex: 2 },
  pet: { position: 'absolute', right: -92 + CLIP_TOP, transform: [{ rotate: '-6deg' }] },
  petPivot: { transformOrigin: BUST_BOTTOM },
  hearts: { position: 'absolute', left: 150, top: 90 },
  typingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  typingName: { marginBottom: 3, marginLeft: space.xs },
  typingBubble: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 20, borderBottomLeftRadius: 6, backgroundColor: color.card, borderWidth: 1, borderColor: veil.glass },
  chat: { position: 'absolute', left: space.lg, zIndex: 3 },
  actions: { position: 'absolute', left: 18, right: 18, gap: space.xs, zIndex: 4 },
  secondary: { height: 48, alignItems: 'center', justifyContent: 'center' },
});
