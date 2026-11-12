import type { Species } from '@blowy/domain';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { IconName } from '../assets/pets';
import { Button } from '../atoms/Button';
import { IconButton } from '../atoms/IconButton';
import { PetImage } from '../atoms/PetImage';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { FeatureRow } from '../molecules/FeatureRow';
import { PlanPicker, type Plan } from '../organisms/PlanPicker';
import { InkProvider } from '../lib/ink';
import { layout } from '../lib/styles';
import { color, plusGradient, radius, space } from '../theme';

export interface PlusTemplateProps<K extends string> {
  /** Puce jaune en haut à gauche (« essai 3 jours offert », « à venir »). */
  sticker: string;
  onClose: () => void;
  closeLabel: string;
  /** Marque du grand titre (« blowy ») : le « + » jaune est ajouté. */
  brand: string;
  /** Ligne estompée sous le titre (« nino en veut plus. »). */
  subtitle: string;
  species: Species;
  features: readonly { icon: IconName; title: string; text: string }[];
  plans: readonly Plan<K>[];
  plan: K;
  onPlan: (key: K) => void;
  /** Rappel sous les formules (« sans blowy+, rien ne disparaît… »). */
  free: string;
  ctaLabel: string;
  onCta?: () => void;
  ctaDisabled?: boolean;
  ctaLoading?: boolean;
  ctaHint?: string;
  /** Petite ligne sous le bouton (« puis 59,88 € par an… »). */
  note?: string;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

/** Hauteur du grand panneau de la maquette (548), comptée depuis le haut du cadre sous la barre d'état de 44. */
const PANEL_HEIGHT = 548;
const FRAME_STATUS = 44;

/** Blowy+ (V6-Paywall) : panneau prune, titre géant, avantages, formules, puis l'appel à l'action. */
export function PlusTemplate<K extends string>({
  sticker,
  onClose,
  closeLabel,
  brand,
  subtitle,
  species,
  features,
  plans,
  plan,
  onPlan,
  free,
  ctaLabel,
  onCta,
  ctaDisabled,
  ctaLoading,
  ctaHint,
  note,
  secondaryLabel,
  onSecondary,
}: PlusTemplateProps<K>) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 18) }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.panel, { height: PANEL_HEIGHT + insets.top - FRAME_STATUS }]}>
          <LinearGradient colors={plusGradient} style={StyleSheet.absoluteFill} />
        </View>
        <View pointerEvents="none" style={[styles.pet, { top: insets.top + 46 }]}>
          <PetImage species={species} mood="smug" size={190} rotate={10} animation="breathe" outline />
        </View>
        <View style={[layout.rowBetween, styles.top]}>
          <View style={styles.sticker}>
            <Text variant="bodyHeavy" size={12} color={color.dark} style={styles.stickerText}>
              {sticker}
            </Text>
          </View>
          <IconButton glyph="close" variant="back" label={closeLabel} onPress={onClose} />
        </View>
        <Title text={[{ text: brand }, { text: '+', color: color.accent }]} size={92} style={styles.title} />
        <Title text={[{ text: subtitle, dim: true }]} size={34} variant="h2" style={styles.subtitle} />
        <InkProvider value={color.white}>
          <View style={styles.features}>
            {features.map((f) => (
              <FeatureRow key={f.icon} icon={f.icon} title={f.title} text={f.text} />
            ))}
          </View>
        </InkProvider>
        <View style={styles.plans}>
          <PlanPicker plans={plans} value={plan} onChange={onPlan} />
        </View>
        <Text size={13.5} muted style={styles.free}>
          {free}
        </Text>
        <View style={styles.actions}>
          <Button label={ctaLabel} onPress={onCta} disabled={ctaDisabled} loading={ctaLoading} accessibilityHint={ctaHint} />
          {note ? (
            <Text size={12} muted center style={styles.note}>
              {note}
            </Text>
          ) : null}
          {secondaryLabel && onSecondary ? (
            <Pressable onPress={onSecondary} accessibilityLabel={secondaryLabel} style={styles.secondary}>
              <Text variant="bodyBold" size={15} color={color.mute}>
                {secondaryLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.night },
  content: { flexGrow: 1 },
  panel: { position: 'absolute', top: 6, left: 6, right: 6, borderRadius: radius.xl + 4, overflow: 'hidden' },
  pet: { position: 'absolute', right: -74 },
  top: { paddingTop: space.xs, paddingHorizontal: 28 },
  sticker: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: color.accent },
  stickerText: { lineHeight: 16 },
  title: { marginTop: space.md, marginHorizontal: 28, lineHeight: 83 },
  subtitle: { marginTop: space.xs, marginHorizontal: 28 },
  features: { marginTop: 20, marginHorizontal: 28, gap: 14 },
  plans: { marginTop: 40, marginHorizontal: 18 },
  free: { marginTop: 18, marginHorizontal: 28, lineHeight: 19 },
  actions: { marginTop: 'auto', paddingTop: space.lg, marginHorizontal: 18, gap: space.sm },
  note: { lineHeight: 16 },
  secondary: { height: 44, alignItems: 'center', justifyContent: 'center' },
});
