/** Garde-robe (V6-GardeRobe, V6-Objet) : la tenue en direct, les 4 emplacements, porter ou retirer, comment gagner le reste. */
import type { WardrobeItem } from '@blowy/contract';
import { itemLabel, slotLabel, statGoalLabel } from '@blowy/content';
import { ITEM_SLOTS, type ItemSlot, type StatKey } from '@blowy/domain';
import { Banner, Chip, ItemDetail, OutfitPreview, SettingsTemplate, SheetTemplate, Skeleton, SlotTabs, WardrobeGrid } from '@blowy/ui';
import { type Href, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { errorText } from '@/features/links';
import { usePet, useSetOutfit, useUnlocks, useWardrobe, withItem } from '@/features/pet';
import { goBack } from '@/features/session';
import { wardrobe as t } from '@/locales/pet';

/** Où l'on avance vers chaque étape. */
const SHORTCUT: Record<StatKey, Href> = {
  careDays: '/(tabs)/pet',
  links: '/(tabs)/rencontres',
  bestLevel: '/(tabs)/chats',
  bestStreak: '/(tabs)/chats',
  challenges: '/pet/caractere',
  words: '/(tabs)/moi',
};

export default function WardrobeScreen() {
  const router = useRouter();
  const pet = usePet();
  const wardrobe = useWardrobe();
  const setOutfit = useSetOutfit();
  const seen = useUnlocks((s) => s.seen);
  // Les étiquettes « nouveau » restent le temps de la visite, puis on les considère vues.
  const [newIds] = useState(() => useUnlocks.getState().fresh);
  const [slot, setSlot] = useState<ItemSlot>('head');
  const [open, setOpen] = useState<WardrobeItem | null>(null);
  useEffect(() => () => seen(), [seen]);

  const back = () => goBack('/(tabs)/pet');
  const w = wardrobe.data;
  const p = pet.data?.pet;

  if (!w || !p) {
    const failed = wardrobe.isError || pet.isError;
    return (
      <SettingsTemplate title={t.title} titleSize={40} onBack={back} backLabel={t.back}>
        {failed ? (
          <Banner
            tone="error"
            title={t.loadError}
            text={(wardrobe.error ?? pet.error)?.message ?? ''}
            actionLabel={t.retry}
            onAction={() => void Promise.all([wardrobe.refetch(), pet.refetch()])}
          />
        ) : (
          <>
            <Skeleton height={178} radius="xl" />
            <Skeleton height={42} radius="pill" />
            <Skeleton height={360} radius="lg" />
          </>
        )}
      </SettingsTemplate>
    );
  }

  const owned = w.items.filter((i) => i.state === 'owned').length;
  const total = w.items.length;
  const badges = Object.fromEntries(ITEM_SLOTS.map((s) => [s, w.items.some((i) => i.slot === s && newIds.includes(i.id))])) as Record<ItemSlot, boolean>;

  const select = (item: WardrobeItem) => {
    if (item.state === 'owned') setOutfit.mutate(withItem(w.outfit, item.slot, item.id));
    else setOpen(item);
  };
  const go = (href: Href) => {
    setOpen(null);
    router.navigate(href);
  };

  const name = open ? (itemLabel[open.id] ?? open.id) : '';
  const goal = open?.goal;

  return (
    <SettingsTemplate
      title={t.title}
      titleSize={40}
      onBack={back}
      backLabel={t.back}
      right={<Chip label={t.count(owned, total)} accessibilityLabel={t.countA11y(owned, total)} />}
    >
      <OutfitPreview
        species={p.species}
        outfit={w.outfit}
        slotLabels={slotLabel}
        itemLabels={itemLabel}
        emptyLabel={t.empty}
        activeSlot={slot}
        onSlotPress={setSlot}
        petLabel={t.petA11y(p.name)}
      />
      <SlotTabs labels={slotLabel} active={slot} onChange={setSlot} badges={badges} />
      {setOutfit.isError ? <Banner tone="error" text={errorText(setOutfit.error, t.outfitError)} onClose={() => setOutfit.reset()} /> : null}
      <WardrobeGrid
        items={w.items}
        slot={slot}
        worn={w.outfit[slot] ?? null}
        itemLabels={itemLabel}
        goalLabels={t.goalShort}
        premiumLabel={t.premium}
        wornLabel={t.worn}
        newIds={newIds}
        newLabel={t.new}
        hints={t.hints}
        onSelect={select}
      />

      <SheetTemplate
        visible={!!open}
        onClose={() => setOpen(null)}
        closeLabel={t.close}
        header={
          open ? (
            <ItemDetail
              id={open.id}
              title={t.itemTitle(name)}
              text={open.state === 'premium' ? t.premiumText : t.where[open.slot]}
              note={open.state === 'premium' ? t.premiumNote : undefined}
              goal={
                goal
                  ? { text: statGoalLabel[goal.stat]?.(goal.need) ?? '', have: goal.have, need: goal.need, hint: t.goalHint[goal.stat]?.(goal.have) }
                  : undefined
              }
              action={goal ? { label: t.shortcut[goal.stat], onPress: () => go(SHORTCUT[goal.stat]) } : undefined}
              closeLabel={t.close}
              onClose={() => setOpen(null)}
            />
          ) : undefined
        }
      />
    </SettingsTemplate>
  );
}
