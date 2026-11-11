import type { ReactElement, ReactNode } from 'react';
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
}

/** Gabarit d'un onglet principal : marque, grand titre, contenu, place pour la barre flottante. */
export function TabTemplate({ brand, title, right, children, scroll = true, refreshControl }: TabTemplateProps) {
  return (
    <ScreenTemplate scroll={scroll} edges={['top']} bottomSpace={TAB_BAR_SPACE} refreshControl={refreshControl}>
      {brand || title || right ? (
        <View style={[layout.row, styles.head]}>
          <View style={layout.grow}>
            {brand ? (
              <Text variant="bodyBold" size={18} style={styles.brand}>
                {brand}
                <Text variant="bodyBold" size={18} color={color.accent}>
                  .
                </Text>
              </Text>
            ) : null}
            {title ? <Title text={title} size={64} numberOfLines={1} /> : null}
          </View>
          {right}
        </View>
      ) : null}
      <View style={[layout.gapMd, styles.body]}>{children}</View>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'flex-end', gap: space.md, paddingTop: space.xs },
  brand: { letterSpacing: -0.3 },
  body: { paddingTop: space.md },
});
