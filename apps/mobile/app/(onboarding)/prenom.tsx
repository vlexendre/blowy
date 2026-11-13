/** Toi, 1/3 : le pet demande le prénom (un grand champ centré). */
import { OnboardingTemplate, TextField } from '@blowy/ui';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';

import { ScreenMotion } from '@/core';
import { hasDraftPet, progressAt, useDraft } from '@/features/onboarding';
import { goBack } from '@/features/session';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';

const t = onboarding.toi;

export default function Prenom() {
  const [ok] = useState(hasDraftPet);
  return ok ? <PrenomStep /> : <Redirect href="/" />;
}

function PrenomStep() {
  const species = useDraft((d) => d.species);
  const petName = useDraft((d) => d.petName);
  const name = useDraft((d) => d.displayName);
  const set = useDraft((d) => d.set);
  const next = () => {
    if (!name.trim()) return;
    set({ displayName: name.trim() });
    router.push('/(onboarding)/naissance');
  };
  return (
    <ScreenMotion>
      <OnboardingTemplate
        {...progressAt('prenom')}
        onBack={() => goBack('/(onboarding)/caractere')}
        backLabel={common.back}
        host={{ species, line: t.nameHost, seed: petName, name: petName }}
        centerBody
        primaryLabel={t.cta}
        primaryDisabled={!name.trim()}
        onPrimary={next}
      >
        <TextField
          hero
          value={name}
          onChangeText={(v) => set({ displayName: v })}
          placeholder={t.namePlaceholder}
          hint={t.nameHint}
          maxLength={24}
          autoFocus
          autoCapitalize="words"
          autoComplete="given-name"
          textContentType="givenName"
          returnKeyType="next"
          onSubmitEditing={next}
          accessibilityLabel={t.nameLabel}
        />
      </OnboardingTemplate>
    </ScreenMotion>
  );
}
