/**
 * Compteur `.gnav .bdg` : min 16×16, marges 0 4, rayon 999, rose #FF3D7F, Inter 9 px 800→700,
 * anneau blanc `0 0 0 2px rgba(255,255,255,.9)`. Variante `plus` (`.pls`) : violet, 8 px, .04em,
 * hauteur 15. Toujours un texte, jamais une couleur seule.
 */
import { Text as RNText, View } from 'react-native';
import { color, textSpec, tone, type Tone } from '../foundations/theme';
import { badgeStyle } from './styles';
import { bodyFont } from '../foundations/typography';

export interface BadgeProps {
  label: string;
  tone?: Tone | 'pink';
  /** `count` (`.bdg`) par défaut ; `plus` = pastille « PLUS ». */
  kind?: 'count' | 'plus';
  /** Anneau blanc (sur barre d'onglets) ; vrai par défaut. */
  ring?: boolean;
  accessibilityLabel?: string;
}


export function Badge({ label, tone: t, kind = 'count', ring = true, accessibilityLabel }: BadgeProps) {
  const tt = t ?? (kind === 'plus' ? 'violet' : 'pink');
  const bg = tt === 'pink' ? color.pink : tone[tt].bg;
  const fg = tt === 'pink' ? color.white : tone[tt].fg;
  const sp = kind === 'count' ? textSpec.badge : textSpec.plus;
  return (
    <View accessible={!!accessibilityLabel} accessibilityLabel={accessibilityLabel} style={badgeStyle(kind, bg, ring)}>
      <RNText maxFontSizeMultiplier={1.4} style={[bodyFont(sp.size, sp.weight, sp.letterSpacingEm), { color: fg }]}>
        {label}
      </RNText>
    </View>
  );
}
