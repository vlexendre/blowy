import { useTabBarSpace } from '../organisms/BottomTabBar';
import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '../atoms/IconButton';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { layout } from '../lib/styles';
import { Appear } from '../motion/Appear';
import { alpha, color, space } from '../theme';
import type { TitleContent } from '../types';

/**
 * Ce que l'en-tête et le pied laissent voir de la carte, en points depuis les bords de l'écran (mesuré) : la carte
 * y centre sa zone, et y range la mention légale d'Apple Plans (jamais sous un panneau).
 */
export interface MapFrame {
  /** Bas de l'en-tête (titre, zone). */
  top: number;
  /** Haut du pied (fiche, bandeaux, boutons), compté depuis le bas de l'écran. */
  bottom: number;
  /** Zones sûres de l'écran (encoche, barre d'accueil). */
  safeTop: number;
  safeBottom: number;
  /** Vrai une fois l'en-tête et le pied mesurés (avant : des valeurs par défaut). */
  measured: boolean;
}

export interface MapTemplateProps {
  /** La carte (vraie ou dessinée), en plein écran sous tout le reste ; en fonction, elle reçoit la partie visible. */
  map: ReactNode | ((frame: MapFrame) => ReactNode);
  title: TitleContent;
  /** « Ta zone : 1,5 km. Positions arrondies, jamais en direct. ». */
  subtitle?: string;
  /** Retour (écran poussé) ; absent quand la carte est un onglet. */
  onBack?: () => void;
  backLabel: string;
  /** Onglet : le pied flotte au-dessus de la barre d'onglets. */
  inTabs?: boolean;
  /** Sous le titre : où l'on est (`MapZoneBar`), à la place du sous-titre. */
  zone?: ReactNode;
  /** À droite du titre (interrupteur « discret »). */
  right?: ReactNode;
  /** Puce centrée au-dessus du pied (« 12 minimoas plus loin »). */
  badge?: ReactNode;
  /** Pied : fiche choisie, bandeau Minimoa+, boutons. */
  bottom?: ReactNode;
  /**
   * Feuille à crans (`PeopleSheet`, onglet Quartier) : posée au-dessus de la barre d'onglets, elle peut monter jusque
   * sous l'encoche. Le pied (fiche, puce) se range au-dessus de sa partie visible.
   */
  sheet?: ReactNode;
  /** Hauteur visible de la feuille (0 : cachée), telle que la feuille la donne une fois posée. */
  sheetVisible?: number;
}

/**
 * Écran de carte (maquette V6-GCarte) : la carte en plein écran, l'en-tête sur un fondu nuit (le titre reste lisible
 * sur la carte), et un pied flottant. Rien d'autre ne bouge ici : la vedette est la carte (les minimoas qui se posent).
 */
export function MapTemplate({ map, title, subtitle, zone, onBack, backLabel, right, badge, bottom, sheet, sheetVisible = 0, inTabs = false }: MapTemplateProps) {
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const [head, setHead] = useState<number | null>(null);
  const [foot, setFoot] = useState<number | null>(null);
  const sheetGap = inTabs ? tabSpace + space.xs : space.md + insets.bottom;
  const lifted = sheet && sheetVisible > 0 ? sheetVisible + space.sm : 0;
  const footGap = sheetGap + lifted;
  const frame: MapFrame = {
    // Le fondu sous l'en-tête laisse voir la carte : on n'en garde que le haut.
    top: Math.round((head ?? insets.top + 220) - space.xxl + space.sm),
    bottom: Math.round(bottom || badge ? footGap + (foot ?? 120) + space.sm : lifted > 0 ? footGap : inTabs ? tabSpace : insets.bottom + space.md),
    safeTop: insets.top,
    safeBottom: insets.bottom,
    measured: head !== null && (foot !== null || !(bottom || badge)),
  };
  const onHead = (e: LayoutChangeEvent) => setHead(e.nativeEvent.layout.height);
  const onFoot = (e: LayoutChangeEvent) => setFoot(e.nativeEvent.layout.height);
  return (
    <View style={styles.root}>
      {typeof map === 'function' ? map(frame) : map}
      <LinearGradient
        onLayout={onHead}
        pointerEvents="box-none"
        colors={[color.night, alpha(color.night, 0.92), alpha(color.night, 0)]}
        locations={[0, 0.55, 1]}
        style={[styles.head, { paddingTop: insets.top + space.sm }]}
      >
        <View style={[layout.row, styles.topRow]}>
          {onBack ? <IconButton glyph="back" label={backLabel} onPress={onBack} size={40} variant="back" /> : null}
          <View style={layout.grow} />
          {right}
        </View>
        <Title text={title} size={44} numberOfLines={2} />
        {subtitle ? (
          <Text size={15} muted style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
        {zone ? <View style={styles.zone}>{zone}</View> : null}
      </LinearGradient>
      {sheet ? (
        <View pointerEvents="box-none" style={[styles.sheet, { top: insets.top + space.md, bottom: sheetGap - space.xs }]}>
          {sheet}
        </View>
      ) : null}
      {bottom || badge ? (
        <Appear once="map:bottom" delay={320} distance={30} duration={300} style={[styles.bottom, { bottom: footGap }]} pointerEvents="box-none">
          <View onLayout={onFoot} pointerEvents="box-none" style={styles.footCol}>
            {badge ? (
              <View style={styles.badge} pointerEvents="box-none">
                {badge}
              </View>
            ) : null}
            {bottom}
          </View>
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
  zone: { marginTop: space.xs },
  bottom: { position: 'absolute', left: 14, right: 14 },
  sheet: { position: 'absolute', left: space.sm, right: space.sm },
  footCol: { gap: space.sm },
  badge: { flexDirection: 'row', justifyContent: 'center', paddingBottom: space.xs },
});
