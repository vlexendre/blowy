import { dayOf } from '@blowy/domain';
import { memo, type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, type ListRenderItem, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Skeleton } from '../atoms/Skeleton';
import { DayChip } from '../molecules/DayChip';
import { MessageBubble, type MessageBubbleProps } from '../molecules/MessageBubble';
import { Appear, staggerDelay } from '../motion/Appear';
import { useReducedMotion } from '../lib/motion';
import { space } from '../theme';
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
  /**
   * Nom au-dessus d'une réplique de minimoa qui a un rôle (« nino · brise-glace »). Défaut : le nom du minimoa seul.
   * `name` est déjà en minuscules.
   */
  roleLabel?: (role: NonNullable<MessageLook['petRole']>, name: string) => string;
  /** Appui long sur un message de l'autre personne (signaler ce message). */
  onMessageLongPress?: (message: MessageLook) => void;
  /** Envoi optimiste : sous une bulle en route depuis un moment (« Envoi… »). */
  sendingLabel?: string;
  /** Envoi optimiste : sous une bulle pas partie (« Pas envoyé · Réessayer »). */
  failedLabel?: string;
  /** Toucher « Réessayer » sous une bulle pas partie. */
  onRetry?: (message: MessageLook) => void;
  /** Libellé lu de l'appui long. */
  longPressHint?: string;
  /**
   * Groupe (plusieurs autres) : qui a écrit un message `other` (clé, prénom, personne pour l'avatar). Deux messages
   * de suite de deux membres différents ne se regroupent pas. Sans lui : `other` pour tous.
   */
  whoIs?: (message: MessageLook) => { key: string; name: string; person: Pick<PersonLook, 'displayName' | 'avatarUrl' | 'face' | 'pet'> } | undefined;
  contentStyle?: StyleProp<ViewStyle>;
}

type Row = { kind: 'day'; key: string; label: string } | { kind: 'msg'; key: string; message: MessageLook; continued: boolean };

const groupable = (m: MessageLook): boolean => m.author !== 'system' && m.kind !== 'event';
/** Clé de ligne d'un message : celle de son brouillon s'il a été envoyé de façon optimiste. */
const rowKey = (m: MessageLook): string => m.key ?? m.id;

/** Un message de pet tout juste arrivé : attente avant ses « … », puis durée des « … ». */
const PET_FIRST = 380;
const PET_GAP = 1050;
const PET_TYPING = 760;

/** Rang de chaque message arrivé pendant que le fil est affiché (les plus anciens chargés en remontant n'en sont pas). */
type Fresh = Map<string, { petRank: number }>;

