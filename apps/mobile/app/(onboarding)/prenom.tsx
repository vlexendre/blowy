/**
 * « On t'appelle comment ? » : un grand champ centré ; en dessous, « Un code ? » (facultatif) : invitation, groupe,
 * créateur ou « 3 mots ». L'API dit ce qu'il est ; un code inconnu n'empêche rien (docs/VIRALITE.md).
 */
import { OnboardingTemplate, OptionalField, TextField } from '@blowy/ui';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { ScreenMotion } from '@/core';
import { useCodeLookup } from '@/features/growth';
import { adoptQuizResult, progressAt, useDraft, useDraftGate, useQuizResult, useStep } from '@/features/onboarding';
import { goBack } from '@/features/session';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';

const t = onboarding.toi;
const names = common.speciesNames;
const isDefaultName = (name: string): boolean => !name.trim() || Object.values(names).some((n) => n === name.trim());

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
  // Revenu de la préparation : prénom refusé par le filtre (`?fix=1&reason=…`). La raison reste affichée tant que le
  // prénom n'a pas changé ; valider relance la création.
  const params = useLocalSearchParams<{ fix?: string; reason?: string }>();
  const fix = params.fix === '1';
  const [refusedName] = useState(() => useDraft.getState().displayName);
  const refusal = fix && params.reason && name === refusedName ? params.reason : null;
  // Arrivé par un lien d'invitation : le code est déjà là, le champ est ouvert.
  const [showInvite, setShowInvite] = useState(() => !!useDraft.getState().inviteCode);
  const lookup = useCodeLookup(inviteCode);
  const found = lookup.data ?? null;
  useEffect(() => {
    if (lookup.isSuccess) set({ codeKind: found?.kind ?? null });
  }, [lookup.isSuccess, found, set]);
  // Code du quiz du site : le minimoa reprend l'espèce et le caractère du résultat.
  const quiz = useQuizResult(found?.kind === 'quiz' ? found.code : null);
  useEffect(() => {
    if (quiz.data) adoptQuizResult(quiz.data, (s) => names[s], isDefaultName);
  }, [quiz.data]);
  const codeHint = found ? t.codeFound[found.kind](found.label ?? found.code) : undefined;
  const codeError = inviteCode.trim().length >= 3 && lookup.isSuccess && !found ? t.codeUnknown : undefined;
  const next = () => {
    if (!name.trim() || refusal) return;
    set({ displayName: name.trim() });
    if (fix) router.replace('/(onboarding)/preparation');
    else router.push('/(onboarding)/sexe');
  };
  return (
    <ScreenMotion>
      <OnboardingTemplate
        {...progressAt('prenom')}
        onBack={fix ? undefined : () => goBack('/(onboarding)/ta-vision')}
        backLabel={common.back}
        host={{ species, line: t.nameHost, seed: petName, name: petName }}
        centerBody
        primaryLabel={fix ? onboarding.preparation.fixCta : t.cta}
        primaryDisabled={!name.trim() || !!refusal}
        onPrimary={next}
      >
        <TextField
          hero
          value={name}
          onChangeText={(v) => set({ displayName: v })}
          placeholder={t.namePlaceholder}
          hint={t.nameHint}
          error={refusal}
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
            onChangeText={(v) => set({ inviteCode: v.toUpperCase(), codeKind: null })}
            hint={codeHint}
            error={codeError}
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
