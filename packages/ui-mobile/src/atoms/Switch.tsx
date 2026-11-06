/**
 * Interrupteur `.sw` des maquettes V5 : cible 54×44, piste 50×30 rayon 999 marge 3, pastille 24
 * blanche (ombre `0 2px 0 rgba(0,0,0,.15)`). Libellé = état réel, couleur = état réel :
 * ON #3F7A0B à droite, OFF #8C7B66 à gauche (V5.2 F.19). `accessibilityLabel` dit « activé » /
 * « désactivé » (fourni par l'appelant, traduit).
 */
import { Pressable, View } from 'react-native';
import { v5, v5Alpha } from '../foundations/theme';

export interface SwitchProps {
  value: boolean;
  onValueChange?: (v: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
  testID?: string;
}

export function Switch({ value, onValueChange, accessibilityLabel, disabled, testID }: SwitchProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: !!disabled }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      testID={testID}
      onPress={() => onValueChange?.(!value)}
      style={{ marginLeft: 'auto', width: 54, height: 44, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
    >
      <View style={{ width: 50, height: 30, borderRadius: 999, padding: 3, flexDirection: 'row', justifyContent: value ? 'flex-end' : 'flex-start', backgroundColor: value ? v5.switchOn : v5.greyWarm }}>
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: v5.white, boxShadow: [{ offsetX: 0, offsetY: 2, blurRadius: 0, spreadDistance: 0, color: v5Alpha.black15 }] }} />
      </View>
    </Pressable>
  );
}