/** Ce que chaque ligne lit en plus de son message : change rarement (pas à chaque frappe ni à chaque message). */
interface RowContext {
  myPet: PetLook;
  other: ChatThreadProps['other'];
  otherName?: string;
  lockedPhotoLabel?: string;
  typingLabel?: ChatThreadProps['typingLabel'];
  roleLabel?: ChatThreadProps['roleLabel'];
  longPressHint?: string;
  whoIs?: ChatThreadProps['whoIs'];
  sendingLabel?: string;
  failedLabel?: string;
  /** Poignées stables (elles lisent la dernière version des props) ; absentes si l'écran n'en donne pas. */
  onPhotoPress?: (m: MessageLook) => void;
  onLongPress?: (m: MessageLook) => void;
  onRetry?: (m: MessageLook) => void;
}

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
  roleLabel,
  onMessageLongPress,
  longPressHint,
  whoIs,
  contentStyle,
  sendingLabel,
  failedLabel,
  onRetry,
}: ChatThreadProps) {
  // Messages déjà là : ceux qui arrivent ensuite (plus récents que tous) entrent en scène.
  const known = useRef<Set<string> | null>(null);
  const newest = useRef('');
  // Un message reste « tout juste arrivé » tant qu'il est monté (son entrée n'est pas coupée par un rendu suivant).
  const arrived = useRef<Fresh>(new Map());
  const fresh = useMemo<Fresh>(() => {
    if (!known.current) return arrived.current;
    let next: Fresh | null = null;
    let pets = 0;
    for (const m of messages) {
      const key = rowKey(m);
      if (known.current.has(key) || arrived.current.has(key)) continue;
      // Un brouillon (heure du téléphone) est toujours nouveau ; un message du serveur, s'il est plus récent que tous.
      if (!m.status && m.at < newest.current) continue;
      const isPet = m.author === 'my_pet' || m.author === 'other_pet';
      next ??= new Map(arrived.current);
      next.set(key, { petRank: isPet ? pets++ : -1 });
    }
    if (!next) return arrived.current;
    arrived.current = next;
    return next;
  }, [messages]);
  useEffect(() => {
    const set = known.current ?? new Set<string>();
    for (const m of messages) {
      set.add(rowKey(m));
      // L'heure d'un brouillon est celle du téléphone : elle ne sert pas de repère.
      if (!m.status && m.at > newest.current) newest.current = m.at;
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
      const continued =
        !!prev && prev.author === m.author && groupable(prev) && groupable(m) && (!whoIs || m.author !== 'other' || whoIs(prev)?.key === whoIs(m)?.key);
      out.push({ kind: 'msg', key: rowKey(m), message: m, continued });
      prevDay = day;
      prev = m;
    }
    return out.reverse();
  }, [messages, dayKey, dayLabel, whoIs]);

  // Les écrans passent souvent des fonctions recréées à chaque rendu : on garde la dernière, derrière des poignées
  // stables, pour que les lignes (mémoïsées) ne se redessinent pas toutes à chaque frappe.
  const latest = useRef({ onPhotoPress, onMessageLongPress, onRetry, onEndReached });
  latest.current = { onPhotoPress, onMessageLongPress, onRetry, onEndReached };
  const photo = useCallback((m: MessageLook) => latest.current.onPhotoPress?.(m), []);
  const longPress = useCallback((m: MessageLook) => latest.current.onMessageLongPress?.(m), []);
  const retry = useCallback((m: MessageLook) => latest.current.onRetry?.(m), []);
  const endReached = useCallback(() => latest.current.onEndReached?.(), []);
  const hasPhoto = !!onPhotoPress;
  const hasLongPress = !!onMessageLongPress;
  const hasRetry = !!onRetry;
  const ctx = useMemo<RowContext>(
    () => ({
      myPet,
      other,
      otherName,
      lockedPhotoLabel,
      typingLabel,
      roleLabel,
      longPressHint,
      whoIs,
      sendingLabel,
      failedLabel,
      onPhotoPress: hasPhoto ? photo : undefined,
      onLongPress: hasLongPress ? longPress : undefined,
      onRetry: hasRetry ? retry : undefined,
    }),
    [myPet, other, otherName, lockedPhotoLabel, typingLabel, roleLabel, longPressHint, whoIs, sendingLabel, failedLabel, hasPhoto, hasLongPress, hasRetry, photo, longPress, retry],
  );

  const renderItem = useCallback<ListRenderItem<Row>>(({ item, index }) => <ThreadRow item={item} index={index} fresh={fresh.get(item.key)} ctx={ctx} />, [fresh, ctx]);

  // Mon message vient de partir : le fil revient en bas, même si je lisais plus haut.
  const list = useRef<FlatList<Row>>(null);
  const bottomKey = rows[0]?.key;
  const bottom = rows[0];
  useEffect(() => {
    if (bottom?.kind === 'msg' && bottom.message.author === 'me' && fresh.has(bottom.key)) list.current?.scrollToOffset({ offset: 0, animated: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bottomKey]);

  if (messages.length === 0 && empty) return <View style={[styles.empty, contentStyle]}>{empty}</View>;

  return (
    <FlatList
      ref={list}
      inverted
      data={rows}
      keyExtractor={keyOfRow}
      renderItem={renderItem}
      onEndReached={endReached}
      onEndReachedThreshold={0.4}
      ListFooterComponent={loadingOlder ? <OlderSkeleton /> : header}
      contentContainerStyle={[styles.content, contentStyle]}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      // Un message qui arrive pendant qu'on lit plus haut ne fait pas sauter la lecture ; tout en bas, le fil le suit.
      maintainVisibleContentPosition={MAINTAIN}
      initialNumToRender={20}
      maxToRenderPerBatch={20}
      windowSize={11}
      showsVerticalScrollIndicator={false}
    />
  );
}

const keyOfRow = (r: Row): string => r.key;
const MAINTAIN = { minIndexForVisible: 1, autoscrollToTopThreshold: 120 } as const;

/** Une ligne du fil : ne se redessine que si son message, son regroupement ou son entrée changent. */
const ThreadRow = memo(
  function ThreadRow({ item, index, fresh, ctx }: { item: Row; index: number; fresh: { petRank: number } | undefined; ctx: RowContext }) {
    // Ouverture du fil (et pages plus anciennes) : courte cascade depuis le bas, une seule fois par message.
    const settle = (node: ReactElement) => (
      <Appear once={`chat:${item.key}`} distance={8} duration={180} delay={staggerDelay(index, 30)}>
        {node}
      </Appear>
    );
    if (item.kind === 'day') return settle(<DayChip label={item.label} />);
    const m = item.message;
    const { myPet, other, otherName, whoIs, roleLabel, typingLabel, onMessageLongPress } = { ...ctx, onMessageLongPress: ctx.onLongPress };
    const isOtherSide = m.author === 'other' || m.author === 'other_pet';
    const pet = m.author === 'my_pet' ? myPet : m.author === 'other_pet' ? other.pet : undefined;
    const who = m.author === 'other' ? whoIs?.(m) : undefined;
    const sender = who?.person ?? other;
    // Noms tels qu'ils s'écrivent, majuscule comprise (« Léa », « Pépite · brise-glace »).
    const plain = m.author === 'other' ? (who?.name ?? otherName ?? other.displayName) : pet?.name;
    const name = plain && pet && m.petRole && roleLabel ? roleLabel(m.petRole, plain) : plain;
    const reportable = m.author === 'other' && m.kind !== 'event' && !!onMessageLongPress;
    const props: MessageBubbleProps = {
      message: m,
      name,
      pet,
      person: isOtherSide ? sender : undefined,
      // Groupe : chaque membre se reconnaît à son minimoa (pas le disque dégradé du visage caché d'un lien).
      hiddenFace: m.author === 'other' && sender.face === 'hidden' && !who,
      continued: item.continued,
      onPhotoPress: ctx.onPhotoPress ? () => ctx.onPhotoPress?.(m) : undefined,
      lockedPhotoLabel: ctx.lockedPhotoLabel,
      fade: false,
      typingLabel: plain && typingLabel ? typingLabel(plain) : undefined,
      onLongPress: reportable ? () => onMessageLongPress?.(m) : undefined,
      longPressHint: reportable ? ctx.longPressHint : undefined,
      status: m.status,
      sendingLabel: ctx.sendingLabel,
      failedLabel: ctx.failedLabel,
      onRetry: m.status === 'failed' && ctx.onRetry ? () => ctx.onRetry?.(m) : undefined,
    };
    if (!fresh) return settle(<MessageBubble {...props} />);
    return <FreshBubble {...props} petRank={fresh.petRank} />;
  },
  // L'index ne sert qu'à la cascade d'ouverture (jouée une fois) : un message ajouté en bas ne redessine pas tout.
  (a, b) =>
    a.ctx === b.ctx &&
    a.fresh === b.fresh &&
    a.item.key === b.item.key &&
    (a.item.kind === 'day' || b.item.kind === 'day'
      ? a.item.kind === b.item.kind && (a.item as { label?: string }).label === (b.item as { label?: string }).label
      : a.item.message === b.item.message && a.item.continued === b.item.continued),
);

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
  loader: { gap: space.sm, paddingTop: space.md, paddingBottom: space.sm },
  mine: { alignSelf: 'flex-end' },
});

/** Anciens messages en route : deux bulles en squelette (l'une de l'autre personne, l'une à soi), à la place d'une roue. */
function OlderSkeleton() {
  return (
    <View style={styles.loader}>
      <Skeleton width="58%" height={44} radius="lg" />
      <Skeleton width="42%" height={36} radius="lg" delay={160} style={styles.mine} />
    </View>
  );
}
