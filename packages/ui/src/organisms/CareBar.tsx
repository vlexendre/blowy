import { CARE_ACTIONS, type CareAction } from '@blowy/domain';
import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { CareIcon } from '../atoms/CareIcon';
import { CareButton } from '../molecules/CareButton';
import { color, size as sizes, veil } from '../theme';

export interface CareBarProps {
  /** Libellés des gestes (`careLabel` de @blowy/content accepté tel quel). */
  labels: Record<CareAction, { action: string; refused: string }>;
  /** Gestes que le pet accepte maintenant (`canCare(needs, action)`) ; les autres sont estompés. */
  available: Record<CareAction, boolean>;
  onCare: (action: CareAction) => void;
  /** Appui sur un geste refusé. */
  onRefused?: (action: CareAction) => void;
  /** Gestes conseillés (disque jaune). */
  hot?: Partial<Record<CareAction, boolean>>;
  /** Geste en cours d'envoi : les autres sont inactifs. */
  busy?: CareAction | null;
  /** Pictos à la place des `CareIcon`. */
  icons?: Partial<Record<CareAction, ReactNode>>;
  style?: StyleProp<ViewStyle>;
}

/** Les quatre soins (nourrir, jouer, sieste, câlin) dans une carte, en disques ronds (V6-Accueil). */
export function CareBar({ labels, available, onCare, onRefused, hot, busy, icons, style }: CareBarProps) {
  return (
    <View style={[styles.card, style]}>
      {CARE_ACTIONS.map((a) => (
        <CareButton
          key={a}
          label={labels[a].action}
          icon={icons?.[a] ?? <CareIcon name={a} size={30} />}
          hot={!!hot?.[a]}
          refused={!available[a]}
          refusedLabel={labels[a].refused}
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
  // `.card.row` : padding 12 6, rayon 26.
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 26,
    backgroundColor: color.panel,
    borderWidth: sizes.border,
    borderColor: veil.line,
  },
});
