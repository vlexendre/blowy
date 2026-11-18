/**
 * Cartes qui donnent envie de Minimoa+ en montrant ce qui existe vraiment (docs/DESIR.md) : de vraies personnes
 * compatibles vues de loin (silhouettes floues, aucun visage ni prénom), une collection saisonnière avec sa vraie date
 * de fin, l'essayage d'un objet premium sur son propre minimoa, un objet premium porté par un autre minimoa.
 * Aucun texte en dur : tout arrive en props.
 */
import type { Species } from '@blowy/domain';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '../atoms/Avatar';
import { Button } from '../atoms/Button';
import { ItemImage } from '../atoms/ItemImage';
import { Panel } from '../atoms/Panel';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { Appear } from '../motion/Appear';
import { alpha, color, radius, size, space, veil } from '../theme';

// ── Vu de loin ───────────────────────────────────────────────────────────────

export interface FarAwayCardProps {
  /** « Vu de loin ». */
  kicker: string;
  /** Phrase du serveur, avec le vrai nombre (« 12 autres minimoas compatibles au-delà de ta zone, dont 3 à plus de 85 % »). */
  title: string;
  /** Ce que Minimoa+ change, sans promesse de plus. */
  text: string;
  ctaLabel: string;
  onPress: () => void;
  /** Formes des silhouettes (décor : jamais celles des vraies personnes). */
  species: readonly Species[];
  /** Nombre réel, pour le badge « +12 » à côté des silhouettes. */
  count: number;
}

/** « Vu de loin » : de vraies personnes compatibles, floues et sans identité, et ce qui les rend visibles. */
export function FarAwayCard({ kicker, title, text, ctaLabel, onPress, species, count }: FarAwayCardProps) {
  return (
    <Appear>
      <Pressable onPress={onPress} scaleTo={0.98} accessibilityRole="button" accessibilityLabel={`${kicker}. ${title} ${text}`}>
        <Panel gradient="violet" radius={24} padding="none" style={styles.far}>
          <View style={[layout.row, styles.farHead]}>
            <View style={[layout.row, styles.stack]} accessible={false}>
              {species.slice(0, 4).map((s, i) => (
                <Avatar key={`${s}${i}`} size={38} pet={{ name: s, species: s }} blurred cutout style={i ? styles.next : null} />
              ))}
              <View style={[styles.more, styles.next]}>
                <Text variant="bodyHeavy" size={13} color={color.white}>
                  {`+${count}`}
                </Text>
              </View>
            </View>
            <Text variant="bodyHeavy" size={12} color={alpha(color.white, 0.8)} style={styles.kicker}>
              {kicker.toUpperCase()}
            </Text>
          </View>
          <Text variant="bodyHeavy" size={17} color={color.white}>
            {title}
          </Text>
          <Text size={13} color={alpha(color.white, 0.85)}>
            {text}
          </Text>
          <View pointerEvents="none" importantForAccessibility="no-hide-descendants">
            <Button label={ctaLabel} variant="white" size="sm" />
          </View>
        </Panel>
      </Pressable>
    </Appear>
  );
}

// ── Collection saisonnière ───────────────────────────────────────────────────

export interface CollectionBannerProps {
  /** « Collection Hiver ». */
  kicker: string;
  /** « Jusqu'au 31 janvier · encore 75 jours » (date du serveur). */
  title: string;
  /** Ce qui se passe après la fin, dit simplement. */
  text: string;
  /** Objets de la collection (les premiers en vitrine). */
  items: readonly string[];
  /** Sans Minimoa+ : « L'avoir avec Minimoa+ » ; avec : rien. */
  action?: { label: string; onPress: () => void } | null;
}

