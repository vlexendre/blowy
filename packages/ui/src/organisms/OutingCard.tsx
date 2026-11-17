import { StyleSheet, View } from 'react-native';

import { Card } from '../atoms/Card';
import { Chip } from '../atoms/Chip';
import { Glyph } from '../atoms/Glyph';
import { Loader } from '../atoms/Loader';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { OutingChoice } from '../molecules/OutingChoice';
import { Appear } from '../motion/Appear';
import { PopIn } from '../motion/PopIn';
import { alpha, color, density, radius, space, veil } from '../theme';

export interface OutingAnswerLook<K extends string = string> {
  id: K;
  /** « Oui, j’ai vu du monde » (servi par l'API). */
  label: string;
  /** Petit visuel au-dessus du libellé (emoji). */
  emoji?: string;
  /** Libellé court pour la forme `compact` (« Vu du monde ») ; défaut `label`. */
  short?: string;
}

export interface OutingCardProps<K extends string = string> {
  /** « Tu as mis le nez dehors aujourd’hui ? » (servi par l'API). */
  question: string;
  answers: readonly OutingAnswerLook<K>[];
  /** Dernière réponse du jour. */
  picked: K | null;
  /** On peut encore répondre (« pas encore » laisse la question ouverte). */
  canAnswer: boolean;
  /** Réponse en cours d'envoi. */
  busy?: K | null;
  onAnswer: (id: K) => void;
  /** Ce que le minimoa a répondu (après une réponse). */
  line?: string | null;
  /** Puce « confirmé par ta position » quand une position hors de chez soi a compté. */
  confirmedLabel?: string | null;
  /** Mis en avant (le minimoa a besoin de sortir) : filet jaune. */
  highlight?: boolean;
  /** Forme courte de l'accueil : la question, trois tuiles de réponse ; une sortie comptée devient une ligne. */
  compact?: boolean;
  /** Titre de la ligne « sortie comptée » de la forme courte (« Sortie comptée »). */
  doneLabel?: string;
  /** La réponse qui ne compte pas de sortie (« pas encore ») : choix calme, sans étincelles ni battement. */
  stayId?: K;
}

/**
 * La question du jour du minimoa (V6-GAccueil) : trois grandes réponses. Une sortie comptée replie la carte sur la
 * réponse choisie et la phrase du minimoa ; « pas encore » garde la question ouverte.
 */
