/**
 * « Tes habitudes » (spéc. §25), après « Tu es… » : jusqu'à 2 habitudes du catalogue (tuiles à emoji), ou « Plus
 * tard ». La phrase de visibilité (servie par le contenu partagé avec l'API) est dite au moment du choix. Les habitudes
 * partent avec la création du compte (`habits` de `POST /v1/me/onboard`), « tous les jours » par défaut.
 */
import { habitsIn } from '@blowy/content';
import { OnboardingTemplate, PickTiles, Text } from '@blowy/ui';
import { Redirect, router } from 'expo-router';
import { useMemo } from 'react';

import { ScreenMotion } from '@/core';
import { progressAt, useDraft, useDraftGate, useStep } from '@/features/onboarding';
import { goBack } from '@/features/session';
import { common } from '@/locales/common';
import { groupes, groupesShared } from '@/locales/groupes';
import { rituels } from '@/locales/rituels';
import { getLocale } from '@/locales/runtime';

const t = groupes.onboarding;
const MAX = 2;

export default function Habitudes() {
  const gate = useDraftGate();
  if (gate === 'missing') return <Redirect href="/" />;
  if (gate === 'loading') return null;
  return <HabitsStep />;
}

function HabitsStep() {
  useStep('habitudes');
  const species = useDraft((d) => d.species);
  const petName = useDraft((d) => d.petName);
  const name = useDraft((d) => d.displayName.trim());
  const picked = useDraft((d) => d.habits ?? []);
  const locale = getLocale();
  const items = useMemo(() => habitsIn(locale).map((h) => ({ key: h.id, label: h.label, emoji: rituels.habits.emoji[h.id] })), [locale]);

  const toggle = (id: string) => {
    const now = useDraft.getState().habits ?? [];
    if (now.includes(id)) useDraft.getState().set({ habits: now.filter((x) => x !== id) });
    else if (now.length < MAX) useDraft.getState().set({ habits: [...now, id] });
  };
  const next = () => router.push('/(onboarding)/naissance');
  const later = () => {
    useDraft.getState().set({ habits: [] });
    next();
  };

  return (
    <ScreenMotion>
      <OnboardingTemplate
        {...progressAt('habitudes')}
        onBack={() => goBack('/(onboarding)/sexe')}
        backLabel={common.back}
        host={{ species, line: t.host(name), highlight: name, seed: petName, name: petName }}
        gap={10}
        scroll
        primaryLabel={t.next}
        onPrimary={next}
        primaryDisabled={picked.length === 0}
        secondaryLabel={t.later}
        onSecondary={later}
      >
        <Text size={13} muted>
          {picked.length >= MAX ? `${t.max} ${groupesShared.habitsVisibility}` : groupesShared.habitsVisibility}
        </Text>
        <PickTiles items={items} selected={picked} onToggle={toggle} max={MAX} selectedLabel={groupes.create.selected} />
      </OnboardingTemplate>
    </ScreenMotion>
  );
}
