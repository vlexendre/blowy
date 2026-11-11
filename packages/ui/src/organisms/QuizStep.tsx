import { GAUGE_KEYS, type GaugeKey, type Gauges } from '@blowy/domain';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import type { IconName } from '../assets/pets';
import { Card } from '../atoms/Card';
import { PetImage } from '../atoms/PetImage';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { ChoiceCard } from '../molecules/ChoiceCard';
import { GaugeBar } from '../molecules/GaugeBar';
import { layout } from '../lib/styles';
import { color, type GradientName, space } from '../theme';
import type { PetLook, TitleContent } from '../types';

export interface QuizChoice<K extends string = string> {
  key: K;
  title: string;
  caption?: string;
  icon?: IconName | ReactNode;
}

export interface QuizStepProps<K extends string = string> {
  /** Petite ligne jaune (« sociabilité »). */
  kicker?: string;
  title: TitleContent;
  text?: string;
  choices: readonly QuizChoice<K>[];
  selectedKey?: K | null;
  onChoose: (key: K) => void;
  /** Aperçu en haut : le pet et ses jauges qui bougent avec les réponses. */
  preview?: { pet: PetLook; gauges: Gauges; labels: Record<GaugeKey, { low: string; high: string }> };
}

const CHOICE_GRADIENTS: readonly GradientName[] = ['rose', 'accent', 'violet', 'orange'];

/** Une question du quiz de caractère : aperçu des jauges, question, deux grandes réponses. */
export function QuizStep<K extends string>({ kicker, title, text, choices, selectedKey, onChoose, preview }: QuizStepProps<K>) {
  return (
    <View style={[layout.fill, layout.gapLg]}>
      {preview ? (
        <Card padding="md" style={[layout.row, layout.gapMd]}>
          <PetImage species={preview.pet.species} mood="neutre" size={76} animation="breathe" />
          <View style={[layout.grow, layout.gapSm]}>
            {GAUGE_KEYS.map((k) => (
              <GaugeBar key={k} value={preview.gauges[k]} low={preview.labels[k].low} high={preview.labels[k].high} compact />
            ))}
          </View>
        </Card>
      ) : null}
      <View style={layout.gapSm}>
        {kicker ? (
          <Text variant="label" color={color.accent}>
            {kicker}
          </Text>
        ) : null}
        <Title text={title} size={46} />
        {text ? <Text muted>{text}</Text> : null}
      </View>
      <View style={[styles.choices, layout.gapMd]} accessibilityRole="radiogroup">
        {choices.map((c, i) => (
          <ChoiceCard
            key={c.key}
            title={c.title}
            caption={c.caption}
            icon={c.icon}
            gradient={CHOICE_GRADIENTS[i % CHOICE_GRADIENTS.length]}
            selected={selectedKey === c.key}
            faded={!!selectedKey && selectedKey !== c.key}
            onPress={() => onChoose(c.key)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  choices: { marginTop: 'auto', paddingTop: space.lg },
});
