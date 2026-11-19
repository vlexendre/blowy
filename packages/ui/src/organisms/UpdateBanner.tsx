import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner } from '../molecules/Banner';
import { color, radius, space } from '../theme';

export interface UpdateBannerProps {
  title: string;
  text: string;
  actionLabel: string;
  onAction: () => void;
  /** Masquer jusqu'à la prochaine version publiée. */
  onClose: () => void;
  closeLabel: string;
}

/**
 * Bandeau discret « nouvelle version » (docs/VERSIONING.md), posé en haut de l'écran par-dessus le contenu : une
 * version plus récente est publiée, celle-ci reste servie. Se ferme d'un geste.
 */
export function UpdateBanner({ title, text, actionLabel, onAction, onClose, closeLabel }: UpdateBannerProps) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { top: insets.top + space.xs }]}>
      {/* Fond plein sous le bandeau teinté : il reste lisible par-dessus n'importe quel écran. */}
      <View style={styles.backdrop}>
        <Banner tone="info" title={title} text={text} actionLabel={actionLabel} onAction={onAction} onClose={onClose} closeLabel={closeLabel} actionBelow />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: space.md, right: space.md },
  backdrop: {
    backgroundColor: color.night,
    borderRadius: radius.md,
    shadowColor: color.night,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
