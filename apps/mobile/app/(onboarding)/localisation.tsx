/**
 * Le quartier (V6-GLocalisation), après la date de naissance et avant la connexion : on ne montre personne sans l'âge
 * ni le coin (Ton chemin, V1). D'abord l'explication (ta zone, pas ton adresse ; jamais ta position exacte), puis un
 * seul « Continuer » qui ouvre la demande du téléphone (règle d'Apple : pas de « plus tard » avant la demande). Refusée
 * ou indisponible : on continue quand même, la ville se choisit à la main depuis l'accueil. Rien n'est envoyé ici : la
 * position du moment est relevée à la création du compte (`useOnboard`), seulement si l'accord est donné.
 */
import type { Species } from '@blowy/domain';
import { FeatureRow, OnboardingTemplate, Text, ZonePreview } from '@blowy/ui';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Platform } from 'react-native';

import { ScreenMotion, useSession } from '@/core';
import { askLocationPermission } from '@/features/map/location';
import { progressAt, useDraft, useDraftGate, useStep } from '@/features/onboarding';
import { goBack } from '@/features/session';
import { chemin } from '@/locales/chemin';
import { common } from '@/locales/common';
import { carte } from '@/locales/rencontres';
import { formatNumber } from '@/locales/runtime';

const t = chemin.onboarding.location;
const OTHERS: readonly Species[] = ['suzie', 'gaston', 'pia'];

export default function Localisation() {
  const gate = useDraftGate();
  if (gate === 'missing') return <Redirect href="/" />;
  if (gate === 'loading') return null;
  return <LocalisationStep />;
}

function LocalisationStep() {
  useStep('localisation');
  const species = useDraft((d) => d.species);
  const petName = useDraft((d) => d.petName);
  const session = useSession();
  const [asking, setAsking] = useState(false);

  const next = async () => {
    if (asking) return;
    setAsking(true);
    const answer = await askLocationPermission();
    useDraft.getState().set({ locationAnswer: Platform.OS === 'web' && answer.status !== 'granted' ? 'unavailable' : answer.status === 'granted' ? 'granted' : 'denied' });
    setAsking(false);
    // Déjà connecté (compte sans minimoa) : pas besoin de repasser par la connexion.
    router.push(session ? '/(onboarding)/preparation' : '/(onboarding)/connexion');
  };

  return (
    <ScreenMotion>
      <OnboardingTemplate
        {...progressAt('localisation')}
        onBack={() => goBack('/(onboarding)/naissance')}
        backLabel={common.back}
        host={{ species, line: t.question, highlight: t.highlight, seed: petName, name: petName }}
        gap={14}
        primaryLabel={t.cta}
        onPrimary={() => void next()}
        primaryLoading={asking}
        footnote={
          <Text size={13} muted center>
            {t.refuseNote}
          </Text>
        }
      >
        <ZonePreview species={species} others={OTHERS.filter((x) => x !== species)} radiusLabel={carte.zoneHome(formatNumber(1.5, { maximumFractionDigits: 1 }))} accessibilityLabel={t.zoneText(petName)} />
        <FeatureRow icon="coeurs" title={t.zoneTitle} text={t.zoneText(petName)} />
        <FeatureRow icon="gel" title={t.exactTitle} text={t.exactText} />
      </OnboardingTemplate>
    </ScreenMotion>
  );
}
