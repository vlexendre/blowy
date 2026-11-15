import { StyleSheet, View } from 'react-native';

import { Button } from '../atoms/Button';
import { Card } from '../atoms/Card';
import { Chip, type ChipTone } from '../atoms/Chip';
import { Glyph } from '../atoms/Glyph';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { DrawnCheck } from '../motion/DrawnCheck';
import { alpha, color, size, space, veil } from '../theme';

export interface WordsShareCardProps {
  /** « décris-moi en 3 mots ». */
  title: string;
  /** « 9 potes ont répondu » (montré seulement quand quelqu'un a répondu, voir `received`). */
  countLabel?: string;
  /** Petite puce à côté du titre tant que personne n'a répondu (« anonyme »). */
  badge?: string;
  /** Mots reçus (libellé déjà traduit) et nombre de votes. */
  words: readonly { label: string; count?: number }[];
  /** Adresse affichée (« blowy.app/alex »). */
  url: string;
  copyLabel: string;
  /** Remplace `copyLabel` juste après la copie (« copié ✓ »). */
  copiedLabel?: string;
  copied?: boolean;
  /** Action principale (« partager le lien »). */
  shareLabel: string;
  onCopy: () => void;
  onShare: () => void;
  /**
   * Ce que c'est, en une ligne (« tes potes ouvrent ton lien, choisissent 3 mots sur toi ; ces mots forment son
   * caractère »). Remplacée par `receivedText` une fois des mots reçus.
   */
  emptyText?: string;
  /** Les trois temps, très courts (« tu partages », « ils choisissent 3 mots », « nino change »). */
  steps?: readonly [string, string, string];
  /** Des potes ont déjà répondu : le compte passe en avant, `receivedText` remplace l'explication. */
  received?: boolean;
  receivedText?: string;
  /** Lien discret vers ce que les mots ont changé (« voir son caractère »). */
  moreLabel?: string;
  onMore?: () => void;
}

const TONES: readonly ChipTone[] = ['accent', 'rose', 'orange', 'violet'];

/**
 * Le lien « 3 mots » en un coup d'œil : ce que c'est (une ligne), comment ça marche (1-2-3), et une seule action
 * principale, « partager le lien ». L'adresse et « copier » restent à côté, en second. Une fois des mots reçus :
 * le compte en avant, les mots s'il y en a, et un lien vers le caractère du pet.
 */
export function WordsShareCard({
  title,
  countLabel,
  badge,
  words,
  url,
  copyLabel,
  copiedLabel,
  copied,
  shareLabel,
  onCopy,
  onShare,
  emptyText,
  steps,
  received,
  receivedText,
  moreLabel,
  onMore,
}: WordsShareCardProps) {
  const done = received ?? words.length > 0;
  return (
    <Card padding="none" style={styles.card}>
      <View style={[layout.rowBetween, layout.gapSm]}>
        <Text variant="bodyHeavy" size={18} style={layout.shrink}>
          {title}
        </Text>
        {done && countLabel ? <Chip label={countLabel} tone="accent" size="sm" /> : badge ? <Chip label={badge} size="sm" /> : null}
      </View>

      {done ? (
        <>
          {words.length ? (
            <View style={[layout.row, styles.chips]}>
              {words.map((w, i) => (
                <Chip key={w.label} label={w.count ? `${w.label} ×${w.count}` : w.label} tone={TONES[i % TONES.length]} style={styles.chip} />
              ))}
            </View>
          ) : null}
          {receivedText ? (
            <Text size={14} muted style={styles.lead}>
              {receivedText}
            </Text>
          ) : null}
          {moreLabel && onMore ? (
            <Pressable onPress={onMore} accessibilityRole="link" accessibilityLabel={moreLabel} style={[layout.row, styles.more]}>
              <Text variant="bodyBold" size={14} color={color.accent}>
                {moreLabel}
              </Text>
              <Glyph name="chevron" size={14} color={color.accent} />
            </Pressable>
          ) : null}
        </>
      ) : (
        <>
          {emptyText ? (
            <Text size={14} muted style={styles.lead}>
              {emptyText}
            </Text>
          ) : null}
          {steps ? <Steps steps={steps} /> : null}
        </>
      )}

      <Button label={shareLabel} icon="share" variant="accent" size="md" onPress={onShare} />
      <View style={[layout.row, layout.gapSm]}>
        <View style={[styles.url, layout.grow]}>
          {/* Le code doit rester lisible : le texte rétrécit plutôt que d'être coupé (iPhone étroit, bouton à côté). */}
          <Text variant="bodyBold" size={14} muted numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} selectable>
            {url}
          </Text>
        </View>
        <Button
          label={copied && copiedLabel ? copiedLabel : copyLabel}
          icon={copied ? <DrawnCheck key="check" size={14} haptic="success" /> : 'copy'}
          variant="ghost"
          size="sm"
          onPress={onCopy}
          style={styles.copy}
        />
      </View>
    </Card>
  );
}

/** 1 · 2 · 3 : trois pastilles numérotées reliées par un filet, un libellé court sous chacune. */
function Steps({ steps }: { steps: readonly [string, string, string] }) {
  return (
    <View style={styles.steps} accessible accessibilityLabel={steps.map((s, i) => `${i + 1}. ${s}`).join(' ')}>
      <View style={styles.rail} />
      {steps.map((s, i) => (
        <View key={i} style={styles.step}>
          <View style={[styles.num, i === 2 && styles.numLast]}>
            <Text variant="bodyHeavy" size={13} color={i === 2 ? color.dark : color.white}>
              {String(i + 1)}
            </Text>
          </View>
          <Text variant="bodyBold" size={12} center style={styles.stepText}>
            {s}
          </Text>
        </View>
      ))}
    </View>
  );
}

const NUM = 28;

const styles = StyleSheet.create({
  card: { borderRadius: 24, padding: space.md + 2, gap: space.md },
  lead: { lineHeight: 19, marginTop: -4 },
  chips: { flexWrap: 'wrap', gap: space.xs + 2 },
  chip: { height: 26, paddingHorizontal: 11 },
  more: { gap: 2, alignSelf: 'flex-start', minHeight: 28 },
  steps: { flexDirection: 'row', alignItems: 'flex-start' },
  // Le filet passe derrière les pastilles, du centre de la 1re au centre de la 3e.
  rail: { position: 'absolute', top: NUM / 2 - 1, left: '16.6%', right: '16.6%', height: 2, borderRadius: 1, backgroundColor: veil.line },
  step: { flex: 1, alignItems: 'center', gap: 6, paddingHorizontal: 2 },
  num: { width: NUM, height: NUM, borderRadius: NUM / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: color.card, borderWidth: 1.5, borderColor: alpha(color.white, 0.18) },
  numLast: { backgroundColor: color.accent, borderColor: color.accent },
  stepText: { lineHeight: 15 },
  url: { height: size.button.sm, justifyContent: 'center', paddingHorizontal: space.md, borderRadius: size.button.sm / 2, backgroundColor: color.card },
  copy: { minWidth: 96 },
});
