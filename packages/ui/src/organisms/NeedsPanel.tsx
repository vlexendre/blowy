import { NEED_KEYS, type NeedKey, type Needs, urgentNeed } from '@blowy/domain';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import type { IconName } from '../assets/pets';
import { Card } from '../atoms/Card';
import { Icon } from '../atoms/Icon';
import { ItemImage } from '../atoms/ItemImage';
import { Text } from '../atoms/Text';
import { NeedMeter } from '../molecules/NeedMeter';
import { layout } from '../lib/styles';
import { alpha, color, radius, space } from '../theme';

export interface NeedsPanelProps {
  /** Besoins du pet (`Pet.needs`). */
  needs: Needs;
  /** Nom et phrase « bas » de chaque besoin (`needLabel` de @blowy/content accepté tel quel). */
  labels: Record<NeedKey, { name: string; low: string }>;
  /** Titre de la carte (« ses besoins »). */
  title?: string;
  /** Aide à droite du titre. */
  hint?: string;
  /** Phrase quand rien ne presse (« il est comblé »). */
  okText?: string;
  /** Besoin urgent imposé ; défaut `urgentNeed(needs)` du domaine (le plus bas sous 40). */
  urgent?: NeedKey | null;
  /** Icônes par besoin ; défaut gâteau, éclair, cœurs. */
  icons?: Partial<Record<NeedKey, IconName | ReactNode>>;
}

const DEFAULT_ICONS: Record<NeedKey, ReactNode> = {
  hunger: <ItemImage id="gateau" size={28} />,
  energy: <Icon name="eclair" size={26} />,
  mood: <Icon name="coeurs" size={26} />,
};

/** Les trois besoins (faim, énergie, humeur) et la phrase du besoin le plus urgent. */
export function NeedsPanel({ needs, labels, title, hint, okText, urgent, icons }: NeedsPanelProps) {
  const worst = urgent === undefined ? urgentNeed(needs) : urgent;
  const sentence = worst ? labels[worst].low : okText;
  return (
    <Card padding="md" style={styles.card}>
      {title || hint ? (
        <View style={layout.rowBetween}>
          {title ? <Text variant="label">{title}</Text> : <View />}
          {hint ? (
            <Text variant="small" muted>
              {hint}
            </Text>
          ) : null}
        </View>
      ) : null}
      {NEED_KEYS.map((k) => (
        <NeedMeter key={k} label={labels[k].name} lowText={labels[k].low} value={needs[k]} icon={icons?.[k] ?? DEFAULT_ICONS[k]} />
      ))}
      {sentence ? (
        <View accessibilityRole={worst ? 'alert' : undefined} style={[styles.sentence, worst ? styles.urgent : styles.ok]}>
          <Text variant="bodyBold" size={14} color={worst ? color.coral : color.ok} center>
            {sentence}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.md },
  sentence: { borderRadius: radius.md, paddingVertical: space.sm, paddingHorizontal: space.md },
  urgent: { backgroundColor: alpha(color.coral, 0.14) },
  ok: { backgroundColor: alpha(color.ok, 0.12) },
});
