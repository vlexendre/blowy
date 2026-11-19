import type { FaceVisibility } from '@blowy/domain';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '../atoms/Avatar';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { Appear } from '../motion/Appear';
import { color, radius, space, veil } from '../theme';
import type { PetLook } from '../types';

export interface PreviewPerson {
  key: string;
  pet: PetLook;
  face: FaceVisibility;
  /** « Vous deux : un dîner à 4 plutôt qu’une grosse soirée ». */
  common: string;
  /** « dans ton quartier » (jamais au mètre) ; null si inconnu. */
  where?: string | null;
  /** Lu à la place du prénom caché (« Quelqu’un, dans ton quartier »). */
  accessibilityLabel: string;
}

export interface PreviewPeopleProps {
  people: readonly PreviewPerson[];
  /** Sous la liste (« Les visages se dévoilent quand tu dis bonjour. Personne ne voit où tu es exactement. »). */
  note?: string;
}

/**
 * Aperçu (V6-GApercu) : des personnes près de chez toi, floutées, prénom caché, avec un point commun. Elles arrivent
 * l'une après l'autre. Rien de plus que ce que le serveur dit (présentations du jour).
 */
export function PreviewPeople({ people, note }: PreviewPeopleProps) {
  return (
    <View style={styles.wrap}>
      {people.map((p, i) => (
        <Appear key={p.key} delay={120 + i * 150} distance={10}>
          <View accessible accessibilityLabel={p.accessibilityLabel} style={[layout.row, styles.row]}>
            <Avatar size={58} pet={p.pet} face={p.face} blurred />
            <View style={layout.grow}>
              <View style={[layout.row, styles.head]}>
                <View style={styles.hidden} />
                {p.where ? (
                  <Text size={13} muted>
                    {p.where}
                  </Text>
                ) : null}
              </View>
              <Text variant="bodyHeavy" size={16}>
                {p.common}
              </Text>
            </View>
          </View>
        </Appear>
      ))}
      {note ? (
        <Text size={15} muted center>
          {note}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm + 2 },
  row: { gap: space.md, borderRadius: radius.card, backgroundColor: color.panel, borderWidth: 1, borderColor: veil.line, paddingHorizontal: space.lg, paddingVertical: space.md },
  head: { gap: space.sm, marginBottom: 6 },
  hidden: { width: 70, height: 14, borderRadius: radius.pill, backgroundColor: color.line },
});
