import type { Species } from '@blowy/domain';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { IconName } from '../assets/pets';
import { Button } from '../atoms/Button';
import { Glyph } from '../atoms/Glyph';
import { IconButton } from '../atoms/IconButton';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { InkProvider } from '../lib/ink';
import { layout } from '../lib/styles';
import { PerkLine } from '../molecules/PerkLine';
import { Appear } from '../motion/Appear';
import { PlusHero, type PlusHeroPose } from '../organisms/PlusHero';
import { type PlusPlanCard, PlusPlanCards } from '../organisms/PlusPlanCards';
import { TrialTimeline, type TrialStepView } from '../organisms/TrialTimeline';
import { color, plusBackdrop, radius, space, veil } from '../theme';
import { SheetHandle, useSheet } from './SheetTemplate';

/** Une offre telle que la feuille la montre (les prix arrivent mis en forme : jamais écrits dans le kit). */
export interface PlusOfferView<K extends string = string> extends PlusPlanCard<K> {
  /** Montant facturé et sa période ensemble (« 59,88 € par an »). */
  price: string;
  /**
   * Frise : l'essai (aujourd'hui → rappel → premier paiement) si la personne y a droit, sinon ce qui se passe sans essai
   * (paiement aujourd'hui → renouvellement → annulable).
   */
  timeline?: readonly TrialStepView[] | null;
}

/** Un avantage de Minimoa+ : « **Titre :** explication », avec son icône. */
export interface PlusPerkView {
  key: string;
  icon: IconName;
  title: string;
  text: string;
  /** Phrase complète lue par le lecteur d'écran. */
  label?: string;
  /** Lié à ce que la personne vient d'essayer : en tête, titre en jaune. */
  highlight?: boolean;
}

export interface PlusTemplateProps<K extends string> {
  onClose: () => void;
  closeLabel: string;
  /** Marque (« minimoa ») : le « + » jaune est ajouté. */
  brand: string;
  /** Le grand titre bénéfice. */
  headline: string;
  pet: { species: Species; name: string };
  /** Trois poses du minimoa, trois bénéfices courts (petit écran : la dernière seule). */
  poses: readonly PlusHeroPose[];
  floatingItems?: readonly string[];
  /** Preuve concrète (nombre réel venu du serveur) : absente à zéro. */
  teaser?: { label: string; species: readonly Species[] } | null;
  /** Avantages, dans l'ordre (celui de la raison en tête). */
  perks: readonly PlusPerkView[];
  /** Avantages déjà illustrés par les poses : la liste ne les répète pas quand les trois poses sont là. */
  heroPerks?: readonly string[];
  /** Lignes d'avantages montrées d'abord (les autres se déplient sur place). Défaut : 4 (petit écran : 2). */
  perksShown?: number;
  /** Libellé qui déplie le reste (« Et 5 de plus »), selon le nombre caché. */
  morePerksLabel?: (hidden: number) => string;
  /** Offres ; absentes pour un membre (`member`). */
  offers?: readonly PlusOfferView<K>[];
  selected?: K;
  onSelect?: (key: K) => void;
  offersLabel?: string;
  /** Bouton d'achat : l'action (« Commencer mes 7 jours gratuits »)… */
  ctaLabel?: string;
  /** …et, dessous, le montant facturé et sa période (« puis 59,88 € par an »). */
  ctaSubLabel?: string | null;
  onCta?: () => void;
  ctaDisabled?: boolean;
  ctaLoading?: boolean;
  /** Retour d'un achat, d'une restauration ou d'un chargement : au-dessus du bouton. */
  status?: { tone: 'info' | 'success' | 'error'; text: string } | null;
  /** Mention de test (achat simulé du mode local). */
  devNote?: string | null;
  /** Déjà membre : l'état de l'abonnement et « Gérer mon abonnement » à la place des offres. */
  member?: { title: string; summary: string; manageLabel?: string; onManage?: () => void } | null;
  /** « Continuer gratuitement » : toujours présent, neutre. */
  continueLabel: string;
  onContinue: () => void;
  restoreLabel?: string;
  onRestore?: () => void;
  restoreLoading?: boolean;
  /** Liens du bas (conditions d'utilisation, confidentialité), à côté de « Restaurer » : toujours visibles. */
  links?: readonly { label: string; onPress: () => void }[];
  /** Liens à côté de « Continuer gratuitement » (conditions de Minimoa+, avec la mention complète). */
  moreLinks?: readonly { label: string; onPress: () => void }[];
  /** Sous le bouton : l'essai et la date du premier paiement, le renouvellement automatique, où annuler. */
  ctaNote?: string | null;
}

