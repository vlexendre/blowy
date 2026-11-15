/**
 * Date de naissance (V6-GNaissance), avant la connexion : sélecteur à trois roues, et une carte qui dit l'âge en grand
 * (elle saute à chaque cran). Moins de 18 ans : on s'arrête là, le brouillon est vidé, rien n'est créé (V6-TropJeune).
 */
import { ageOn, dayOf, MIN_AGE, type Species } from '@blowy/domain';
import { AgeCard, AgeGate, DateWheel, type DateParts, OnboardingTemplate, ScreenTemplate, Text } from '@blowy/ui';
import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';

import { ScreenMotion } from '@/core';
import { isValidBirthdate, progressAt, useDraft, useDraftGate, useStep } from '@/features/onboarding';
import { goBack, useSignOut } from '@/features/session';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';
import { formatDate } from '@/locales/runtime';

const t = onboarding.naissance;
const pad = (n: number): string => String(n).padStart(2, '0');
const toIso = (d: DateParts): string => `${d.year}-${pad(d.month)}-${pad(d.day)}`;
const fromIso = (iso: string): DateParts => {
  const [y, m, d] = iso.split('-').map(Number);
  return { year: y ?? 2000, month: m ?? 1, day: d ?? 1 };
};

export default function Naissance() {
  const gate = useDraftGate();
  // Trop jeune : le brouillon vient d'être vidé, l'écran d'arrêt reste affiché (gardé ici, hors du brouillon).
  const [tooYoung, setTooYoung] = useState<{ name: string; species: Species } | null>(null);
  const signOut = useSignOut();
  if (tooYoung) {
    // Le minimoa, triste, se détourne. « Fermer » : déconnexion s'il y avait une session, retour à la bienvenue.
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
  if (gate === 'missing') return <Redirect href="/" />;
  if (gate === 'loading') return null;
  return <NaissanceStep onTooYoung={setTooYoung} />;
}

function NaissanceStep({ onTooYoung }: { onTooYoung: (v: { name: string; species: Species }) => void }) {
  useStep('naissance');
  const species = useDraft((d) => d.species);
  const petName = useDraft((d) => d.petName);
  const today = dayOf(new Date());
  const thisYear = Number(today.slice(0, 4));
  const [date, setDate] = useState<DateParts>(() => {
    const saved = useDraft.getState().birthdate;
    return isValidBirthdate(saved) ? fromIso(saved) : { year: thisYear - 25, month: 1, day: 1 };
  });
  const monthNames = useMemo(() => Array.from({ length: 12 }, (_, m) => formatDate(new Date(Date.UTC(2001, m, 15)), { month: 'long', timeZone: 'UTC' })), []);
  const iso = toIso(date);
  const age = ageOn(iso, today);
  const young = age < MIN_AGE;

  const next = () => {
    // Moins de 18 ans : on s'arrête ici, sans rien envoyer ni garder.
    if (young) {
      onTooYoung({ name: petName, species });
      useDraft.getState().reset();
      return;
    }
    useDraft.getState().set({ birthdate: iso });
    router.push('/(onboarding)/localisation');
  };

  return (
    <ScreenMotion>
      <OnboardingTemplate
        {...progressAt('naissance')}
        onBack={() => goBack('/(onboarding)/cherche')}
        backLabel={common.back}
        host={{ species, line: t.host, highlight: t.highlight, seed: petName, name: petName }}
        gap={14}
        primaryLabel={t.cta}
        onPrimary={next}
        footnote={
          <Text size={13} muted center>
            {t.note}
          </Text>
        }
      >
        <AgeCard species={species} title={young ? t.young : t.age(Math.max(0, age))} ageKey={age} blocked={young} petLabel={petName} />
        <DateWheel value={date} onChange={setDate} monthNames={monthNames} labels={t.labels} minYear={thisYear - 100} maxYear={thisYear} />
      </OnboardingTemplate>
    </ScreenMotion>
  );
}
