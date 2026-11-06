import { Sprite } from '../atoms/Sprite';
import { Chip } from '../atoms/Chip';
import type { Tone } from '../foundations/theme';

export interface StatChipProps {
  /** Asset du manifest (icons/flame.webp…). */
  iconPath: string;
  value: string;
  accessibilityLabel: string;
  onPress?: () => void;
  tone?: Tone;
  testID?: string;
}

/** Compteur illustré (série, pièces, pet) — en-tête du Nid. */
export function StatChip({
  iconPath,
  value,
  accessibilityLabel,
  onPress,
  tone = 'white',
  testID,
}: StatChipProps) {
  return (
    <Chip
      label={value}
      tone={tone}
      leading={<Sprite path={iconPath} size={22} />}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    />
  );
}