export function OutingCard<K extends string>({
  question,
  answers,
  picked,
  canAnswer,
  busy = null,
  onAnswer,
  line,
  confirmedLabel,
  highlight = false,
  compact = false,
  doneLabel,
  stayId,
}: OutingCardProps<K>) {
  const chosen = answers.find((a) => a.id === picked);
  if (!canAnswer && chosen && compact) {
    // Sortie comptée : une ligne calme (disque cerclé de jaune, l'emoji, « Sortie comptée », la réponse). La phrase du
    // minimoa est dans sa bulle.
    const detail = [chosen.short ?? chosen.label, confirmedLabel].filter(Boolean).join(' · ');
    return (
      <Appear key={`done:${chosen.id}`} from="below" distance={8}>
        <Card padding="none" style={styles.doneRow}>
          <View
            accessible
            accessibilityLabel={[doneLabel, chosen.label, confirmedLabel].filter(Boolean).join(', ')}
            style={styles.doneInner}
          >
            <View style={styles.doneDisc}>
              <PopIn trigger={chosen.id} from={0.3}>
                {chosen.emoji ? (
                  <Text
                    size={19}
                    style={styles.doneEmoji}
                    importantForAccessibility="no"
                    accessibilityElementsHidden
                  >
                    {chosen.emoji}
                  </Text>
                ) : (
                  <Glyph name="check" size={18} color={color.dark} />
                )}
              </PopIn>
              <PopIn trigger={chosen.id} delay={160} style={styles.doneCheck}>
                <Glyph name="check" size={10} color={color.dark} />
              </PopIn>
            </View>
            <View style={layout.grow}>
              {doneLabel ? (
                <Text variant="bodyHeavy" size={15} numberOfLines={1}>
                  {doneLabel}
                </Text>
              ) : null}
              <Text size={13} muted numberOfLines={2}>
                {detail}
              </Text>
            </View>
          </View>
        </Card>
      </Appear>
    );
  }
  if (!canAnswer && chosen) {
    return (
      <Card padding="none" style={styles.card}>
        <Text variant="bodyHeavy" size={15} muted>
          {question}
        </Text>
        <View style={[layout.row, layout.gapSm, styles.chips]}>
          <PopIn trigger={chosen.id}>
            <Chip
              label={chosen.emoji ? `${chosen.emoji} ${chosen.label}` : chosen.label}
              tone="accent"
              size="md"
            />
          </PopIn>
          {confirmedLabel ? <Chip label={confirmedLabel} tone="glass" size="md" /> : null}
        </View>
        {line ? (
          <Appear key={line} from="below" distance={6}>
            <Text variant="bodyBold" size={15}>
              {line}
            </Text>
          </Appear>
        ) : null}
      </Card>
    );
  }
  if (compact) {
    // Forme de l'accueil : la question, puis trois tuiles (emoji + mot) qui se lisent comme des choix.
    return (
      <Card
        padding="none"
        highlight={highlight ? color.accent : undefined}
        style={[styles.card, styles.cardCompact, highlight && styles.lit]}
      >
        <Text
          variant="bodyHeavy"
          size={16}
          numberOfLines={2}
          accessibilityRole="header"
          style={styles.question}
        >
          {question}
        </Text>
        <View style={[layout.row, styles.tiles]}>
          {answers.map((a, i) => (
            <OutingChoice
              key={a.id}
              emoji={a.emoji}
              label={a.short ?? a.label}
              accessibilityLabel={a.label}
              tone={a.id === stayId ? 'stay' : 'go'}
              selected={picked === a.id && busy === null}
              pending={busy === a.id}
              dimmed={busy !== null && busy !== a.id}
              pulse={highlight && a.id !== stayId}
              pulseDelay={900 + i * 140}
              onPress={() => onAnswer(a.id)}
            />
          ))}
        </View>
      </Card>
    );
  }
  return (
    <Card padding="none" highlight={highlight ? color.accent : undefined} style={styles.card}>
      <Text variant="bodyHeavy" size={17} accessibilityRole="header">
        {question}
      </Text>
      <View style={[layout.row, styles.answers]}>
        {answers.map((a) => {
          const selected = picked === a.id;
          const loading = busy === a.id;
          return (
            <Pressable
              key={a.id}
              onPress={() => onAnswer(a.id)}
              disabled={busy !== null}
              haptic="medium"
              bounceKey={selected}
              accessibilityRole="button"
              accessibilityLabel={a.label}
              accessibilityState={{ selected, busy: loading, disabled: busy !== null }}
              style={[styles.answer, selected && styles.selected]}
            >
              {loading ? (
                <Loader color={selected ? color.dark : 'accent'} />
              ) : a.emoji ? (
                <Text
                  size={22}
                  style={styles.emoji}
                  importantForAccessibility="no"
                  accessibilityElementsHidden
                >
                  {a.emoji}
                </Text>
              ) : null}
              <Text
                variant="bodyHeavy"
                size={14}
                center
                color={selected ? color.dark : color.white}
                numberOfLines={3}
              >
                {a.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {line ? (
        <Appear key={line} from="below" distance={6}>
          <Text variant="bodyBold" size={15} color={veil.text}>
            {line}
          </Text>
        </Appear>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  // V6-GAccueil : carte nuit, trois tuiles de même largeur (échelle de densité : intérieur 14, rayon des cartes).
  card: { borderRadius: radius.card, padding: density.cardPad, gap: space.md },
  // Forme courte : 10 × 12, question puis trois tuiles de 56 (V6-GAccueil `.ans`).
  cardCompact: { paddingVertical: space.sm + 2, paddingHorizontal: space.md, gap: space.sm },
  // Le minimoa a besoin de sortir : même voile jaune que le défi à faire (`ChallengeEntry`).
  lit: { backgroundColor: alpha(color.accent, 0.08) },
  question: { paddingHorizontal: 2 },
  tiles: { gap: space.sm, alignItems: 'stretch' },
  // Sortie comptée : une ligne d'entrée (56), disque cerclé de jaune avec l'emoji et une petite coche verte.
  doneRow: {
    justifyContent: 'center',
    minHeight: density.entryRow,
    borderRadius: radius.card,
    paddingVertical: space.sm,
    paddingHorizontal: density.cardPad,
  },
  doneInner: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  doneDisc: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: color.card,
    borderWidth: 2,
    borderColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneEmoji: { lineHeight: 24 },
  doneCheck: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: color.ok,
    borderWidth: 2,
    borderColor: color.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { flexWrap: 'wrap' },
  answers: { gap: space.sm, alignItems: 'stretch' },
  answer: {
    flex: 1,
    minHeight: 72,
    borderRadius: radius.md,
    paddingHorizontal: space.sm,
    paddingVertical: space.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    backgroundColor: veil.glass,
    borderWidth: 1,
    borderColor: alpha(color.white, 0.08),
  },
  selected: { backgroundColor: color.accent, borderColor: color.accent },
  emoji: { lineHeight: 28 },
});
