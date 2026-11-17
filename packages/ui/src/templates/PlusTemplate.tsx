import type { Outfit, Species } from '@blowy/domain';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
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
  /** Marque du grand titre (« minimoa ») : le « + » jaune est ajouté. */
  brand: string;
  /** Ligne estompée sous le titre : ce que la personne vient d'essayer, ou « Nino en veut plus. ». */
  headline: string;
  /** Son minimoa, habillé, et les objets premium qui flottent autour de lui. */
  pet: { species: Species; outfit?: Outfit | null; name: string };
  floatingItems?: readonly string[];
  /** Preuve concrète (nombre réel venu du serveur) : absente à zéro. */
  teaser?: { label: string; species: readonly Species[] } | null;
  perks: readonly { key: string; label: string; highlight?: boolean }[];
  /** Avantages montrés d'abord (les autres se déplient sur place) ; défaut : tous. */
  perksShown?: number;
  /** Libellé qui déplie le reste (« Et 5 de plus »), avec le nombre caché. */
  morePerksLabel?: string;
  /** Offres ; absentes pour un membre (`member`). */
  offers?: readonly PlusOfferView<K>[];
  selected?: K;
  onSelect?: (key: K) => void;
  offersLabel?: string;
  ctaLabel?: string;
  onCta?: () => void;
  ctaDisabled?: boolean;
  ctaLoading?: boolean;
  /** Retour d'un achat (en attente, échec, réussite), d'une restauration ou d'un chargement : dans la barre fixe, au-dessus du bouton. */
  status?: { tone: 'info' | 'success' | 'error'; text: string } | null;
  /** Mention de test (achat simulé du mode local), sous les offres. */
  devNote?: string | null;
  /** Déjà membre : l'état de l'abonnement et « gérer mon abonnement » à la place des offres. */
  member?: { title: string; summary: string; manageLabel?: string; onManage?: () => void } | null;
  /** « Continuer gratuitement » : toujours présent, neutre. */
  continueLabel: string;
  onContinue: () => void;
  restoreLabel?: string;
  onRestore?: () => void;
  restoreLoading?: boolean;
  /** Liens de la barre fixe (conditions d'utilisation, confidentialité), à côté de « Restaurer mes achats » : toujours visibles. */
  links?: readonly { label: string; onPress: () => void }[];
  /** Liens à côté de « Continuer gratuitement » (conditions de Minimoa+, avec la mention complète du renouvellement). */
  moreLinks?: readonly { label: string; onPress: () => void }[];
  /** Sous le bouton d'achat : l'essai et sa fin, le prix ensuite, le renouvellement automatique, où annuler. */
  ctaNote?: string | null;
}

/**
 * Hauteur du panneau du haut. La feuille tient sur un écran sans défiler (390 × 844 comme 375 × 667) : sur un petit
 * écran le panneau, le titre et le minimoa rapetissent.
 */
const HEADER = 156;
const HEADER_SHORT = 112;

const STATUS_TINT = { info: color.accent, success: color.ok, error: color.danger } as const;

/** Un objet premium qui flotte près du minimoa (boucle douce, arrêtée avec « réduire les animations »). */
function Floating({ id, size, delay, style }: { id: string; size: number; delay: number; style: object }) {
  const t = useLoop(2600, true, delay);
  const float = useAnimatedStyle(() => ({
    transform: [{ translateY: -6 * t.value }, { rotate: `${-6 + 12 * t.value}deg` }],
  }));
  return (
    <PopIn delay={420 + delay / 4} from={0.3} style={[styles.floating, style]} pointerEvents="none">
      <Animated.View style={float}>
        <ItemImage id={id} size={size} />
      </Animated.View>
    </PopIn>
  );
}

/** Frise de l'essai : trois jalons reliés, le premier allumé (absente sur un petit écran : la note du bouton dit la même chose). */
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

