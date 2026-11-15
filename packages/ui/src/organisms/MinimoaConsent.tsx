import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import type { IconName } from '../assets/pets';
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
  style?: StyleProp<ViewStyle>;
}

/**
 * Accord de lecture des minimoas d'un chat (maquette V6-GAccord) : panneau rose où les deux minimoas se font face,
 * la phrase de confidentialité telle quelle, puis ce qu'il se passe. Les deux choix sont dans le pied de la feuille.
 * Les minimoas montent du bas du panneau (fondu si animations réduites).
 */
export function MinimoaConsent({ title, subtitle, mine, theirs, text, notes, style }: MinimoaConsentProps) {
  return (
    <View style={[styles.root, style]}>
      <Panel gradient="rose" radius="lg" padding="none" overflow={false} style={styles.panel}>
        <View style={styles.copy}>
          <Title text={title} size={36} color={color.dark} />
          {subtitle ? (
            <Text variant="bodyBold" size={15} color={color.dark} style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.pets} pointerEvents="none">
          <Appear from="below" distance={40} delay={120} duration={320}>
            <PetImage species={mine.species} mood="cote" size={92} outline animation="breathe" />
          </Appear>
          <Appear from="below" distance={40} delay={240} duration={320}>
            <PetImage species={theirs.species} mood="joie" size={82} outline animation="breathe" delay={400} />
          </Appear>
        </View>
      </Panel>
      <View style={styles.box} accessible accessibilityRole="text">
        <Text variant="bodyBold" size={17} style={styles.boxText}>
          {text}
        </Text>
      </View>
      {notes.map((n) => (
        <View key={n.key} style={[layout.rowTop, styles.note]}>
          <Icon name={n.icon} size={22} />
          <Text size={15} muted style={layout.shrink}>
            {n.text}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.md },
  panel: { minHeight: 214, overflow: 'hidden' },
  copy: { padding: space.lg, paddingBottom: 96, gap: space.xs },
  subtitle: { lineHeight: 19, maxWidth: '58%' },
  pets: { position: 'absolute', right: 6, bottom: -6, flexDirection: 'row', alignItems: 'flex-end' },
  box: { padding: space.lg, borderRadius: 22, backgroundColor: color.card, borderWidth: 1, borderColor: veil.glass },
  boxText: { lineHeight: 24 },
  note: { gap: space.sm, paddingHorizontal: space.xs },
});
