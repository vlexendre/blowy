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
      <Icon name={icon} size={36} />
      <View style={layout.grow}>
        <Text variant="bodyBold" size={16}>
          {title}
        </Text>
        {text ? (
          <Text variant="small" muted>
            {text}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ base: { gap: space.md + 2 } });
