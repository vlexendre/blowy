import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { space, veil } from '../theme';

export interface DividerProps {
  /** Retrait à gauche (`tokens.space`). */
  inset?: keyof typeof space;
  vertical?: boolean;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/** Filet de séparation très discret. */
export function Divider({ inset, vertical, color = veil.hairline, style }: DividerProps) {
  return (
    <View
      accessible={false}
      style={[
        vertical ? styles.v : styles.h,
        { backgroundColor: color },
        inset ? { marginLeft: space[inset] } : null,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  h: { height: StyleSheet.hairlineWidth * 2, alignSelf: 'stretch' },
  v: { width: StyleSheet.hairlineWidth * 2, alignSelf: 'stretch' },
});
