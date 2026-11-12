import { formLabel } from '@blowy/content';
import { Banner, Header, ScreenTemplate, Skeleton } from '@blowy/ui';
import { useRouter } from 'expo-router';

import { ScreenMotion } from '@/core';
import { type MapPet, NeighbourhoodMap, useEncounters, useWave } from '@/features/encounters';
import { sortLinks, useLinks } from '@/features/links';
import { usePet } from '@/features/pet';
import { chats as chatsText } from '@/locales/chats';
import { carte as t, rencontres as listText } from '@/locales/rencontres';

/** Plan stylisé du voisinage du pet : pas de géolocalisation en V1. */
export default function CarteScreen() {
  const router = useRouter();
  const pet = usePet();
  const links = useLinks();
  const encounters = useEncounters();
  const wave = useWave();
  const back = () => (router.canGoBack() ? router.back() : router.replace('/rencontres'));
  const p = pet.data?.pet;
  const myName = p?.name ?? chatsText.yourPet;
  const toRencontres = () => router.push('/rencontres');

  const met: MapPet[] = [
    ...(encounters.data?.suggestions ?? []).map((s) => ({
      key: `s:${s.user.id}`,
      person: s.user,
      compat: s.compatibility,
      via: s.via === 'friend_of_friend' ? listText.via.friend_of_friend(s.mutualName) : listText.via[s.via](),
      waved: s.waved,
      incoming: false,
    })),
    ...(encounters.data?.incoming ?? []).map((i) => ({ key: `in:${i.id}`, person: i.from, compat: i.compatibility, via: undefined, waved: false, incoming: true })),
  ].map(({ key, person, compat, via, waved, ...rest }) => ({
    key,
    name: person.displayName,
    pet: person.pet,
    kind: 'met' as const,
    accessibilityLabel: t.metA11y(person.displayName, person.pet.name),
    who: t.linkWho(person.displayName),
    via,
    tags: [formLabel[person.pet.form]],
    compat,
    action: rest.incoming
      ? { label: listText.open, tone: 'accent' as const, onPress: () => router.push(`/rencontre/${person.id}`) }
      : {
          label: t.hello(myName),
          tone: 'accent' as const,
          loading: wave.isPending && wave.variables === person.id,
          onPress: () => wave.mutate(person.id),
        },
    after: waved ? { say: t.helloSent, label: t.rencontres, onPress: toRencontres } : null,
  }));
  const linked: MapPet[] = sortLinks(links.data ?? []).map((l) => ({
    key: l.id,
    name: l.other.displayName,
    pet: l.other.pet,
    kind: 'link',
    ghost: l.status === 'ghost',
    accessibilityLabel: t.linkA11y(l.other.displayName, l.other.pet.name),
    who: t.linkWho(l.other.displayName),
    via: t.linkVia,
    tags: [formLabel[l.other.pet.form]],
    action: { label: t.openChat(l.other.displayName), tone: 'white', onPress: () => router.push(`/link/${l.id}`) },
  }));

  const loading = pet.isPending || links.isPending || encounters.isPending;
  const failed = pet.isError || links.isError || encounters.isError;

  if (!p || loading) {
    return (
      <ScreenMotion>
      <ScreenTemplate header={<Header onBack={back} backLabel={t.back} />}>
        {failed ? (
          <Banner
            tone="error"
            title={t.loadError}
            text={(pet.error ?? links.error ?? encounters.error)?.message ?? ''}
            actionLabel={t.retry}
            onAction={() => void Promise.all([pet.refetch(), links.refetch(), encounters.refetch()])}
          />
        ) : (
          <Skeleton height={400} radius="xl" />
        )}
      </ScreenTemplate>
      </ScreenMotion>
    );
  }

  const pins = [...met, ...linked];
  return (
    <ScreenMotion>
    <ScreenTemplate scroll={false} padded={false} edges={[]} keyboard={false}>
      <NeighbourhoodMap
        me={p}
        meLabel={t.me}
        pins={pins}
        title={t.title}
        subtitle={t.subtitle(pins.length)}
        onBack={back}
        backLabel={t.back}
        badge={t.badge}
        onBadge={() => router.push('/moi/blowy-plus')}
        compatLabel={t.compat}
        empty={{ text: t.empty, label: t.rencontres, onPress: toRencontres }}
      />
    </ScreenTemplate>
    </ScreenMotion>
  );
}
