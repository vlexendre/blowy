import { StyleSheet, View } from 'react-native';

import { Button } from '../atoms/Button';
import { Card } from '../atoms/Card';
import { Chip } from '../atoms/Chip';
import { ItemImage } from '../atoms/ItemImage';
import { ProgressBar } from '../atoms/ProgressBar';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { color } from '../theme';
import type { TitleContent } from '../types';

export interface ItemDetailProps {
  /** Identifiant de l'objet. */
  id: string;
  /** « LA COURONNE » (Anton, partie estompée). */
  title: TitleContent;
  /** Où il se porte (« se pose sur la tête… »). */
  text?: string;
  /** Objet à gagner : la phrase de l'étape, l'avancement et une aide (« ton meilleur lien est au niveau 3. »). */
  goal?: { text: string; have: number; need: number; hint?: string };
  /** Puce violette (« bientôt disponible ») pour un objet premium. */
  note?: string;
  /** Bouton jaune vers l'endroit où on avance (« aller dans mes chats »). */
  action?: { label: string; onPress: () => void };
  closeLabel: string;
  onClose: () => void;
}

/** Fiche d'un objet de la garde-robe (V6-Objet) : visuel, nom, étape à franchir et raccourci. À poser dans une feuille. */
export function ItemDetail({ id, title, text, goal, note, action, closeLabel, onClose }: ItemDetailProps) {
  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <View style={styles.box}>
          <ItemImage id={id} size={84} />
        </View>
        <View style={styles.titles}>
          <Title text={title} size={34} />
          {text ? (
            <Text size={13} muted style={styles.text}>
              {text}
            </Text>
          ) : null}
          {note ? <Chip label={note} tone="violet" size="sm" style={styles.note} /> : null}
        </View>
      </View>
      {goal ? (
        <Card padding="none" style={styles.goal} accessibilityLabel={`${goal.text}, ${goal.have} / ${goal.need}`}>
          <View style={styles.goalRow}>
            <Text variant="bodyHeavy" size={15} style={styles.goalText}>
              {goal.text}
            </Text>
            <Text variant="bodyHeavy" size={15} color={color.accent}>
              {`${Math.min(goal.have, goal.need)} / ${goal.need}`}
            </Text>
          </View>
          <ProgressBar value={goal.need > 0 ? goal.have / goal.need : 0} height={9} style={styles.bar} />
          {goal.hint ? (
            <Text size={12} muted style={styles.hint}>
              {goal.hint}
            </Text>
          ) : null}
        </Card>
      ) : null}
      <View style={styles.actions}>
        {action ? <Button label={action.label} onPress={action.onPress} block={false} style={styles.primary} /> : null}
        <Button label={closeLabel} variant="ghost" onPress={onClose} block={false} style={action ? styles.close : styles.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  // Visuel 112 × 112, rayon 28, fond #221E3C ; écart 14.
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  box: { width: 112, height: 112, borderRadius: 28, backgroundColor: color.card, alignItems: 'center', justifyContent: 'center' },
  titles: { flex: 1, minWidth: 0 },
  text: { marginTop: 4, lineHeight: 18 },
  note: { marginTop: 8 },
  goal: { padding: 14, borderRadius: 24 },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  goalText: { flex: 1 },
  bar: { marginTop: 10 },
  hint: { marginTop: 8 },
  actions: { flexDirection: 'row', gap: 8 },
  primary: { flex: 1 },
  close: { width: 110 },
});
