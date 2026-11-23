/**
 * La carte de l'onglet Quartier (reprise de l'ancien onglet Carte) : chargement par zone, épingles qui restent posées,
 * zone gardée quand Minimoa+ regarde ailleurs, « Recentrer ».
 */
import type { MapPin, Me } from '@blowy/contract';
import { useEffect, useRef, useState } from 'react';

import { type MapAt, useMap } from '@/features/map';

/** Distance à vol d'oiseau, en km (assez précis pour savoir si un cercle en contient un autre). */
function kmBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const k = 111.32;
  const dx = (b.lng - a.lng) * k * Math.cos((((a.lat + b.lat) / 2) * Math.PI) / 180);
  const dy = (b.lat - a.lat) * k;
  return Math.sqrt(dx * dx + dy * dy);
}

type Center = { latitude: number; longitude: number };

export function useQuartierMap(me: Me | undefined) {
  const [at, setAt] = useState<MapAt | null>(null);
  const map = useMap(at);
  // « Recentrer » : la caméra revient sur la zone (elle y revient aussi seule quand la zone change).
  const [focus, setFocus] = useState(0);
  // Ta zone (ou la ville choisie) : le cercle et le calage de la caméra, gardés quand Minimoa+ regarde ailleurs.
  const [home, setHome] = useState<{ center: Center; radiusKm: number } | null>(null);

  // Minimoa+ : la carte a bougé → on relit ce qu'il y a là (après un court repos du doigt).
  const pan = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (pan.current) clearTimeout(pan.current);
    },
    [],
  );
  // Ce qui est déjà chargé (cercles lus) : glisser ou zoomer dedans ne relit rien (pas de saut des épingles).
  const loaded = useRef<{ lat: number; lng: number; radiusKm: number }[]>([]);
  const onRegionChange = (next: MapAt) => {
    if (pan.current) clearTimeout(pan.current);
    const r = next.radiusKm ?? 0;
    if (loaded.current.some((c) => kmBetween(c, next) + r <= c.radiusKm * 1.05)) return;
    pan.current = setTimeout(() => setAt(next), 450);
  };

  const data = map.data;
  // Les épingles restent posées : chaque lecture ajoute ce qu'elle trouve ; dans le cercle relu, ce qui n'y est plus
  // (mode discret, blocage) disparaît, ailleurs rien ne bouge.
  const [kept, setKept] = useState<MapPin[]>([]);
  useEffect(() => {
    if (!data?.center || data.status !== 'ok') return;
    const circle = { lat: data.center.latitude, lng: data.center.longitude, radiusKm: data.radiusKm };
    loaded.current = [...loaded.current.slice(-11), circle];
    setKept((prev) => {
      const fresh = new Map(data.pins.map((x) => [x.user.id, x]));
      const stay = prev.filter((x) => !fresh.has(x.user.id) && kmBetween(circle, { lat: x.position.latitude, lng: x.position.longitude }) > circle.radiusKm);
      return [...stay, ...data.pins];
    });
  }, [data]);
  // Changement de zone (ville choisie, retour chez soi, mode discret) : on repart de zéro.
  const zoneKey = `${me?.identity.location.chosenCityActive ?? ''}|${me?.identity.location.chosenCity?.label ?? ''}|${me?.identity.discreet ?? ''}`;
  const lastZone = useRef(zoneKey);
  useEffect(() => {
    if (lastZone.current === zoneKey) return;
    lastZone.current = zoneKey;
    loaded.current = [];
    setKept([]);
  }, [zoneKey]);
  const homeCenter = !at && data?.center ? data.center : null;
  const homeRadius = data?.radiusKm ?? 0;
  useEffect(() => {
    if (homeCenter) setHome({ center: homeCenter, radiusKm: homeRadius });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeCenter?.latitude, homeCenter?.longitude, homeRadius]);

  // La zone (cercle, caméra) : celle qu'on vient de lire, ou celle gardée quand Minimoa+ regarde ailleurs.
  const zone = data?.center ? (!at || !home ? { center: data.center, radiusKm: data.radiusKm } : home) : null;
  const pins = kept.length > 0 ? kept : (data?.pins ?? []);
  const recenter = () => {
    setAt(null);
    setFocus((f) => f + 1);
  };
  return { map, at, zone, pins, focus, recenter, onRegionChange };
}
