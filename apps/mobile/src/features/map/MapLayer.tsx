/**
 * La vraie carte (iPhone) : Apple Plans par react-native-maps (fournisseur par défaut sur iOS : ni clé, ni coût de
 * tuiles), en mode sombre et atténué, sans points d'intérêt. Par-dessus : la zone (cercle pointillé jaune), toi au
 * centre, les minimoas compatibles en autocollants aux positions arrondies du serveur, des silhouettes floues au-delà.
 * Gratuit : caméra fixée sur la zone (ni glisser ni zoomer). Minimoa+ : navigation libre.
 * Ailleurs (Android sans clé Google, module natif absent, erreur du module) : la carte dessinée (`ZoneMap`).
 */
import { color } from '@blowy/tokens';
import { alpha, MapBlob, MapSticker, ZoneMap } from '@blowy/ui';
import { Component, type ReactNode, useMemo, useRef } from 'react';
import { Platform, StyleSheet } from 'react-native';

import type { MapLayerProps } from './MapLayer.types';

export type { MapLayerProps } from './MapLayer.types';

type MapsModule = typeof import('react-native-maps');
let maps: MapsModule | null = null;
if (Platform.OS === 'ios') {
  try {
    // Chargé à la demande : un build sans le module natif garde la carte dessinée.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    maps = require('react-native-maps') as MapsModule;
  } catch {
    maps = null;
  }
}

const KM_PER_DEG = 111.32;

export function MapLayer(props: MapLayerProps) {
  if (!maps) return <ZoneMap {...props} />;
  return (
    <Fallback fallback={<ZoneMap {...props} />}>
      <NativeMap {...props} module={maps} />
    </Fallback>
  );
}

function NativeMap({ module, center, radiusKm, me, mePosition, pins, blurred = [], free, insetTop = 140, insetBottom = 200, onRegionChange }: MapLayerProps & { module: MapsModule }) {
  const { default: MapView, Marker, Circle } = module;
  // Minimoa+ : seul un geste de la personne déplace ce qu'on regarde (pas le calage de la carte à l'ouverture).
  const touched = useRef(false);
  // Toute la zone visible (avec une marge), dans la partie de l'écran que ni l'en-tête ni la fiche ne couvrent.
  const region = useMemo(() => {
    const spanKm = radiusKm * 2 * 1.25;
    return {
      latitude: center.latitude,
      longitude: center.longitude,
      latitudeDelta: spanKm / KM_PER_DEG,
      longitudeDelta: spanKm / (KM_PER_DEG * Math.cos((center.latitude * Math.PI) / 180)),
    };
  }, [center.latitude, center.longitude, radiusKm]);
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      // Gratuit : la caméra reste sur la zone (région imposée, gestes coupés). Minimoa+ : région de départ, puis libre.
      region={free ? region : undefined}
      initialRegion={region}
      mapType="mutedStandard"
      userInterfaceStyle="dark"
      showsPointsOfInterests={false}
      showsBuildings={false}
      showsCompass={false}
      showsScale={false}
      showsUserLocation={false}
      toolbarEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
      scrollEnabled={!free}
      zoomEnabled={!free}
      zoomTapEnabled={!free}
      cameraZoomRange={{ minCenterCoordinateDistance: 600, maxCenterCoordinateDistance: free ? 6000 : 80_000 }}
      mapPadding={{ top: insetTop, bottom: insetBottom, left: 0, right: 0 }}
      onTouchStart={() => {
        touched.current = true;
      }}
      onRegionChangeComplete={(r) => {
        if (free || !onRegionChange || !touched.current) return;
        onRegionChange({ lat: r.latitude, lng: r.longitude, radiusKm: Math.min(25, Math.max(0.5, (r.latitudeDelta * KM_PER_DEG) / 2)) });
      }}
    >
      <Circle center={center} radius={radiusKm * 1000} strokeColor={color.accent} strokeWidth={3} fillColor={alpha(color.night, 0.35)} lineDashPattern={[2, 9]} />
      {blurred.map((b, i) => (
        <Marker key={`b${i}`} coordinate={b} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <MapBlob delay={i * 340} />
        </Marker>
      ))}
      {me ? (
        <Marker coordinate={mePosition ?? center} anchor={{ x: 0.5, y: 0.35 }} zIndex={5}>
          <MapSticker pet={me.pet} label={me.label} me accessibilityLabel={me.accessibilityLabel} size={58} />
        </Marker>
      ) : null}
      {pins.map((p, i) => (
        <Marker key={p.key} coordinate={p.position} anchor={{ x: 0.5, y: 0.35 }} zIndex={p.selected ? 10 : 6} onPress={p.onPress}>
          <MapSticker pet={p.pet} label={p.label} selected={p.selected} onPress={p.onPress} accessibilityLabel={p.accessibilityLabel} floatDelay={i * 230} />
        </Marker>
      ))}
    </MapView>
  );
}

/** Une erreur du module natif ne casse pas l'écran : la carte dessinée prend le relais. */
class Fallback extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
