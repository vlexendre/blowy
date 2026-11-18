/**
 * Banc de la carte (route : /dev/carte) : l'écran « Autour de toi » avec des données fixes, sans API.
 * `?state=home` (ta zone, gratuit) · `city` (Minimoa+, ville choisie) · `away` (Minimoa+, carte déplacée) · `empty`
 * (personne) · `card` (fiche ouverte) · `discreet` (mode discret) ; `?board=1` : les médaillons de la carte, 4 espèces,
 * nues et habillées (objets hauts sur la tête), « toi » et les autres.
 */
import type { Outfit, Species } from '@blowy/domain';
import { color } from '@blowy/tokens';
import { Banner, Button, MapPinCard, MapPlusStrip, MapSticker, MapTemplate, MapZoneBar, PillToggle, Sticker, Text } from '@blowy/ui';
import { useLocalSearchParams } from 'expo-router';
import { LogBox, ScrollView, View } from 'react-native';

import { MapLayer } from '@/features/map/MapLayer';
import { carte as t } from '@/locales/rencontres';

// Banc seulement : pas de panneau d'avertissement par-dessus le pied (captures).
LogBox.ignoreAllLogs(true);

const SPECIES: Species[] = ['nino', 'suzie', 'gaston', 'pia'];
const TALL: Record<Species, Outfit> = {
  nino: { head: 'couronne', face: 'lunettes_rondes' },
  suzie: { head: 'lapin', face: 'joues_roses' },
  gaston: { head: 'sorcier' },
  pia: { head: 'cornes', face: 'lunettes_etoile' },
};
const LILLE = { latitude: 50.6292, longitude: 3.0573 };
const at = (dLat: number, dLng: number) => ({ latitude: LILLE.latitude + dLat, longitude: LILLE.longitude + dLng });
const PINS = [
  { key: 'a', position: at(0.006, -0.008), pet: { name: 'Suzie', species: 'suzie' as const, outfit: { head: 'couronne' } }, label: 'Léa' },
  { key: 'b', position: at(-0.007, 0.009), pet: { name: 'Gaston', species: 'gaston' as const }, label: 'Malo' },
  { key: 'c', position: at(0.002, 0.012), pet: { name: 'Pia', species: 'pia' as const, outfit: { head: 'cornes' } }, label: 'Sasha' },
];

export default function DevCarte() {
  const { state = 'home', board } = useLocalSearchParams<{ state?: string; board?: string }>();
  if (board) return <Board />;
  const plus = state === 'city' || state === 'away';
  const empty = state === 'empty';
  const pins = empty ? [] : PINS;
  const zone =
    state === 'away' ? (
      <MapZoneBar label={t.zoneAway} away note={t.privacy} actionLabel={t.recenter} onAction={() => undefined} />
    ) : state === 'city' ? (
      <MapZoneBar label={t.zoneCity(t.cities.lyon, '20')} away note={t.privacy} actionLabel={t.cityBack} onAction={() => undefined} />
    ) : (
      <MapZoneBar label={t.zoneHome('1,5')} note={t.privacy} />
    );
  const selected = state === 'card' ? PINS[0] : null;
  const bottom = (
    <>
      {state === 'discreet' ? <Banner tone="info" text={t.discreetOn} /> : null}
      {selected ? (
        <MapPinCard
          motionKey={selected.key}
          pet={selected.pet}
          owner={t.owner(selected.label)}
          compat="86 %"
          compatLabel={t.compat}
          actionLabel={t.wave(selected.pet.name)}
          onAction={() => undefined}
        />
      ) : null}
      {empty ? <Banner tone="info" text={t.emptyShort} actionLabel={t.emptyAction} onAction={() => undefined} actionBelow /> : null}
      {!selected ? (
        plus ? (
          <Button label={t.city} variant="glass" size="md" onPress={() => undefined} />
        ) : (
          <MapPlusStrip title={t.plusTitle} text={t.plusText} ctaLabel={t.plusCta} onPress={() => undefined} />
        )
      ) : null}
    </>
  );
  return (
    <MapTemplate
      title={t.title}
      zone={zone}
      onBack={() => undefined}
      backLabel={t.back}
      right={<PillToggle label={t.discreet} value={state === 'discreet'} onValueChange={() => undefined} />}
      map={(frame) => (
        <MapLayer
          center={LILLE}
          radiusKm={plus ? 2.2 : 1.5}
          free={!plus}
          insetTop={frame.top}
          insetBottom={frame.bottom}
          me={{ pet: { name: 'Pia', species: 'pia', outfit: { head: 'cornes' } }, label: t.me, accessibilityLabel: t.meA11y('Pia') }}
          blurred={plus ? [] : [at(0.02, 0.01), at(-0.018, -0.012)]}
          pins={pins.map((p) => ({ ...p, accessibilityLabel: p.label, selected: p.key === selected?.key, onPress: () => undefined }))}
        />
      )}
      badge={!plus && !selected ? <Sticker label="12 minimoas plus loin" tone="white" rotate={-2} font="body" /> : undefined}
      bottom={bottom}
    />
  );
}

/** Les médaillons de la carte : 4 espèces, nues puis habillées (objets hauts), « toi » et les autres. */
function Board() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: color.night }} contentContainerStyle={{ padding: 20, gap: 24 }}>
      {[false, true].map((dressed) => (
        <View key={String(dressed)} style={{ gap: 12 }}>
          <Text variant="bodyHeavy">{dressed ? 'Habillés' : 'Nus'}</Text>
          {[false, true].map((me) => (
            <View key={String(me)} style={{ flexDirection: 'row', gap: 18, flexWrap: 'wrap' }}>
              {SPECIES.map((sp) => (
                <MapSticker
                  key={sp}
                  pet={{ name: sp, species: sp, outfit: dressed ? TALL[sp] : undefined }}
                  label={me ? t.me : sp}
                  me={me}
                  size={me ? 58 : 56}
                  accessibilityLabel={sp}
                />
              ))}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
