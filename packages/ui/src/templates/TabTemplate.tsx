import type { ReactElement, ReactNode } from 'react';
import type { ScreenTemplateProps } from './ScreenTemplate';
import type { RefreshControlProps } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { useTabBarSpace } from '../organisms/BottomTabBar';
import { layout } from '../lib/styles';
import { color, density, space } from '../theme';
import type { TitleContent } from '../types';
import { ScreenTemplate } from './ScreenTemplate';

export interface TabTemplateProps {
  /** Mot-marque au-dessus du titre (« minimoa »), suivi du point jaune. */
  brand?: string;
  /** Grand titre (« CHATS · 5 ») ; peut être omis si le contenu commence par un panneau. */
  title?: TitleContent;
  /** Action à droite du titre (bouton +). */
  right?: ReactNode;
  children?: ReactNode;
  scroll?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
  /** Marges latérales. Défaut 16 (V6-Pet / V6-Rencontres : 12). */
  gutter?: number;
  /** Écart entre les blocs du contenu. Défaut 8 (`density.gap`). */
  gap?: number;
  /** Marge au-dessus du contenu. Défaut 8. */
  top?: number;
  /** Défilement (fonction ou gestionnaire Reanimated, ex. `PetRefresh`). */
  onScroll?: ScreenTemplateProps['onScroll'];
  scrollEventThrottle?: number;
  /** Place en plus en bas (ex. `NOW_BAR_SPACE` quand une `NowBar` flotte au-dessus de la barre d'onglets). */
  bottomExtra?: number;
}

/** Grand titre d'onglet (64 dans V6 ; 56 depuis la passe « densité »). */
const TAB_TITLE = 56;

/** Texte brut d'un titre (segments joints) pour le petit titre de la barre du haut. */
const plain = (t: TitleContent): string => (typeof t === 'string' ? t : t.map((s) => s.text).join(''));

/**
 * Gabarit d'un onglet principal : marque, grand titre, contenu, place pour la barre flottante.
 * Toute la hauteur : le contenu passe sous la barre d'état (verre flouté qui s'allume au défilement) ; quand le
 * grand titre sort de l'écran, un petit titre apparaît en haut. En bas, le dernier élément s'arrête au-dessus de la barre d'onglets.
 */
export function TabTemplate({
  brand,
  title,
  right,
  children,
  scroll = true,
  refreshControl,
  gutter,
  gap = density.gap,
  top = space.sm,
  onScroll,
  scrollEventThrottle,
  bottomExtra = 0,
}: TabTemplateProps) {
  const barSpace = useTabBarSpace();
  return (
    <ScreenTemplate
      scroll={scroll}
      edges={['top']}
      bottomSpace={barSpace + bottomExtra}
      compactTitle={title ? plain(title) : undefined}
      compactAfter={brand ? 104 : 80}
      refreshControl={refreshControl}
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
      contentStyle={gutter !== undefined ? { paddingHorizontal: gutter } : undefined}
    >
      {brand || title || right ? (
        <View style={[layout.row, styles.head]}>
          <View style={layout.grow}>
            {brand ? (
              <Text variant="bodyHeavy" size={18} style={styles.brand}>
                {brand}
                <Text variant="bodyHeavy" size={18} color={color.accent}>
                  .
                </Text>
              </Text>
            ) : null}
            {title ? (
              <Title
                text={title}
                size={TAB_TITLE}
                numberOfLines={1}
                style={brand ? styles.title : undefined}
              />
            ) : null}
          </View>
          {right ? <View style={styles.right}>{right}</View> : null}
        </View>
      ) : null}
      <View style={{ gap, paddingTop: top }}>{children}</View>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'flex-end', gap: space.md, paddingTop: space.xs },
  // Mot-marque : 18 px, graisse 800, letter-spacing -.02em.
  brand: { letterSpacing: -0.36, lineHeight: 24 },
  title: { marginTop: space.xs },
  right: { marginBottom: space.sm },
});
