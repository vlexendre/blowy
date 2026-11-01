import { StyleSheet, View } from 'react-native';
import { color, radius, space, tone, type Tone } from '../foundations/theme';
import { Icon, type IconName } from '../atoms/Icon';
import { Pressable3D } from '../atoms/Pressable3D';
import { Text } from '../atoms/Text';

export type ActionTileState = 'idle' | 'pending' | 'confirmed' | 'corrected' | 'unavailable';

export interface ActionTileProps {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  tone?: Tone;
  state?: ActionTileState;
  /** Libellé d'état affiché (« en attente », « confirmé ») — l'état n'est jamais visuel seulement. */
  stateLabel?: string;
  subtitle?: string;
  disabled?: boolean;
  testID?: string;
}

/** Tuile d'action du Nid (maquette .act : blanc, ombre #EEDFCB, 46 pt). */
export function ActionTile({ label, onPress, icon, tone: t = 'white', state = 'idle', stateLabel, subtitle, disabled, testID }: ActionTileProps) {
  const tk = tone[t];
  const busy = state === 'pending';
  return (
    <Pressable3D
      background={tk.bg}
      shadowColor={tk.shadow}
      depth={4}
      radius={radius.md}
      onPress={onPress}
      disabled={disabled || busy || state === 'unavailable'}
      accessibilityLabel={[label, subtitle, stateLabel].filter(Boolean).join(', ')}
      accessibilityState={{ busy, disabled: disabled || state === 'unavailable' }}
      testID={testID}
      style={styles.tile}
    >
      <View style={styles.row}>
        {icon ? <Icon name={state === 'confirmed' ? 'check' : icon} size={18} tint={tk.fg === color.white ? color.white : color.ink} /> : null}
        <Text variant="displayS" style={{ color: tk.fg }} numberOfLines={1} adjustsFontSizeToFit>
          {label}
        </Text>
      </View>
      {subtitle || stateLabel ? (
        <Text variant="caption" style={{ color: tk.fg, opacity: 0.8 }} numberOfLines={1}>
          {stateLabel ?? subtitle}
        </Text>
      ) : null}
    </Pressable3D>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.sm, paddingVertical: space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
});
