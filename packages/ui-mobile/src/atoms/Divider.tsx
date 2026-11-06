import { View } from 'react-native';
import { color, space } from '../foundations/theme';

export function Divider({ inset = 0 }: { inset?: number }) {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: color.creamShadow,
        marginVertical: space.xs,
        marginLeft: inset,
      }}
    />
  );
}

export function Spacer({ size = 'lg', flex }: { size?: keyof typeof space; flex?: boolean }) {
  return <View style={flex ? { flex: 1 } : { height: space[size], width: space[size] }} />;
}
