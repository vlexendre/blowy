import { CARE_ACTIONS, type CareAction } from '@blowy/domain';
import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import type { IconName } from '../assets/pets';
import { Icon } from '../atoms/Icon';
import { ItemImage } from '../atoms/ItemImage';
import { CareButton } from '../molecules/CareButton';
import { space } from '../theme';

export interface CareBarProps {
  /** Libellés des gestes (`careLabel` de @blowy/content accepté tel quel). */
  labels: Record<CareAction, { action: string; refused: string }>;
  /** Gestes que le pet accepte maintenant (`canCare(needs, action)`) ; les autres sont « refusés ». */
  available: Record<CareAction, boolean>;
  onCare: (action: CareAction) => void;
  /** Appui sur un geste refusé. */
  onRefused?: (action: CareAction) => void;
  /** Geste en cours d'envoi : les autres sont inactifs. */
  busy?: CareAction | null;
  /** Montre la raison du refus sous les boutons refusés. Défaut vrai. */
  showRefused?: boolean;
  icons?: Partial<Record<CareAction, IconName | ReactNode>>;
  style?: StyleProp<ViewStyle>;
}

const DEFAULT_ICONS: Record<CareAction, ReactNode> = {
  feed: <ItemImage id="gateau" size={38} />,
  play: <ItemImage id="ballon" size={36} />,
  nap: <ItemImage id="masque_nuit" size={40} />,
  cuddle: <Icon name="coeurs" size={38} />,
};

/** Les quatre soins (nourrir, jouer, sieste, câlin) en gros boutons ronds. */
export function CareBar({ labels, available, onCare, onRefused, busy, showRefused = true, icons, style }: CareBarProps) {
  return (
    <View style={[styles.row, style]}>
      {CARE_ACTIONS.map((a) => (
        <CareButton
          key={a}
          label={labels[a].action}
          icon={icons?.[a] ?? DEFAULT_ICONS[a]}
          refused={!available[a]}
          refusedLabel={showRefused ? labels[a].refused : undefined}
          onRefusedPress={onRefused ? () => onRefused(a) : undefined}
          loading={busy === a}
          disabled={!!busy && busy !== a}
          onPress={() => onCare(a)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.xs },
});
