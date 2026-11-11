import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { IconButton } from '../atoms/IconButton';
import { Text } from '../atoms/Text';
import { AvatarPair } from '../molecules/AvatarPair';
import { Hearts } from '../molecules/Hearts';
import { LevelPill } from '../molecules/LevelPill';
import { type SegmentedTabItem, SegmentedTabs } from '../molecules/SegmentedTabs';
import { layout } from '../lib/styles';
import { space } from '../theme';
import type { PersonLook, PetLook } from '../types';
import { ScreenTemplate } from './ScreenTemplate';

export interface LinkTemplateProps<K extends string = string> {
  other: PersonLook;
  myPet: PetLook;
  lives: number;
  ghost?: boolean;
  /** « niveau 3 › ». */
  levelLabel: string;
  onLevelPress?: () => void;
  onBack: () => void;
  backLabel?: string;
  /** Libellé lu des vies (« 5 vies sur 7 »). */
  livesLabel?: string;
  /** Onglets aujourd'hui · chat · souvenirs. */
  tabs: readonly SegmentedTabItem<K>[];
  activeTab: K;
  onTabChange: (key: K) => void;
  children?: ReactNode;
  /** Pied collant (composer du chat). */
  footer?: ReactNode;
  /** Corps défilant ; défaut faux (le chat gère sa liste). */
  scroll?: boolean;
}

/** Gabarit d'un lien : en-tête (pets, nom, vies, niveau), onglets, corps. */
export function LinkTemplate<K extends string>({
  other,
  myPet,
  lives,
  ghost,
  levelLabel,
  onLevelPress,
  onBack,
  backLabel = 'Retour',
  livesLabel,
  tabs,
  activeTab,
  onTabChange,
  children,
  footer,
  scroll = false,
}: LinkTemplateProps<K>) {
  const header = (
    <View style={layout.gapMd}>
      <View style={[layout.row, styles.top]}>
        <IconButton glyph="back" label={backLabel} onPress={onBack} size={40} />
        <AvatarPair size={40} first={{ pet: myPet, hidden: true }} second={{ pet: other.pet, uri: other.avatarUrl, face: other.face, name: other.displayName }} />
        <View style={[layout.grow, styles.who]}>
          <Text variant="bodyBold" size={19} numberOfLines={1} accessibilityRole="header">
            {other.displayName}
          </Text>
          <Hearts lives={lives} ghost={ghost} size={13} accessibilityLabel={livesLabel} />
        </View>
        <LevelPill label={levelLabel} onPress={onLevelPress} />
      </View>
      <SegmentedTabs items={tabs} activeKey={activeTab} onChange={onTabChange} />
    </View>
  );
  return (
    <ScreenTemplate header={header} footer={footer} scroll={scroll} padded={scroll}>
      {children}
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  top: { gap: space.md - 2 },
  who: { gap: space.xs },
});
