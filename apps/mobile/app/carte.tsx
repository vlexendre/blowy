/**
 * La carte (spéc §10, maquette V6-GCarte) : ta zone, les minimoas compatibles en autocollants (positions arrondies du
 * serveur), des silhouettes floues au-delà et leur nombre (caché à zéro). Gratuit : la carte reste sur ta zone.
 * Minimoa+ : navigation libre et « Changer de ville ». Mode discret. Sans localisation : ce qui manque et comment l'activer.
 * Vraie carte Apple sur iPhone ; ailleurs (web, module absent), la carte dessinée (`MapLayer`).
 */
import type { MapPin } from '@blowy/contract';
import { entitlements } from '@blowy/domain';
import {
  Banner,
  Button,
  ChoiceGrid,
  DotNote,
  EmptyState,
  Header,
  MapPinCard,
  MapPlusStrip,
  MapTemplate,
  MatchWhy,
  PillToggle,
  ScreenTemplate,
  SheetTemplate,
  Skeleton,
  Stack,
  Sticker,
  Text,
  useFirstTime,
} from '@blowy/ui';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { ScreenMotion } from '@/core';
import { useLiveEncounters, useWave, whyA11y } from '@/features/encounters';
import { AreaSheet, CITIES, type MapAt, useCity, useDiscreet, useFreshPosition, useMap, useMarkWaved } from '@/features/map';
import { MapLayer } from '@/features/map/MapLayer';
import { useMe } from '@/features/me';
import { openPlus } from '@/features/plus';
import { chats as chatsText } from '@/locales/chats';
import { formatNumber } from '@/locales/runtime';
import { carte as t, rencontres as listText } from '@/locales/rencontres';
import { ui } from '@/locales/ui';

