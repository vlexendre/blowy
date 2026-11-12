/** Accueil de l'app (V6-Accueil, V6-Boude) : le pet, ses besoins, les soins, sa garde-robe, son caractère. */
import { ApiError } from '@blowy/api-client';
import { careLabel, formLabel, itemLabel, needLabel, shapeLabel, statGoalLabel } from '@blowy/content';
import { type CareAction, urgentNeed } from '@blowy/domain';
import { color } from '@blowy/tokens';
import { Banner, CareBar, CareIcon, EntryCard, ItemImage, NeedsPanel, PetStage, Skeleton, TabTemplate } from '@blowy/ui';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { RefreshControl } from 'react-native';

import { errorText } from '@/features/links';
import { careAvailable, careHot, nextItem, pickLine, useCare, useLivePet, useUnlocks, useWardrobe } from '@/features/pet';
import { UnlockCelebration } from '@/features/pet/UnlockCelebration';
import { home as t } from '@/locales/pet';

/** Durée d'affichage d'une réplique après un soin (« miam. », « il n'a plus faim. »). */
const SAID_MS = 3500;

export default function PetHome() {
  const router = useRouter();
  const pet = useLivePet();
  const wardrobe = useWardrobe();
  const care = useCare();
  const fresh = useUnlocks((s) => s.fresh);
  const [reaction, setReaction] = useState<CareAction | null>(null);
  const [reactionKey, setReactionKey] = useState(0);
  const [said, setSaid] = useState<{ text: string; key: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!said) return;
    const id = setTimeout(() => setSaid(null), SAID_MS);
    return () => clearTimeout(id);
  }, [said]);

  const say = (text: string) => setSaid((s) => ({ text, key: (s?.key ?? 0) + 1 }));
  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([pet.refetch(), wardrobe.refetch()]);
    setRefreshing(false);
  };
  const refreshControl = <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={color.mute} />;

  if (!pet.data) {
    return (
      <TabTemplate gutter={14} gap={10} top={6} refreshControl={refreshControl}>
        {pet.isPending ? (
          <>
            <Skeleton height={318} radius="xl" />
            <Skeleton height={56} radius="md" />
            <Skeleton height={112} radius="lg" />
          </>
        ) : (
          <Banner tone="error" title={t.loadError} text={pet.error?.message ?? ''} actionLabel={t.retry} onAction={() => void pet.refetch()} />
        )}
      </TabTemplate>
    );
  }

  const { pet: p, challenge } = pet.data;
  const urgent = urgentNeed(p.needs);
  const speech = said?.text ?? pickLine(urgent ? t.speech[urgent] : t.happy, p.needs);
  const sulking = p.shape === 'boude';

  const onCare = (action: CareAction) =>
    care.mutate(action, {
      onSuccess: () => {
        setReaction(action);
        setReactionKey((k) => k + 1);
        say(careLabel[action]?.done ?? '');
      },
      onError: (e) => {
        // Refus du pet (besoin déjà comblé) : il le dit lui-même dans sa bulle.
        if (e instanceof ApiError && e.code === 'already_done') say(e.message || (careLabel[action]?.refused ?? ''));
      },
    });

  const w = wardrobe.data;
  const owned = w?.items.filter((i) => i.state === 'owned').length ?? 0;
  const next = w ? nextItem(w.items) : null;
  const nextText = next
    ? t.wardrobeNext(itemLabel[next.id] ?? next.id, statGoalLabel[next.goal.stat]?.(next.goal.need) ?? '', next.goal.have, next.goal.need)
    : w
      ? t.wardrobeAll
      : t.wardrobeLoading;
  const careError = care.isError && !(care.error instanceof ApiError && care.error.code === 'already_done');

  return (
    <TabTemplate gutter={14} gap={10} top={6} refreshControl={refreshControl}>
      <PetStage
        pet={p}
        title={p.name.toUpperCase()}
        shape={p.shape}
        shapeLabel={shapeLabel[p.shape]?.title}
        speech={speech}
        action={{ label: t.wardrobe, onPress: () => router.push('/pet/garde-robe'), accessibilityLabel: t.wardrobeA11y }}
        reaction={reaction}
        reactionKey={reactionKey}
        petLabel={t.petA11y(p.name)}
      />
      <NeedsPanel needs={p.needs} labels={needLabel} />
      <CareBar
        labels={careLabel}
        available={careAvailable(p.needs)}
        hot={careHot(p.needs)}
        busy={care.isPending ? care.variables : null}
        onCare={onCare}
        onRefused={(a) => say(careLabel[a]?.refused ?? '')}
      />
      {careError ? <Banner tone="error" text={errorText(care.error, t.careError)} onClose={() => care.reset()} /> : null}

      {sulking ? (
        <EntryCard tone="alert" left={<CareIcon name="door" size={30} color={color.danger} />} title={t.sulkTitle(p.name)} text={t.sulkText} />
      ) : (
        <EntryCard
          left={<ItemImage id={next?.id ?? p.outfit.head ?? 'couronne'} size={46} />}
          title={t.wardrobeTitle(owned, w?.items.length ?? 64)}
          text={nextText}
          badge={fresh.length ? t.newCount(fresh.length) : undefined}
          onPress={() => router.push('/pet/garde-robe')}
          accessibilityLabel={`${t.wardrobeA11y}, ${t.wardrobeTitle(owned, w?.items.length ?? 64)}, ${nextText}`}
        />
      )}
      <EntryCard
        title={t.character}
        text={t.characterText(formLabel[p.form], challenge.doneToday)}
        chevron
        onPress={() => router.push('/pet/caractere')}
        accessibilityLabel={`${t.characterA11y}, ${t.characterText(formLabel[p.form], challenge.doneToday)}`}
      />
      <UnlockCelebration />
    </TabTemplate>
  );
}
