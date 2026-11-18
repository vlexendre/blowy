import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../atoms/Button';
import { Panel } from '../atoms/Panel';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { AvatarStack } from '../molecules/AvatarStack';
import { layout } from '../lib/styles';
import { type GradientName, onGradient, space } from '../theme';
import type { PetLook } from '../types';

export interface PeopleCardProps {
  /** Petite ligne au-dessus (« Aujourd’hui »). */
  kicker?: string;
  /** La phrase qui compte (« Nino a 3 personnes à te présenter », « Léa te fait signe »). */
  title: string;
  /** Une ligne de plus (« Pote de Malo · Même rythme que toi »). */
  text?: string;
  /** Les minimoas des personnes (3 au plus montrés). */
  people?: readonly PetLook[];
  /** Grand bouton (« Voir qui »). Sans lui, toute la carte se touche. */
  actionLabel?: string;
  onPress?: () => void;
  loading?: boolean;
  /** Une seconde action discrète, sous la première (« Je te préviens quand quelqu’un te fait signe ? »). */
  footer?: ReactNode;
  gradient?: GradientName;
  accessibilityLabel?: string;
}

/**
 * La carte « les gens d'abord » en tête de l'accueil : qui ton minimoa a pour toi aujourd'hui (présentations, signe
 * reçu, ton groupe), ou ce qui manque pour qu'il présente quelqu'un (position, invitation). Une phrase, des minimoas,
 * une action.
 */
export function PeopleCard({ kicker, title, text, people, actionLabel, onPress, loading, footer, gradient = 'violet', accessibilityLabel }: PeopleCardProps) {
  const ink = onGradient[gradient];
  const body = (
    <View style={styles.body}>
      <View style={[layout.row, styles.head]}>
        <View style={layout.grow}>
          {kicker ? (
            <Text variant="label" color={ink} style={styles.kicker}>
              {kicker}
            </Text>
          ) : null}
          <Text variant="bodyHeavy" size={21} color={ink} style={styles.title}>
            {title}
          </Text>
        </View>
        {people?.length ? <AvatarStack people={people.map((pet) => ({ pet, name: pet.name }))} size={42} max={3} /> : null}
      </View>
      {text ? (
        <Text size={15} color={ink} style={styles.text}>
          {text}
        </Text>
      ) : null}
      {actionLabel && onPress ? <Button label={actionLabel} variant={gradient === 'accent' ? 'dark' : 'white'} size="md" iconRight="arrow" loading={loading} onPress={onPress} block /> : null}
      {footer}
    </View>
  );
  return (
    <Panel gradient={gradient} radius="lg" padding="lg">
      {onPress && !actionLabel ? (
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title} scaleTo="auto">
          {body}
        </Pressable>
      ) : (
        body
      )}
    </Panel>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.md },
  head: { gap: space.md, alignItems: 'center' },
  kicker: { opacity: 0.8, marginBottom: 2 },
  title: { lineHeight: 26 },
  text: { lineHeight: 20, opacity: 0.9 },
});
