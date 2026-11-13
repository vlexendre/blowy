/** Toi, 3/3 : la ville (facultative, « passer ») et, si on en a un, le code d'invitation. */
import { OnboardingTemplate, OptionalField, TextField } from '@blowy/ui';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';

import { ScreenMotion } from '@/core';
import { usePendingInvite } from '@/features/encounters';
import { hasDraftPet, progressAt, useDraft } from '@/features/onboarding';
import { goBack } from '@/features/session';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';

const t = onboarding.toi;

export default function Ville() {
  const [ok] = useState(hasDraftPet);
  return ok ? <VilleStep /> : <Redirect href="/" />;
}

function VilleStep() {
  const species = useDraft((d) => d.species);
  const petName = useDraft((d) => d.petName);
  const city = useDraft((d) => d.city);
  const inviteCode = useDraft((d) => d.inviteCode);
  const set = useDraft((d) => d.set);
  // Arrivé par un lien d'invitation : le code est déjà là, le champ est ouvert.
  const [showInvite, setShowInvite] = useState(() => !!(useDraft.getState().inviteCode || usePendingInvite.getState().code));
  useEffect(() => {
    const d = useDraft.getState();
    const code = usePendingInvite.getState().code;
    if (!d.inviteCode && code) d.set({ inviteCode: code });
  }, []);

  const next = (skip = false) => {
    if (skip) set({ city: '' });
    router.push('/(onboarding)/promesse');
  };

  return (
    <ScreenMotion>
      <OnboardingTemplate
        {...progressAt('ville')}
        onBack={() => goBack('/(onboarding)/naissance')}
        backLabel={common.back}
        host={{ species, line: t.cityHost, seed: petName, name: petName }}
        centerBody
        primaryLabel={t.cta}
        onPrimary={() => next()}
        secondaryLabel={t.skip}
        onSecondary={() => next(true)}
      >
        <TextField
          hero
          value={city}
          onChangeText={(v) => set({ city: v })}
          placeholder={t.cityPlaceholder}
          hint={t.cityHint}
          maxLength={40}
          autoCapitalize="words"
          textContentType="addressCity"
          returnKeyType="next"
          onSubmitEditing={() => next()}
          accessibilityLabel={t.cityLabel}
        />
        <OptionalField toggleLabel={t.inviteToggle} open={showInvite} onOpen={() => setShowInvite(true)}>
          <TextField
            inset
            label={t.inviteLabel}
            value={inviteCode}
            onChangeText={(v) => set({ inviteCode: v.toUpperCase() })}
            placeholder={t.invitePlaceholder}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={16}
          />
        </OptionalField>
      </OnboardingTemplate>
    </ScreenMotion>
  );
}
