/** Toi, 2/3 : la date de naissance (18 ans et plus). Trop jeune : on s'arrête là, rien n'est gardé (V6-TropJeune). */
import { ageOn, dayOf, MIN_AGE, type Species } from '@blowy/domain';
import { AgeGate, OnboardingTemplate, ScreenTemplate, Shake, TextField } from '@blowy/ui';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';

import { ScreenMotion } from '@/core';
import { birthdateFromInput, hasDraftPet, progressAt, useDraft } from '@/features/onboarding';
import { goBack, useSignOut } from '@/features/session';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';

const t = onboarding.toi;

/** Tape « 14031999 » → « 14 / 03 / 1999 » (maquette V6-Profil). */
function formatBirth(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)} / ${d.slice(2)}`;
  return `${d.slice(0, 2)} / ${d.slice(2, 4)} / ${d.slice(4)}`;
}
/** « 1999-03-14 » → « 14 / 03 / 1999 » (brouillon déjà rempli : retour arrière). */
const isoToInput = (iso: string): string => (iso ? iso.split('-').reverse().join(' / ') : '');
const birthDigits = (v: string): number => v.replace(/\D/g, '').length;

export default function Naissance() {
  const [ok] = useState(hasDraftPet);
  return ok ? <NaissanceStep /> : <Redirect href="/" />;
}

function NaissanceStep() {
  const species = useDraft((d) => d.species);
  const petName = useDraft((d) => d.petName);
  const displayName = useDraft((d) => d.displayName);
  const [birth, setBirth] = useState(() => isoToInput(useDraft.getState().birthdate));
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [tooYoung, setTooYoung] = useState<{ name: string; species: Species } | null>(null);
  const signOut = useSignOut();

  const next = () => {
    const iso = birthdateFromInput(birth);
    if (!iso) {
      setError(t.birthError);
      setShake((n) => n + 1);
      return;
    }
    // Moins de 18 ans : on s'arrête ici, sans rien envoyer ni garder.
    if (ageOn(iso, dayOf(new Date())) < MIN_AGE) {
      setTooYoung({ name: petName, species });
      useDraft.getState().reset();
      return;
    }
    useDraft.getState().set({ birthdate: iso });
    router.push('/(onboarding)/ville');
  };

  if (tooYoung) {
    // Le pet, triste, se détourne (AgeGate). « fermer » : déconnexion s'il y avait une session, retour à la bienvenue.
    return (
      <ScreenMotion>
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
      </ScreenMotion>
    );
  }

  const first = displayName.trim();
  return (
    <ScreenMotion>
      <OnboardingTemplate
        {...progressAt('naissance')}
        onBack={() => goBack('/(onboarding)/prenom')}
        backLabel={common.back}
        host={{ species, line: t.birthHost(first), highlight: first, seed: petName, name: petName }}
        centerBody
        primaryLabel={t.cta}
        primaryDisabled={birthDigits(birth) < 8}
        onPrimary={next}
      >
        <Shake trigger={shake}>
          <TextField
            hero
            value={birth}
            onChangeText={(v) => {
              setBirth(formatBirth(v));
              if (error) setError(null);
            }}
            placeholder={t.birthPlaceholder}
            hint={t.birthHint}
            error={error}
            keyboardType="number-pad"
            maxLength={14}
            autoFocus
            autoComplete="birthdate-full"
            returnKeyType="next"
            onSubmitEditing={next}
            accessibilityLabel={t.birthLabel}
          />
        </Shake>
      </OnboardingTemplate>
    </ScreenMotion>
  );
}
