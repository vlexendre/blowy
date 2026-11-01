import { View } from 'react-native';
import { color } from '../foundations/theme';

/** Point d'indicateur (étape, présence). Décoratif : la signification est toujours écrite à côté. */
export function Dot({ active, size = 8 }: { active?: boolean; size?: number }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: active ? size * 2.5 : size, height: size, borderRadius: size / 2, backgroundColor: active ? color.ink : color.creamShadow }}
    />
  );
}
