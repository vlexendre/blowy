/**
 * La carte (spéc §10, maquette V6-GCarte) : ta zone, les minimoas compatibles en autocollants (positions arrondies du
 * serveur), des silhouettes floues au-delà et leur nombre (caché à zéro). Gratuit : la carte reste sur ta zone.
 * Minimoa+ : navigation libre et « Changer de ville ». Mode discret. Sans localisation : ce qui manque et comment l'activer.
 * Sous le titre, où l'on est (`MapZoneBar`) : « Ta zone · 1,5 km », « Tu regardes Lyon · 20 km » (et « Revenir à ma
 * zone »), « Tu regardes ailleurs » (et « Recentrer »). La caméra montre la zone en entier entre l'en-tête et le pied
 * mesurés (`MapFrame`), et la mention légale d'Apple Plans reste au-dessus du pied.
 * Vraie carte Apple sur iPhone ; ailleurs (web, module absent), la carte dessinée (`MapLayer`).
 * Ton chemin (V1) : épingles façon TripBFF (visage rond, pointe, « Prénom · dans ton quartier » : une distance à gros
 * grains, jamais au mètre), anneau jaune pour les présentés du jour, « Personne ne voit où tu es exactement », et en
 * bas « Aujourd'hui, Nino te présente » (« Vous deux : », « Dire bonjour » : le même geste que les rencontres).
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
  MapZoneBar,
  MatchWhy,
  PersonOfDayCard,
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
import { isWaveLimit, useLiveEncounters, useWave, useWaveBlock, whyA11y } from '@/features/encounters';
import { AreaSheet, CITIES, type MapAt, useCity, useDiscreet, useFreshPosition, useMap, useMarkWaved } from '@/features/map';
import { errorText } from '@/features/links';
import { MapLayer } from '@/features/map/MapLayer';
import { useMe } from '@/features/me';
import { openPlus } from '@/features/plus';
import { distanceBand, useCheminResults } from '@/features/chemin';
import { chats as chatsText } from '@/locales/chats';
import { chemin } from '@/locales/chemin';
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
  // Trop de coucous (plafond du jour, coucous en attente) : « Faire signe » désactivé, la fiche dit pourquoi.
  const waveBlock = useWaveBlock(wave.error);
  const discreet = useDiscreet();
  const city = useCity();
  const [selected, setSelected] = useState<string | null>(null);
  const [citySheet, setCitySheet] = useState(false);
  const [areaSheet, setAreaSheet] = useState(false);
  // « Recentrer » : la caméra revient sur la zone (elle y revient aussi seule quand la zone change).
  const [focus, setFocus] = useState(0);
  // Ta zone (ou la ville choisie) : le cercle et le calage de la caméra, gardés quand Minimoa+ regarde ailleurs.
  const [home, setHome] = useState<{ center: { latitude: number; longitude: number }; radiusKm: number } | null>(null);
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
  const homeCenter = !at && data?.center ? data.center : null;
  const homeRadius = data?.radiusKm ?? 0;
  useEffect(() => {
    if (homeCenter) setHome({ center: homeCenter, radiusKm: homeRadius });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeCenter?.latitude, homeCenter?.longitude, homeRadius]);
  const plus = !!m && entitlements(m.plus).mapEverywhere;
  const petName = m?.pet.name ?? chatsText.yourPet;
  // Les présentés du jour (anneau jaune), la personne du jour de la séance d'abord.
  const lastResult = useCheminResults((x) => (x.last ? x.results[x.last]?.result : undefined));
  const dayPerson = lastResult?.person?.suggestion.user.id ?? null;
  const presented = useMemo(() => {
    const list = [...(encounters.data?.suggestions ?? [])];
    return list.sort((a, b) => Number(b.user.id === dayPerson) - Number(a.user.id === dayPerson));
  }, [encounters.data, dayPerson]);
  const [showing, setShowing] = useState(0);
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
  // La zone (cercle, caméra) : celle qu'on vient de lire, ou celle gardée quand Minimoa+ regarde ailleurs.
  const zone = !at || !home ? { center: data.center, radiusKm: data.radiusKm } : home;
  const pins = data.pins;
  const current: MapPin | null = pins.find((p) => p.user.id === selected) ?? null;
  const km = formatNumber(zone.radiusKm, { maximumFractionDigits: 1 });
  const chosen = m.identity.location.chosenCity;
  const cityActive = m.identity.location.chosenCityActive && !!chosen;
  const manual = m.identity.location.manualArea?.label ?? null;
  // Où l'on est : ta zone, la ville choisie (Minimoa+), ou ailleurs (Minimoa+ a déplacé la carte).
  const panned = plus && !!at;
  const recenter = () => {
    setAt(null);
    setSelected(null);
    setFocus((f) => f + 1);
  };
  const backHome = () => city.clear.mutate(undefined, { onSuccess: recenter });
  const privacy = chemin.carte.privacy;
  const zoneBar = panned ? (
    <MapZoneBar label={t.zoneAway} away note={privacy} actionLabel={t.recenter} actionA11y={t.recenterA11y} onAction={recenter} />
  ) : cityActive && chosen ? (
    <MapZoneBar label={t.zoneCity(chosen.label, km)} away note={privacy} actionLabel={t.cityBack} onAction={backHome} actionLoading={city.clear.isPending} />
  ) : (
    <MapZoneBar label={manual ? t.zoneHomeNamed(manual, km) : t.zoneHome(km)} note={privacy} />
  );
  // D'où l'on mesure la distance (à gros grains) : ton quartier, sinon le centre de la zone affichée.
  const from = m.identity.location.zone?.center ?? zone.center;
  const bandOf = (pos: { latitude: number; longitude: number }) => chemin.carte.band[distanceBand(from, pos)];
  const hotIds = new Set(presented.map((x) => x.user.id));
  // « Aujourd'hui, Nino te présente » : un présenté du jour à la fois, « Voir les autres » passe au suivant.
  const today = presented.length > 0 ? presented[showing % presented.length] : null;
  const todayPin = today ? pins.find((x) => x.user.id === today.user.id) : undefined;
  // Les silhouettes et leur nombre viennent du serveur : rien à zéro.
  const beyond = data.beyond.count > 0 ? data.beyond : null;

  const card = current ? (
    <MapPinCard
      motionKey={current.user.id}
      pet={current.user.pet}
      owner={t.owner(current.user.displayName)}
      compat={ui.closeness(current.compatibility)}
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
      actionDisabled={current.relation === 'none' && !!waveBlock}
      actionNote={waveBlock ?? undefined}
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
      {wave.isError && !isWaveLimit(wave.error) ? <Banner tone="error" text={errorText(wave.error, listText.actionError)} onClose={() => wave.reset()} /> : null}
      {card}
      {!current && today ? (
        <PersonOfDayCard
          kicker={`${chemin.carte.sheetKicker(petName)} · ${chemin.carte.sheetCount((showing % presented.length) + 1, presented.length)}`}
          person={{ name: today.user.displayName, pet: today.user.pet, face: today.user.face, avatarUrl: today.user.avatarUrl }}
          line={todayPin ? bandOf(todayPin.position) : null}
          togetherTitle={chemin.carte.together}
          points={today.explanation.common.map((x) => x.name)}
          helloLabel={today.waved ? chemin.fin.helloDone : chemin.fin.hello}
          helloDone={today.waved}
          helloLoading={wave.isPending && wave.variables === today.user.id}
          helloDisabled={!!waveBlock && !today.waved}
          helloNote={waveBlock}
          onHello={() => {
            const id = today.user.id;
            wave.mutate(id, { onSuccess: () => markWaved(id) });
          }}
          secondaryLabel={presented.length > 1 ? chemin.carte.others : undefined}
          onSecondary={presented.length > 1 ? () => setShowing((n) => n + 1) : undefined}
        />
      ) : null}
      {!current && pins.length === 0 && !today ? (
        <Banner tone="info" text={t.emptyShort} actionLabel={t.emptyAction} onAction={() => router.dismissTo('/(tabs)/rencontres')} actionBelow />
      ) : null}
      {!current && !today ? (
        plus ? (
          // Un seul bouton en bas : revenir à sa zone se fait depuis la pilule de zone, en haut.
          <Button label={t.city} variant="glass" size="md" onPress={() => setCitySheet(true)} />
        ) : (
          // Au-delà de la zone : le vrai nombre du serveur (silhouettes floues sur la carte), sinon l'avantage seul.
          (beyond?.count ?? 0) > 0 ? (
            <MapPlusStrip title={t.plusFar(beyond?.count ?? 0)} text={t.plusFarText(beyond?.strong ?? 0)} ctaLabel={t.plusCta} onPress={() => openPlus('far_away')} />
          ) : (
            <MapPlusStrip title={t.plusTitle} text={t.plusText} ctaLabel={t.plusCta} onPress={() => openPlus('map')} />
          )
        )
      ) : null}
    </>
  );

  return (
    <ScreenMotion>
      <MapTemplate
        title={t.title}
        zone={zoneBar}
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
        map={(frame) => (
          <MapLayer
            center={zone.center}
            radiusKm={zone.radiusKm}
            free={!plus}
            onRegionChange={plus ? onRegionChange : undefined}
            land={land}
            insetTop={frame.top}
            insetBottom={frame.bottom}
            safeTop={frame.safeTop}
            safeBottom={frame.safeBottom}
            measured={frame.measured}
            focusKey={focus}
            me={{ pet: m.pet, label: t.me, accessibilityLabel: t.meA11y(m.pet.name) }}
            // Toi : au centre de ta zone, même quand Minimoa+ regarde ailleurs (sauf ville choisie : tu y es « sans bouger »).
            mePosition={cityActive ? undefined : (m.identity.location.zone?.center ?? undefined)}
            blurred={beyond?.blurred ?? []}
            pins={pins.map((p) => ({
              key: p.user.id,
              position: p.position,
              pet: p.user.pet,
              label: chemin.carte.pin(p.user.displayName, bandOf(p.position)),
              hot: hotIds.has(p.user.id),
              accessibilityLabel: hotIds.has(p.user.id) ? chemin.carte.pinA11yHot(p.user.displayName, bandOf(p.position)) : t.pinA11y(p.user.pet.name, p.user.displayName),
              selected: p.user.id === selected,
              onPress: () => setSelected((s) => (s === p.user.id ? null : p.user.id)),
            }))}
          />
        )}
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
        footer={
          cityActive ? (
            <Button
              label={t.cityBack}
              variant="ghost"
              onPress={() =>
                city.clear.mutate(undefined, {
                  onSuccess: () => {
                    recenter();
                    setCitySheet(false);
                  },
                })
              }
              loading={city.clear.isPending}
            />
          ) : undefined
        }
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
                  recenter();
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
