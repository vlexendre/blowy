/**
 * Offre d'abonnement : liste de forfaits dont le prix vient TOUJOURS du store (texte localisé
 * fourni par l'app), sélection, CTA, continuer gratuitement clairement visible, mention de mode
 * démo si l'intégration n'est pas LIVE. Aucun prix calculé ici.
 */
import { StyleSheet, View } from 'react-native';
import { space } from '../foundations/theme';
import { Button } from '../atoms/Button';
import { Text } from '../atoms/Text';
import { Banner } from '../molecules/Banner';
import { OptionCard } from '../molecules/OptionCard';

export interface PaywallPackage {
  id: string;
  title: string;
  /** Prix localisé du store + période (« 59,99 € / an »). */
  priceLine: string;
  /** Essai / offre d'introduction, seulement si le store la déclare éligible. */
  introLine?: string | null;
}

export interface PaywallOfferProps {
  packages: readonly PaywallPackage[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  ctaLabel: string;
  onPurchase: () => void;
  purchasing?: boolean;
  continueFreeLabel: string;
  onContinueFree: () => void;
  restoreLabel: string;
  onRestore: () => void;
  legalText: string;
  demoNotice?: string | null;
  emptyText?: string | null;
}

export function PaywallOffer(p: PaywallOfferProps) {
  return (
    <View style={styles.wrap}>
      {p.demoNotice ? <Banner message={p.demoNotice} tone="violet" icon="flag" /> : null}
      {p.packages.length === 0 && p.emptyText ? (
        <Text variant="body" tone="inkSoft">
          {p.emptyText}
        </Text>
      ) : (
        p.packages.map((pk) => (
          <OptionCard key={pk.id} title={pk.title} subtitle={[pk.priceLine, pk.introLine].filter(Boolean).join(' · ')} selected={p.selectedId === pk.id} onPress={() => p.onSelect(pk.id)} testID={`package-${pk.id}`} />
        ))
      )}
      <Button label={p.ctaLabel} onPress={p.onPurchase} loading={p.purchasing} disabled={!p.selectedId || p.packages.length === 0} testID="paywall-purchase" />
      <Button label={p.continueFreeLabel} variant="secondary" onPress={p.onContinueFree} testID="paywall-continue-free" />
      <Button label={p.restoreLabel} variant="ghost" onPress={p.onRestore} />
      <Text variant="caption" tone="muted" align="center">
        {p.legalText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { gap: space.md } });
