import { StyleSheet, View } from 'react-native';

import { Avatar } from '../atoms/Avatar';
import { Button } from '../atoms/Button';
import { Card } from '../atoms/Card';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { layout } from '../lib/styles';
import { color, radius, space, speciesColor, veil } from '../theme';
import type { IncomingLook } from '../types';

export interface IncomingCardProps {
  /** La demande reçue (objet `Incoming` du contrat accepté tel quel). */
  incoming: IncomingLook;
  /** « Sasha veut te rencontrer ». */
  title: string;
  /** « pia, le pet de Sasha ». */
  ownerLabel?: string;
  compatLabel?: string;
  acceptLabel: string;
  declineLabel: string;
  onAccept: () => void;
  onDecline: () => void;
  accepting?: boolean;
  declining?: boolean;
}

/** Quelqu'un a salué ton pet : accepter (le lien se crée) ou décliner. */
export function IncomingCard({ incoming, title, ownerLabel, compatLabel, acceptLabel, declineLabel, onAccept, onDecline, accepting, declining }: IncomingCardProps) {
  const { from, compatibility, intro } = incoming;
  const tint = speciesColor[from.pet.species];
  return (
    <Card padding="lg" highlight={tint} style={layout.gapMd}>
      <View style={[layout.row, layout.gapMd]}>
        <Avatar size={52} pet={from.pet} uri={from.avatarUrl} face={from.face} name={from.displayName} ring={tint} />
        <View style={layout.grow}>
          <Text variant="bodyBold" size={17}>
            {title}
          </Text>
          {ownerLabel ? (
            <Text variant="small" muted>
              {ownerLabel}
            </Text>
          ) : null}
        </View>
        <View style={styles.compat}>
          <Title text={`${compatibility} %`} size={28} color={color.accent} />
          {compatLabel ? (
            <Text variant="label" size={9} muted>
              {compatLabel}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.intro}>
        <Text variant="body" size={15}>
          {intro}
        </Text>
      </View>
      <View style={[layout.row, layout.gapSm]}>
        <Button label={declineLabel} variant="ghost" size="md" onPress={onDecline} loading={declining} disabled={accepting} style={layout.fill} />
        <Button label={acceptLabel} variant="accent" size="md" onPress={onAccept} loading={accepting} disabled={declining} style={layout.fill} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  compat: { alignItems: 'flex-end' },
  intro: { padding: space.md, borderRadius: radius.md, borderBottomLeftRadius: space.xs + 2, backgroundColor: color.card, borderWidth: 1, borderColor: veil.glass },
});
