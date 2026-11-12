import { dayOf } from '@blowy/domain';
import { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, type ListRenderItem, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { DayChip } from '../molecules/DayChip';
import { MessageBubble, type MessageBubbleProps } from '../molecules/MessageBubble';
import { Appear, staggerDelay } from '../motion/Appear';
import { useReducedMotion } from '../lib/motion';
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
  /** Libellé lu des « … » d'un pet qui écrit (« gaston écrit… »). */
  typingLabel?: (name: string) => string;
  contentStyle?: StyleProp<ViewStyle>;
}

type Row = { kind: 'day'; key: string; label: string } | { kind: 'msg'; key: string; message: MessageLook; continued: boolean };

const groupable = (m: MessageLook): boolean => m.author !== 'system' && m.kind !== 'event';

/** Un message de pet tout juste arrivé : attente avant ses « … », puis durée des « … ». */
const PET_FIRST = 380;
const PET_GAP = 1050;
const PET_TYPING = 760;

/** Rang de chaque message arrivé pendant que le fil est affiché (les plus anciens chargés en remontant n'en sont pas). */
type Fresh = Map<string, { petRank: number }>;

/** Fil de discussion inversé (le plus récent en bas) avec séparateurs de jour et pagination vers le haut. */
export function ChatThread({
  messages,
  myPet,
  other,
  otherName,
  dayLabel,
  dayKey,
  onEndReached,
  loadingOlder,
  onPhotoPress,
  lockedPhotoLabel,
  header,
  empty,
  typingLabel,
  contentStyle,
}: ChatThreadProps) {
  // Messages déjà là : ceux qui arrivent ensuite (plus récents que tous) entrent en scène.
  const known = useRef<Set<string> | null>(null);
  const newest = useRef('');
  // Un message reste « tout juste arrivé » tant qu'il est monté (son entrée n'est pas coupée par un rendu suivant).
  const arrived = useRef<Fresh>(new Map());
  const fresh = useMemo<Fresh>(() => {
    if (!known.current) return arrived.current;
    const next: Fresh = new Map(arrived.current);
    let pets = 0;
    for (const m of messages) {
      if (known.current.has(m.id) || m.at < newest.current) continue;
      const isPet = m.author === 'my_pet' || m.author === 'other_pet';
      next.set(m.id, { petRank: isPet ? pets++ : -1 });
    }
    arrived.current = next;
    return next;
  }, [messages]);
  useEffect(() => {
    const set = known.current ?? new Set<string>();
    for (const m of messages) {
      set.add(m.id);
      if (m.at > newest.current) newest.current = m.at;
    }
    known.current = set;
  }, [messages]);

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
    ({ item, index }) => {
      // Ouverture du fil (et pages plus anciennes) : courte cascade depuis le bas, une seule fois par message.
      const settle = (node: ReactElement) => (
        <Appear once={`chat:${item.key}`} distance={8} duration={180} delay={staggerDelay(index, 30)}>
          {node}
        </Appear>
      );
      if (item.kind === 'day') return settle(<DayChip label={item.label} />);
      const m = item.message;
      const isOtherSide = m.author === 'other' || m.author === 'other_pet';
      const pet = m.author === 'my_pet' ? myPet : m.author === 'other_pet' ? other.pet : undefined;
      // Maquette : noms en minuscules au-dessus des bulles (« léa », « suzie »).
      const name = (m.author === 'other' ? (otherName ?? other.displayName) : pet?.name)?.toLowerCase();
      const props: MessageBubbleProps = {
        message: m,
        name,
        pet,
        person: isOtherSide ? other : undefined,
        hiddenFace: m.author === 'other' && other.face === 'hidden',
        continued: item.continued,
        onPhotoPress: onPhotoPress ? () => onPhotoPress(m) : undefined,
        lockedPhotoLabel,
        fade: false,
        typingLabel: name && typingLabel ? typingLabel(name) : undefined,
      };
      const f = fresh.get(m.id);
      if (!f) return settle(<MessageBubble {...props} />);
      return <FreshBubble {...props} petRank={f.petRank} />;
    },
    [myPet, other, otherName, onPhotoPress, lockedPhotoLabel, typingLabel, fresh],
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

/**
 * Message tout juste arrivé : le mien monte depuis le champ ; celui d'un pet attend son tour, montre ses « … »,
 * puis s'écrit ; celui de l'autre s'ouvre depuis son avatar. Sans animation : affiché tout de suite.
 */
function FreshBubble({ petRank, ...props }: MessageBubbleProps & { petRank: number }) {
  const reduced = useReducedMotion();
  const pet = petRank >= 0 && !reduced;
  const start = PET_FIRST + Math.max(0, petRank) * PET_GAP;
  const [phase, setPhase] = useState<'wait' | 'typing' | 'done'>(pet ? 'wait' : 'done');
  useEffect(() => {
    if (!pet) return;
    const a = setTimeout(() => setPhase('typing'), start);
    const b = setTimeout(() => setPhase('done'), start + PET_TYPING);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [pet, start]);
  if (phase === 'wait') return null;
  return <MessageBubble {...props} typing={phase === 'typing'} enter={props.message.author === 'me' ? 'send' : 'receive'} />;
}

const styles = StyleSheet.create({
  // Liste inversée : `paddingBottom` est le haut visuel (12 pt sous les onglets, dont 8 posés par l'en-tête du gabarit).
  content: { paddingHorizontal: space.md + 2, paddingTop: 0, paddingBottom: space.xs, gap: space.sm },
  empty: { flex: 1, justifyContent: 'center' },
  loader: { marginVertical: space.lg },
});
