import type { Species } from '@blowy/domain';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '../atoms/Avatar';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { Appear } from '../motion/Appear';
import { alpha, color, radius, space } from '../theme';

export interface NotifPreviewProps {
  species: Species;
  /** Nom affiché en tête de chaque notification (« MINIMOA »). */
  app: string;
  items: readonly { title: string; body: string; time: string }[];
  accessibilityLabel: string;
}

/**
 * Aperçu des notifications (écran de demande) : des bannières comme sur l'écran verrouillé, qui descendent l'une après
 * l'autre, envoyées par ton minimoa. Illustration seulement.
 */
export function NotifPreview({ species, app, items, accessibilityLabel }: NotifPreviewProps) {
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={styles.wrap}>
      {items.map((n, i) => (
        <Appear key={n.title} from="above" distance={22} delay={160 + i * 220}>
          <View style={[layout.row, styles.row, styles.card, { opacity: 1 - i * 0.12, transform: [{ scale: 1 - i * 0.03 }] }]}>
            <Avatar size={40} pet={{ name: species, species }} />
            <View style={layout.grow}>
              <View style={layout.rowBetween}>
                <Text variant="label" size={11} muted>
                  {app}
                </Text>
                <Text size={13} muted>
                  {n.time}
                </Text>
              </View>
              <Text variant="bodyHeavy" size={15} numberOfLines={1}>
                {n.title}
              </Text>
              <Text size={14} muted numberOfLines={2}>
                {n.body}
              </Text>
            </View>
          </View>
        </Appear>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  card: { borderRadius: radius.md + 4, backgroundColor: alpha(color.white, 0.09), borderWidth: 1, borderColor: alpha(color.white, 0.08), padding: space.md },
  row: { gap: space.md, alignItems: 'center' },
});
