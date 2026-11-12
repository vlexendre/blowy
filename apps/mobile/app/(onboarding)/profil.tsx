/** Profil (suite de Compte) : prénom, date de naissance (18+), ville, code d'invitation → création du compte et du pet. */
import { ApiError } from '@blowy/api-client';
import { ageOn, dayOf, MIN_AGE } from '@blowy/domain';
import { AgeGate, Banner, LegalNote, OnboardingTemplate, ScreenTemplate, TextField } from '@blowy/ui';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { usePendingInvite } from '@/features/encounters';
import { birthdateFromInput, useDraft, useOnboard } from '@/features/onboarding';
import { errorMessage, goBack, useSignOut } from '@/features/session';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';

const t = onboarding.profil;

/** Tape « 14031999 » → « 14 / 03 / 1999 » (maquette V6-Profil). */
function formatBirth(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)} / ${d.slice(2)}`;
  return `${d.slice(0, 2)} / ${d.slice(2, 4)} / ${d.slice(4)}`;
}
/** « 1999-03-14 » → « 14 / 03 / 1999 » (brouillon déjà rempli). */
const isoToInput = (iso: string): string => (iso ? iso.split('-').reverse().join(' / ') : '');
const birthDigits = (v: string): number => v.replace(/\D/g, '').length;

export default function Profil() {
  const draft = useDraft();
  const pending = usePendingInvite();
  const onboard = useOnboard();
  const signOut = useSignOut();
  const [birth, setBirth] = useState(() => isoToInput(draft.birthdate));
  const [birthError, setBirthError] = useState<string | null>(null);
  const [tooYoung, setTooYoung] = useState<{ name: string; species: typeof draft.species } | null>(null);
  const petName = draft.petName || common.speciesNames[draft.species];

  useEffect(() => {
    const d = useDraft.getState();
    const code = usePendingInvite.getState().code;
    if (!d.inviteCode && code) d.set({ inviteCode: code });
  }, []);

  const submit = () => {
    const iso = birthdateFromInput(birth);
    if (!iso) {
      setBirthError(t.birthError);
      return;
    }
    // Moins de 18 ans : on s'arrête ici, sans rien envoyer ni garder (V6-TropJeune).
    if (ageOn(iso, dayOf(new Date())) < MIN_AGE) {
      setTooYoung({ name: petName, species: draft.species });
      useDraft.getState().reset();
      return;
    }
    draft.set({ birthdate: iso });
    onboard.mutate(undefined, {
      onSuccess: () => {
        const used = useDraft.getState().inviteCode.trim().toUpperCase();
        if (used && pending.code?.toUpperCase() === used) pending.set(null);
        useDraft.getState().reset();
        router.replace('/(onboarding)/invite');
      },
      onError: (e) => {
        if (e instanceof ApiError && e.code === 'too_young') {
          setTooYoung({ name: petName, species: draft.species });
          useDraft.getState().reset();
        } else if (e instanceof ApiError && e.code === 'already_onboarded') {
          useDraft.getState().reset();
          router.replace('/(tabs)/chats');
        }
      },
    });
  };

  if (tooYoung) {
    return (
      <ScreenTemplate scroll={false} gutter={14}>
        <AgeGate
          species={tooYoung.species}
          title={t.tooYoungTitle}
          text={t.tooYoungText(tooYoung.name)}
          note={t.tooYoungNote}
          actionLabel={t.tooYoungAction}
          loading={signOut.isPending}
          onAction={() => signOut.mutate(undefined, { onSettled: () => router.replace('/(onboarding)/welcome') })}
        />
      </ScreenTemplate>
    );
  }

  const apiError = onboard.isError && !(onboard.error instanceof ApiError && ['too_young', 'already_onboarded'].includes(onboard.error.code));
  return (
    <OnboardingTemplate
      progress={0.8}
      onBack={() => goBack('/(onboarding)/compte')}
      backLabel={common.back}
      dense
      title={t.title}
      titleSize={52}
      titlePet={{ species: draft.species }}
      primaryLabel={t.cta}
      primaryIcon={null}
      primaryLoading={onboard.isPending}
      primaryDisabled={!draft.displayName.trim() || birthDigits(birth) < 8}
      onPrimary={submit}
      footnote={<LegalNote segments={[{ text: t.legal }]} size={11} />}
    >
      <TextField
        inset
        label={t.nameLabel}
        value={draft.displayName}
        onChangeText={(v) => draft.set({ displayName: v })}
        placeholder={t.namePlaceholder}
        maxLength={24}
        autoCapitalize="words"
        autoComplete="given-name"
        textContentType="givenName"
        returnKeyType="next"
      />
      <TextField
        inset
        label={t.birthLabel}
        hint={t.birthHint}
        error={birthError}
        value={birth}
        onChangeText={(v) => {
          setBirth(formatBirth(v));
          if (birthError) setBirthError(null);
        }}
        placeholder={t.birthPlaceholder}
        keyboardType="number-pad"
        maxLength={14}
        autoComplete="birthdate-full"
      />
      <TextField
        inset
        label={t.cityLabel}
        value={draft.city}
        onChangeText={(v) => draft.set({ city: v })}
        placeholder={t.cityPlaceholder}
        maxLength={40}
        autoCapitalize="words"
        textContentType="addressCity"
      />
      <TextField
        inset
        label={t.inviteLabel}
        value={draft.inviteCode}
        onChangeText={(v) => draft.set({ inviteCode: v.toUpperCase() })}
        placeholder={t.invitePlaceholder}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={16}
      />
      {apiError ? <Banner tone="error" text={errorMessage(onboard.error)} actionLabel={common.retry} onAction={submit} /> : null}
    </OnboardingTemplate>
  );
}