function OfferCard<K extends string>({ offer, on, onPress, compact }: { offer: PlusOfferView<K>; on: boolean; onPress: () => void; compact: boolean }) {
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
          {offer.timeline?.length && !compact ? <TrialTimeline steps={offer.timeline} /> : null}
        </View>
      ) : (
        <View style={[layout.rowBetween, styles.offerShort]}>
          <Text variant="bodyHeavy" size={15} style={layout.grow}>
            {offer.short}
          </Text>
          {/* Le prix reste sur une ligne ; c'est le nom de l'offre qui passe à la ligne s'il le faut. */}
          <Text variant="bodyHeavy" size={15} numberOfLines={1} style={styles.shortPrice}>
            {offer.price}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/**
 * Minimoa+ (V6-GPlus) : feuille haute. En haut, le minimoa de la personne habillé avec les objets premium qui flottent, la
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
  perksShown,
  morePerksLabel,
  offers,
  selected,
  onSelect,
  offersLabel,
  ctaLabel,
  onCta,
  ctaDisabled,
  ctaLoading,
  status,
  devNote,
  member,
  continueLabel,
  onContinue,
  restoreLabel,
  onRestore,
  restoreLoading,
  links,
  moreLinks,
  ctaNote,
}: PlusTemplateProps<K>) {
  const insets = useSafeAreaInsets();
  const short = useWindowDimensions().height < 740;
  // Dans une feuille (`SheetTemplate bare`) : la barre du haut sert de poignée, la croix et « continuer » font
  // redescendre la feuille, et tirer le contenu au-delà du haut la ferme.
  const sheet = useSheet();
  const top = sheet ? 12 : insets.top;
  const close = sheet ? sheet.close : onClose;
  const proceed = sheet ? sheet.close : onContinue;
  const [allPerks, setAllPerks] = useState(false);
  const cut = !allPerks && perksShown !== undefined && morePerksLabel && perks.length > perksShown + 1 ? perksShown : perks.length;
  const shownPerks = perks.slice(0, cut);
  return (
    <View style={[styles.root, sheet && styles.rootSheet]}>
      <ScrollView
        style={layout.fill}
        contentContainerStyle={[styles.content, { paddingBottom: space.lg }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScrollEndDrag={sheet ? (e) => e.nativeEvent.contentOffset.y < -70 && sheet.close() : undefined}
      >
        {/* Le panneau suit son contenu (titre, ligne de la raison, preuve concrète) : rien ne déborde quelle que soit la raison. */}
        <View style={[styles.panel, { minHeight: (short ? HEADER_SHORT : HEADER) + top - 6 }]}>
          <View style={styles.panelFill}>
            <LinearGradient colors={plusGradient} style={StyleSheet.absoluteFill} />
          </View>
          {/* Son minimoa, habillé, entre par la droite ; les objets premium flottent autour. */}
          <Appear from="right" distance={60} delay={120} duration={motion.slow} pointerEvents="none" style={[styles.pet, { top: top + (short ? 16 : 24) }]}>
            <DressedPet species={pet.species} outfit={pet.outfit ?? undefined} size={short ? 100 : 136} mood="joie" accessibilityLabel={pet.name} />
          </Appear>
          {floatingItems[0] ? <Floating id={floatingItems[0]} size={short ? 38 : 46} delay={0} style={{ top: top + (short ? 78 : 112), right: -4 }} /> : null}
          {floatingItems[1] ? <Floating id={floatingItems[1]} size={short ? 36 : 42} delay={900} style={{ top: top + 2, right: short ? 92 : 108 }} /> : null}
          <SheetHandle style={[layout.rowBetween, styles.top, { paddingTop: top - 6 + space.md }]}>
            <View />
            <IconButton glyph="close" variant="back" label={closeLabel} onPress={close} />
          </SheetHandle>
          <View style={[styles.head, short && styles.headShort]}>
            <Title text={[{ text: brand }, { text: '+', color: color.accent }]} size={short ? 44 : 56} style={short ? styles.titleShort : styles.title} />
            {/* Petit écran avec la preuve concrète : elle remplace la ligne de la raison. */}
            {short && teaser ? null : <Title text={[{ text: headline, dim: true }]} size={short ? 20 : 24} variant="h2" style={styles.headline} />}
            {teaser ? (
              <Appear delay={260} style={[layout.row, styles.teaser]}>
                <View style={[layout.row, styles.silhouettes]} accessible={false}>
                  {teaser.species.slice(0, 3).map((s, i) => (
                    <Avatar key={s} size={30} pet={{ name: s, species: s }} blurred cutout style={i ? styles.silhouetteNext : null} />
                  ))}
                </View>
                <Text variant="bodyHeavy" size={15} color={color.white} style={styles.teaserText}>
                  {teaser.label}
                </Text>
              </Appear>
            ) : null}
          </View>
        </View>

        <View style={[styles.body, short && styles.bodyShort]}>
          {/* Petit écran, après un achat raté ou une restauration : les avantages laissent la place au message. */}
          {short && status ? null : (
            <View style={[styles.perks, short && styles.perksShort]}>
              {shownPerks.map((p, i) => (
                <Appear key={p.key} delay={140 + Math.min(i, 8) * 35} distance={8} style={styles.perkCell}>
                  <View style={[layout.row, styles.perk]}>
                    <Glyph name="check" size={16} color={color.accent} />
                    <Text variant={p.highlight ? 'bodyHeavy' : 'bodyBold'} size={15} color={p.highlight ? color.accent : undefined} style={styles.perkText}>
                      {p.label}
                    </Text>
                  </View>
                </Appear>
              ))}
              {cut < perks.length ? (
                <Appear delay={140 + cut * 35} distance={8} style={styles.perkCell}>
                  <Pressable onPress={() => setAllPerks(true)} accessibilityRole="button" accessibilityLabel={morePerksLabel} style={[layout.row, styles.perk, styles.morePerks]}>
                    <Glyph name="plus" size={16} color={color.mute} />
                    <Text variant="bodyBold" size={15} muted style={[styles.perkText, styles.legalText]}>
                      {morePerksLabel}
                    </Text>
                  </Pressable>
                </Appear>
              ) : null}
            </View>
          )}

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
                  <OfferCard key={o.key} offer={o} on={o.key === selected} onPress={() => onSelect?.(o.key)} compact={short || !!status} />
                ))}
              </View>
            </Appear>
          ) : null}

          {devNote && !short ? (
            <Text size={13} muted center>
              {devNote}
            </Text>
          ) : null}

          {/*
            Sous l'offre, sur une ligne : continuer sans payer, et les conditions de Minimoa+ (la mention complète du
            renouvellement y est ; l'essentiel est sous le bouton). Tout tient sur un écran, sans défiler.
          */}
          <View style={styles.actions}>
            <Pressable onPress={proceed} accessibilityLabel={continueLabel} style={styles.secondary}>
              <InkProvider value={color.white}>
                <Text variant="bodyHeavy" size={15}>
                  {continueLabel}
                </Text>
              </InkProvider>
            </Pressable>
            {moreLinks?.map((l) => (
              <LegalLink key={l.label} label={l.label} onPress={l.onPress} />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Barre fixe : l'achat, ce qu'il engage en une ligne, et la restauration et les conditions, toujours visibles. */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {/* Retour d'achat ou de chargement : une ligne colorée au-dessus du bouton (la frise se replie pour lui faire place). */}
        {status ? (
          <Appear key={status.text} from="none">
            <View style={[layout.row, styles.status]} accessibilityRole={status.tone === 'error' ? 'alert' : 'summary'} accessibilityLiveRegion="polite">
              <View style={[styles.statusDot, { backgroundColor: STATUS_TINT[status.tone] }]} />
              <Text variant="bodyBold" size={13} color={STATUS_TINT[status.tone]} style={layout.grow}>
                {status.text}
              </Text>
            </View>
          </Appear>
        ) : null}
        {!member && ctaLabel ? <Button label={ctaLabel} onPress={onCta} disabled={ctaDisabled || !onCta} loading={ctaLoading} /> : null}
        {!member && ctaNote ? (
          <Text size={13} muted center style={styles.ctaNote}>
            {ctaNote}
          </Text>
        ) : null}
        <View style={styles.legalBar}>
          {restoreLabel && onRestore ? (
            <Pressable onPress={onRestore} disabled={restoreLoading} accessibilityRole="button" accessibilityLabel={restoreLabel} style={[styles.legalItem, styles.legalCell]}>
              <Text variant="bodyBold" size={13} muted={!restoreLoading} dim={restoreLoading} center style={styles.legalText}>
                {restoreLabel}
              </Text>
            </Pressable>
          ) : null}
          {links?.map((l) => (
            <LegalLink key={l.label} label={l.label} onPress={l.onPress} cell />
          ))}
        </View>
      </View>
    </View>
  );
}

/** Lien légal ; `cell` : une des trois cases de la barre fixe (le libellé passe sur deux lignes plutôt que de déborder). */
function LegalLink({ label, onPress, cell }: { label: string; onPress: () => void; cell?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" accessibilityLabel={label} style={[styles.legalItem, cell && styles.legalCell]}>
      <Text size={13} muted center={cell} style={styles.legalText}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.night },
  rootSheet: { backgroundColor: 'transparent' },
  content: { flexGrow: 1 },
  panel: { marginTop: 6, marginHorizontal: 6 },
  panelFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.xl + 4,
    overflow: 'hidden',
  },
  pet: { position: 'absolute', right: -8 },
  floating: { position: 'absolute' },
  top: { paddingBottom: space.xs, paddingHorizontal: 14 },
  head: { paddingLeft: 20, paddingRight: 136, paddingBottom: space.lg },
  title: { lineHeight: 52 },
  // Petit écran : le titre remonte à hauteur de la croix (il est à gauche, elle à droite).
  headShort: { paddingBottom: space.md, marginTop: -34 },
  bodyShort: { gap: space.sm, paddingTop: space.sm },
  status: { gap: space.sm, alignItems: 'center', paddingHorizontal: space.xs },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  titleShort: { lineHeight: 42 },
  headline: { marginTop: 2 },
  teaser: { gap: space.sm, alignItems: 'center', marginTop: space.md },
  silhouettes: { alignItems: 'center' },
  silhouetteNext: { marginLeft: -11 },
  teaserText: { flex: 1, lineHeight: 19 },
  body: { paddingHorizontal: 20, paddingTop: space.md, gap: space.md, flexGrow: 1 },
  perks: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10 },
  perksShort: { rowGap: 4 },
  perkCell: { width: '50%', paddingRight: space.xs },
  perk: { gap: 7, alignItems: 'center' },
  morePerks: { minHeight: 44, marginVertical: -12 },
  perkText: { flex: 1, lineHeight: 20 },
  offers: {},
  offersList: { gap: space.sm },
  offer: { borderRadius: radius.lg - 6, borderWidth: 2, backgroundColor: color.panel },
  offerOn: { borderColor: color.accent, paddingHorizontal: 14, paddingVertical: 12 },
  offerOff: { borderColor: veil.glassStrong, paddingHorizontal: 14, minHeight: 52, justifyContent: 'center' },
  offerTop: { gap: space.sm, alignItems: 'flex-start' },
  offerShort: { gap: space.md },
  price: { marginTop: space.xs, lineHeight: 36 },
  shortPrice: { flexShrink: 0 },
  badge: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: color.accent,
    transform: [{ rotate: '3deg' }],
  },
  timeline: { marginTop: space.md },
  timelineLine: {
    position: 'absolute',
    top: 8,
    left: '16%',
    right: '16%',
    height: 2,
    backgroundColor: veil.off,
  },
  timelineStep: { flex: 1, alignItems: 'center', gap: 2 },
  timelineDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: veil.off,
    backgroundColor: color.card,
    marginBottom: space.xs,
  },
  timelineDotOn: { backgroundColor: color.accent, borderColor: alpha(color.accent, 0.4) },
  timelineText: { lineHeight: 16, paddingHorizontal: 2 },
  memberCard: {
    gap: space.md,
    padding: 14,
    borderRadius: radius.lg - 6,
    borderWidth: 2,
    borderColor: color.accent,
    backgroundColor: color.panel,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    columnGap: space.lg,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: space.md,
    gap: space.xs,
    backgroundColor: color.night,
    borderTopWidth: 1,
    borderTopColor: veil.hairline,
  },
  ctaNote: { lineHeight: 17 },
  legalBar: { flexDirection: 'row', justifyContent: 'center', columnGap: space.md },
  legalCell: { flexShrink: 1, alignItems: 'center' },
  secondary: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  legalItem: { minHeight: 44, justifyContent: 'center' },
  legalText: { textDecorationLine: 'underline' },
});
