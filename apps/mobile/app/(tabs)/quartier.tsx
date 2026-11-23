/**
 * Onglet Quartier (docs/ADA-2027.md, décision 8) : l'ancienne Carte et les anciennes Rencontres réunies. La carte de ta
 * zone (épingles fixes et arrondies du serveur, groupes, chargement par zone, mode discret ; Minimoa+ : toute la carte
 * et « Changer de ville »), avec une feuille à crans « Aujourd'hui · 3 personnes » : les bonjours reçus et les personnes
 * présentées aujourd'hui. Toucher une épingle ou une ligne ouvre la même fiche (`NeighborFiche`), fermable.
 * Sans position : la liste seule, avec une seule action (« Activer », ou « Choisir ma ville » si l'accès est refusé).
 * VoiceOver : la vue en liste (l'alternative à la carte, toutes les épingles comprises) s'ouvre d'elle-même, et la
 * pilule « Liste » la propose à tous. Distance toujours en bandes (« dans ton quartier »), jamais au mètre ; photos
 * cachées pour tout le monde jusqu'au lien noué (décision 7). « Déjà croisés » vit maintenant en bas des Chats.
 */
import { entitlements } from '@blowy/domain';
import { color } from '@blowy/tokens';
import {
  Banner,
  Button,
  ChoiceGrid,
  MapPlusStrip,
  MapTemplate,
  MapZoneBar,
  PeopleSheet,
  PillToggle,
  ScreenTemplate,
  SheetTemplate,
  Skeleton,
  Stack,
  Sticker,
  TabTemplate,
  Text,
  useFirstTime,
} from '@blowy/ui';
import { useMemo, useState } from 'react';
import { Platform, RefreshControl } from 'react-native';

import { ScreenMotion } from '@/core';
import { useCheminResults } from '@/features/chemin';
import { isWaveLimit, useLiveEncounters, useWave, useWaveBlock } from '@/features/encounters';
import { errorText } from '@/features/links';
import { AreaSheet, CITIES, useCity, useDiscreet, useFreshPosition } from '@/features/map';
import { MapLayer } from '@/features/map/MapLayer';
import { useMe } from '@/features/me';
import { openPlus } from '@/features/plus';
import { NeighborFiche, QuartierList, quartierPeople, useQuartierMap, useScreenReader } from '@/features/quartier';
import { chats as chatsText } from '@/locales/chats';
import { chemin } from '@/locales/chemin';
import { formatNumber } from '@/locales/runtime';
import { carte as t, rencontres as listText } from '@/locales/rencontres';
import { voisins as v } from '@/locales/voisins';

