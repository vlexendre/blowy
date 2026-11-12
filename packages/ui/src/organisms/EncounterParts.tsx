import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '../atoms/Avatar';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { InkProvider } from '../lib/ink';
import { layout } from '../lib/styles';
import { alpha, color, speciesColor, veil } from '../theme';
import type { PersonLook } from '../types';

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

export interface EncounterHeadProps {
  person: PersonLook;
  /** Nom en Anton (le pet) ou phrase en gras (« Léa veut te rencontrer »). */
  name: string;
  nameStyle?: 'display' | 'text';
  badge?: ReactNode;
  owner?: string;
  compatibility: number;
  compatLabel?: string;
}

/** Avatar cerclé, nom, propriétaire et pourcentage d'accord. */
export function EncounterHead({ person, name, nameStyle = 'display', badge, owner, compatibility, compatLabel }: EncounterHeadProps) {
  const tint = speciesColor[person.pet.species];
  return (
    <View style={[layout.row, styles.head]}>
      <Avatar size={58} pet={person.pet} uri={person.avatarUrl} face={person.face} name={person.displayName} ring={tint} />
      <View style={layout.grow}>
        <View style={[layout.row, styles.nameRow]}>
          {nameStyle === 'display' ? (
            <Title text={name} size={28} numberOfLines={1} style={layout.shrink} />
          ) : (
            <Text variant="bodyBold" size={17} numberOfLines={2} style={layout.shrink}>
              {name}
            </Text>
          )}
          {badge}
        </View>
        {owner ? (
          <Text variant="small" size={13} muted numberOfLines={1} style={styles.owner}>
            {owner}
          </Text>
        ) : null}
      </View>
      <View style={styles.compat}>
        <Title text={`${compatibility} %`} size={38} color={color.accent} />
        {compatLabel ? (
          <Text variant="bodyHeavy" size={9} muted style={styles.compatLabel}>
            {compatLabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/** Ce qu'un pet raconte : « pia, à nino » puis sa bulle. */
export function PetSays({ label, labelColor, text }: { label?: string; labelColor: string; text: string }) {
  return (
    <View>
      {label ? (
        <Text variant="bodyHeavy" size={11} color={labelColor} style={styles.who}>
          {label}
        </Text>
      ) : null}
      <View style={styles.bubble}>
        <Text size={14} style={styles.bubbleText}>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: 24, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 14, gap: 8, backgroundColor: color.panel, overflow: 'hidden' },
  head: { gap: 12 },
  nameRow: { gap: 8 },
  owner: { marginTop: 2 },
  compat: { alignItems: 'flex-end' },
  compatLabel: { letterSpacing: 1.08, textTransform: 'uppercase' },
  who: { marginLeft: 4, marginBottom: 3 },
  bubble: { alignSelf: 'flex-start', paddingVertical: 9, paddingHorizontal: 13, borderRadius: 20, borderBottomLeftRadius: 6, backgroundColor: color.card, borderWidth: 1, borderColor: veil.glass },
  bubbleText: { lineHeight: 18 },
});
