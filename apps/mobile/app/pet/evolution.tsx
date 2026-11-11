import { eventLabel, formLabel, gaugeLabel } from '@blowy/content';
import { daysBetween, dayOf, type GaugeKey, type PetForm } from '@blowy/domain';
import { color, speciesColor } from '@blowy/tokens';
import {
  Banner,
  Card,
  Chip,
  EvolutionTimeline,
  GaugeBar,
  Header,
  MessageBubble,
  Panel,
  PetImage,
  ScreenTemplate,
  Skeleton,
  Sticker,
  Text,
  Title,
} from '@blowy/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { shortDay } from '@/features/links';
import { usePet } from '@/features/pet';
import { evolution as t, pet as petText } from '@/locales/pet';

const FORMS: readonly PetForm[] = ['tendre', 'piquant', 'joueur', 'sociable', 'casanier', 'equilibre'];
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
  const back = () => (router.canGoBack() ? router.back() : router.replace('/pet'));
  const p = pet.data?.pet;
  const age = p ? Math.max(0, daysBetween(dayOf(new Date(p.bornAt)), dayOf(new Date()))) : 0;

  const header = <Header onBack={back} backLabel={t.back} right={p ? <Chip label={t.age(age)} tone="glass" size="sm" /> : undefined} />;

  if (!pet.data || !p) {
    return (
      <ScreenTemplate header={header}>
        {pet.isPending ? (
          <View style={styles.body}>
            <Skeleton height={300} radius="xl" />
            <Skeleton height={260} radius="lg" />
          </View>
        ) : (
          <Banner tone="error" title={petText.loadError} text={pet.error?.message ?? ''} actionLabel={petText.retry} onAction={() => void pet.refetch()} />
        )}
      </ScreenTemplate>
    );
  }

  const focus = chosen ?? (p.form === 'equilibre' ? 'tendre' : p.form);
  const push = PUSH[focus];

  return (
    <ScreenTemplate header={header}>
      <View style={styles.body}>
        <Panel gradient="violet" padding="lg">
          <Title text={t.title} variant="hero" />
          <View style={styles.hero}>
            <PetImage species={p.species} form={p.form} size={170} animation="breathe" accessibilityLabel={`${p.name}, ${formLabel[p.form]}`} />
            <View style={styles.heroLabel}>
              <Sticker label={t.now} tone="white" size="sm" />
              <Title text={formLabel[p.form].toUpperCase()} variant="h2" />
            </View>
          </View>
        </Panel>

        <View style={styles.sectionHead}>
          <Text variant="label">{t.formsTitle}</Text>
          <Text variant="small" muted>
            {t.formsHint}
          </Text>
        </View>
        <View style={styles.grid}>
          {FORMS.map((f) => {
            const current = f === p.form;
            return (
              <Card
                key={f}
                padding="sm"
                tone={focus === f ? 'raised' : 'panel'}
                highlight={current ? color.accent : focus === f ? speciesColor[p.species] : undefined}
                onPress={() => setChosen(f)}
                accessibilityLabel={t.formA11y(formLabel[f], current)}
                style={styles.cell}
              >
                <PetImage species={p.species} form={f} size={78} />
                <Title text={formLabel[f].toUpperCase()} variant="h3" center numberOfLines={1} />
                <Text variant="small" size={11} muted center numberOfLines={1}>
                  {current ? t.current : t.formCaption[f]}
                </Text>
              </Card>
            );
          })}
        </View>

        <Card padding="lg">
          <Text>
            <Text variant="bodyBold">{t.howTitle(formLabel[focus])}</Text>
            {t.how[focus]}
          </Text>
          {push ? (
            <GaugeBar
              value={p.gauges[push.gauge]}
              target={push.target}
              low={gaugeLabel[push.gauge].low}
              high={gaugeLabel[push.gauge].high}
              caption={`${petText.gaugeNames[push.gauge]} · ${p.gauges[push.gauge] > 0 ? '+' : ''}${p.gauges[push.gauge]}`}
              style={styles.gauge}
            />
          ) : null}
        </Card>

        <Text variant="label">{t.timelineTitle}</Text>
        <EvolutionTimeline events={pet.data.events} eventLabels={eventLabel} gaugeLabels={gaugeLabel} dateLabel={(at) => shortDay(dayOf(new Date(at)))} emptyText={t.timelineEmpty} />

        <MessageBubble message={{ author: 'my_pet', kind: 'text', body: t.speech, mediaUrl: null }} name={p.name.toLowerCase()} pet={{ name: p.name, species: p.species, form: p.form }} />
        <Text variant="small" muted center>
          {t.decay}
        </Text>
      </View>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  body: { gap: 16, paddingTop: 8 },
  hero: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8 },
  heroLabel: { alignItems: 'flex-end', gap: 6, paddingBottom: 12 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { width: '31.5%', flexGrow: 1, alignItems: 'center', gap: 2 },
  gauge: { marginTop: 12 },
});
