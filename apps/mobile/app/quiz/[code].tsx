/**
 * Résultat du quiz du site (minimoa://quiz/CODE, https://minimoa.app/quiz/CODE, ou bouton « J'ai déjà Minimoa ») :
 * sans minimoa, l'espèce et le caractère de départ sont repris dans le brouillon d'inscription, puis l'inscription
 * continue (le code part avec elle : source « quiz »). Avec un minimoa : il est déjà là.
 */
import { ApiError } from '@blowy/api-client';
import { EmptyState, ScreenTemplate, Skeleton } from '@blowy/ui';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { ScreenMotion } from '@/core';
import { adoptQuizResult, resumeOnboarding, signedOutStart, useQuizResult } from '@/features/onboarding';
import { useGate } from '@/features/session';
import { common } from '@/locales/common';
import { quartier as copy } from '@/locales/quartier';

const t = copy.quiz;
const names = common.speciesNames;
const isDefaultName = (name: string): boolean => !name.trim() || Object.values(names).some((n) => n === name.trim());

export default function QuizLink() {
  const params = useLocalSearchParams<{ code: string }>();
  const code = (params.code ?? '').trim().toUpperCase();
  const gate = useGate();
  const fresh = gate === 'signedOut' || gate === 'needsOnboarding';
  const result = useQuizResult(fresh && code ? code : null);
  const [adopted, setAdopted] = useState(false);

  useEffect(() => {
    if (!fresh || !result.data || adopted) return;
    adoptQuizResult(result.data, (s) => names[s], isDefaultName);
    setAdopted(true);
  }, [fresh, result.data, adopted]);

  if (!code) return <Redirect href="/" />;
  if (adopted) return <Redirect href={gate === 'signedOut' ? signedOutStart() : resumeOnboarding()} />;

  const notFound = result.error instanceof ApiError && (result.error.code === 'not_found' || result.error.code === 'invalid');
  if (gate === 'ready' || notFound) {
    const ready = gate === 'ready';
    return (
      <ScreenMotion>
        <ScreenTemplate scroll={false}>
          <EmptyState
            peek
            mood={ready ? 'joie' : 'triste'}
            title={ready ? t.readyTitle : t.notFoundTitle}
            text={ready ? t.readyText : t.notFoundText}
            actionLabel={ready ? t.home : t.start}
            onAction={() => router.replace(ready ? '/(tabs)/pet' : gate === 'signedOut' ? signedOutStart() : resumeOnboarding())}
          />
        </ScreenTemplate>
      </ScreenMotion>
    );
  }
  return (
    <ScreenMotion>
      <ScreenTemplate scroll={false}>
        <View accessibilityLabel={t.loading}>
          <Skeleton height={380} radius="xl" />
        </View>
      </ScreenTemplate>
    </ScreenMotion>
  );
}
