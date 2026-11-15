import type { Outfit, Species } from '@blowy/domain';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '../atoms/Avatar';
import { Button } from '../atoms/Button';
import { DressedPet } from '../atoms/DressedPet';
import { Glyph } from '../atoms/Glyph';
import { IconButton } from '../atoms/IconButton';
import { ItemImage } from '../atoms/ItemImage';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { Banner } from '../molecules/Banner';
import { InkProvider } from '../lib/ink';
import { useLoop } from '../lib/motion';
import { layout } from '../lib/styles';
import { Appear } from '../motion/Appear';
import { PopIn } from '../motion/PopIn';
import { alpha, color, motion, plusGradient, radius, space, veil } from '../theme';
import { SheetHandle, useSheet } from './SheetTemplate';

/** Une offre telle que la feuille la montre (les prix arrivent mis en forme : jamais écrits dans le kit). */
export interface PlusOfferView<K extends string = string> {
  key: K;
  /** Ligne du haut, déployée (« Annuel · 7 jours gratuits, puis »). */
  lead: string;
  /** Montant facturé, le prix le plus visible (« 59,88 € par an »). */
  price: string;
  /** Équivalent mensuel, en petit (« soit 4,99 € par mois »). */
  perMonth?: string | null;
  /** Pastille de remise exacte (« −67 % »). */
  badge?: string | null;
  /** Ligne repliée (« Mensuel, sans essai »), avec le prix à droite. */
  short: string;
  /** Frise de l'essai : aujourd'hui → rappel → premier paiement. */
  timeline?: readonly { title: string; text: string }[] | null;
}

export interface PlusTemplateProps<K extends string> {
  onClose: () => void;
  closeLabel: string;
  /** Marque du grand titre (« blowy ») : le « + » jaune est ajouté. */
  brand: string;
  /** Ligne estompée sous le titre : ce que la personne vient d'essayer, ou « Nino en veut plus. ». */
  headline: string;
  /** Son minimoa, habillé, et les objets premium qui flottent autour de lui. */
  pet: { species: Species; outfit?: Outfit | null; name: string };
  floatingItems?: readonly string[];
  /** Preuve concrète (nombre réel venu du serveur) : absente à zéro. */
  teaser?: { label: string; species: readonly Species[] } | null;
  perks: readonly { key: string; label: string; highlight?: boolean }[];
  /** Offres ; absentes pour un membre (`member`). */
  offers?: readonly PlusOfferView<K>[];
  selected?: K;
  onSelect?: (key: K) => void;
  offersLabel?: string;
  ctaLabel?: string;
  onCta?: () => void;
  ctaDisabled?: boolean;
  ctaLoading?: boolean;
  /** Retour d'un achat (en attente, échec, réussite) ou d'une restauration. */
  status?: { tone: 'info' | 'success' | 'error'; text: string } | null;
  /** Déjà membre : l'état de l'abonnement et « gérer mon abonnement » à la place des offres. */
  member?: { title: string; summary: string; manageLabel?: string; onManage?: () => void } | null;
  /** « Continuer gratuitement » : toujours présent, neutre. */
  continueLabel: string;
  onContinue: () => void;
  /** Renouvellement automatique et comment annuler (Apple 3.1.2). */
  renewalNotice?: string | null;
  restoreLabel?: string;
  onRestore?: () => void;
  restoreLoading?: boolean;
  links?: readonly { label: string; onPress: () => void }[];
}

const HEADER = 178;

/** Un objet premium qui flotte près du minimoa (boucle douce, arrêtée avec « réduire les animations »). */
function Floating({ id, size, delay, style }: { id: string; size: number; delay: number; style: object }) {
  const t = useLoop(2600, true, delay);
  const float = useAnimatedStyle(() => ({ transform: [{ translateY: -6 * t.value }, { rotate: `${-6 + 12 * t.value}deg` }] }));
  return (
    <PopIn delay={420 + delay / 4} from={0.3} style={[styles.floating, style]} pointerEvents="none">
      <Animated.View style={float}>
        <ItemImage id={id} size={size} />
      </Animated.View>
    </PopIn>
  );
}

