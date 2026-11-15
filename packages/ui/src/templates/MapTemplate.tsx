import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '../atoms/IconButton';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { layout } from '../lib/styles';
import { Appear } from '../motion/Appear';
import { alpha, color, space } from '../theme';
import type { TitleContent } from '../types';

export interface MapTemplateProps {
  /** La carte (vraie ou dessinée), en plein écran sous tout le reste. */
  map: ReactNode;
  title: TitleContent;
  /** « Ta zone : 1,5 km. Positions arrondies, jamais en direct. ». */
  subtitle?: string;
  onBack: () => void;
  backLabel: string;
  /** À droite du titre (interrupteur « discret »). */
  right?: ReactNode;
  /** Puce centrée au-dessus du pied (« 12 minimoas plus loin »). */
  badge?: ReactNode;
  /** Pied : fiche choisie, bandeau Blowy+, boutons. */
  bottom?: ReactNode;
}

/**
 * Écran de carte (maquette V6-GCarte) : la carte en plein écran, l'en-tête sur un fondu nuit (le titre reste lisible
 * sur la carte), et un pied flottant. Rien d'autre ne bouge ici : la vedette est la carte (les minimoas qui se posent).
 */
export function MapTemplate({ map, title, subtitle, onBack, backLabel, right, badge, bottom }: MapTemplateProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      {map}
      <LinearGradient
        pointerEvents="box-none"
        colors={[color.night, alpha(color.night, 0.92), alpha(color.night, 0)]}
        locations={[0, 0.55, 1]}
        style={[styles.head, { paddingTop: insets.top + space.sm }]}
      >
        <View style={[layout.row, styles.topRow]}>
          <IconButton glyph="back" label={backLabel} onPress={onBack} size={40} variant="back" />
          <View style={layout.grow} />
          {right}
        </View>
        <Title text={title} size={44} numberOfLines={2} />
        {subtitle ? (
          <Text size={15} muted style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </LinearGradient>
      {bottom || badge ? (
        <Appear once="map:bottom" delay={320} distance={30} duration={300} style={[styles.bottom, { bottom: space.md + insets.bottom }]} pointerEvents="box-none">
          {badge ? (
            <View style={styles.badge} pointerEvents="box-none">
              {badge}
            </View>
          ) : null}
          {bottom}
        </Appear>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.night, overflow: 'hidden' },
  head: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: 20, paddingBottom: space.xxl, gap: space.xs },
  topRow: { gap: space.sm, marginBottom: space.xs },
  subtitle: { maxWidth: 300 },
  bottom: { position: 'absolute', left: 14, right: 14, gap: space.sm },
  badge: { flexDirection: 'row', justifyContent: 'center', paddingBottom: space.xs },
});
