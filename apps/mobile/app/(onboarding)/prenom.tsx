/** « On t'appelle comment ? » : un grand champ centré ; en dessous, le code d'invitation si on en a un. */
import { OnboardingTemplate, OptionalField, TextField } from '@blowy/ui';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';

import { ScreenMotion } from '@/core';
import { progressAt, useDraft, useDraftGate, useStep } from '@/features/onboarding';
import { goBack } from '@/features/session';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';

const t = onboarding.toi;

export default function Prenom() {
  const gate = useDraftGate();
  if (gate === 'missing') return <Redirect href="/" />;
  if (gate === 'loading') return null;
  return <PrenomStep />;
}

function PrenomStep() {
  useStep('prenom');
  const species = useDraft((d) => d.species);
  const petName = useDraft((d) => d.petName);
  const name = useDraft((d) => d.displayName);
  const inviteCode = useDraft((d) => d.inviteCode);
  const set = useDraft((d) => d.set);
  // Arrivé par un lien d'invitation : le code est déjà là, le champ est ouvert.
  const [showInvite, setShowInvite] = useState(() => !!useDraft.getState().inviteCode);
  const next = () => {
    if (!name.trim()) return;
    set({ displayName: name.trim() });
    router.push('/(onboarding)/sexe');
  };
  return (
    <ScreenMotion>
      <OnboardingTemplate
        {...progressAt('prenom')}
        onBack={() => goBack('/(onboarding)/ta-vision')}
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
