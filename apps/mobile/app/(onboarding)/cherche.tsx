/**
 * Ce que tu cherches (V6-GCherche) : des potes, plus, ou les deux. Pour « plus », qui tu veux rencontrer, puis un
 * accord explicite (donnée sensible, jamais montrée aux autres : elle sert seulement à filtrer). Sans accord, pas de
 * « plus » : la personne peut choisir « des potes ».
 */
import type { Seeking, Whom } from '@blowy/contract';
import { SEEKINGS, WHOMS } from '@blowy/domain';
import { Appear, CheckRow, ChoiceCard, ChoiceGrid, OnboardingTemplate, Text } from '@blowy/ui';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';

import { ScreenMotion } from '@/core';
import { progressAt, seekingDone, useDraft, useDraftGate, useStep } from '@/features/onboarding';
import { goBack } from '@/features/session';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';

const t = onboarding.cherche;

export default function Cherche() {
  const gate = useDraftGate();
  if (gate === 'missing') return <Redirect href="/" />;
  if (gate === 'loading') return null;
  return <ChercheStep />;
}

function ChercheStep() {
  useStep('cherche');
  const species = useDraft((d) => d.species);
  const petName = useDraft((d) => d.petName);
  const seeking = useDraft((d) => d.seeking);
  const whom = useDraft((d) => d.whom);
  const consent = useDraft((d) => d.sensitiveConsent);
  const set = useDraft((d) => d.set);
  const [reactKey, setReactKey] = useState(0);
  const romantic = seeking === 'plus' || seeking === 'les_deux';
  const ok = seekingDone({ seeking, whom, sensitiveConsent: consent });

  const pick = (s: Seeking) => {
    setReactKey((n) => n + 1);
    // « Des potes » : rien de sensible n'est gardé.
    set(s === 'potes' ? { seeking: s, whom: null, sensitiveConsent: false } : { seeking: s });
  };

  return (
    <ScreenMotion>
      <OnboardingTemplate
        {...progressAt('cherche')}
        onBack={() => goBack('/(onboarding)/sexe')}
        backLabel={common.back}
        host={{ species, line: t.host, highlight: t.highlight, reactKey, seed: petName, name: petName }}
        gap={12}
        primaryLabel={t.cta}
        primaryDisabled={!ok}
        onPrimary={() => router.push('/(onboarding)/naissance')}
        footnote={
          <Text size={13} muted center>
            {romantic && !consent ? t.consentHint : t.footer(petName)}
          </Text>
        }
      >
        {SEEKINGS.map((s, i) => {
          const o = t.options[s];
          return (
            <Appear key={s} delay={60 + i * 60} distance={18} from="right">
              <ChoiceCard title={o.title} subtitle={o.subtitle} emoji={o.emoji} compact plain marker selected={seeking === s} tilt={i % 2 ? 2 : -2} onPress={() => pick(s)} />
            </Appear>
          );
        })}
        {romantic ? (
          <Appear key="whom" distance={10} style={{ gap: 12 }}>
            <Text variant="bodyHeavy" size={17}>
              {t.whomTitle}
            </Text>
            <ChoiceGrid<Whom>
              items={WHOMS.map((w) => ({ key: w, label: t.whom[w] }))}
              selected={whom}
              onSelect={(w) => set({ whom: w })}
            />
            <CheckRow checked={consent} onChange={(v) => set({ sensitiveConsent: v })} label={t.consent} />
          </Appear>
        ) : null}
      </OnboardingTemplate>
    </ScreenMotion>
  );
}
