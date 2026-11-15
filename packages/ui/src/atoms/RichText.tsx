import type { TypeName } from '@blowy/tokens';
import type { StyleProp, TextStyle } from 'react-native';

import { normalizeRuns } from '../lib/runs';
import { Text, type TextProps } from './Text';

/** Un morceau de phrase : texte, et ce qui le distingue du reste (graisse, couleur, lien). */
export interface TextRun {
  text: string;
  variant?: TypeName;
  color?: string;
  muted?: boolean;
  dim?: boolean;
  /** Lien : souligné par `style`, jamais d'espace en tête. */
  onPress?: () => void;
  accessibilityRole?: TextProps['accessibilityRole'];
  style?: StyleProp<TextStyle>;
}

export interface RichTextProps extends Omit<TextProps, 'children'> {
  runs: readonly TextRun[];
}

const isPlain = (r: TextRun): boolean => !r.variant && !r.color && !r.muted && !r.dim && !r.onPress && !r.style;

/**
 * Phrase en plusieurs morceaux (mot en gras, nom en couleur, lien) : un seul `Text` parent, les morceaux imbriqués,
 * les espaces des jointures réglées une fois pour toutes (`lib/runs` : rien ne se perd, pas de double espace,
 * insécable avant « ? ! : ; »). À préférer à des `Text` côte à côte dans une rangée, qui perdent leurs espaces.
 */
export function RichText({ runs, variant, size, ...rest }: RichTextProps) {
  return (
    <Text variant={variant} size={size} {...rest}>
      {normalizeRuns(runs, { noLeadingSpace: (r) => !!r.onPress }).map((r, i) =>
        isPlain(r) ? (
          r.text
        ) : (
          <Text
            key={i}
            variant={r.variant ?? variant}
            size={size}
            color={r.color}
            muted={r.muted}
            dim={r.dim}
            onPress={r.onPress}
            accessibilityRole={r.accessibilityRole ?? (r.onPress ? 'link' : undefined)}
            style={r.style}
          >
            {r.text}
          </Text>
        ),
      )}
    </Text>
  );
}
