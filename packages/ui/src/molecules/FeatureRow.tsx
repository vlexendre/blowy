import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import type { IconName } from '../assets/pets';
import { Icon } from '../atoms/Icon';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { space } from '../theme';

export interface FeatureRowProps {
  icon: IconName;
  title: string;
  text?: string;
  style?: StyleProp<ViewStyle>;
}

/** Avantage listé (paywall, explications) : icône 3D + titre + précision. */
export function FeatureRow({ icon, title, text, style }: FeatureRowProps) {
  return (
    <View accessible style={[layout.row, styles.base, style]}>
      <Icon name={icon} size={38} />
      <View style={layout.grow}>
        <Text variant="bodyHeavy" size={16} style={styles.title}>
          {title}
        </Text>
        {text ? (
          <Text variant="small" style={styles.text}>
            {text}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { gap: space.md },
  title: { lineHeight: 19 },
  text: { opacity: 0.72 },
});
