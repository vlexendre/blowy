import { MAX_LIVES } from '@blowy/domain';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '../atoms/Avatar';
import { Button } from '../atoms/Button';
import { Chip } from '../atoms/Chip';
import { Panel } from '../atoms/Panel';
import { PetImage } from '../atoms/PetImage';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { Hearts } from '../molecules/Hearts';
import { layout } from '../lib/styles';
import { color, radius, space, veil } from '../theme';
import type { PetLook, TitleContent } from '../types';

export interface GhostPanelProps {
  /** Ton pet, en version fantôme. */
  pet: PetLook;
  /** « TU L'AS / GHOSTÉ. » */
  title: TitleContent;
  text?: string;
  /** Ce que dit ton pet, et le nom au-dessus (« nino, version fantôme »). */
  speech?: string;
  speakerLabel?: string;
  /** Le lien peut encore être ranimé (une seule fois). */
  canRevive: boolean;
  reviveLabel: string;
  /** Complément estompé (« (une seule fois) »). */
  reviveHint?: string;
  /** Affiché quand le lien a déjà été ranimé (« déjà ranimé une fois »). */
  alreadyRevivedLabel: string;
  leaveLabel?: string;
  onRevive?: () => void;
  onLeave?: () => void;
  reviving?: boolean;
}

/** Lien fantôme : pet transparent, explication, ranimer (une fois) ou laisser partir. */
export function GhostPanel({ pet, title, text, speech, speakerLabel, canRevive, reviveLabel, reviveHint, alreadyRevivedLabel, leaveLabel, onRevive, onLeave, reviving }: GhostPanelProps) {
  return (
    <Panel gradient="wine" padding="xl" style={styles.panel}>
      <Hearts lives={0} max={MAX_LIVES} ghost style={styles.hearts} />
      <Title text={title} variant="hero" />
      {text ? (
        <Text variant="bodyBold" size={17}>
          {text}
        </Text>
      ) : null}
      <View style={styles.stage}>
        {speech ? (
          <View style={[layout.rowTop, layout.gapSm, styles.speech]}>
            <Avatar size={30} pet={pet} hidden pose="fantome" />
            <View style={layout.shrink}>
              {speakerLabel ? (
                <Text variant="bodyBold" size={11} style={styles.who}>
                  {speakerLabel}
                </Text>
              ) : null}
              <View style={styles.bubble}>
                <Text variant="body" size={15}>
                  {speech}
                </Text>
              </View>
            </View>
          </View>
        ) : null}
        <PetImage species={pet.species} mood="fantome" size={200} animation="bob" style={styles.ghost} />
      </View>
      <View style={layout.gapSm}>
        {canRevive ? (
          <Button label={reviveLabel} hint={reviveHint} variant="white" onPress={onRevive} loading={reviving} />
        ) : (
          <Chip label={alreadyRevivedLabel} tone="glass" size="lg" style={styles.done} />
        )}
        {leaveLabel && onLeave ? <Button label={leaveLabel} variant="ghost" onPress={onLeave} /> : null}
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: { gap: space.md },
  hearts: { alignSelf: 'flex-end' },
  stage: { minHeight: 260, justifyContent: 'flex-end', alignItems: 'center' },
  speech: { position: 'absolute', top: 0, left: 0, right: space.xxxl, zIndex: 1 },
  who: { marginLeft: space.xs, marginBottom: 3 },
  bubble: { padding: space.md, borderRadius: radius.md, borderTopLeftRadius: space.xs + 2, backgroundColor: color.dark, borderWidth: 1, borderColor: veil.glass },
  ghost: { opacity: 0.9 },
  done: { alignSelf: 'stretch', justifyContent: 'center' },
});
