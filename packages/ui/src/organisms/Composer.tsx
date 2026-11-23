import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { IconButton } from '../atoms/IconButton';
import { Text } from '../atoms/Text';
import { ease, fadeTo, springs, useReducedMotion } from '../lib/motion';
import { layout } from '../lib/styles';
import { color, motion, radius, size, space, type, veil } from '../theme';
import { useUiStrings } from '../lib/strings';

export interface ComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholder: string;
  /** Lien rangé : pas de saisie, `disabledText` à la place. */
  disabled?: boolean;
  disabledText?: string;
  /** Envoi en cours, non optimiste : le bouton attend. Le chat envoie de façon optimiste et ne s'en sert plus. */
  sending?: boolean;
  /** Bouton « + » (photo, défi, quiz). */
  onAttach?: () => void;
  attachLabel?: string;
  sendLabel?: string;
  maxLength?: number;
  /** Ouvre le clavier à l'apparition (chat ouvert juste après « Le réveiller » : « il se réveille au premier mot »). */
  autoFocus?: boolean;
}

/** Avion en papier de la maquette (19 pt). */
const SEND = (
  <Svg width={19} height={19} viewBox="0 0 24 24">
    <Path d="M4 12l16-8-6 16-2-7z" fill={color.dark} />
  </Svg>
);

/** Barre de saisie du chat : +, champ pilule, envoyer (plus de suggestions ni de bascules au-dessus du champ). */
export function Composer({
  value,
  onChangeText,
  onSend,
  placeholder,
  disabled,
  disabledText,
  sending,
  onAttach,
  attachLabel,
  sendLabel,
  maxLength = 2000,
  autoFocus,
}: ComposerProps) {
  const uiStrings = useUiStrings();
  // Envoi optimiste : l'avion s'envole à chaque envoi, sans attendre le serveur (le champ reste libre).
  const [launch, setLaunch] = useState(0);
  if (disabled) {
    return (
      <View style={[styles.wrap, styles.disabled]} accessibilityRole="text">
        <Text variant="bodyBold" size={14} muted center>
          {disabledText ?? ''}
        </Text>
      </View>
    );
  }
  const canSend = value.trim().length > 0 && !sending;
  const send = () => {
    setLaunch((n) => n + 1);
    onSend();
  };
  return (
    <View style={styles.wrap}>
      <View style={[layout.row, layout.gapSm]}>
        {onAttach ? <IconButton glyph="plus" label={attachLabel ?? uiStrings.add} onPress={onAttach} /> : null}
        <View style={[layout.row, styles.field]}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={color.mute}
            selectionColor={color.accent}
            accessibilityLabel={placeholder}
            maxLength={maxLength}
            autoFocus={autoFocus}
            multiline
            numberOfLines={Platform.OS === 'web' ? 1 : undefined}
            style={[type.body, styles.input]}
          />
        </View>
        {/* Maquette : bouton jaune plein même champ vide ; l'envoi d'un champ vide est ignoré. */}
        <IconButton icon={<Plane ready={canSend} sending={!!sending} launch={launch} />} label={sendLabel ?? uiStrings.send} variant="accent" onPress={canSend ? send : undefined} disabled={sending} />
      </View>
    </View>
  );
}

/**
 * L'avion du bouton envoyer se transforme : au repos (champ vide) il pique du nez, un peu petit ; dès qu'on écrit,
 * il se redresse d'un « pop ». À l'envoi il s'envole en haut à droite, et un nouvel avion revient d'en bas à gauche
 * quand l'envoi est fini (ou tout de suite après, à chaque `launch` d'un envoi optimiste). Fondus seuls si animations
 * réduites.
 */
function Plane({ ready, sending, launch }: { ready: boolean; sending: boolean; launch: number }) {
  const reduced = useReducedMotion();
  const pose = useSharedValue(ready ? 1 : 0);
  const pop = useSharedValue(1);
  const fly = useSharedValue(0);
  const fade = useSharedValue(1);
  const flying = useRef(false);
  useEffect(() => {
    if (reduced) {
      pose.value = ready ? 1 : 0;
      return;
    }
    pose.value = withSpring(ready ? 1 : 0, springs.pop);
    if (ready) pop.value = withSequence(withTiming(1.18, { duration: motion.instant, easing: ease.out }), withSpring(1, springs.pop));
  }, [ready, reduced, pose, pop]);
  useEffect(() => {
    if (sending && !flying.current) {
      flying.current = true;
      if (reduced) {
        fade.value = fadeTo(0.4, motion.instant);
        return;
      }
      fly.value = withTiming(1, { duration: motion.base, easing: ease.in });
      return;
    }
    if (!sending && flying.current) {
      flying.current = false;
      if (reduced) {
        fade.value = fadeTo(1, motion.fast);
        return;
      }
      // Revient d'en bas à gauche (même si l'envoi a été plus rapide que le départ).
      fly.value = withSequence(withDelay(motion.base, withTiming(-1, { duration: 0 })), withSpring(0, springs.pop));
    }
  }, [sending, reduced, fly, fade]);
  useEffect(() => {
    if (launch === 0 || flying.current) return;
    if (reduced) {
      fade.value = withSequence(withTiming(0.4, { duration: motion.instant }), withTiming(1, { duration: motion.fast }));
      return;
    }
    fly.value = withSequence(withTiming(1, { duration: motion.fast, easing: ease.in }), withTiming(-1, { duration: 0 }), withSpring(0, springs.pop));
  }, [launch, reduced, fly, fade]);
  const style = useAnimatedStyle(() => {
    const f = fly.value;
    const away = Math.abs(f);
    return {
      opacity: fade.value * (1 - Math.min(1, away * 1.15)),
      transform: [
        { translateX: f * 22 },
        { translateY: -f * 22 },
        { rotate: `${(1 - pose.value) * 16}deg` },
        { scale: (0.86 + 0.14 * pose.value) * pop.value * (1 - away * 0.35) },
      ],
    };
  });
  return <Animated.View style={style}>{SEND}</Animated.View>;
}

const styles = StyleSheet.create({
  // Maquette : padding 6 12 26 ; le gabarit pose déjà 12 au-dessus et la zone de sécurité en dessous.
  wrap: { paddingHorizontal: space.md, gap: space.sm },
  disabled: { minHeight: size.button.lg, justifyContent: 'center', marginHorizontal: space.md, borderRadius: radius.pill, backgroundColor: veil.line },
  field: { flex: 1, minHeight: 46, borderRadius: 23, backgroundColor: veil.line, borderWidth: 1, borderColor: veil.track, paddingLeft: space.lg, paddingRight: space.xs },
  input: { flex: 1, minWidth: 0, color: color.white, fontSize: 15, lineHeight: 20, maxHeight: 120, paddingTop: 12, paddingBottom: 12 },
});
