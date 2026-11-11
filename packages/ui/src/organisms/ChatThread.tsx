import { dayOf } from '@blowy/domain';
import { type ReactElement, useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, type ListRenderItem, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { DayChip } from '../molecules/DayChip';
import { MessageBubble } from '../molecules/MessageBubble';
import { color, space } from '../theme';
import type { MessageLook, PersonLook, PetLook } from '../types';

export interface ChatThreadProps {
  /** Messages dans l'ordre chronologique (du plus ancien au plus récent). */
  messages: readonly MessageLook[];
  myPet: PetLook;
  /** L'autre personne (son pet porte le nom et la couleur des messages `other_pet`). */
  other: Pick<PersonLook, 'displayName' | 'avatarUrl' | 'face' | 'pet'>;
  /** Nom affiché au-dessus des messages de l'autre. Défaut : `other.displayName`. */
  otherName?: string;
  /** Libellé d'un séparateur de jour à partir de `AAAA-MM-JJ` (« aujourd'hui · mardi »). */
  dayLabel: (day: string) => string;
  /** Jour civil d'un horodatage. Défaut : `dayOf` du domaine (Europe/Paris). */
  dayKey?: (at: string) => string;
  /** Charger la page précédente (haut du fil). */
  onEndReached?: () => void;
  loadingOlder?: boolean;
  onPhotoPress?: (message: MessageLook) => void;
  /** Texte d'une photo encore cachée (pas de `mediaUrl`). */
  lockedPhotoLabel?: string;
  /** Affiché en haut du fil (début de la conversation). */
  header?: ReactElement;
  /** Affiché quand il n'y a aucun message. */
  empty?: ReactElement;
  contentStyle?: StyleProp<ViewStyle>;
}

type Row = { kind: 'day'; key: string; label: string } | { kind: 'msg'; key: string; message: MessageLook; continued: boolean };

const groupable = (m: MessageLook): boolean => m.author !== 'system' && m.kind !== 'event';

/** Fil de discussion inversé (le plus récent en bas) avec séparateurs de jour et pagination vers le haut. */
export function ChatThread({ messages, myPet, other, otherName, dayLabel, dayKey, onEndReached, loadingOlder, onPhotoPress, lockedPhotoLabel, header, empty, contentStyle }: ChatThreadProps) {
  const rows = useMemo(() => {
    const keyOf = dayKey ?? ((at: string) => dayOf(new Date(at)));
    const out: Row[] = [];
    let prevDay: string | null = null;
    let prev: MessageLook | null = null;
    for (const m of messages) {
      const day = keyOf(m.at);
      if (day !== prevDay) {
        out.push({ kind: 'day', key: `day:${day}`, label: dayLabel(day) });
        prev = null;
      }
      const continued = !!prev && prev.author === m.author && groupable(prev) && groupable(m);
      out.push({ kind: 'msg', key: m.id, message: m, continued });
      prevDay = day;
      prev = m;
    }
    return out.reverse();
  }, [messages, dayKey, dayLabel]);

  const renderItem = useCallback<ListRenderItem<Row>>(
    ({ item }) => {
      if (item.kind === 'day') return <DayChip label={item.label} />;
      const m = item.message;
      const isOtherSide = m.author === 'other' || m.author === 'other_pet';
      const pet = m.author === 'my_pet' ? myPet : m.author === 'other_pet' ? other.pet : undefined;
      const name = m.author === 'other' ? (otherName ?? other.displayName) : pet?.name;
      return (
        <MessageBubble
          message={m}
          name={name}
          pet={pet}
          person={isOtherSide ? other : undefined}
          continued={item.continued}
          onPhotoPress={onPhotoPress ? () => onPhotoPress(m) : undefined}
          lockedPhotoLabel={lockedPhotoLabel}
        />
      );
    },
    [myPet, other, otherName, onPhotoPress, lockedPhotoLabel],
  );

  if (messages.length === 0 && empty) return <View style={[styles.empty, contentStyle]}>{empty}</View>;

  return (
    <FlatList
      inverted
      data={rows}
      keyExtractor={(r) => r.key}
      renderItem={renderItem}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      ListFooterComponent={loadingOlder ? <ActivityIndicator color={color.mute} style={styles.loader} /> : header}
      contentContainerStyle={[styles.content, contentStyle]}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      initialNumToRender={20}
      maxToRenderPerBatch={20}
      windowSize={11}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.md + 2, paddingVertical: space.md, gap: space.sm },
  empty: { flex: 1, justifyContent: 'center' },
  loader: { marginVertical: space.lg },
});
