import { StyleSheet, View } from 'react-native';

import { Button, type ButtonVariant } from '../atoms/Button';
import { space } from '../theme';
import { useTabBarSpace } from './BottomTabBar';

export interface NowBarProps {
  /** L'action du moment (« Commencer la séance », « Malo t'a dit bonjour »). */
  label: string;
  /** Une ligne dessous (« 5 questions · puis 3 personnes qui te ressemblent »). */
  sub?: string | null;
  onPress: () => void;
  /** `accent` pour ce qui attend une action, `glass` quand la journée est faite. */
  variant?: Extract<ButtonVariant, 'accent' | 'glass'>;
  accessibilityLabel?: string;
}

/** Hauteur à réserver en bas du contenu d'un onglet qui affiche une `NowBar` (bouton + écart). */
export const NOW_BAR_SPACE = 76 + space.md;

/**
 * Un seul gros bouton, en bas, sous le pouce, juste au-dessus de la barre d'onglets : la chose à faire maintenant
 * (docs/SCREENS.md, « Accueil »). À poser hors du défilement, par-dessus l'écran.
 */
export function NowBar({ label, sub, onPress, variant = 'accent', accessibilityLabel }: NowBarProps) {
  const bottom = useTabBarSpace();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom }]}>
      <Button label={label} subLabel={sub ?? null} variant={variant} size="lg" onPress={onPress} accessibilityLabel={accessibilityLabel} block />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: space.md, right: space.md },
});
