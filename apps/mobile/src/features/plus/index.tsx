/**
 * Blowy+ : présentation de l'offre, partagée par le paywall de l'inscription et l'écran « Moi › Blowy+ ».
 * Les achats ne sont pas branchés dans cette version (`purchases.available` faux) : rien n'est vendu,
 * le bouton principal reste désactivé et l'écran propose de continuer gratuitement.
 */
import type { Species } from '@blowy/domain';
import { space } from '@blowy/tokens';
import { Banner, Button, FeatureRow, IconButton, Panel, PetImage, PlanPicker, ScreenTemplate, Sticker, Text, Title } from '@blowy/ui';
import { useState } from 'react';
import { View } from 'react-native';

import { usePorts } from '@/core';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';

const t = onboarding.plus;
type PlanKey = (typeof t.plans)[number]['key'];

export interface PlusOfferProps {
  pet: { name: string; species: Species };
  /** Déjà membre : on remercie au lieu de présenter l'offre. */
  member?: boolean;
  onClose: () => void;
  /** Action « continuer gratuitement » (le paywall mène aux onglets, Moi revient en arrière). */
  onContinue: () => void;
}

export function PlusOffer({ pet, member = false, onClose, onContinue }: PlusOfferProps) {
  const { purchases } = usePorts();
  const [plan, setPlan] = useState<PlanKey>('yearly');
  const [buying, setBuying] = useState(false);

  const buy = async () => {
    setBuying(true);
    try {
      if (await purchases.purchase(plan)) onContinue();
    } finally {
      setBuying(false);
    }
  };

  return (
    <ScreenTemplate
      padded
      footer={
        <>
          {purchases.available && !member ? (
            <Button label={t.cta} onPress={buy} loading={buying} />
          ) : (
            <Button label={member ? t.member : t.cta} disabled accessibilityHint={t.soon} />
          )}
          <Button label={t.continueFree} variant="ghost" onPress={onContinue} />
        </>
      }
    >
      <View style={{ gap: space.lg }}>
        <Panel gradient="wine" padding="lg" style={{ paddingTop: space.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Sticker label={t.sticker} tone="accent" size="sm" />
            <IconButton glyph="close" label={common.close} onPress={onClose} />
          </View>
          <View style={{ position: 'absolute', right: -40, top: 56 }} pointerEvents="none">
            <PetImage species={pet.species} mood="smug" size={150} animation="bob" outline rotate={-8} />
          </View>
          <View style={{ marginTop: space.md, marginBottom: space.lg, paddingRight: 70 }}>
            <Title text={t.title(pet.name)} size={52} />
          </View>
          <View style={{ gap: space.md }}>
            {t.features.map((f) => (
              <FeatureRow key={f.icon} icon={f.icon} title={typeof f.title === 'function' ? f.title(pet.name) : f.title} text={f.text} />
            ))}
          </View>
        </Panel>
        <PlanPicker plans={t.plans} value={plan} onChange={setPlan} />
        {purchases.available ? null : <Banner tone="info" text={t.soon} />}
        <Text muted size={14}>
          {t.free}
        </Text>
      </View>
    </ScreenTemplate>
  );
}