/** En dessous : petit écran (375 × 667 et moins) ; une seule pose, liste et frise resserrées. */
const SHORT = 740;

const STATUS_TINT = { info: color.accent, success: color.ok, error: color.danger } as const;

/**
 * Minimoa+ : feuille haute sur un fond doux aux couleurs de la marque. En haut la marque et la croix (active tout de
 * suite), un grand titre bénéfice et le minimoa de la personne en trois poses (trois bénéfices courts) ; puis les
 * autres avantages en lignes « **Titre :** explication », les offres en cartes côte à côte (montant facturé et période en
 * grand, remise de l'annuelle en pastille), la frise de l'essai si la personne y a droit, « Continuer gratuitement ».
 * Barre fixe en bas : le bouton (avec le prix), l'essai, la date du premier paiement, le renouvellement et où annuler,
 * puis « Restaurer · Conditions · Confidentialité ». Tout tient sur un écran sans défiler (390 × 844 et 375 × 667).
 */
export function PlusTemplate<K extends string>({
  onClose,
  closeLabel,
  brand,
  headline,
  pet,
  poses,
  floatingItems = [],
  teaser,
  perks,
  heroPerks = [],
  perksShown,
  morePerksLabel,
  offers,
  selected,
  onSelect,
  offersLabel,
  ctaLabel,
  ctaSubLabel,
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
  const short = useWindowDimensions().height < SHORT;
  // Dans une feuille (`SheetTemplate bare`) : la barre du haut sert de poignée, la croix et « continuer » font
  // redescendre la feuille, et tirer le contenu au-delà du haut la ferme.
  const sheet = useSheet();
  const top = sheet ? 10 : insets.top;
  const close = sheet ? sheet.close : onClose;
  const proceed = sheet ? sheet.close : onContinue;
  const [allPerks, setAllPerks] = useState(false);

  // Les trois poses illustrent déjà trois avantages : la liste donne les autres. Petit écran (une pose) : tous.
  const listed = short ? perks : perks.filter((p) => p.highlight || !heroPerks.includes(p.key));
  // Petit écran avec un message (achat, restauration) ou une frise : une ligne de moins.
  const room = perksShown ?? 2;
  // Petit écran : une ligne. Membre (pas d'offres ni de frise) : tous les avantages, la place est là.
  const shown = member ? listed.length : short ? Math.min(room, 1) : room;
  const cut = !allPerks && morePerksLabel && listed.length > shown + 1 ? shown : listed.length;
  const selectedOffer = offers?.find((o) => o.key === selected);
  const timeline = !member && selectedOffer?.timeline?.length ? selectedOffer.timeline : null;

  return (
    <View style={[styles.root, sheet && styles.rootSheet]}>
      <LinearGradient colors={plusBackdrop.colors} locations={plusBackdrop.locations} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <ScrollView
        style={layout.fill}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScrollEndDrag={sheet ? (e) => e.nativeEvent.contentOffset.y < -70 && sheet.close() : undefined}
      >
        <View style={[styles.body, short && styles.bodyShort, { paddingTop: top }]}>
          {/* Le haut (marque, titre, croix) sert de poignée : on le tire pour descendre la feuille. */}
          <SheetHandle>
            <PlusHero
              brand={brand}
              corner={<IconButton glyph="close" variant="back" label={closeLabel} onPress={close} style={styles.close} />}
              headline={headline}
              pet={pet}
              poses={poses}
              floatingItems={floatingItems}
              teaser={teaser}
              compact={short}
            />
          </SheetHandle>

          {listed.length && !(short && status && !member) ? (
            <View style={[styles.perks, short && styles.perksShort]}>
              {listed.slice(0, cut).map((p, i) => (
                <Appear key={p.key} delay={160 + Math.min(i, 8) * 40} distance={8}>
                  <PerkLine icon={p.icon} title={p.title} text={p.text} highlight={p.highlight} compact={short} accessibilityLabel={p.label} />
                </Appear>
              ))}
              {cut < listed.length && morePerksLabel ? (
                <Pressable
                  onPress={() => setAllPerks(true)}
                  accessibilityRole="button"
                  accessibilityLabel={morePerksLabel(listed.length - cut)}
                  style={[layout.row, styles.morePerks]}
                >
                  <View style={[styles.moreDot, short && styles.moreDotShort]}>
                    <Glyph name="plus" size={12} color={color.white} />
                  </View>
                  <Text variant="bodyBold" size={short ? 14 : 15} muted style={styles.underline}>
                    {morePerksLabel(listed.length - cut)}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

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
            <Appear delay={220}>
              <PlusPlanCards plans={offers} selected={selected} onSelect={onSelect} label={offersLabel} compact={short} />
            </Appear>
          ) : null}

          {timeline && !(short && status) ? <TrialTimeline steps={timeline} compact /> : null}

          {devNote && !short ? (
            <Text size={13} muted center>
              {devNote}
            </Text>
          ) : null}

          {/* Continuer sans payer, et les conditions de Minimoa+ (la mention complète du renouvellement y est). */}
          <View style={[styles.actions, !member && styles.actionsBottom]}>
            <Pressable onPress={proceed} accessibilityLabel={continueLabel} style={styles.secondary}>
              <InkProvider value={color.white}>
                <Text variant="bodyHeavy" size={short ? 14 : 15}>
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

      {/* Barre fixe : l'achat et ce qu'il engage, puis la restauration et les conditions, toujours visibles. */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 6) }]}>
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
        {!member && ctaLabel ? (
          <Button label={ctaLabel} subLabel={ctaSubLabel} onPress={onCta} disabled={ctaDisabled || !onCta} loading={ctaLoading} />
        ) : null}
        {!member && ctaNote ? (
          <Text size={13} muted center style={styles.ctaNote}>
            {ctaNote}
          </Text>
        ) : null}
        <View style={styles.legalBar}>
          {restoreLabel && onRestore ? (
            <Pressable onPress={onRestore} disabled={restoreLoading} accessibilityRole="button" accessibilityLabel={restoreLabel} style={[styles.legalItem, styles.legalCell]}>
              <Text size={13} muted={!restoreLoading} dim={restoreLoading} center style={styles.underline}>
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

/** Lien légal ; `cell` : une des cases de la barre du bas (le libellé passe sur deux lignes plutôt que de déborder). */
function LegalLink({ label, onPress, cell }: { label: string; onPress: () => void; cell?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" accessibilityLabel={label} style={[styles.legalItem, cell && styles.legalCell]}>
      <Text size={13} muted center={cell} style={styles.underline}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.night },
  rootSheet: { backgroundColor: 'transparent' },
  content: { flexGrow: 1 },
  close: { marginRight: -6 },
  body: { paddingHorizontal: 20, paddingTop: 0, paddingBottom: 0, gap: 10, flexGrow: 1 },
  bodyShort: { gap: 8 },
  perks: { gap: 6 },
  perksShort: { gap: 6 },
  morePerks: { gap: space.sm + 2, alignItems: 'center', minHeight: 28, alignSelf: 'flex-start' },
  moreDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: veil.glassStrong, alignItems: 'center', justifyContent: 'center' },
  moreDotShort: { width: 22, height: 22, borderRadius: 11 },
  memberCard: {
    gap: space.md,
    padding: 14,
    borderRadius: radius.md + 2,
    borderWidth: 2,
    borderColor: color.accent,
    backgroundColor: color.panel,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    columnGap: space.md,
  },
  // Avec les offres, « Continuer gratuitement » se cale en bas, juste au-dessus de la barre d'achat.
  actionsBottom: { marginTop: 'auto' },
  status: { gap: space.sm, alignItems: 'center', paddingHorizontal: space.xs },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: space.xs,
    backgroundColor: color.night,
    borderTopWidth: 1,
    borderTopColor: veil.hairline,
  },
  ctaNote: { lineHeight: 17 },
  legalBar: { flexDirection: 'row', justifyContent: 'center', columnGap: space.lg, marginTop: -6 },
  legalCell: { flexShrink: 1, alignItems: 'center' },
  secondary: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  legalItem: { minHeight: 44, justifyContent: 'center' },
  underline: { textDecorationLine: 'underline' },
});
