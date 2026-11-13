/** Création du pet (V6-Craft) : une des 4 espèces, un petit nom, aperçu en direct. Ensuite, ce pet pose les questions. */
import { cleanPetName, PET_NAME_MAX, type Species } from '@blowy/domain';
import { Button, OnboardingTemplate, SpeciesPicker, TextField } from '@blowy/ui';
import { router } from 'expo-router';
import { useEffect } from 'react';

import { ScreenMotion } from '@/core';
import { progressAt, useDraft } from '@/features/onboarding';
import { goBack } from '@/features/session';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';

const t = onboarding.craft;
const names = common.speciesNames;
const isDefaultName = (name: string): boolean => !name.trim() || Object.values(names).some((n) => n === name.trim());

export default function Craft() {
  const species = useDraft((d) => d.species);
  const petName = useDraft((d) => d.petName);
  const set = useDraft((d) => d.set);
  const name = petName;

  // Premier passage : le pet porte le nom de son espèce, la personne le change si elle veut.
  useEffect(() => {
    const d = useDraft.getState();
    if (!d.petName) d.set({ petName: names[d.species] });
  }, []);

  const pickSpecies = (s: Species) => set(isDefaultName(petName) ? { species: s, petName: names[s] } : { species: s });
  const randomName = () => {
    const pool = t.randomNames.filter((n) => n !== petName);
    set({ petName: pool[Math.floor(Math.random() * pool.length)] ?? names[species] });
  };
  const display = (cleanPetName(name) || names[species]).toLowerCase();

  return (
    <ScreenMotion>
    <OnboardingTemplate
      {...progressAt('craft')}
      onBack={() => goBack('/(onboarding)/welcome')}
      backLabel={common.back}
      title={t.title}
      primaryLabel={t.cta}
      primaryDisabled={!cleanPetName(name)}
      onPrimary={() => {
        set({ petName: cleanPetName(name) });
        router.push('/(onboarding)/caractere');
      }}
    >
      {/* Le pet choisi bondit au centre, les autres passent la tête ; le nom tapé le fait hocher la tête. */}
      <SpeciesPicker
        value={species}
        onChange={pickSpecies}
        names={names}
        speech={t.speech(display)}
        speechHighlight={display}
        badge={t.badge}
        nodKey={display}
      />
      <TextField
        label={t.nameLabel}
        hint={t.nameHint}
        value={name}
        onChangeText={(v) => set({ petName: v.slice(0, PET_NAME_MAX) })}
        placeholder={t.namePlaceholder}
        maxLength={PET_NAME_MAX}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="done"
        large
        accessibilityLabel={t.nameLabel}
        right={<Button label={t.random} size="chip" variant="glass" onPress={randomName} accessibilityLabel={t.randomLabel} />}
      />
    </OnboardingTemplate>
    </ScreenMotion>
  );
}
