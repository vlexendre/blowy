import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { color } from '../theme';
import type { TitleContent } from '../types';

export interface StreakHeadlineProps {
  /** « 12 JOURS D'AFFILÉE », la fin en orange (segment avec `color`). */
  title: TitleContent;
  /** « Une réponse par jour suffit. » */
  line?: string;
  /** Pas encore fait aujourd'hui : la flamme est un peu plus pâle. */
  low?: boolean;
  accessibilityLabel?: string;
}

/** La série en grand (V6-GSerie) : une flamme orange sur un halo, le nombre de jours, une ligne. */
export function StreakHeadline({ title, line, low, accessibilityLabel }: StreakHeadlineProps) {
  return (
    <View style={styles.root} accessible accessibilityLabel={accessibilityLabel}>
      <View pointerEvents="none" style={styles.glow}>
        <Svg width={200} height={150}>
          <Defs>
            <RadialGradient id="g" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={color.orange} stopOpacity={0.32} />
              <Stop offset="1" stopColor={color.orange} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width={200} height={150} fill="url(#g)" />
        </Svg>
      </View>
      <View style={low ? styles.low : null}>
        <Svg width={104} height={104} viewBox="0 0 24 24">
          <Path
            d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-3 1.5-4.5 2.5-6 .3 2 1.2 3 2.5 3-.5-3 0-5.5 0-8z"
            fill={color.orange}
          />
          <Path
            d="M12 11c.6 2 2.6 2.8 2.6 5.4a2.6 2.6 0 0 1-5.2 0c0-1.5.8-2.3 1.3-3 .2 1 .6 1.5 1.3 1.5-.3-1.5 0-2.7 0-3.9z"
            fill={color.accentSoft}
          />
        </Svg>
      </View>
      <Title text={title} size={44} center style={styles.title} />
      {line ? (
        <Text size={15} muted center style={styles.line}>
          {line}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center' },
  glow: { position: 'absolute', top: 0 },
  low: { opacity: 0.75 },
  title: { marginTop: 2 },
  line: { marginTop: 6, maxWidth: 300 },
});
