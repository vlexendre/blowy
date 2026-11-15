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
import { Appear, Stagger } from '../motion/Appear';
import { PopIn } from '../motion/PopIn';
import { PlanPicker, type Plan } from '../organisms/PlanPicker';
import { InkProvider } from '../lib/ink';
import { layout } from '../lib/styles';
import { color, motion, plusGradient, radius, space } from '../theme';
import { SheetHandle, useSheet } from './SheetTemplate';

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
  /** « restaurer mes achats » (exigé par Apple, toujours visible en bas). */
  restoreLabel?: string;
  onRestore?: () => void;
  restoreLoading?: boolean;
  /** Retour de la restauration (« aucun achat à restaurer »). */
  restoreNote?: string;
  /** Liens légaux en bas (conditions d'utilisation, confidentialité). */
  links?: readonly { label: string; onPress: () => void }[];
}

/** Hauteur du grand panneau de la maquette (548), comptée depuis le haut du cadre sous la barre d'état de 44. */
const PANEL_HEIGHT = 548;
const FRAME_STATUS = 44;
/** Contenu tiré de plus de 70 pt au-delà du haut (iOS) : la feuille se ferme. */
const PULL_TO_CLOSE = 70;

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
  restoreLabel,
  onRestore,
  restoreLoading,
  restoreNote,
  links,
}: PlusTemplateProps<K>) {
  const insets = useSafeAreaInsets();
  // Dans une feuille (`SheetTemplate bare`) : pas de barre d'état au-dessus, la barre du haut sert de poignée,
  // la croix et « continuer » font redescendre la feuille, et tirer le contenu au-delà du haut la ferme.
  const sheet = useSheet();
  const top = sheet ? 12 : insets.top;
  const close = sheet ? sheet.close : onClose;
  const secondary = sheet && onSecondary ? sheet.close : onSecondary;
  return (
    <View style={[styles.root, sheet && styles.rootSheet]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: top, paddingBottom: Math.max(insets.bottom, 18) }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScrollEndDrag={sheet ? (e) => e.nativeEvent.contentOffset.y < -PULL_TO_CLOSE && sheet.close() : undefined}
      >
        <View style={[styles.panel, { height: PANEL_HEIGHT + top - FRAME_STATUS }]}>
          <LinearGradient colors={plusGradient} style={StyleSheet.absoluteFill} />
        </View>
        <Appear from="right" distance={70} delay={140} duration={motion.slow} pointerEvents="none" style={[styles.pet, { top: top + 46 }]}>
          <PetImage species={species} mood="smug" size={190} rotate={10} animation="breathe" outline />
        </Appear>
        <SheetHandle style={[layout.rowBetween, styles.top, sheet && styles.topSheet]}>
          <PopIn delay={120} from={0.6} style={styles.sticker}>
            <Text variant="bodyHeavy" size={12} color={color.dark} style={styles.stickerText}>
              {sticker}
            </Text>
          </PopIn>
          <IconButton glyph="close" variant="back" label={closeLabel} onPress={close} />
        </SheetHandle>
        <Appear delay={60} distance={18}>
          <Title text={[{ text: brand }, { text: '+', color: color.accent }]} size={92} style={styles.title} />
          <Title text={[{ text: subtitle, dim: true }]} size={34} variant="h2" style={styles.subtitle} />
        </Appear>
        <InkProvider value={color.white}>
          <View style={styles.features}>
            <Stagger delay={160} step={50} from="left" distance={14}>
              {features.map((f) => (
                <FeatureRow key={f.icon} icon={f.icon} title={f.title} text={f.text} />
              ))}
            </Stagger>
          </View>
        </InkProvider>
        <Appear delay={340} distance={14} style={styles.plans}>
          <PlanPicker plans={plans} value={plan} onChange={onPlan} />
        </Appear>
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
          {secondaryLabel && secondary ? (
            <Pressable onPress={secondary} accessibilityLabel={secondaryLabel} style={styles.secondary}>
              <Text variant="bodyBold" size={15} color={color.mute}>
                {secondaryLabel}
              </Text>
            </Pressable>
          ) : null}
          {(restoreLabel && onRestore) || links?.length ? (
            <View style={styles.legal}>
              {restoreLabel && onRestore ? (
                <Pressable onPress={onRestore} disabled={restoreLoading} accessibilityRole="button" accessibilityLabel={restoreLabel} style={styles.legalItem}>
                  <Text variant="bodyBold" size={12.5} muted style={styles.legalText}>
                    {restoreLabel}
                  </Text>
                </Pressable>
              ) : null}
              {links?.map((l) => (
                <Pressable key={l.label} onPress={l.onPress} accessibilityRole="link" accessibilityLabel={l.label} style={styles.legalItem}>
                  <Text size={12.5} muted style={styles.legalText}>
                    {l.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {restoreNote ? (
            <Text size={12} muted center style={styles.note}>
              {restoreNote}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.night },
  rootSheet: { backgroundColor: 'transparent' },
  content: { flexGrow: 1 },
  panel: { position: 'absolute', top: 6, left: 6, right: 6, borderRadius: radius.xl + 4, overflow: 'hidden' },
  pet: { position: 'absolute', right: -74 },
  top: { paddingTop: space.xs, paddingHorizontal: 28 },
  // Poignée de la feuille : plus haute, pour qu'on l'attrape facilement (la barre grise est dessinée par la feuille).
  topSheet: { paddingTop: space.md, paddingBottom: space.xs },
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
  legal: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: space.md },
  legalItem: { minHeight: 32, justifyContent: 'center' },
  legalText: { textDecorationLine: 'underline' },
});
