import { StyleSheet, View } from 'react-native';

import { Button } from '../atoms/Button';
import { Chip } from '../atoms/Chip';
import { ItemImage } from '../atoms/ItemImage';
import { Panel } from '../atoms/Panel';
import { Pressable } from '../atoms/Pressable';
import { ProgressBar } from '../atoms/ProgressBar';
import { Text } from '../atoms/Text';
import { RigourGauge } from '../molecules/RigourGauge';
import { layout } from '../lib/styles';
import { alpha, color, type GradientName, onGradient, radius, space } from '../theme';

export interface HabitCardProps<R extends string = string> {
  /** « Marcher ». */
  title: string;
  /** « Rythme · série de 9 · photo vers 18 h ». */
  meta: string;
  /** Picto à gauche (emoji). */
  emoji?: string;
  gradient?: GradientName;
  /** Vers le prochain objet : avancement et libellé (« La tasse à 1 habitude tenue »). */
  progress?: { value: number; label: string; itemId: string | null } | null;
  /**
   * Rythmes proposés et celui choisi, en deux pastilles dans la carte. Facultatif : l'écran des habitudes les range
   * dans la feuille « Régler » (`settings`) pour garder la carte courte.
   */
  rhythms?: readonly { id: R; label: string }[];
  rhythm?: R;
  onRhythm?: (id: R) => void;
  /** Rythme en cours d'enregistrement. */
  rhythmBusy?: boolean;
  /** Puce d'état du jour (« Fait aujourd'hui », « 2/3 cette semaine »). */
  status?: string | null;
  /** Phrase du minimoa après la dernière preuve. */
  line?: string | null;
  /** Action du jour (« Montrer la preuve ») : bouton sombre. */
  action?: { label: string; onPress: () => void } | null;
  /** Rigueur sur 28 jours (spéc. §25) : jauge sous l'avancement. */
  rigour?: { value: number | null; label: string; valueLabel: string; accessibilityLabel?: string } | null;
  /** Lien discret à droite de l'action : « Arrêter », ou « Régler » (rythme, arrêter) en feuille. */
  remove?: { label: string; onPress: () => void; accessibilityLabel: string } | null;
}

/**
 * Une habitude suivie (V6-GHabitudes) : panneau en dégradé, picto, nom, rythme et série, barre vers l'objet qu'elle
 * fait gagner (image réelle), l'action du jour, et (si fourni) le choix du rythme en deux pastilles.
 */
export function HabitCard<R extends string>({ title, meta, emoji, gradient = 'accent', progress, rhythms, rhythm, onRhythm, rhythmBusy = false, status, line, action, remove, rigour }: HabitCardProps<R>) {
  const ink = onGradient[gradient];
  const darkInk = ink === color.dark;
  return (
    <Panel gradient={gradient} radius={radius.card} padding="none" style={styles.panel}>
      <View style={[layout.rowTop, styles.head]}>
        {emoji ? (
          <Text size={26} style={styles.emoji} importantForAccessibility="no" accessibilityElementsHidden>
            {emoji}
          </Text>
        ) : null}
        <View style={layout.grow}>
          <Text variant="bodyHeavy" size={17} accessibilityRole="header">
            {title}
          </Text>
          <Text variant="bodyBold" size={13} style={styles.meta}>
            {meta}
          </Text>
          {status ? <Chip label={status} tone={darkInk ? 'dark' : 'light'} size="sm" style={styles.status} /> : null}
        </View>
        {progress?.itemId ? (
          <View style={[styles.item, { backgroundColor: alpha(color.white, darkInk ? 0.4 : 0.18) }]}>
            <ItemImage id={progress.itemId} size={38} />
          </View>
        ) : null}
      </View>
      {progress ? (
        <View style={[layout.row, styles.progress]}>
          <ProgressBar value={progress.value} height={7} color={darkInk ? color.dark : color.white} trackColor={alpha(darkInk ? color.dark : color.white, 0.18)} style={layout.fill} />
          <Text variant="bodyHeavy" size={13} numberOfLines={2} style={styles.progressLabel}>
            {progress.label}
          </Text>
        </View>
      ) : null}
      {rigour ? <RigourGauge value={rigour.value} label={rigour.label} valueLabel={rigour.valueLabel} accessibilityLabel={rigour.accessibilityLabel} ink={darkInk ? 'dark' : 'light'} /> : null}
      {line ? (
        <Text variant="bodyBold" size={14}>
          {line}
        </Text>
      ) : null}
      {rhythms && onRhythm ? (
      <View style={[layout.row, styles.track, { backgroundColor: alpha(color.dark, darkInk ? 0.22 : 0.3) }]} accessibilityRole="radiogroup">
        {rhythms.map((r) => {
          const on = r.id === rhythm;
          return (
            <Pressable
              key={r.id}
              onPress={() => !on && onRhythm(r.id)}
              disabled={rhythmBusy}
              haptic="selection"
              bounceKey={on}
              accessibilityRole="radio"
              accessibilityState={{ checked: on, busy: rhythmBusy && on }}
              accessibilityLabel={r.label}
              style={[styles.seg, on && styles.segOn]}
            >
              <Text variant="bodyHeavy" size={14} center color={on ? color.dark : darkInk ? color.dark : color.white} numberOfLines={1}>
                {r.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      ) : null}
      {action || remove ? (
        <View style={[layout.row, styles.actions, !action && styles.actionsEnd]}>
          {action ? <Button label={action.label} variant="dark" size="md" onPress={action.onPress} style={layout.fill} /> : null}
          {remove ? (
            <Pressable onPress={remove.onPress} accessibilityRole="button" accessibilityLabel={remove.accessibilityLabel} hitSlop={6} style={styles.remove}>
              <Text variant="bodyHeavy" size={15} style={styles.removeText}>
                {remove.label}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: { paddingHorizontal: space.md + 2, paddingTop: space.md + 2, paddingBottom: space.sm + 2, gap: space.sm + 2 },
  head: { gap: space.md },
  emoji: { lineHeight: 32 },
  meta: { opacity: 0.78, marginTop: 2 },
  status: { alignSelf: 'flex-start', marginTop: space.sm },
  item: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '4deg' }] },
  progress: { gap: space.md },
  progressLabel: { maxWidth: '52%', textAlign: 'right' },
  track: { borderRadius: radius.pill, padding: 4, gap: 4 },
  seg: { flex: 1, minHeight: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.sm },
  segOn: { backgroundColor: color.white },
  actions: { gap: space.md, justifyContent: 'space-between' },
  actionsEnd: { justifyContent: 'flex-end' },
  remove: { minHeight: 44, minWidth: 44, justifyContent: 'center', paddingHorizontal: space.sm },
  removeText: { opacity: 0.72, textDecorationLine: 'underline' },
});
