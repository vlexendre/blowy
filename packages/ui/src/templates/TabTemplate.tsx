import type { ReactElement, ReactNode } from 'react';
import type { ScreenTemplateProps } from './ScreenTemplate';
import type { RefreshControlProps } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { TAB_BAR_SPACE } from '../organisms/BottomTabBar';
import { layout } from '../lib/styles';
import { color, space } from '../theme';
import type { TitleContent } from '../types';
import { ScreenTemplate } from './ScreenTemplate';

export interface TabTemplateProps {
  /** Mot-marque au-dessus du titre (« blowy »), suivi du point jaune. */
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
  /** Écart entre les blocs du contenu. Défaut 12. */
  gap?: number;
  /** Marge au-dessus du contenu. Défaut 12. */
  top?: number;
  /** Défilement (fonction ou gestionnaire Reanimated, ex. `PetRefresh`). */
  onScroll?: ScreenTemplateProps['onScroll'];
  scrollEventThrottle?: number;
}

/** Gabarit d'un onglet principal : marque, grand titre, contenu, place pour la barre flottante. */
export function TabTemplate({
  brand,
  title,
  right,
  children,
  scroll = true,
  refreshControl,
  gutter,
  gap = space.md,
  top = space.md,
  onScroll,
  scrollEventThrottle,
}: TabTemplateProps) {
  return (
    <ScreenTemplate
      scroll={scroll}
      edges={['top']}
      bottomSpace={TAB_BAR_SPACE}
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
            {title ? <Title text={title} size={64} numberOfLines={1} style={brand ? styles.title : undefined} /> : null}
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
