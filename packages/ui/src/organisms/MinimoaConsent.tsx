import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import type { IconName } from '../assets/pets';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Panel } from '../atoms/Panel';
import { PetImage } from '../atoms/PetImage';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { layout } from '../lib/styles';
import { Appear } from '../motion/Appear';
import { color, space, veil } from '../theme';
import type { PetLook, TitleContent } from '../types';

export interface MinimoaConsentProps {
  /** « VOS MINIMOAS / DANS CE CHAT. ». */
  title: TitleContent;
  /** « Ils lancent, relancent, et glissent une remarque. ». */
  subtitle?: string;
  mine: PetLook;
  theirs: PetLook;
  /** La phrase de confidentialité, exactement comme l'API la sert (`consent.text`). */
  text: string;
  /** Lignes d'explication sous la phrase : ce qui se passe si l'un refuse, où en est l'autre. */
  notes: readonly { key: string; icon: IconName; text: string }[];
  /** Lien vers la politique de confidentialité, juste sous la phrase (App Review 5.1.2(i)). */
  policy?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
}

/**
 * Accord de lecture des minimoas d'un chat (maquette V6-GAccord) : panneau rose où les deux minimoas se font face,
 * la phrase de confidentialité telle quelle, puis ce qu'il se passe. Les deux choix sont dans le pied de la feuille.
 * Les minimoas montent du bas du panneau (fondu si animations réduites).
 */
export function MinimoaConsent({ title, subtitle, mine, theirs, text, notes, policy, style }: MinimoaConsentProps) {
  return (
    <View style={[styles.root, style]}>
      <Panel gradient="rose" radius="lg" padding="none" overflow={false} style={styles.panel}>
        <View style={styles.copy}>
          <Title text={title} size={30} color={color.dark} />
          {subtitle ? (
            <Text variant="bodyBold" size={13} color={color.dark} style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.pets} pointerEvents="none">
          <Appear from="below" distance={40} delay={120} duration={320}>
            <PetImage species={mine.species} mood="cote" size={72} outline animation="breathe" />
          </Appear>
          <Appear from="below" distance={40} delay={240} duration={320}>
            <PetImage species={theirs.species} mood="joie" size={64} outline animation="breathe" delay={400} />
          </Appear>
        </View>
      </Panel>
      <View style={styles.box} accessible accessibilityRole="text">
        <Text variant="bodyBold" size={15} style={styles.boxText}>
          {text}
        </Text>
      </View>
      {/* Hors de la boîte (lue d'un bloc par VoiceOver) pour rester un bouton à part. */}
      {policy ? <Button label={policy.label} variant="link" size="sm" block={false} onPress={policy.onPress} style={styles.policy} /> : null}
      {notes.map((n) => (
        <View key={n.key} style={[layout.rowTop, styles.note]}>
          <Icon name={n.icon} size={20} />
          <Text size={14} muted style={layout.shrink}>
            {n.text}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.sm + 2 },
  panel: { minHeight: 118, overflow: 'hidden' },
  copy: { padding: 14, gap: space.xs, maxWidth: '64%' },
  subtitle: { lineHeight: 17 },
  pets: { position: 'absolute', right: 4, bottom: -4, flexDirection: 'row', alignItems: 'flex-end' },
  box: { padding: 14, borderRadius: 20, backgroundColor: color.card, borderWidth: 1, borderColor: veil.glass },
  boxText: { lineHeight: 21 },
  policy: { alignSelf: 'flex-start', marginTop: -space.xs },
  note: { gap: space.sm, paddingHorizontal: space.xs },
});
