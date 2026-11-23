import { LinearGradient } from 'expo-linear-gradient';
import { type ReactElement, type ReactNode, useCallback, useState } from 'react';
import { type LayoutChangeEvent, type ListRenderItem, type RefreshControlProps, StyleSheet, View } from 'react-native';
import Animated, { type useAnimatedScrollHandler } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '../atoms/Text';
import { ScrollLockProvider, useScrollLock } from '../lib/scroll-lock';
import { useTabBarSpace } from '../organisms/BottomTabBar';
import { type CheminStep, CheminStepRow } from '../organisms/CheminPath';
import { alpha, color } from '../theme';

/** Le chemin s'efface sur ses 32 derniers points, juste au-dessus de la barre d'onglets (`.chemin` de V6-GAccueil). */
const FADE = 32;
/** Marges latérales de l'accueil (`.contenu` : 14). */
const GUTTER = 14;
/** Écart entre les blocs du haut (`.contenu` : gap 10). */
const GAP = 10;

export interface HomeTemplateProps {
  /** Le haut de l'accueil, dans l'ordre : panneau du minimoa, ligne de série, carte de l'état du moment. */
  header: ReactNode;
  /** Les étapes du chemin, de la plus ancienne montrée à la dernière (liste virtualisée). */
  steps: readonly CheminStep[];
  /** Rang (dans tout le chemin) de la première étape montrée : les virages restent les mêmes d'un jour à l'autre. */
  firstIndex?: number;
  /** Étiquette de l'étape du jour (« Commencer »). */
  startLabel: string;
  onStart?: () => void;
  /** Sous la dernière étape montrée : la suite se débloque au fil des séances (d'autres univers suivent). */
  endNote?: string;
  /** À la place du chemin (chargement, erreur avec « Réessayer »). */
  footer?: ReactNode;
  /** Tirer pour rafraîchir (`PetRefresh`). */
  refreshControl?: ReactElement<RefreshControlProps>;
  onScroll?: ReturnType<typeof useAnimatedScrollHandler>;
  scrollEventThrottle?: number;
}

/**
 * Gabarit de l'accueil (V6-GAccueil) : une seule liste virtualisée (`FlatList`) dont l'en-tête porte le panneau du
 * minimoa et l'état du moment, et dont les lignes sont les étapes du chemin. Tout défile d'un bloc : en très grand
 * texte rien n'est coupé, et à 375×667 l'étape du jour tient dans le premier écran sans défiler. La barre d'état reste
 * opaque ; au-dessus de la barre d'onglets, le chemin s'efface en fondu (rien n'est coupé net). Fournit le verrou de
 * défilement (`useScrollLock`) : attraper le minimoa ou glisser un soin bloque le défilement le temps du geste.
 */
export function HomeTemplate(props: HomeTemplateProps) {
  return (
    <ScrollLockProvider>
      <HomeList {...props} />
    </ScrollLockProvider>
  );
}

function HomeList({ header, steps, firstIndex = 0, startLabel, onStart, endNote, footer, refreshControl, onScroll, scrollEventThrottle }: HomeTemplateProps) {
  const { locked } = useScrollLock();
  const insets = useSafeAreaInsets();
  const barSpace = useTabBarSpace();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width) - GUTTER * 2);
  const last = steps.length - 1;
  const renderItem: ListRenderItem<CheminStep> = useCallback(
    ({ item, index }) =>
      width > 0 ? (
        <CheminStepRow step={item} index={firstIndex + index} first={firstIndex + index === 0} last={index === last} width={width} startLabel={startLabel} onStart={onStart} />
      ) : null,
    [width, firstIndex, last, startLabel, onStart],
  );
  // Fondu : transparent 32 pt au-dessus de la barre, puis la nuit jusqu'en bas (la barre de verre flotte dessus).
  const fadeHeight = barSpace + FADE;
  return (
    <View style={styles.fill} onLayout={onLayout}>
      <Animated.FlatList
        data={steps}
        keyExtractor={(s) => s.key}
        renderItem={renderItem}
        extraData={width}
        ListHeaderComponent={<View style={styles.header}>{header}</View>}
        // L'en-tête passe devant les lignes du chemin : le minimoa attrapé (sorti de son panneau) reste au-dessus.
        ListHeaderComponentStyle={styles.headerCell}
        ListFooterComponent={
          footer ? (
            <View style={styles.footer}>{footer}</View>
          ) : endNote ? (
            <Text muted center size={15} style={styles.endNote}>
              {endNote}
            </Text>
          ) : undefined
        }
        scrollEnabled={!locked}
        contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: barSpace + FADE, paddingHorizontal: GUTTER }}
        refreshControl={refreshControl}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        windowSize={7}
        maxToRenderPerBatch={8}
      />
      <View pointerEvents="none" style={[styles.status, { height: insets.top }]} />
      <LinearGradient
        pointerEvents="none"
        colors={[alpha(color.night, 0), color.night, color.night]}
        locations={[0, FADE / fadeHeight, 1]}
        style={[styles.fade, { height: fadeHeight }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: color.night },
  header: { gap: GAP, paddingBottom: GAP },
  headerCell: { zIndex: 2, elevation: 2 },
  endNote: { paddingTop: GAP, paddingHorizontal: GUTTER },
  footer: { paddingTop: GAP },
  status: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: color.night },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
