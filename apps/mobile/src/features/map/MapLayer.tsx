/**
 * La vraie carte (iPhone) : Apple Plans par react-native-maps (fournisseur par défaut sur iOS : ni clé, ni coût de
 * tuiles), en mode sombre et atténué, sans points d'intérêt. Par-dessus : la zone (cercle pointillé jaune), toi au
 * centre, les minimoas compatibles en autocollants aux positions arrondies du serveur, des silhouettes floues au-delà.
 * La caméra montre toute la zone (cercle compris) entre l'en-tête et le pied, et y revient quand la zone change.
 * Gratuit : caméra fixée sur la zone (ni glisser ni zoomer). Minimoa+ : navigation libre ; le cercle reste sur la zone.
 * La mention légale d'Apple Plans reste toujours visible : les marges de la carte suivent l'en-tête et le pied mesurés.
 * Ailleurs (Android sans clé Google, module natif absent, erreur du module) : la carte dessinée (`ZoneMap`).
 */
import { color } from '@blowy/tokens';
import { alpha, MapBlob, MapSticker, ZoneMap } from '@blowy/ui';
import { Component, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
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

/** Les quatre bords du cercle de la zone (nord, sud, est, ouest) : ce que la caméra doit montrer en entier. */
function zoneEdges(center: { latitude: number; longitude: number }, radiusKm: number) {
  const dLat = radiusKm / KM_PER_DEG;
  const dLng = radiusKm / (KM_PER_DEG * Math.max(0.2, Math.cos((center.latitude * Math.PI) / 180)));
  return [
    { latitude: center.latitude + dLat, longitude: center.longitude },
    { latitude: center.latitude - dLat, longitude: center.longitude },
    { latitude: center.latitude, longitude: center.longitude + dLng },
    { latitude: center.latitude, longitude: center.longitude - dLng },
  ];
}

/** Marge autour du cercle, en points (le cercle ne touche jamais un bord ni un panneau). */
const RING_MARGIN = 18;

function NativeMap({
  module,
  center,
  radiusKm,
  me,
  mePosition,
  pins,
  blurred = [],
  free,
  insetTop = 140,
  insetBottom = 200,
  safeTop = 0,
  safeBottom = 0,
  focusKey = 0,
  measured = true,
  onRegionChange,
}: MapLayerProps & { module: MapsModule }) {
  const { default: MapView, Marker, Circle } = module;
  const ref = useRef<InstanceType<typeof MapView> | null>(null);
  const [ready, setReady] = useState(false);
  // Minimoa+ : seul un geste de la personne déplace ce qu'on regarde (pas un recalage de la caméra).
  const touched = useRef(false);
  const fitted = useRef(false);
  // Départ : la zone, avant même le premier calage (pas de planisphère au premier rendu).
  const initial = useMemo(() => {
    const spanKm = radiusKm * 2 * 1.6;
    return {
      latitude: center.latitude,
      longitude: center.longitude,
      latitudeDelta: spanKm / KM_PER_DEG,
      longitudeDelta: spanKm / (KM_PER_DEG * Math.cos((center.latitude * Math.PI) / 180)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toute la zone visible, centrée dans la partie de l'écran que ni l'en-tête ni le pied ne couvrent : à l'ouverture,
  // quand la zone change (ville choisie, retour à sa zone) et sur « Recentrer ». Pas quand le pied change de taille.
  const insetsRef = useRef({ top: insetTop, bottom: insetBottom });
  insetsRef.current = { top: insetTop, bottom: insetBottom };
  useEffect(() => {
    if (!ready || !measured || !ref.current) return;
    const { top, bottom } = insetsRef.current;
    touched.current = false;
    ref.current.fitToCoordinates(zoneEdges(center, radiusKm), {
      edgePadding: { top: top + RING_MARGIN, bottom: bottom + RING_MARGIN, left: RING_MARGIN, right: RING_MARGIN },
      animated: fitted.current,
    });
    fitted.current = true;
  }, [ready, measured, center.latitude, center.longitude, radiusKm, focusKey]);

  return (
    <MapView
      ref={ref}
      style={StyleSheet.absoluteFill}
      initialRegion={initial}
      onMapReady={() => setReady(true)}
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
      // Gratuit : la caméra reste sur la zone (gestes coupés). Minimoa+ : libre.
      scrollEnabled={!free}
      zoomEnabled={!free}
      zoomTapEnabled={!free}
      cameraZoomRange={free ? undefined : { minCenterCoordinateDistance: 600, maxCenterCoordinateDistance: 400_000 }}
      // Marges de la carte = ce que l'en-tête et le pied couvrent : Apple y range sa mention légale (« Plans »,
      // « Mentions légales »), juste au-dessus du pied, jamais dessous (MapKit y ajoute déjà les zones sûres).
      mapPadding={{ top: Math.max(0, insetTop - safeTop), bottom: Math.max(0, insetBottom - safeBottom), left: 0, right: 0 }}
      onTouchStart={() => {
        touched.current = true;
      }}
      onRegionChangeComplete={(r) => {
        if (free || !onRegionChange || !touched.current) return;
        onRegionChange({ lat: r.latitude, lng: r.longitude, radiusKm: Math.min(25, Math.max(0.5, (r.latitudeDelta * KM_PER_DEG) / 2)) });
      }}
    >
      <Circle center={center} radius={radiusKm * 1000} strokeColor={color.accent} strokeWidth={3} fillColor={alpha(color.accent, 0.06)} lineDashPattern={[2, 9]} />
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
          <MapSticker pet={p.pet} label={p.label} selected={p.selected} hot={p.hot} onPress={p.onPress} accessibilityLabel={p.accessibilityLabel} floatDelay={i * 230} />
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
