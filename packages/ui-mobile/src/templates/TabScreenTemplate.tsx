import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { space } from '../foundations/theme';
import { Text } from '../atoms/Text';
import { TAB_BAR_SPACE } from '../organisms/TabBar';
import { ScreenFrame } from './ScreenFrame';

export interface TabScreenTemplateProps {
  title?: string;
  /** Barre haute (compteurs du Nid, actions). */
  topBar?: ReactNode;
  banner?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
  testID?: string;
}

/** Écran racine d'onglet : réserve l'espace de la barre flottante. */
export function TabScreenTemplate({ title, topBar, banner, children, scroll = true, testID }: TabScreenTemplateProps) {
  return (
    <ScreenFrame banner={banner} scroll={scroll} bottomSpace={TAB_BAR_SPACE} testID={testID}>
      {topBar ? <View style={styles.top}>{topBar}</View> : null}
      {title ? <Text variant="displayL">{title}</Text> : null}
      {children}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({ top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm } });
