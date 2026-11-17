import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { IconButton } from '../atoms/IconButton';
import { Text } from '../atoms/Text';
import { AvatarStack } from '../molecules/AvatarStack';
import { LifeSparks } from '../molecules/LifeSparks';
import { type SegmentedTabItem, SegmentedTabs } from '../molecules/SegmentedTabs';
import { StreakPill } from '../molecules/StreakPill';
import { layout } from '../lib/styles';
import { useUiStrings } from '../lib/strings';
import { space, veil } from '../theme';
import type { PetLook } from '../types';
import { ScreenTemplate, type ScreenTemplateProps } from './ScreenTemplate';

export interface GroupTemplateProps<K extends string = string> {
  name: string;
  /** Minimoas des membres (les autres d'abord). */
  pets: readonly PetLook[];
  /** Groupe d'habitude : vies (même étincelle que les liens) et série ; null pour un groupe libre. */
  habit?: { lives: number; maxLives: number; streak: number; streakUnit: string; livesLabel: string } | null;
  /** Ligne sous le nom d'un groupe libre ou endormi (« 3 membres », « Endormi »). */
  caption?: string;
  onBack: () => void;
  backLabel?: string;
  tabs: readonly SegmentedTabItem<K>[];
  activeTab: K;
  onTabChange: (key: K) => void;
  /** Bandeau sous les onglets. */
  notice?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Corps défilant ; défaut faux (le chat gère sa liste). */
  scroll?: boolean;
  refreshControl?: ScreenTemplateProps['refreshControl'];
}

/** Gabarit d'un groupe : en-tête (minimoas empilés, nom, vies et série d'un groupe d'habitude), onglets, corps. */
export function GroupTemplate<K extends string>({
  name,
  pets,
  habit,
  caption,
  onBack,
  backLabel,
  tabs,
  activeTab,
  onTabChange,
  notice,
  children,
  footer,
  scroll = false,
  refreshControl,
}: GroupTemplateProps<K>) {
  const uiStrings = useUiStrings();
  const header = (
    <View style={[styles.head, styles.inset]}>
      <View style={[layout.row, styles.top]}>
        <IconButton glyph="back" label={backLabel ?? uiStrings.back} onPress={onBack} size={40} style={styles.back} />
        <AvatarStack people={pets.map((pet) => ({ pet, hidden: true }))} size={30} max={3} />
        <View style={[layout.grow, styles.who]}>
          <Text variant="bodyHeavy" size={17} numberOfLines={1} accessibilityRole="header" style={styles.name}>
            {name}
          </Text>
          {habit && !caption ? (
            <LifeSparks lives={habit.lives} max={habit.maxLives} size={14} accessibilityLabel={habit.livesLabel} />
          ) : caption ? (
            <Text size={13} muted numberOfLines={1}>
              {caption}
            </Text>
          ) : null}
        </View>
        {habit && habit.streak > 0 ? <StreakPill count={habit.streak} label={habit.streakUnit} /> : null}
      </View>
      <SegmentedTabs items={tabs} activeKey={activeTab} onChange={onTabChange} />
      {notice}
    </View>
  );
  return (
    <ScreenTemplate header={header} footer={footer} scroll={scroll} padded={false} contentStyle={scroll ? styles.inset : undefined} refreshControl={scroll ? refreshControl : undefined}>
      {children}
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  head: { gap: 10, paddingTop: 2 },
  top: { gap: 10 },
  back: { backgroundColor: veil.track },
  who: { gap: space.xs, minWidth: 0 },
  name: { lineHeight: 20 },
  inset: { paddingHorizontal: 14 },
});
