import { color } from '@blowy/tokens';
import { Banner, Button, Chip, Glyph, Header, ScreenTemplate, Skeleton, Text, Title } from '@blowy/ui';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { type MapPet, NeighbourhoodMap, useEncounters } from '@/features/encounters';
import { sortLinks, useLinks } from '@/features/links';
import { usePet } from '@/features/pet';
import { chats as chatsText } from '@/locales/chats';
import { carte as t } from '@/locales/rencontres';

/** Carte stylisée du voisinage du pet : pas de géolocalisation en V1. */
export default function CarteScreen() {
  const router = useRouter();
  const pet = usePet();
  const links = useLinks();
  const encounters = useEncounters();
  const back = () => (router.canGoBack() ? router.back() : router.replace('/rencontres'));
  const p = pet.data?.pet;

  const linked: MapPet[] = sortLinks(links.data ?? []).map((l) => ({
    key: l.id,
    name: l.other.displayName,
    pet: l.other.pet,
    ghost: l.status === 'ghost',
    accessibilityLabel: t.linkA11y(l.other.displayName, l.other.pet.name),
    onPress: () => router.push(`/link/${l.id}`),
  }));
  const met: MapPet[] = [
    ...(encounters.data?.incoming ?? []).map((i) => ({ key: `in:${i.id}`, person: i.from })),
    ...(encounters.data?.suggestions ?? []).map((s) => ({ key: `s:${s.user.id}`, person: s.user })),
  ].map(({ key, person }) => ({
    key,
    name: person.displayName,
    pet: person.pet,
    accessibilityLabel: t.metA11y(person.displayName, person.pet.name),
    onPress: () => router.push(`/rencontre/${person.id}`),
  }));

  const loading = pet.isPending || links.isPending || encounters.isPending;
  const failed = pet.isError || links.isError || encounters.isError;

  return (
    <ScreenTemplate header={<Header onBack={back} backLabel={t.back} title={t.title(p?.name ?? chatsText.yourPet)} />}>
      <View style={styles.body}>
        <Title text={t.heading} variant="h1" />
        {failed && !p ? (
          <Banner
            tone="error"
            title={t.loadError}
            text={(pet.error ?? links.error ?? encounters.error)?.message ?? ''}
            actionLabel={t.retry}
            onAction={() => void Promise.all([pet.refetch(), links.refetch(), encounters.refetch()])}
          />
        ) : loading || !p ? (
          <Skeleton height={400} radius="xl" />
        ) : (
          <>
            <NeighbourhoodMap me={{ name: p.name, species: p.species, form: p.form }} meLabel={t.me} linked={linked} met={met} />
            <View style={styles.legend}>
              <Chip label={`${t.legendLinks} · ${linked.length}`} tone="glass" size="sm" left={<Glyph name="dot" size={12} color={color.accent} />} />
              <Chip label={`${t.legendMet} · ${met.length}`} tone="glass" size="sm" left={<Glyph name="dot" size={12} color={color.mute} />} />
            </View>
            {linked.length + met.length === 0 ? (
              <Text muted center>
                {t.empty}
              </Text>
            ) : null}
          </>
        )}
        <Banner tone="info" title={t.soon} text={t.soonText} />
        <Button label={t.rencontres} variant="white" onPress={() => router.push('/rencontres')} />
      </View>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  body: { gap: 16, paddingTop: 4 },
  legend: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
