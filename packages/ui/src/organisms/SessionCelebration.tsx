import type { Species } from '@blowy/domain';
import { color } from '@blowy/tokens';
import { type ReactNode, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '../atoms/Button';
import { PetImage } from '../atoms/PetImage';
import { Text } from '../atoms/Text';
import { Burst } from '../motion/Burst';
import { PopIn } from '../motion/PopIn';
import { alpha, radius, space } from '../theme';

export interface CelebrationTile {
  key: string;
  label: string;
  value: string;
  tone: 'accent' | 'lime' | 'sky';
}

export interface SessionCelebrationProps {
  species: Species;
  /** Le minimoa animé quand il y en a un (sinon l'image qui rit). */
  mascot?: ReactNode;
  title: string;
  text: string;
  tiles: readonly CelebrationTile[];
  ctaLabel: string;
  onCta: () => void;
}

const TONE = { accent: color.accent, lime: color.lime, sky: '#5CE1FF' } as const;

/**
 * Fin de séance réussie (maquette V7 « Célébration », façon Duolingo) : le minimoa rit dans les confettis, un grand
 * titre, trois tuiles qui arrivent l'une après l'autre (étincelles, série, temps), puis « Récupérer ».
 */
export function SessionCelebration({ species, mascot, title, text, tiles, ctaLabel, onCta }: SessionCelebrationProps) {
  const [party, setParty] = useState(0);
  useEffect(() => setParty(1), []);
  return (
    <View style={styles.wrap}>
      <View style={styles.stage}>
        <Burst kind="confetti" trigger={party} count={16} spread={180} />
        <PopIn from={0.6}>{mascot ?? <PetImage species={species} mood="joie" size={220} />}</PopIn>
      </View>
      <Text variant="h2" center color={color.accent}>
        {title}
      </Text>
      <Text center style={styles.text}>
        {text}
      </Text>
      <View style={styles.tiles}>
        {tiles.map((t, i) => (
          <PopIn key={t.key} delay={250 + i * 150} style={styles.tileWrap}>
            <View style={[styles.tile, { borderColor: TONE[t.tone], backgroundColor: TONE[t.tone] }]} accessible accessibilityLabel={`${t.label} : ${t.value}`}>
              <Text variant="label" center color={color.dark} style={styles.tileLabel}>
                {t.label}
              </Text>
              <View style={styles.tileBody}>
                <Text variant="bodyHeavy" center color={TONE[t.tone]} size={22}>
                  {t.value}
                </Text>
              </View>
            </View>
          </PopIn>
        ))}
      </View>
      <View style={styles.grow} />
      <Button label={ctaLabel} onPress={onCta} size="lg" block />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingBottom: space.lg },
  stage: { height: 250, alignItems: 'center', justifyContent: 'center', marginTop: space.xl },
  text: { marginTop: space.sm },
  tiles: { flexDirection: 'row', gap: space.sm, marginTop: space.xl },
  tileWrap: { flex: 1 },
  tile: { borderWidth: 2, borderRadius: radius.md, overflow: 'hidden' },
  tileLabel: { paddingVertical: 4 },
  tileBody: { backgroundColor: color.night, paddingVertical: space.md, borderBottomLeftRadius: radius.md - 2, borderBottomRightRadius: radius.md - 2, minHeight: 56, justifyContent: 'center', borderTopWidth: 0, borderColor: alpha(color.white, 0) },
  grow: { flex: 1 },
});
