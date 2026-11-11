import { StyleSheet, View } from 'react-native';

import { Button } from '../atoms/Button';
import { Panel } from '../atoms/Panel';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { PhotoTile } from '../molecules/PhotoTile';
import { StreakPill } from '../molecules/StreakPill';
import { layout } from '../lib/styles';
import { type GradientName, space } from '../theme';
import type { PetLook, TitleContent, TodayLook } from '../types';

export interface TodayCardLabels {
  /** « UNE PHOTO / PAR JOUR » (partie estompée en segment `dim`). */
  title: TitleContent;
  /** Unité de la série (« jours »). */
  streakUnit: string;
  /** Rappel sous les photos (« +1 vie quand vous avez posté tous les deux. »). */
  hint: string;
  /** Ma case : étiquette de la photo (« ta photo · 9:12 »), puce (« posté ✓ »), case vide (« prends ta photo »). */
  mine: { label?: string; badge?: string; emptyTitle: string; emptyCaption?: string };
  /** Sa case : en attente, posée mais cachée tant que je n'ai pas posté, étiquette quand visible. */
  theirs: { waitingTitle: string; waitingCaption?: string; lockedTitle: string; lockedCaption?: string; label?: string };
  /** Bouton d'action (« relancer léa », « prendre ma photo »). */
  cta: string;
}

export interface TodayCardProps {
  today: TodayLook;
  /** Pet de l'autre (il patiente dans sa case). */
  otherPet: PetLook;
  streak: number;
  labels: TodayCardLabels;
  onCta?: () => void;
  ctaLoading?: boolean;
  /** Toucher ma case (prendre / revoir ma photo). */
  onMinePress?: () => void;
  gradient?: GradientName;
}

/**
 * Photo du jour d'un lien. Quatre états : personne, moi seul, l'autre seul (cachée tant que je n'ai pas posté), les deux.
 */
export function TodayCard({ today, otherPet, streak, labels, onCta, ctaLoading, onMinePress, gradient = 'orange' }: TodayCardProps) {
  const both = today.mine && today.theirs;
  const theirState = !today.theirs ? 'pending' : both && today.theirPhotoUrl ? 'photo' : 'locked';
  return (
    <Panel gradient={gradient} padding="lg">
      <View style={[layout.rowTop, styles.top]}>
        <Title text={labels.title} size={42} style={layout.grow} />
        <StreakPill count={streak} label={labels.streakUnit} variant="stack" />
      </View>
      <View style={[layout.row, styles.photos]}>
        <PhotoTile
          state={today.mine ? 'photo' : 'empty'}
          uri={today.myPhotoUrl}
          badge={today.mine ? labels.mine.badge : undefined}
          label={today.mine ? labels.mine.label : undefined}
          title={today.mine ? undefined : labels.mine.emptyTitle}
          caption={today.mine ? undefined : labels.mine.emptyCaption}
          onPress={onMinePress}
          style={layout.fill}
        />
        <PhotoTile
          state={theirState}
          uri={both ? today.theirPhotoUrl : null}
          species={otherPet.species}
          title={theirState === 'pending' ? labels.theirs.waitingTitle : theirState === 'locked' ? labels.theirs.lockedTitle : undefined}
          caption={theirState === 'pending' ? labels.theirs.waitingCaption : theirState === 'locked' ? labels.theirs.lockedCaption : undefined}
          label={theirState === 'photo' ? labels.theirs.label : undefined}
          style={layout.fill}
        />
      </View>
      <View style={[layout.row, styles.bottom]}>
        <Text variant="bodyBold" size={13} style={layout.grow}>
          {labels.hint}
        </Text>
        {onCta ? <Button label={labels.cta} variant="dark" size="sm" onPress={onCta} loading={ctaLoading} style={styles.cta} /> : null}
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  top: { gap: space.sm },
  photos: { gap: space.md - 2, marginTop: space.md + 2 },
  bottom: { gap: space.md - 2, marginTop: space.md },
  cta: { height: 44 },
});
