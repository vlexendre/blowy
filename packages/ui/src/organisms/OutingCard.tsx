import { StyleSheet, View } from 'react-native';

import { Card } from '../atoms/Card';
import { Chip } from '../atoms/Chip';
import { Loader } from '../atoms/Loader';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
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
  /** Forme courte de l'accueil : la question sur une ligne, trois petites puces de réponse. */
  compact?: boolean;
}

/**
 * La question du jour du minimoa (V6-GAccueil) : trois grandes réponses. Une sortie comptée replie la carte sur la
 * réponse choisie et la phrase du minimoa ; « pas encore » garde la question ouverte.
 */
export function OutingCard<K extends string>({ question, answers, picked, canAnswer, busy = null, onAnswer, line, confirmedLabel, highlight = false, compact = false }: OutingCardProps<K>) {
  const chosen = answers.find((a) => a.id === picked);
  if (!canAnswer && chosen) {
    return (
      <Card padding="none" style={[styles.card, compact && styles.cardCompact]}>
        <Text variant="bodyHeavy" size={15} muted>
          {question}
        </Text>
        <View style={[layout.row, layout.gapSm, styles.chips]}>
          <PopIn trigger={chosen.id}>
            <Chip label={chosen.emoji ? `${chosen.emoji} ${chosen.label}` : chosen.label} tone="accent" size="md" />
          </PopIn>
          {confirmedLabel ? <Chip label={confirmedLabel} tone="glass" size="md" /> : null}
        </View>
        {line && !compact ? (
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
    return (
      <Card padding="none" highlight={highlight ? color.accent : undefined} style={[styles.card, styles.cardCompact]}>
        <Text variant="bodyHeavy" size={15} numberOfLines={2} accessibilityRole="header">
          {question}
        </Text>
        <View style={[layout.row, styles.pills]}>
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
                style={[styles.pill, selected && styles.selected]}
              >
                {loading ? (
                  <Loader color={selected ? color.dark : 'accent'} size={6} />
                ) : (
                  <Text variant="bodyHeavy" size={13} center color={selected ? color.dark : color.white} numberOfLines={2}>
                    {a.emoji ? `${a.emoji} ` : ''}
                    {a.short ?? a.label}
                  </Text>
                )}
              </Pressable>
            );
          })}
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
                <Text size={22} style={styles.emoji} importantForAccessibility="no" accessibilityElementsHidden>
                  {a.emoji}
                </Text>
              ) : null}
              <Text variant="bodyHeavy" size={14} center color={selected ? color.dark : color.white} numberOfLines={3}>
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
  // Forme courte : 12 × 14, question puis trois puces de 40.
  cardCompact: { paddingVertical: space.md, gap: space.sm + 2 },
  pills: { gap: space.xs + 2 },
  pill: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.pill,
    paddingHorizontal: space.xs,
    paddingVertical: space.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: veil.glass,
    borderWidth: 1,
    borderColor: alpha(color.white, 0.08),
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