export default function CarteScreen() {
  const router = useRouter();
  const me = useMe();
  const location = useFreshPosition(me.data);
  const [at, setAt] = useState<MapAt | null>(null);
  const map = useMap(at);
  const encounters = useLiveEncounters();
  const wave = useWave();
  const discreet = useDiscreet();
  const city = useCity();
  const [selected, setSelected] = useState<string | null>(null);
  const [citySheet, setCitySheet] = useState(false);
  const [areaSheet, setAreaSheet] = useState(false);
  const markWaved = useMarkWaved();
  const land = useFirstTime('carte:land');
  const back = () => (router.canGoBack() ? router.back() : router.replace('/rencontres'));

  // Minimoa+ : la carte a bougé → on relit ce qu'il y a là (après un court repos du doigt).
  const pan = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (pan.current) clearTimeout(pan.current);
  }, []);
  const onRegionChange = (next: MapAt) => {
    if (pan.current) clearTimeout(pan.current);
    pan.current = setTimeout(() => setAt(next), 450);
  };

  const m = me.data;
  const data = map.data;
  const plus = !!m && entitlements(m.plus).mapEverywhere;
  const petName = m?.pet.name ?? chatsText.yourPet;
  const known = useMemo(() => {
    const ids = new Set<string>();
    for (const s of encounters.data?.suggestions ?? []) ids.add(s.user.id);
    for (const i of encounters.data?.incoming ?? []) ids.add(i.from.id);
    return ids;
  }, [encounters.data]);

  // ── Chargement, erreur ──────────────────────────────────────────────────
  if (!m || !data) {
    const failed = me.isError || map.isError;
    return (
      <ScreenMotion>
        <ScreenTemplate header={<Header onBack={back} backLabel={t.back} />}>
          {failed ? (
            <Banner
              tone="error"
              title={t.loadError}
              text={(me.error ?? map.error)?.message ?? ''}
              actionLabel={t.retry}
              onAction={() => void Promise.all([me.refetch(), map.refetch()])}
            />
          ) : (
            <Stack top={6}>
              <Skeleton height={56} width="70%" radius="md" />
              <Skeleton height={420} radius="xl" />
            </Stack>
          )}
        </ScreenTemplate>
      </ScreenMotion>
    );
  }

  // ── Sans localisation : ce qui manque, et comment l'activer ─────────────────
  if (data.status === 'no_location' || !data.center) {
    const denied = location.permission?.status === 'denied' && !location.permission.canAskAgain;
    const refusedNow = location.result === 'denied';
    const blocked = denied || refusedNow;
    const web = Platform.OS === 'web';
    return (
      <ScreenMotion>
        <ScreenTemplate header={<Header onBack={back} backLabel={t.back} />}>
          <Stack top={6} gap={16}>
            <EmptyState
              peek
              seed={m.pet.id}
              species={m.pet.species}
              mood={blocked ? 'triste' : 'surpris'}
              title={blocked ? t.noLocation.deniedTitle : t.noLocation.title}
              text={blocked ? (web ? t.noLocation.deniedWeb : t.noLocation.denied) : t.noLocation.text(petName)}
            />
            <DotNote text={t.noLocation.without} />
            {location.result === 'unavailable' ? <Banner tone="info" text={t.noLocation.unavailable} /> : null}
            {blocked && !web ? (
              <Button label={t.noLocation.settings} onPress={location.openSettings} />
            ) : (
              <Button label={blocked ? t.noLocation.retry : t.noLocation.action} onPress={() => void location.enable()} loading={location.sending} />
            )}
            {/* Sans localisation, gratuit : une ville choisie à la main (App Review 5.1.1(iv)). */}
            <Button label={t.area.choose} variant="glass" onPress={() => setAreaSheet(true)} />
          </Stack>
        </ScreenTemplate>
        <AreaSheet visible={areaSheet} onClose={() => setAreaSheet(false)} />
      </ScreenMotion>
    );
  }

  // ── La carte ─────────────────────────────────────────────────────────────
  const center = data.center;
  const pins = data.pins;
  const current: MapPin | null = pins.find((p) => p.user.id === selected) ?? null;
  const km = formatNumber(data.radiusKm, { maximumFractionDigits: 1 });
  const chosen = m.identity.location.chosenCity;
  const cityActive = m.identity.location.chosenCityActive && !!chosen;
  const subtitle = cityActive && chosen ? t.subtitleCity(chosen.label, km) : data.scope === 'everywhere' ? t.subtitleEverywhere(km) : t.subtitle(km);
  // Les silhouettes et leur nombre viennent du serveur : rien à zéro.
  const beyond = data.beyond.count > 0 ? data.beyond : null;

  const card = current ? (
    <MapPinCard
      motionKey={current.user.id}
      pet={current.user.pet}
      owner={t.owner(current.user.displayName)}
      compat={ui.percent(current.compatibility)}
      compatLabel={t.compat}
      why={
        <MatchWhy
          commonTitle={current.explanation.commonTitle}
          common={current.explanation.common.map((c) => c.name)}
          exploreTitle={current.explanation.exploreTitle}
          explore={current.explanation.explore.name}
          accessibilityLabel={whyA11y(current.explanation, listText.whyJoin)}
        />
      }
      // Où vous en êtes, dit par l'API : salué (en attente), on t'a salué (répondre), ou rien encore.
      actionLabel={current.relation === 'waved' ? t.waved : current.relation === 'waved_you' ? t.wavedYou(current.user.displayName) : t.wave(current.user.pet.name)}
      actionLoading={wave.isPending && wave.variables === current.user.id}
      actionDone={current.relation === 'waved'}
      onAction={() => {
        if (current.relation === 'waved') return;
        if (current.relation === 'waved_you') return router.push(`/rencontre/${current.user.id}`);
        const id = current.user.id;
        wave.mutate(id, { onSuccess: () => markWaved(id) });
      }}
      secondaryLabel={known.has(current.user.id) ? t.open : undefined}
      onSecondary={() => router.push(`/rencontre/${current.user.id}`)}
    />
  ) : null;

  const bottom = (
    <>
      {m.identity.discreet && !current ? <Banner tone="info" text={t.discreetOn} /> : null}
      {discreet.isError ? <Banner tone="error" text={listText.actionError} onClose={() => discreet.reset()} /> : null}
      {wave.isError ? <Banner tone="error" text={listText.actionError} onClose={() => wave.reset()} /> : null}
      {card}
      {!current && pins.length === 0 ? (
        <Banner tone="info" text={t.empty} actionLabel={t.emptyAction} onAction={() => router.dismissTo('/(tabs)/rencontres')} actionBelow />
      ) : null}
      {!current ? (
        plus ? (
          <Stack gap={8}>
            <Button label={t.city} variant="white" size="md" onPress={() => setCitySheet(true)} />
            {cityActive ? <Button label={t.cityBack} variant="ghost" size="md" loading={city.clear.isPending} onPress={() => city.clear.mutate()} /> : null}
          </Stack>
        ) : (
          <MapPlusStrip title={t.plusTitle} text={t.plusText} ctaLabel={t.plusCta} onPress={() => openPlus('map')} />
        )
      ) : null}
    </>
  );

  return (
    <ScreenMotion>
      <MapTemplate
        title={t.title}
        subtitle={subtitle}
        onBack={back}
        backLabel={t.back}
        right={
          <PillToggle
            label={t.discreet}
            value={m.identity.discreet}
            onValueChange={(on) => discreet.mutate(on)}
            accessibilityLabel={t.discreetA11y(m.identity.discreet)}
            disabled={discreet.isPending}
          />
        }
        map={
          <MapLayer
            center={center}
            radiusKm={data.radiusKm}
            free={!plus}
            onRegionChange={plus ? onRegionChange : undefined}
            land={land}
            insetTop={190}
            insetBottom={200}
            me={{ pet: m.pet, label: t.me, accessibilityLabel: t.meA11y(m.pet.name) }}
            // Toi : au centre de ta zone, même quand Minimoa+ regarde ailleurs (sauf ville choisie : tu y es « sans bouger »).
            mePosition={cityActive ? undefined : (m.identity.location.zone?.center ?? undefined)}
            blurred={beyond?.blurred ?? []}
            pins={pins.map((p) => ({
              key: p.user.id,
              position: p.position,
              pet: p.user.pet,
              label: p.user.displayName,
              accessibilityLabel: t.pinA11y(p.user.pet.name, p.user.displayName),
              selected: p.user.id === selected,
              onPress: () => setSelected((s) => (s === p.user.id ? null : p.user.id)),
            }))}
          />
        }
        badge={beyond && !current ? <Sticker label={beyond.label} tone="white" rotate={-2} font="body" /> : undefined}
        bottom={bottom}
      />

      {/* Minimoa+ : changer de ville sans bouger. */}
      <SheetTemplate
        visible={citySheet}
        onClose={() => setCitySheet(false)}
        title={t.cityTitle}
        closeLabel={t.back}
        scroll
        footer={cityActive ? <Button label={t.cityBack} variant="ghost" onPress={() => city.clear.mutate(undefined, { onSuccess: () => setCitySheet(false) })} loading={city.clear.isPending} /> : undefined}
      >
        <Text size={15} muted>
          {t.cityText}
        </Text>
        <ChoiceGrid
          items={CITIES.map((c) => ({ key: c.id, label: t.cities[c.id] }))}
          selected={cityActive && chosen ? (CITIES.find((c) => t.cities[c.id] === chosen.label)?.id ?? null) : null}
          onSelect={(id) => {
            const c = CITIES.find((x) => x.id === id);
            if (!c) return;
            city.choose.mutate(
              { label: t.cities[c.id], latitude: c.latitude, longitude: c.longitude },
              {
                onSuccess: () => {
                  setAt(null);
                  setSelected(null);
                  setCitySheet(false);
                },
              },
            );
          }}
        />
        {city.choose.isError ? <Banner tone="error" text={t.cityError} /> : null}
      </SheetTemplate>
    </ScreenMotion>
  );
}
