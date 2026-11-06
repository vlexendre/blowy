import { Switch } from 'react-native';
import { color } from '../foundations/theme';

export interface ToggleProps {
  value: boolean;
  onValueChange: (v: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
  testID?: string;
}

export function Toggle({
  value,
  onValueChange,
  accessibilityLabel,
  disabled,
  testID,
}: ToggleProps) {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      trackColor={{ false: color.creamShadow, true: color.ink }}
      thumbColor={value ? color.lime : color.white}
      ios_backgroundColor={color.creamShadow}
    />
  );
}
