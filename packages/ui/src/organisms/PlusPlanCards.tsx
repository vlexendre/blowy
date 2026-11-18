import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { DISPLAY_SCALE } from '@blowy/tokens';

import { Glyph } from '../atoms/Glyph';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { titleWidthEm } from '../atoms/Title';
import { InkProvider } from '../lib/ink';
import { color, gradient, radius, space, veil } from '../theme';

/** Une offre en carte (les prix arrivent mis en forme par l'app, depuis le magasin : jamais écrits dans le kit). */
export interface PlusPlanCard<K extends string = string> {
  key: K;
  /** Durée courte (« 1 an »). */
  name: string;
  /** Montant facturé à chaque période (« 59,88 € ») : le prix le plus grand de la carte. */
  amount: string;
  /** Période facturée, juste sous le montant (« par an »). */
  period: string;
  /** Équivalent mensuel en petit (annuelle seulement, « 4,99 €/mois »). */
  perMonth?: string | null;
  /** Pastille au-dessus de la carte (remise exacte contre douze mensualités, « Économise 67 % »). */
  badge?: string | null;
  /** Phrase lue par le lecteur d'écran (offre, prix facturé et période, essai). */
  accessibilityLabel: string;
}

export interface PlusPlanCardsProps<K extends string> {
  plans: readonly PlusPlanCard<K>[];
  selected?: K;
  onSelect?: (key: K) => void;
  /** Nom du groupe de choix (« Choisis ton abonnement »), lu par le lecteur d'écran. */
  label?: string;
  /** Marges latérales de l'écran (pour calculer la largeur d'une carte). */
  inset?: number;
  compact?: boolean;
}

const GAP = space.sm;
const PAD = 10;
const CHECK = 22;

/** Corps du montant pour qu'il tienne sur une ligne dans la carte (Allo ExtraBold, chasse mesurée). */
function amountSize(amount: string, width: number, max: number): number {
  const em = titleWidthEm(amount) / DISPLAY_SCALE;
  if (em <= 0) return max;
  return Math.max(15, Math.min(max, Math.floor((width - 2) / em)));
}

/**
 * Choix de l'offre de Minimoa+ : deux ou trois cartes côte à côte, la choisie remplie du dégradé de Minimoa+ avec une
 * coche ronde ; la remise de l'annuelle en pastille au-dessus de sa carte. Le montant facturé et sa période sont ce
 * qu'il y a de plus grand dans chaque carte (règle Apple 3.1.2) ; l'équivalent mensuel reste petit.
 */
export function PlusPlanCards<K extends string>({ plans, selected, onSelect, label, inset = 20, compact }: PlusPlanCardsProps<K>) {
  const { width } = useWindowDimensions();
  const n = Math.max(1, plans.length);
  const cardW = (Math.min(width, 520) - inset * 2 - GAP * (n - 1)) / n;
  const inner = cardW - PAD * 2 - 4;
  const anyBadge = plans.some((p) => p.badge);
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.row, anyBadge && styles.rowBadge]}>
      {plans.map((p) => {
        const on = p.key === selected;
        const size = amountSize(p.amount, inner, compact ? 20 : 23);
        return (
          <Pressable
            key={p.key}
            onPress={() => onSelect?.(p.key)}
            haptic="selection"
            scaleTo={0.97}
            bounceKey={on}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={p.accessibilityLabel}
            style={[styles.card, compact && styles.cardCompact, anyBadge && styles.cardUnderBadge, on ? styles.cardOn : styles.cardOff]}
          >
            {on ? (
              <View style={styles.fill} pointerEvents="none">
                <LinearGradient colors={gradient.violet} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              </View>
            ) : null}
            <InkProvider value={color.white}>
              <Text variant="bodyBold" size={13} color={on ? veil.text : color.mute} numberOfLines={1} style={styles.name}>
                {p.name}
              </Text>
              <Text variant="bodyHeavy" size={size} numberOfLines={1} style={{ lineHeight: Math.round(size * 1.15) }}>
                {p.amount}
              </Text>
              <Text variant="bodyBold" size={13} style={styles.period}>
                {p.period}
              </Text>
              {p.perMonth ? (
                <Text size={13} color={on ? veil.text : color.mute} numberOfLines={1} style={styles.perMonth}>
                  {p.perMonth}
                </Text>
              ) : null}
            </InkProvider>
            {on ? (
              <View style={styles.check} pointerEvents="none">
                <Glyph name="check" size={11} color={color.dark} />
              </View>
            ) : null}
            {p.badge ? (
              <View style={styles.badgeWrap} pointerEvents="none">
                <View style={styles.badge}>
                  <Text variant="bodyHeavy" size={13} color={color.dark} numberOfLines={1}>
                    {p.badge}
                  </Text>
                </View>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: GAP, alignItems: 'stretch' },
  // Place pour la pastille qui dépasse au-dessus de la carte annuelle.
  rowBadge: { paddingTop: 11 },
  card: {
    flex: 1,
    flexBasis: 0,
    minHeight: 96,
    borderRadius: radius.md + 2,
    borderWidth: 2,
    paddingHorizontal: PAD,
    paddingTop: 10,
    paddingBottom: 10,
    justifyContent: 'flex-start',
    backgroundColor: color.panel,
  },
  cardCompact: { minHeight: 80, paddingTop: 7, paddingBottom: 7 },
  // La pastille déborde de 12 au-dessus de la carte : le contenu de toutes les cartes descend d'autant (lignes alignées).
  cardUnderBadge: { paddingTop: 14 },
  cardOn: { borderColor: color.accent },
  cardOff: { borderColor: veil.glassStrong },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: radius.md, overflow: 'hidden' },
  // Coche ronde de l'offre choisie, à cheval sur son coin bas (la pastille de remise occupe le haut).
  check: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    borderWidth: 2,
    borderColor: color.night,
    backgroundColor: color.accent,
    width: CHECK,
    height: CHECK,
    borderRadius: CHECK / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { marginBottom: 3 },
  period: { lineHeight: 16 },
  perMonth: { marginTop: 3, lineHeight: 16 },
  // La pastille peut déborder un peu de la carte (centrée au-dessus d'elle) plutôt que de couper son texte.
  badgeWrap: { position: 'absolute', top: -12, left: -10, right: -10, alignItems: 'center' },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: color.accent,
  },
});
