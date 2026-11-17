import { StyleSheet, View } from 'react-native';

import { Avatar } from '../atoms/Avatar';
import { Button } from '../atoms/Button';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { color, density, radius, space, veil } from '../theme';
import type { PetLook } from '../types';

export interface GroupInviteRowProps {
  /** Minimoa de qui invite. */
  pet: PetLook;
  /** « Sasha t'invite : Lecture du soir ». */
  title: string;
  /** « Habitude : Lire · 2 membres ». */
  subtitle?: string;
  acceptLabel: string;
  declineLabel: string;
  onAccept: () => void;
  onDecline: () => void;
  accepting?: boolean;
  declining?: boolean;
}

/** Invitation à un groupe, en une ligne compacte : qui invite, le groupe, « Accepter » et « Refuser ». */
export function GroupInviteRow({ pet, title, subtitle, acceptLabel, declineLabel, onAccept, onDecline, accepting, declining }: GroupInviteRowProps) {
  return (
    <View style={styles.card}>
      <View style={[layout.row, styles.head]}>
        <Avatar size={36} pet={pet} hidden />
        <View style={layout.grow}>
          <Text variant="bodyHeavy" size={15} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text size={13} muted numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={[layout.row, styles.actions]}>
        <Button label={declineLabel} variant="glass" size="sm" onPress={onDecline} loading={declining} disabled={accepting} style={styles.half} />
        <Button label={acceptLabel} variant="accent" size="sm" onPress={onAccept} loading={accepting} disabled={declining} style={styles.half} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.panel, borderRadius: radius.card, borderWidth: 1, borderColor: veil.hairline, padding: density.cardPad - 2, gap: space.sm + 2 },
  head: { gap: space.md },
  actions: { gap: space.sm },
  half: { flexGrow: 1, flexBasis: 0 },
});
