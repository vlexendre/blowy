import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { Avatar } from '../atoms/Avatar';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { InkProvider } from '../lib/ink';
import { ease, springs, useReducedMotion } from '../lib/motion';
import { layout } from '../lib/styles';
import { alpha, color, speciesColor, veil } from '../theme';
import type { PersonLook } from '../types';
import { useUiStrings } from '../lib/strings';

/** Teinte claire d'une couleur d'espèce (texte sur fond teinté : « par Malo, pote de pote »). */
export function lighten(hex: string, t: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number): number => Math.round(c + (255 - c) * t);
  return `rgb(${mix((n >> 16) & 255)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
}

/** Carte d'une rencontre : bord teinté de l'espèce, léger voile de sa couleur en haut (maquette V6-Rencontres). */
export function EncounterFrame({ tint, children, onPress, accessibilityLabel }: { tint: string; children: ReactNode; onPress?: () => void; accessibilityLabel?: string }) {
  const body = (
    <>
      <LinearGradient colors={[alpha(tint, 0.14), alpha(tint, 0)]} style={StyleSheet.absoluteFill} />
      <InkProvider value={color.white} mute={color.mute}>
        {children}
      </InkProvider>
    </>
  );
  const frame = [styles.frame, { borderColor: alpha(tint, 0.55) }];
  return onPress ? (
    <Pressable onPress={onPress} accessibilityLabel={accessibilityLabel} scaleTo={0.98} style={frame}>
      {body}
    </Pressable>
  ) : (
    <View style={frame}>{body}</View>
  );
}

/**
 * Le haut d'une carte de rencontre (qui, pourquoi) qui ouvre le détail. Les boutons restent hors de cette zone : un
 * bouton dans un bouton n'est pas joignable par VoiceOver.
 */
export function EncounterOpen({ children, onPress, accessibilityLabel }: { children: ReactNode; onPress?: () => void; accessibilityLabel?: string }) {
  if (!onPress) return <View style={styles.open}>{children}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} scaleTo={0.99} dimTo={0.85} style={styles.open}>
      {children}
    </Pressable>
  );
}

export interface EncounterHeadProps {
  person: PersonLook;
  /** Nom en capitales (police des titres) (le pet) ou phrase en gras (« Léa te fait signe »). */
  name: string;
  nameStyle?: 'display' | 'text';
  badge?: ReactNode;
  owner?: string;
  /** Null : rien n'est affiché (compatibilité inconnue : jamais « 0 % »). */
  compatibility: number | null;
  compatLabel?: string;
  /** À incrémenter : l'avatar fait coucou (balancement, petit saut) — réponse à « saluer ». */
  waveKey?: number;
}

/** Avatar cerclé, nom, propriétaire et pourcentage d'accord. */
export function EncounterHead({ person, name, nameStyle = 'display', badge, owner, compatibility, compatLabel, waveKey = 0 }: EncounterHeadProps) {
  const uiStrings = useUiStrings();
  const tint = speciesColor[person.pet.species];
  return (
    <View style={[layout.row, styles.head]}>
      <Waver waveKey={waveKey}>
        <Avatar size={48} pet={person.pet} uri={person.avatarUrl} face={person.face} name={person.displayName} ring={tint} />
      </Waver>
      <View style={layout.grow}>
        <View style={[layout.row, styles.nameRow]}>
          {nameStyle === 'display' ? (
            <Title text={name} size={24} numberOfLines={1} style={layout.shrink} />
          ) : (
            <Text variant="bodyBold" size={16} numberOfLines={2} style={layout.shrink}>
              {name}
            </Text>
          )}
          {badge}
        </View>
        {owner ? (
          <Text size={13} muted numberOfLines={1} style={styles.owner}>
            {owner}
          </Text>
        ) : null}
      </View>
      {compatibility !== null ? <CompatPill value={uiStrings.percent(compatibility)} label={compatLabel} /> : null}
    </View>
  );
}

/**
 * Le chiffre d'accord, en second : une pastille calme (« 82 % d’accord »), jamais plus grande que le pourquoi. À poser
 * seulement à côté d'une explication (`MatchWhy`).
 */
export function CompatPill({ value, label, inline = false }: { value: string; label?: string; inline?: boolean }) {
  return (
    <View style={inline ? [layout.row, styles.compatInline] : styles.compat} accessible accessibilityLabel={label ? `${value} ${label}` : value}>
      <Text variant="bodyHeavy" size={15} color={color.accent}>
        {value}
      </Text>
      {label ? (
        <Text variant="bodyBold" size={13} muted>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

/** Coucou : balancement autour du bas, petit saut. Rien si animations réduites. */
function Waver({ waveKey, children }: { waveKey: number; children: ReactNode }) {
  const reduced = useReducedMotion();
  const rot = useSharedValue(0);
  const hop = useSharedValue(0);
  useEffect(() => {
    if (!waveKey || reduced) return;
    const w = (to: number) => withTiming(to, { duration: 150, easing: ease.inOut });
    rot.value = withDelay(260, withSequence(w(-14), w(12), w(-9), w(6), withSpring(0, springs.pop)));
    hop.value = withDelay(260, withSequence(withTiming(1, { duration: 140, easing: ease.out }), withSpring(0, springs.plush)));
  }, [waveKey, reduced, rot, hop]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -8 * hop.value }, { rotate: `${rot.value}deg` }] }));
  return <Animated.View style={[styles.waver, style]}>{children}</Animated.View>;
}

/** Ce qu'un pet raconte : « pia, à nino » puis sa bulle. */
/** `lines` : coupe la bulle (aperçu sur une carte ; la phrase entière est sur l'écran de la rencontre). */
export function PetSays({ label, labelColor, text, lines }: { label?: string; labelColor: string; text: string; lines?: number }) {
  return (
    <View>
      {label ? (
        <Text variant="bodyHeavy" size={13} color={labelColor} style={styles.who}>
          {label}
        </Text>
      ) : null}
      <View style={styles.bubble}>
        <Text size={14} numberOfLines={lines} style={styles.bubbleText}>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: 22, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 14, gap: 10, backgroundColor: color.panel, overflow: 'hidden' },
  head: { gap: 10 },
  open: { gap: 10 },
  waver: { transformOrigin: '50% 90%' },
  nameRow: { gap: 8 },
  owner: { marginTop: 2 },
  compat: { alignItems: 'flex-end', alignSelf: 'flex-start', paddingTop: 2 },
  compatInline: { gap: 6, alignItems: 'baseline' },
  who: { marginLeft: 4, marginBottom: 3 },
  bubble: { alignSelf: 'flex-start', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 20, borderBottomLeftRadius: 6, backgroundColor: color.card, borderWidth: 1, borderColor: veil.glass },
  bubbleText: { lineHeight: 20 },
});
