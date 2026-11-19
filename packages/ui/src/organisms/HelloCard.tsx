import type { FaceVisibility } from '@blowy/domain';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '../atoms/Avatar';
import { Button } from '../atoms/Button';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { Appear } from '../motion/Appear';
import { alpha, color, radius, space } from '../theme';
import type { PetLook } from '../types';

export interface HelloCardProps {
  /** « Il t’a dit bonjour » (ou « Elle ou il t’a dit bonjour »). */
  kicker: string;
  person: { name: string; pet: PetLook; face: FaceVisibility; avatarUrl: string | null };
  /** « Vous deux : rester dans le quartier… » si l'explication est là, sinon ce que dit son minimoa. */
  line?: string | null;
  /** « Et 2 autres » quand plusieurs bonjours attendent. */
  more?: string | null;
  replyLabel: string;
  onReply: () => void;
  onOpen?: () => void;
  accessibilityLabel?: string;
}

/**
 * En tête des chats (V6-Chats) : un bonjour reçu qui attend ta réponse, avec ce que vous avez en commun et
 * « Répondre ». Carte sombre cerclée de jaune.
 */
export function HelloCard({ kicker, person, line, more, replyLabel, onReply }: HelloCardProps) {
  return (
    <Appear once={`hello:${person.name}`}>
      <View style={styles.card}>
        <View style={[layout.row, styles.row]}>
          <Avatar size={50} pet={person.pet} face={person.face} uri={person.avatarUrl} name={person.name} />
          <View style={layout.shrink}>
            <Text variant="label" color={color.accent}>
              {kicker}
            </Text>
            <Text variant="bodyHeavy" size={17}>
              {person.name}
            </Text>
            {line ? (
              <Text size={13} muted>
                {line}
              </Text>
            ) : null}
          </View>
        </View>
        <Button label={replyLabel} size="md" onPress={onReply} block />
        {more ? (
          <Text size={13} muted center>
            {more}
          </Text>
        ) : null}
      </View>
    </Appear>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, backgroundColor: color.panel, borderWidth: 1, borderColor: alpha(color.accent, 0.6), padding: space.lg, gap: space.md },
  row: { gap: space.md },
});
