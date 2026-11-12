import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '../atoms/Avatar';
import { Chip } from '../atoms/Chip';
import { IconButton } from '../atoms/IconButton';
import { Panel } from '../atoms/Panel';
import { PetImage } from '../atoms/PetImage';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { layout } from '../lib/styles';
import { alpha, color } from '../theme';
import type { PetLook, TitleContent } from '../types';

export interface EncounterStageProps {
  onBack: () => void;
  backLabel: string;
  /** Puce centrale (« par Malo · pote de pote »), avec le visage du pet de l'intermédiaire. */
  via?: { label: string; pet?: PetLook };
  /** Puce jaune à droite (« 91 % »). */
  compat: string;
  compatLabel?: string;
  /** Bouton « … » (signaler / bloquer). */
  onMore?: () => void;
  moreLabel?: string;
  me?: { pet: PetLook; label: string };
  them: { pet: PetLook; label: string };
  /** « ce qu'ils se sont dit, hier soir ». */
  saysLabel: string;
  /** Les bulles des pets. */
  children?: ReactNode;
  title: TitleContent;
  text?: string;
}

const PET = 196;

/** Panneau violet du détail d'une rencontre : les deux pets face à face, ce qu'ils se sont dit, « rien sans ton tap ». */
export function EncounterStage({ onBack, backLabel, via, compat, compatLabel, onMore, moreLabel, me, them, saysLabel, children, title, text }: EncounterStageProps) {
  return (
    <Panel gradient="violet" radius={32} padding="none" style={styles.panel}>
      <View style={layout.rowBetween}>
        <IconButton glyph="back" label={backLabel} onPress={onBack} size={40} />
        {via ? (
          <Chip label={via.label} left={via.pet ? <Avatar size={18} pet={via.pet} hidden /> : undefined} style={[styles.chip, styles.via]} />
        ) : null}
        <View style={[layout.row, styles.right]}>
          <Chip label={compat} tone="accent" accessibilityLabel={compatLabel} style={styles.chip} />
          {onMore ? <IconButton glyph="more" label={moreLabel ?? ''} onPress={onMore} size={32} /> : null}
        </View>
      </View>
      <View style={styles.stage}>
        {me ? (
          <View style={styles.mine} pointerEvents="none">
            <PetImage species={me.pet.species} mood="cote" size={PET} outline animation="breathe" />
          </View>
        ) : null}
        <View style={styles.theirs} pointerEvents="none">
          <PetImage species={them.pet.species} mood="salut" size={PET} outline animation="breathe" delay={500} />
        </View>
        {me ? <Chip label={me.label} tone="accent" style={[styles.chip, styles.meTag]} /> : null}
        <Chip label={them.label} tone="light" style={[styles.chip, styles.themTag]} />
      </View>
      <Text variant="bodyHeavy" size={11} style={styles.says}>
        {saysLabel}
      </Text>
      <View style={styles.thread}>{children}</View>
      <View style={styles.bottom}>
        <Title text={title} size={46} />
        {text ? (
          <Text size={14} style={styles.text}>
            {text}
          </Text>
        ) : null}
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: { flexGrow: 1, paddingTop: 14, paddingHorizontal: 16, paddingBottom: 16 },
  chip: { height: 26, paddingHorizontal: 11 },
  via: { backgroundColor: alpha(color.white, 0.16), flexShrink: 1 },
  right: { gap: 6 },
  stage: { height: 158, marginHorizontal: -16 },
  mine: { position: 'absolute', left: 16, bottom: -22 },
  theirs: { position: 'absolute', right: 12, bottom: -22 },
  meTag: { position: 'absolute', left: 34, top: 8, transform: [{ rotate: '-6deg' }] },
  themTag: { position: 'absolute', right: 30, top: 4, transform: [{ rotate: '5deg' }] },
  says: { opacity: 0.85, marginTop: 30, marginBottom: 8, letterSpacing: 1.32, textTransform: 'uppercase' },
  thread: { gap: 8 },
  bottom: { marginTop: 'auto', paddingTop: 10 },
  text: { marginTop: 6, lineHeight: 19 },
});
