import { type ComponentRef, type ReactNode, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { IconButton } from '../atoms/IconButton';
import { Text } from '../atoms/Text';
import { AvatarPair } from '../molecules/AvatarPair';
import { Hearts } from '../molecules/Hearts';
import { LevelPill } from '../molecules/LevelPill';
import { type SegmentedTabItem, SegmentedTabs } from '../molecules/SegmentedTabs';
import { hapticFor } from '../lib/haptics';
import { layout } from '../lib/styles';
import { useBurst } from '../motion/MotionHost';
import { PopIn } from '../motion/PopIn';
import { space, veil } from '../theme';
import type { PersonLook, PetLook } from '../types';
import { ScreenTemplate, type ScreenTemplateProps } from './ScreenTemplate';

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
  /** Vies montrées à l'ouverture avant d'aller vers `lives` (0 après « ranimer » : les cœurs reviennent un à un). */
  livesFrom?: number;
  /** À incrémenter à chaque passage de niveau : la pastille de niveau rebondit et lâche des confettis. */
  levelUp?: number;
  /** Onglets aujourd'hui · chat · souvenirs. */
  tabs: readonly SegmentedTabItem<K>[];
  activeTab: K;
  onTabChange: (key: K) => void;
  children?: ReactNode;
  /** Pied collant (composer du chat). */
  footer?: ReactNode;
  /** Corps défilant ; défaut faux (le chat gère sa liste). */
  scroll?: boolean;
  /** Bouton « … » à droite de la pastille de niveau (signaler, bloquer, quitter). */
  onOptions?: () => void;
  optionsLabel?: string;
  /** Tirer pour rafraîchir (corps défilant seulement). */
  refreshControl?: ScreenTemplateProps['refreshControl'];
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
  livesFrom,
  levelUp = 0,
  tabs,
  activeTab,
  onTabChange,
  children,
  footer,
  scroll = false,
  onOptions,
  optionsLabel = 'Options',
  refreshControl,
}: LinkTemplateProps<K>) {
  const level = useRef<ComponentRef<typeof View>>(null);
  const burst = useBurst();
  useEffect(() => {
    if (!levelUp) return;
    hapticFor('celebrate');
    level.current?.measureInWindow((x, y, w, h) => burst({ kind: 'confetti', x: x + w / 2, y: y + h / 2 }));
  }, [levelUp, burst]);
  const header = (
    <View style={[styles.head, styles.inset]}>
      <View style={[layout.row, styles.top]}>
        <IconButton glyph="back" label={backLabel} onPress={onBack} size={40} style={styles.back} />
        <AvatarPair size={40} first={{ pet: myPet, hidden: true }} second={{ pet: other.pet, uri: other.avatarUrl, face: other.face, name: other.displayName }} />
        <View style={[layout.grow, styles.who]}>
          <Text variant="bodyHeavy" size={19} numberOfLines={1} accessibilityRole="header" style={styles.name}>
            {other.displayName}
          </Text>
          <Hearts lives={lives} ghost={ghost} from={livesFrom} size={14} accessibilityLabel={livesLabel} />
        </View>
        <View ref={level} collapsable={false} style={styles.level}>
          <PopIn trigger={levelUp} onMount={false}>
            <LevelPill label={levelLabel} onPress={onLevelPress} />
          </PopIn>
        </View>
        {onOptions ? <IconButton glyph="more" label={optionsLabel} onPress={onOptions} size={40} style={styles.back} /> : null}
      </View>
      <SegmentedTabs items={tabs} activeKey={activeTab} onChange={onTabChange} />
    </View>
  );
  return (
    <ScreenTemplate header={header} footer={footer} scroll={scroll} padded={false} contentStyle={scroll ? styles.inset : undefined} refreshControl={scroll ? refreshControl : undefined}>
      {children}
    </ScreenTemplate>
  );
}

// Maquettes (`.hd`, `.tabs3`) : en-tête à 14 pt des bords, onglets 10 pt sous la rangée du haut.
const EDGE = 14;

const styles = StyleSheet.create({
  head: { gap: 10, paddingTop: 2 },
  top: { gap: 10 },
  back: { backgroundColor: veil.track },
  who: { gap: space.xs },
  name: { lineHeight: 20 },
  level: { marginLeft: 'auto', paddingLeft: space.xs },
  /** Marges de 14 pt (le gabarit de base en met 16) ; le chat gère les siennes dans sa liste. */
  inset: { paddingHorizontal: EDGE },
});
