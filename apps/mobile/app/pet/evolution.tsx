import { formLabel, gaugeLabel } from '@blowy/content';
import { daysBetween, dayOf, type GaugeKey, type PetForm } from '@blowy/domain';
import { Banner, EvolutionHero, FormPicker, Header, PetQuote, ScreenTemplate, Skeleton, Stack } from '@blowy/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { formHistory, usePet } from '@/features/pet';
import { evolution as t, pet as petText } from '@/locales/pet';

/** Formes proposées, dans l'ordre de la grille (les trois premières différentes de la forme actuelle). */
const FORMS: readonly PetForm[] = ['tendre', 'piquant', 'joueur', 'sociable', 'casanier'];
/** Jauge et sens qui mènent à chaque forme (seuil d'un trait marqué : 34). */
const PUSH: Record<PetForm, { gauge: GaugeKey; target: number } | null> = {
  equilibre: null,
  casanier: { gauge: 'social', target: -34 },
  sociable: { gauge: 'social', target: 34 },
  joueur: { gauge: 'play', target: 34 },
  piquant: { gauge: 'tender', target: -34 },
  tendre: { gauge: 'tender', target: 34 },
};

export default function EvolutionScreen() {
  const router = useRouter();
  const pet = usePet();
  const [chosen, setChosen] = useState<PetForm | null>(null);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/pet/caractere'));
  const p = pet.data?.pet;

  if (!pet.data || !p) {
    return (
      <ScreenTemplate header={<Header onBack={back} backLabel={t.back} />}>
        {pet.isPending ? (
          <Stack top={6}>
            <Skeleton height={300} radius="xl" />
            <Skeleton height={260} radius="lg" />
          </Stack>
        ) : (
          <Banner tone="error" title={petText.loadError} text={pet.error?.message ?? ''} actionLabel={petText.retry} onAction={() => void pet.refetch()} />
        )}
      </ScreenTemplate>
    );
  }

  const age = Math.max(0, daysBetween(dayOf(new Date(p.bornAt)), dayOf(new Date())));
  const options = FORMS.filter((f) => f !== p.form).slice(0, 3);
  const focus = chosen ?? options[0] ?? 'tendre';
  const push = PUSH[focus];
  const steps = formHistory(pet.data.events, p.form).map((s) => ({
    form: s.form,
    when: s.since ? t.month(s.since) : t.now,
    name: formLabel[s.form],
    caption: t.story[s.form],
    current: !s.since,
  }));

  return (
    <ScreenTemplate>
      <Stack top={6} grow>
        <EvolutionHero title={t.title} species={p.species} steps={steps} onBack={back} backLabel={t.back} age={t.age(age)} />
        <FormPicker
          title={t.formsTitle}
          hint={t.formsHint}
          species={p.species}
          options={options.map((f) => ({ form: f, name: formLabel[f], caption: t.formCaption[f] }))}
          selected={focus}
          onSelect={setChosen}
          how={{ title: t.howTitle(formLabel[focus]), text: t.how[focus], look: t.look[focus] }}
          gauge={
            push
              ? { value: p.gauges[push.gauge], target: push.target, low: gaugeLabel[push.gauge].low, high: gaugeLabel[push.gauge].high }
              : null
          }
        />
        <PetQuote pet={{ name: p.name, species: p.species, form: p.form }} text={t.speech} note={t.decay} />
      </Stack>
    </ScreenTemplate>
  );
}