/** Une collection saisonnière avec sa vraie date de fin (tenue par le serveur, jamais repoussée). */
export function CollectionBanner({ kicker, title, text, items, action }: CollectionBannerProps) {
  return (
    <View style={styles.collection} accessible accessibilityLabel={`${kicker}. ${title}. ${text}`}>
      <View style={[layout.row, styles.collectionHead]}>
        <View style={layout.grow}>
          <Text variant="bodyHeavy" size={12} color={color.accent}>
            {kicker.toUpperCase()}
          </Text>
          <Text variant="bodyHeavy" size={16}>
            {title}
          </Text>
        </View>
        <View style={[layout.row, styles.items]} accessible={false}>
          {items.slice(0, 3).map((id) => (
            <View key={id} style={styles.itemBox}>
              <ItemImage id={id} size={30} />
            </View>
          ))}
        </View>
      </View>
      <Text size={13} muted>
        {text}
      </Text>
      {action ? <Button label={action.label} variant="glass" size="sm" onPress={action.onPress} /> : null}
    </View>
  );
}

// ── Essayage ─────────────────────────────────────────────────────────────────

export interface TryOnBarProps {
  /** « Essayage : Nino porte l'Auréole. » */
  title: string;
  /** « Rien n'est gardé : c'est un aperçu. » */
  text: string;
  keepLabel: string;
  onKeep: () => void;
  removeLabel: string;
  onRemove: () => void;
}

/** Un objet premium essayé sur son propre minimoa (aperçu local, rien n'est enregistré). */
export function TryOnBar({ title, text, keepLabel, onKeep, removeLabel, onRemove }: TryOnBarProps) {
  return (
    <Appear>
      <Panel gradient="violet" radius={22} padding="none" style={styles.tryOn}>
        <Text variant="bodyHeavy" size={15} color={color.white}>
          {title}
        </Text>
        <Text size={13} color={alpha(color.white, 0.85)}>
          {text}
        </Text>
        <View style={[layout.row, styles.tryActions]}>
          <Button label={keepLabel} variant="white" size="sm" onPress={onKeep} block={false} style={layout.grow} />
          <Button label={removeLabel} variant="ghost" size="sm" onPress={onRemove} block={false} />
        </View>
      </Panel>
    </Appear>
  );
}

// ── Porté par un autre ───────────────────────────────────────────────────────

export interface WornPremiumProps {
  /** Objet premium porté. */
  item: string;
  /** « Léa porte l'Auréole · Minimoa+ ». */
  label: string;
  /** « L'essayer sur Nino ». */
  actionLabel: string;
  onPress: () => void;
}

/** Un objet premium vu sur un autre minimoa (déjà visible sur lui), et l'essayer sur le sien. */
export function WornPremium({ item, label, actionLabel, onPress }: WornPremiumProps) {
  return (
    <Pressable onPress={onPress} scaleTo={0.98} accessibilityRole="button" accessibilityLabel={`${label}. ${actionLabel}`}>
      <View style={[layout.row, styles.worn]}>
        <View style={styles.itemBox}>
          <ItemImage id={item} size={30} />
        </View>
        <Text size={13} style={layout.grow} numberOfLines={2}>
          {label}
        </Text>
        <Text variant="bodyHeavy" size={13} color={color.accent}>
          {actionLabel}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  far: { padding: space.lg, gap: space.sm },
  farHead: { alignItems: 'center', gap: space.md },
  stack: { alignItems: 'center' },
  next: { marginLeft: -12 },
  more: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(color.night, 0.35),
    borderWidth: 1,
    borderColor: alpha(color.white, 0.4),
  },
  kicker: { letterSpacing: 1 },
  collection: { padding: space.md, gap: space.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: veil.glass, backgroundColor: color.card },
  collectionHead: { alignItems: 'center', gap: space.md },
  items: { gap: 6 },
  itemBox: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: color.panel },
  tryOn: { padding: space.md, gap: 6 },
  tryActions: { gap: space.sm, marginTop: 4, alignItems: 'center' },
  worn: {
    minHeight: size.touch,
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: veil.glass,
    backgroundColor: color.card,
  },
});
