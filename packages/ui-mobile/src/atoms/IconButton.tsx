import { StyleSheet, View } from 'react-native';
import { color, radius, tone, type Tone } from '../foundations/theme';
import { Badge } from './Badge';
import { Icon, type IconName } from './Icon';
import { Pressable3D } from './Pressable3D';

export interface IconButtonProps {
  icon: IconName;
  accessibilityLabel: string;
  onPress?: () => void;
  tone?: Tone;
  badge?: string;
  testID?: string;
}

/** Bouton carré 44 pt (maquette .back) : retour, fermer, menu. */
export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  tone: t = 'white',
  badge,
  testID,
}: IconButtonProps) {
  const tk = tone[t];
  return (
    <Pressable3D
      background={tk.bg}
      shadowColor={tk.shadow}
      depth={3}
      radius={radius.sm + 2}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={styles.btn}
    >
      <Icon name={icon} tint={t === 'white' ? color.ink : tk.fg} />
      {badge ? (
        <View style={styles.badge}>
          <Badge label={badge} />
        </View>
      ) : null}
    </Pressable3D>
  );
}

const styles = StyleSheet.create({
  btn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -4, right: -4 },
});