/** Frise de l'essai : trois jalons reliés, le premier allumé. */
function TrialTimeline({ steps }: { steps: readonly { title: string; text: string }[] }) {
  return (
    <View style={styles.timeline}>
      <View style={styles.timelineLine} />
      <View style={layout.row}>
        {steps.map((s, i) => (
          <View key={s.title} style={styles.timelineStep}>
            <PopIn delay={180 + i * 90} from={0.5}>
              <View style={[styles.timelineDot, i === 0 ? styles.timelineDotOn : null]} />
            </PopIn>
            <Text variant="bodyHeavy" size={13} center>
              {s.title}
            </Text>
            <Text size={13} muted center style={styles.timelineText}>
              {s.text}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function OfferCard<K extends string>({ offer, on, onPress }: { offer: PlusOfferView<K>; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      haptic="selection"
      scaleTo={0.985}
      bounceKey={on}
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={[on ? offer.lead : offer.short, offer.price, offer.perMonth].filter(Boolean).join(', ')}
      style={[styles.offer, on ? styles.offerOn : styles.offerOff]}
    >
      {on ? (
        <View>
          <View style={[layout.rowBetween, styles.offerTop]}>
            <Text variant="bodyHeavy" size={15} style={layout.grow}>
              {offer.lead}
            </Text>
            {offer.badge ? (
              <View style={styles.badge}>
                <Text variant="bodyHeavy" size={13} color={color.dark}>
                  {offer.badge}
                </Text>
              </View>
            ) : null}
          </View>
          <Text variant="bodyHeavy" size={30} style={styles.price}>
            {offer.price}
          </Text>
          {offer.perMonth ? (
            <Text size={13} muted>
              {offer.perMonth}
            </Text>
          ) : null}
          {offer.timeline?.length ? <TrialTimeline steps={offer.timeline} /> : null}
        </View>
      ) : (
        <View style={[layout.rowBetween, styles.offerShort]}>
          <Text variant="bodyHeavy" size={15} style={layout.grow}>
            {offer.short}
          </Text>
          <Text variant="bodyHeavy" size={15}>
            {offer.price}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/**
 * Blowy+ (V6-GPlus) : feuille haute. En haut, le minimoa de la personne habillé avec les objets premium qui flottent, la
 * preuve concrète (si le serveur en a une), puis les avantages, l'offre annuelle déployée (prix facturé en grand,
 * équivalent mensuel en petit, frise de l'essai), la mensuelle repliée, l'action, « Continuer gratuitement » neutre, le
 * renouvellement et la résiliation, « Restaurer mes achats » et les liens légaux. La croix est là tout de suite.
 */
export function PlusTemplate<K extends string>({
  onClose,
  closeLabel,
  brand,
  headline,
  pet,
  floatingItems = [],
  teaser,
  perks,
  offers,
  selected,
  onSelect,
  offersLabel,
  ctaLabel,
  onCta,
  ctaDisabled,
  ctaLoading,
  status,
  member,
  continueLabel,
  onContinue,
  renewalNotice,
  restoreLabel,
  onRestore,
  restoreLoading,
  links,
}: PlusTemplateProps<K>) {
  const insets = useSafeAreaInsets();
  // Dans une feuille (`SheetTemplate bare`) : la barre du haut sert de poignée, la croix et « continuer » font
  // redescendre la feuille, et tirer le contenu au-delà du haut la ferme.
  const sheet = useSheet();
  const top = sheet ? 12 : insets.top;
  const close = sheet ? sheet.close : onClose;
  const proceed = sheet ? sheet.close : onContinue;
  return (
    <View style={[styles.root, sheet && styles.rootSheet]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: top, paddingBottom: Math.max(insets.bottom, 18) }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScrollEndDrag={sheet ? (e) => e.nativeEvent.contentOffset.y < -70 && sheet.close() : undefined}
      >
        <View style={[styles.panel, { height: HEADER + top }]}>
          <LinearGradient colors={plusGradient} style={StyleSheet.absoluteFill} />
        </View>
        {/* Son minimoa, habillé, entre par la droite ; les objets premium flottent autour. */}
        <Appear from="right" distance={60} delay={120} duration={motion.slow} pointerEvents="none" style={[styles.pet, { top: top + 34 }]}>
          <DressedPet species={pet.species} outfit={pet.outfit ?? undefined} size={150} mood="joie" accessibilityLabel={pet.name} />
        </Appear>
        {floatingItems[0] ? <Floating id={floatingItems[0]} size={48} delay={0} style={{ top: top + 132, right: 2 }} /> : null}
        {floatingItems[1] ? <Floating id={floatingItems[1]} size={44} delay={900} style={{ top: top + 10, right: 122 }} /> : null}
        <SheetHandle style={[layout.rowBetween, styles.top]}>
          <View />
          <IconButton glyph="close" variant="back" label={closeLabel} onPress={close} />
        </SheetHandle>
        <View style={styles.head}>
          <Title text={[{ text: brand }, { text: '+', color: color.accent }]} size={64} style={styles.title} />
          <Title text={[{ text: headline, dim: true }]} size={26} variant="h2" style={styles.headline} />
        </View>

        <View style={styles.body}>
          {teaser ? (
            <Appear delay={260} style={[layout.row, styles.teaser]}>
              <View style={[layout.row, styles.silhouettes]} accessible={false}>
                {teaser.species.slice(0, 3).map((s, i) => (
                  <Avatar key={s} size={34} pet={{ name: s, species: s }} blurred cutout style={i ? styles.silhouetteNext : null} />
                ))}
              </View>
              <Text variant="bodyHeavy" size={15} color={color.white} style={styles.teaserText}>
                {teaser.label}
              </Text>
            </Appear>
          ) : null}
          <View style={styles.perks}>
            {perks.map((p, i) => (
              <Appear key={p.key} delay={140 + Math.min(i, 8) * 35} distance={8} style={styles.perkCell}>
                <View style={[layout.row, styles.perk]}>
                  <Glyph name="check" size={15} color={color.accent} />
                  <Text variant={p.highlight ? 'bodyHeavy' : 'bodyBold'} size={14} color={p.highlight ? color.accent : undefined} style={styles.perkText}>
                    {p.label}
                  </Text>
                </View>
              </Appear>
            ))}
          </View>

          {member ? (
            <Appear delay={220} style={styles.memberCard}>
              <Text variant="bodyHeavy" size={19}>
                {member.title}
              </Text>
              <Text size={15} muted>
                {member.summary}
              </Text>
              {member.manageLabel && member.onManage ? <Button label={member.manageLabel} variant="glass" onPress={member.onManage} /> : null}
            </Appear>
          ) : offers?.length ? (
            <Appear delay={220} style={styles.offers}>
              <View accessibilityRole="radiogroup" accessibilityLabel={offersLabel} style={styles.offersList}>
                {offers.map((o) => (
                  <OfferCard key={o.key} offer={o} on={o.key === selected} onPress={() => onSelect?.(o.key)} />
                ))}
              </View>
            </Appear>
          ) : null}

          {status ? (
            <Appear key={status.text} from="none">
              <Banner tone={status.tone === 'error' ? 'error' : status.tone === 'success' ? 'success' : 'info'} text={status.text} />
            </Appear>
          ) : null}

          <View style={styles.actions}>
            {!member && ctaLabel ? <Button label={ctaLabel} onPress={onCta} disabled={ctaDisabled || !onCta} loading={ctaLoading} /> : null}
            <Pressable onPress={proceed} accessibilityLabel={continueLabel} style={styles.secondary}>
              <InkProvider value={color.white}>
                <Text variant="bodyHeavy" size={16}>
                  {continueLabel}
                </Text>
              </InkProvider>
            </Pressable>
            {renewalNotice ? (
              <Text size={13} muted center style={styles.note}>
                {renewalNotice}
              </Text>
            ) : null}
            <View style={styles.legal}>
              {restoreLabel && onRestore ? (
                <Pressable onPress={onRestore} disabled={restoreLoading} accessibilityRole="button" accessibilityLabel={restoreLabel} style={styles.legalItem}>
                  <Text variant="bodyBold" size={13} muted={!restoreLoading} dim={restoreLoading} style={styles.legalText}>
                    {restoreLabel}
                  </Text>
                </Pressable>
              ) : null}
              {links?.map((l) => (
                <Pressable key={l.label} onPress={l.onPress} accessibilityRole="link" accessibilityLabel={l.label} style={styles.legalItem}>
                  <Text size={13} muted style={styles.legalText}>
                    {l.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
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
  pet: { position: 'absolute', right: -14 },
  floating: { position: 'absolute' },
  top: { paddingTop: space.md, paddingBottom: space.xs, paddingHorizontal: 20 },
  head: { paddingHorizontal: 26, minHeight: HEADER - 64, paddingRight: 150 },
  title: { lineHeight: 60 },
  headline: { marginTop: 2 },
  teaser: { gap: space.md, alignItems: 'center', padding: space.md, borderRadius: radius.md, backgroundColor: alpha(color.white, 0.06) },
  silhouettes: { alignItems: 'center' },
  silhouetteNext: { marginLeft: -12 },
  teaserText: { flex: 1, lineHeight: 20 },
  body: { paddingHorizontal: 20, paddingTop: space.md, gap: space.md, flexGrow: 1 },
  perks: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 },
  perkCell: { width: '50%', paddingRight: space.sm },
  perk: { gap: 6, alignItems: 'flex-start' },
  perkText: { flex: 1, lineHeight: 18 },
  offers: {},
  offersList: { gap: space.sm },
  offer: { borderRadius: radius.lg - 6, borderWidth: 2, backgroundColor: color.panel },
  offerOn: { borderColor: color.accent, paddingHorizontal: 18, paddingVertical: 14 },
  offerOff: { borderColor: veil.glassStrong, paddingHorizontal: 18, minHeight: 56, justifyContent: 'center' },
  offerTop: { gap: space.sm, alignItems: 'flex-start' },
  offerShort: { gap: space.md },
  price: { marginTop: space.xs, lineHeight: 36 },
  badge: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: color.accent, transform: [{ rotate: '3deg' }] },
  timeline: { marginTop: space.md },
  timelineLine: { position: 'absolute', top: 8, left: '16%', right: '16%', height: 2, backgroundColor: veil.off },
  timelineStep: { flex: 1, alignItems: 'center', gap: 2 },
  timelineDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: veil.off, backgroundColor: color.card, marginBottom: space.xs },
  timelineDotOn: { backgroundColor: color.accent, borderColor: alpha(color.accent, 0.4) },
  timelineText: { lineHeight: 16, paddingHorizontal: 2 },
  memberCard: { gap: space.md, padding: 18, borderRadius: radius.lg - 6, borderWidth: 2, borderColor: color.accent, backgroundColor: color.panel },
  actions: { marginTop: 'auto', gap: space.xs },
  secondary: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  note: { lineHeight: 18 },
  legal: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: space.lg, marginTop: space.xs },
  legalItem: { minHeight: 44, justifyContent: 'center' },
  legalText: { textDecorationLine: 'underline' },
});