export default function QuartierScreen() {
  const me = useMe();
  const m = me.data;
  const location = useFreshPosition(m);
  const q = useQuartierMap(m);
  const data = q.map.data;
  const encounters = useLiveEncounters();
  const wave = useWave();
  // Trop de coucous (plafond du jour, coucous en attente) : « Saluer » désactivé, la fiche dit pourquoi.
  const waveBlock = useWaveBlock(wave.error);
  const discreet = useDiscreet();
  const city = useCity();
  const reader = useScreenReader();
  const [listChoice, setListChoice] = useState<boolean | null>(null);
  const listView = listChoice ?? reader;
  const [selected, setSelected] = useState<string | null>(null);
  const [citySheet, setCitySheet] = useState(false);
  const [areaSheet, setAreaSheet] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const land = useFirstTime('carte:land');

  const plus = !!m && entitlements(m.plus).mapEverywhere;
  const petName = m?.pet.name ?? chatsText.yourPet;
  // La personne du jour de la séance d'abord ; la distance se mesure depuis ton quartier.
  const lastResult = useCheminResults((x) => (x.last ? x.results[x.last]?.result : undefined));
  const dayPerson = lastResult?.person?.suggestion.user.id ?? null;
  const from = m?.identity.location.zone?.center ?? q.zone?.center ?? null;
  const people = useMemo(
    () => quartierPeople({ encounters: encounters.data, pins: q.pins, from, dayPerson }),
    [encounters.data, q.pins, from, dayPerson],
  );
  const current = selected ? (people.byId.get(selected) ?? null) : null;
  const select = (id: string) => setSelected((s) => (s === id ? null : id));
  const fiche = current ? <NeighborFiche person={current} plus={plus} wave={wave} waveBlock={waveBlock} onClose={() => setSelected(null)} /> : null;
  const sheetTitle = v.sheetTitle(people.today.length);

  const banners = (
    <>
      {m?.identity.discreet && !listView ? <Banner tone="info" text={t.discreetOn} /> : null}
      {discreet.isError ? <Banner tone="error" text={listText.actionError} onClose={() => discreet.reset()} /> : null}
      {wave.isError && !isWaveLimit(wave.error) ? <Banner tone="error" text={errorText(wave.error, listText.actionError)} onClose={() => wave.reset()} /> : null}
    </>
  );

  // ── Chargement, erreur ──────────────────────────────────────────────────
  if (!m || !data) {
    const failed = me.isError || q.map.isError;
    return (
      <ScreenMotion>
        <ScreenTemplate>
          {failed ? (
            <Banner
              tone="error"
              title={t.loadError}
              text={v.loadErrorText}
              actionLabel={t.retry}
              onAction={() => void Promise.all([me.refetch(), q.map.refetch()])}
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

  const zone = q.zone;
  const noLocation = data.status === 'no_location' || !data.center || !zone;
  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([encounters.refetch(), q.map.refetch(), me.refetch()]);
    setRefreshing(false);
  };
  const listToggle = (
    <PillToggle label={v.list} value={listView} onValueChange={(on) => (setListChoice(on), setSelected(null))} accessibilityLabel={v.listA11y(listView)} />
  );

  // ── La liste seule : sans position (une seule action), ou vue en liste (VoiceOver) ─────────────────────────
  if (noLocation || listView || !zone) {
    const denied = (location.permission?.status === 'denied' && !location.permission.canAskAgain) || location.result === 'denied';
    const web = Platform.OS === 'web';
    const place = noLocation ? (
      <Banner
        tone="info"
        title={listText.noLocation.title}
        text={
          location.result === 'unavailable'
            ? listText.noLocation.unavailable
            : denied
              ? web
                ? listText.noLocation.deniedWeb
                : listText.noLocation.denied
              : listText.noLocation.text(petName)
        }
        // Une seule action : activer ; refusée, choisir sa ville à la main (gratuit, App Review 5.1.1(iv)).
        actionLabel={denied ? v.chooseCity : v.activate}
        onAction={denied ? () => setAreaSheet(true) : () => void location.enable()}
        actionBelow
      />
    ) : null;
    return (
      <ScreenMotion>
        <TabTemplate
          title={v.title}
          right={noLocation ? undefined : listToggle}
          gutter={12}
          gap={10}
          top={6}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={color.mute} />}
        >
          <QuartierList
            me={m}
            people={people}
            showAround={!noLocation}
            selected={selected}
            fiche={fiche}
            onSelect={select}
            waveBlock={waveBlock}
            header={
              <>
                {place}
                {noLocation ? null : <Text size={15} muted>{`${sheetTitle} · ${v.sheetNote}`}</Text>}
                {banners}
              </>
            }
          />
        </TabTemplate>
        <AreaSheet visible={areaSheet} onClose={() => setAreaSheet(false)} />
      </ScreenMotion>
    );
  }

  // ── La carte et sa feuille ────────────────────────────────────────────────
  const km = formatNumber(zone.radiusKm, { maximumFractionDigits: 1 });
  const chosen = m.identity.location.chosenCity;
  const cityActive = m.identity.location.chosenCityActive && !!chosen;
  const manual = m.identity.location.manualArea?.label ?? null;
  // Où l'on est : ta zone, la ville choisie (Minimoa+), ou ailleurs (Minimoa+ a déplacé la carte).
  const panned = plus && !!q.at;
  const recenter = () => {
    setSelected(null);
    q.recenter();
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
  // Les silhouettes et leur nombre viennent du serveur : rien à zéro.
  const beyond = data.beyond.count > 0 ? data.beyond : null;
  // Minimoa+ : un seul bouton (revenir à sa zone se fait depuis la pilule de zone, en haut). Gratuit : la proposition
  // de la carte, que la liste ne montre que si elle n'en a pas déjà une, et jamais quand elle est vide.
  const footer = plus ? <Button label={t.city} variant="glass" size="md" onPress={() => setCitySheet(true)} /> : undefined;
  const plusOffer = plus ? undefined : beyond ? (
    <MapPlusStrip title={t.plusFar(beyond.count)} text={t.plusFarText(beyond.strong)} ctaLabel={t.plusCta} onPress={() => openPlus('far_away')} />
  ) : (
    <MapPlusStrip title={t.plusTitle} text={t.plusText} ctaLabel={t.plusCta} onPress={() => openPlus('map')} />
  );

  return (
    <ScreenMotion>
      <MapTemplate
        title={v.title}
        zone={zoneBar}
        backLabel={t.back}
        inTabs
        right={
          <Stack direction="row" gap={8} align="center">
            {listToggle}
            <PillToggle
              label={t.discreet}
              value={m.identity.discreet}
              onValueChange={(on) => discreet.mutate(on)}
              accessibilityLabel={t.discreetA11y(m.identity.discreet)}
              disabled={discreet.isPending}
            />
          </Stack>
        }
        map={(frame) => (
          <MapLayer
            center={zone.center}
            radiusKm={zone.radiusKm}
            free={!plus}
            onRegionChange={plus ? q.onRegionChange : undefined}
            land={land}
            insetTop={frame.top}
            insetBottom={frame.bottom}
            safeTop={frame.safeTop}
            safeBottom={frame.safeBottom}
            measured={frame.measured}
            focusKey={q.focus}
            clusterA11y={t.cluster}
            onClusterPress={plus ? undefined : () => openPlus('map')}
            me={{ pet: m.pet, label: t.me, accessibilityLabel: t.meA11y(m.pet.name) }}
            // Toi : au centre de ta zone, même quand Minimoa+ regarde ailleurs (sauf ville choisie : tu y es « sans bouger »).
            mePosition={cityActive ? undefined : (m.identity.location.zone?.center ?? undefined)}
            blurred={beyond?.blurred ?? []}
            pins={q.pins.map((p) => {
              const n = people.byId.get(p.user.id);
              const band = n?.band ? chemin.carte.band[n.band] : '';
              const hot = !!n?.presented;
              return {
                key: p.user.id,
                position: p.position,
                pet: p.user.pet,
                label: band ? chemin.carte.pin(p.user.displayName, band) : p.user.displayName,
                hot,
                // Sur la carte, le serveur n'envoie aucune photo (`face: 'hidden'`, décision 7) : l'épingle montre le minimoa.
                // Pastille verte s'il est venu aujourd'hui.
                photo: p.user.face === 'hidden' ? null : p.user.avatarUrl,
                blurred: p.user.face === 'blurred',
                online: p.activeToday ?? false,
                accessibilityLabel: hot ? chemin.carte.pinA11yHot(p.user.displayName, band) : t.pinA11y(p.user.pet.name, p.user.displayName),
                selected: p.user.id === selected,
                onPress: () => select(p.user.id),
              };
            })}
          />
        )}
        badge={beyond && !current ? <Sticker label={beyond.label} tone="white" rotate={-2} font="body" /> : undefined}
        bottom={fiche ?? undefined}
        sheet={
          <PeopleSheet
            title={sheetTitle}
            subtitle={v.sheetNote}
            hidden={!!current}
            expandA11y={v.expandA11y}
            collapseA11y={v.collapseA11y}
            onVisibleChange={setSheetVisible}
          >
            <QuartierList me={m} people={people} onSelect={select} waveBlock={waveBlock} header={banners} footer={footer} plusOffer={plusOffer} />
          </PeopleSheet>
        }
        sheetVisible={current ? 0 : sheetVisible}
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
              onPress={() => city.clear.mutate(undefined, { onSuccess: () => (recenter(), setCitySheet(false)) })}
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
              { onSuccess: () => (recenter(), setCitySheet(false)) },
            );
          }}
        />
        {city.choose.isError ? <Banner tone="error" text={t.cityError} /> : null}
      </SheetTemplate>
    </ScreenMotion>
  );
}
