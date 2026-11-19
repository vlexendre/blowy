/** Garde-robe (V6-GardeRobe, V6-Objet) : la tenue en direct, les 4 emplacements, porter ou retirer, comment gagner le reste. */
import type { WardrobeItem } from '@blowy/contract';
import { itemLabel, slotLabel, statGoalLabel } from '@/locales/content';
import { ITEM_SLOTS, type ItemSlot, type StatKey, itemById } from '@blowy/domain';
import {
  Banner,
  Chip,
  CollectionBanner,
  ItemDetail,
  ItemImage,
  OutfitPreview,
  type OutfitPreviewHandle,
  SettingsTemplate,
  SheetTemplate,
  Skeleton,
  SlotTabs,
  TryOnBar,
  useFlyTo,
  WardrobeGrid,
  type WardrobeGridHandle,
} from '@blowy/ui';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { ScreenMotion } from '@/core';
import { errorText } from '@/features/links';
import { usePet, useSetOutfit, useUnlocks, useWardrobe, withItem } from '@/features/pet';
import { openPlus } from '@/features/plus';
import { goBack } from '@/features/session';
import { wardrobe as t } from '@/locales/pet';
import { formatDate } from '@/locales/runtime';

/** Où l'on avance vers chaque étape. */
const SHORTCUT: Record<StatKey, Href | null> = {
  careDays: '/(tabs)/pet',
  links: '/(tabs)/rencontres',
  bestLevel: '/(tabs)/chats',
  bestStreak: '/(tabs)/chats',
  // Défi du jour et habitudes : hors de l'interface V1 (Ton chemin) : pas de raccourci (l'objet se gagne encore par
  // l'ancienne app). La série, elle, avance avec la séance du jour.
  challenges: null,
  words: '/(tabs)/moi',
  ritualStreak: '/pet/serie',
  habitsKept: null,
  referrals: '/(tabs)/moi',
  founded: '/(tabs)/rencontres',
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
  // Essayage d'un objet premium (aperçu sur son minimoa, jamais enregistré) ; `?try=` : vu sur un autre minimoa.
  const params = useLocalSearchParams<{ try?: string; from?: string }>();
  const [tryOn, setTryOn] = useState<string | null>(() => (typeof params.try === 'string' && itemById(params.try)?.unlock.kind === 'premium' ? params.try : null));
  // Objets en vol vers le pet : portés tout de suite (optimiste), montrés sur lui à l'atterrissage.
  const [incoming, setIncoming] = useState<string[]>([]);
  const preview = useRef<OutfitPreviewHandle>(null);
  const grid = useRef<WardrobeGridHandle>(null);
  const fly = useFlyTo();
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

  // Un objet essayé qu'on possède déjà (ou qui n'est plus proposé) : pas d'essayage.
  const trying = tryOn && w.items.some((i) => i.id === tryOn && i.state === 'premium') ? tryOn : null;
  const tryItem = trying ? itemById(trying) : undefined;
  const shown = tryItem ? { ...w.outfit, [tryItem.slot]: tryItem.id } : w.outfit;
  const season = w.collection;
  const owned = w.items.filter((i) => i.state === 'owned').length;
  const total = w.items.length;
  const badges = Object.fromEntries(ITEM_SLOTS.map((s) => [s, w.items.some((i) => i.slot === s && newIds.includes(i.id))])) as Record<ItemSlot, boolean>;

  /** Ce qui vole : l'image de l'objet, à la taille du départ. */
  const render =
    (id: string) =>
    ({ width }: { width: number }) => <ItemImage id={id} size={width} />;
  /** Un objet retourne dans sa case : il saute du pet et vole jusqu'à elle. */
  const sendBack = async (id: string) => {
    const [from, to] = await Promise.all([preview.current?.itemRect(id), grid.current?.tileRect(id)]);
    if (!from || !to) return;
    const side = Math.max(from.width, from.height);
    void fly({
      from: { x: from.x + from.width / 2 - side / 2, y: from.y + from.height / 2 - side / 2, width: side, height: side },
      to,
      render: render(id),
      arc: 90,
      duration: 520,
      haptic: false,
      onLand: () => grid.current?.land(id),
    });
  };
  const select = async (item: WardrobeItem) => {
    if (item.state === 'owned') setTryOn(null);
    if (item.state !== 'owned') {
      setOpen(item);
      return;
    }
    const worn = w.outfit[item.slot];
    // L'action part tout de suite ; l'animation suit (rien n'attend la fin d'un vol).
    setOutfit.mutate(withItem(w.outfit, item.slot, item.id));
    if (worn === item.id) {
      preview.current?.react('surprise');
      void sendBack(item.id);
      return;
    }
    if (worn) void sendBack(worn);
    setIncoming((l) => [...l, item.id]);
    const [from, to] = await Promise.all([grid.current?.tileRect(item.id), preview.current?.itemRect(item.id)]);
    const done = () => setIncoming((l) => l.filter((i) => i !== item.id));
    if (!from || !to) {
      done();
      return;
    }
    const side = Math.max(to.width, to.height);
    void fly({
      from,
      to: { x: to.x + to.width / 2 - side / 2, y: to.y + to.height / 2 - side / 2, width: side, height: side },
      render: render(item.id),
      onLand: () => {
        done();
        preview.current?.react('joy');
      },
    });
  };
  const go = (href: Href) => {
    setOpen(null);
    router.navigate(href);
  };
  // Minimoa+ monte en feuille : on attend que la fiche de l'objet soit redescendue (iOS ne présente pas deux
  // modales à la fois).
  const toPlus = () => {
    const item = open?.id;
    setOpen(null);
    setTimeout(() => openPlus('premium_item', item ? { item } : {}), 320);
  };
  /** Essayer l'objet premium ouvert sur son minimoa : la fiche descend, il le porte (aperçu). */
  const tryIt = () => {
    const item = open;
    setOpen(null);
    if (!item) return;
    setSlot(item.slot);
    setTryOn(item.id);
    preview.current?.react('joy');
  };

  const name = open ? (itemLabel[open.id] ?? open.id) : '';
  const goal = open?.goal;

  return (
    <ScreenMotion>
      <SettingsTemplate
        title={t.title}
        titleSize={40}
        onBack={back}
        backLabel={t.back}
        right={<Chip label={t.count(owned, total)} accessibilityLabel={t.countA11y(owned, total)} />}
      >
        <OutfitPreview
          species={p.species}
          outfit={shown}
          slotLabels={slotLabel}
          itemLabels={itemLabel}
          emptyLabel={t.empty}
          activeSlot={slot}
          onSlotPress={setSlot}
          petLabel={t.petA11y(p.name)}
          hiddenItems={incoming}
          seed={p.id}
          previewRef={preview}
        />
        {tryItem ? (
          <TryOnBar
            title={t.tryTitle(itemLabel[tryItem.id] ?? tryItem.id, p.name)}
            text={t.tryText}
            keepLabel={t.tryKeep}
            onKeep={() => openPlus(params.from === 'worn' && tryItem.id === params.try ? 'worn_by' : 'try_on', { item: tryItem.id })}
            removeLabel={t.tryRemove}
            onRemove={() => setTryOn(null)}
          />
        ) : null}
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
          onSelect={(item) => void select(item)}
          gridRef={grid}
        />
        {/* Collection saisonnière : sa vraie date de fin vient du serveur (docs/DESIR.md). */}
        {season ? (
          <CollectionBanner
            kicker={t.collection.name[season.id]}
            title={t.collection.title(formatDate(new Date(`${season.until}T12:00:00Z`), { day: 'numeric', month: 'long' }), season.daysLeft)}
            text={season.kept ? t.collection.kept : t.collection.text}
            items={season.items}
            action={season.kept ? null : { label: t.collection.cta, onPress: () => openPlus('collection') }}
          />
        ) : null}

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
                action={
                  open.state === 'premium'
                    ? { label: t.premiumCta, onPress: toPlus }
                    : goal && SHORTCUT[goal.stat]
                      ? { label: t.shortcut[goal.stat], onPress: () => go(SHORTCUT[goal.stat] as Href) }
                      : undefined
                }
                secondary={open.state === 'premium' ? { label: t.tryOn(p.name), onPress: tryIt } : undefined}
                closeLabel={t.close}
                onClose={() => setOpen(null)}
              />
            ) : undefined
          }
        />
      </SettingsTemplate>
    </ScreenMotion>
  );
}
