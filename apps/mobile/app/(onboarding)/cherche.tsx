/**
 * Ce que tu cherches (V6-GCherche), une question à la fois. D'abord : des potes, plus, ou les deux (toucher choisit et
 * passe à la suite, comme « Tu es… »). Pour « plus » ou « les deux », un second temps sur le même écran : qui tu veux
 * rencontrer, puis un accord explicite (donnée sensible, jamais montrée aux autres : elle sert seulement à filtrer).
 * Sans accord, pas de « plus » : retour au premier temps pour choisir « des potes ».
 */
import type { Seeking, Whom } from '@blowy/contract';
import { SEEKINGS, WHOMS } from '@blowy/domain';
import { Appear, CheckRow, ChoiceCard, ChoiceGrid, OnboardingTemplate, Text } from '@blowy/ui';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ScreenMotion } from '@/core';
import { progressAt, seekingDone, useDraft, useDraftGate, useStep } from '@/features/onboarding';
import { goBack } from '@/features/session';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';

const t = onboarding.cherche;
const romanticOf = (s: Seeking | null): boolean => s === 'plus' || s === 'les_deux';

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
  // Second temps (« qui » et l'accord) : seulement après avoir choisi « plus » ou « les deux ».
  const [askWhom, setAskWhom] = useState(false);
  const leaving = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  useFocusEffect(useCallback(() => void (leaving.current = false), []));
  const ok = seekingDone({ seeking, whom, sensitiveConsent: consent });

  const pick = (s: Seeking) => {
    if (leaving.current) return;
    leaving.current = true;
    setReactKey((n) => n + 1);
    // « Des potes » : rien de sensible n'est gardé.
    set(s === 'potes' ? { seeking: s, whom: null, sensitiveConsent: false } : { seeking: s });
    // La carte s'incline, le minimoa réagit, puis la suite (rien n'attend la fin de l'animation).
    timer.current = setTimeout(() => {
      if (romanticOf(s)) {
        leaving.current = false;
        setAskWhom(true);
      } else {
        router.push('/(onboarding)/naissance');
      }
    }, 360);
  };

  if (askWhom && romanticOf(seeking)) {
    return (
      <ScreenMotion>
        <OnboardingTemplate
          {...progressAt('cherche')}
          onBack={() => setAskWhom(false)}
          backLabel={common.back}
          host={{ species, line: t.whomHost, highlight: t.whomHighlight, reactKey, seed: petName, name: petName }}
          gap={14}
          primaryLabel={t.cta}
          primaryDisabled={!ok}
          onPrimary={() => router.push('/(onboarding)/naissance')}
          footnote={
            consent ? undefined : (
              <Text size={13} muted center>
                {t.consentHint}
              </Text>
            )
          }
        >
          <Appear distance={10}>
            <ChoiceGrid<Whom>
              items={WHOMS.map((w) => ({ key: w, label: t.whom[w] }))}
              selected={whom}
              onSelect={(w) => {
                setReactKey((n) => n + 1);
                set({ whom: w });
              }}
            />
          </Appear>
          <Appear delay={80} distance={10}>
            <CheckRow checked={consent} onChange={(v) => set({ sensitiveConsent: v })} label={t.consent} />
          </Appear>
        </OnboardingTemplate>
      </ScreenMotion>
    );
  }

  return (
    <ScreenMotion>
      <OnboardingTemplate
        {...progressAt('cherche')}
        onBack={() => goBack('/(onboarding)/sexe')}
        backLabel={common.back}
        host={{ species, line: t.host, highlight: t.highlight, reactKey, seed: petName, name: petName }}
        gap={12}
      >
        {SEEKINGS.map((s, i) => {
          const o = t.options[s];
          return (
            <Appear key={s} delay={60 + i * 60} distance={18} from="right">
              <ChoiceCard title={o.title} emoji={o.emoji} compact plain marker selected={seeking === s} tilt={i % 2 ? 2 : -2} onPress={() => pick(s)} />
            </Appear>
          );
        })}
      </OnboardingTemplate>
    </ScreenMotion>
  );
}
