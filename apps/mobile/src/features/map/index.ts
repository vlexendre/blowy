/**
 * La carte (spéc §10) et la position : ce que le serveur montre (zone, minimoas compatibles, silhouettes au-delà),
 * l'accord de localisation, le mode discret et la ville choisie (Blowy+).
 * Une position n'est jamais exacte ni en temps réel : le serveur l'arrondit (~300 m) et la décale.
 */
import type { ChosenCity, Me } from '@blowy/contract';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { keys, useApi } from '@/core';

import { askLocationPermission, currentPosition, type LocationPermission, openAppSettings, readLocationPermission } from './location';

export { openAppSettings } from './location';
export type { LocationPermission } from './location';
export { CITIES, type City } from './cities';

export const mapKey = ['map'] as const;

/** Où regarder (Blowy+ : ailleurs que sa zone). Sans valeur : sa zone. */
export interface MapAt {
  lat: number;
  lng: number;
  radiusKm?: number;
}

export function useMap(at?: MapAt | null) {
  const api = useApi();
  return useQuery({
    queryKey: [...mapKey, at ? `${at.lat.toFixed(3)},${at.lng.toFixed(3)},${at.radiusKm ?? ''}` : 'zone'],
    queryFn: () => api.vision.map(at ?? undefined),
    placeholderData: (prev) => prev,
  });
}

/** Ce qui dépend de la position : relu après chaque changement (carte, rencontres proches, profil). */
function useInvalidatePlace() {
  const qc = useQueryClient();
  return useCallback(() => {
    void qc.invalidateQueries({ queryKey: mapKey });
    void qc.invalidateQueries({ queryKey: keys.encounters });
    void qc.invalidateQueries({ queryKey: keys.me });
  }, [qc]);
}

/**
 * Accord de localisation du téléphone et de Blowy, et relevé de la position.
 * - `permission` : l'accord du téléphone (relu au retour dans l'app, après un passage par les Réglages) ;
 * - `enable()` : demande l'accord si besoin, relève la position et l'envoie (`consent: true` la première fois) ;
 * - `refresh()` : nouveau relevé, sans rien demander (app ouverte, accord déjà donné).
 */
export function useLocation(me: Me | undefined) {
  const api = useApi();
  const qc = useQueryClient();
  const invalidate = useInvalidatePlace();
  const [permission, setPermission] = useState<LocationPermission | null>(null);
  const read = useCallback(() => void readLocationPermission().then(setPermission), []);
  useEffect(() => {
    read();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') read();
    });
    return () => sub.remove();
  }, [read]);

  const consented = !!me?.identity.location.consentAt;
  const send = useMutation({
    mutationFn: async (opts: { ask: boolean }): Promise<'ok' | 'denied' | 'unavailable'> => {
      let p = await readLocationPermission();
      if (p.status !== 'granted' && opts.ask && p.canAskAgain) p = await askLocationPermission();
      setPermission(p);
      if (p.status !== 'granted') return 'denied';
      const point = await currentPosition();
      if (!point) return 'unavailable';
      const status = await api.vision.locate(point, consented ? undefined : true);
      qc.setQueryData<Me>(keys.me, (m) => (m ? { ...m, identity: { ...m.identity, location: status } } : m));
      invalidate();
      return 'ok';
    },
  });
  const forget = useMutation({
    mutationFn: () => api.vision.forgetLocation(),
    onSuccess: (status) => {
      qc.setQueryData<Me>(keys.me, (m) => (m ? { ...m, identity: { ...m.identity, location: status } } : m));
      invalidate();
    },
  });
  return {
    permission,
    consented,
    enable: () => send.mutateAsync({ ask: true }),
    refresh: () => send.mutate({ ask: false }),
    sending: send.isPending,
    result: send.data ?? null,
    error: send.error,
    forget,
    openSettings: openAppSettings,
  };
}

/**
 * Relevé discret à l'ouverture d'un écran qui en a besoin (carte, rencontres) : seulement si la personne a déjà
 * donné son accord, à Blowy et au téléphone. Au plus une fois toutes les 10 minutes.
 */
let lastFix = 0;
export function useFreshPosition(me: Me | undefined) {
  const loc = useLocation(me);
  const { consented, permission, refresh } = loc;
  useEffect(() => {
    if (!consented || permission?.status !== 'granted') return;
    if (Date.now() - lastFix < 10 * 60_000) return;
    lastFix = Date.now();
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consented, permission?.status]);
  return loc;
}

/** Mode discret : tu n'apparais sur la carte de personne (tu restes proposé en rencontre). */
export function useDiscreet() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (discreet: boolean) => api.me.update({ discreet }),
    onMutate: (discreet) => {
      const before = qc.getQueryData<Me>(keys.me);
      if (before) qc.setQueryData<Me>(keys.me, { ...before, identity: { ...before.identity, discreet } });
      return { before };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.before) qc.setQueryData(keys.me, ctx.before);
    },
    onSuccess: (me) => {
      qc.setQueryData(keys.me, me);
      void qc.invalidateQueries({ queryKey: mapKey });
    },
  });
}

/** Blowy+ : changer de ville sans bouger, ou revenir à sa zone. */
export function useCity() {
  const api = useApi();
  const qc = useQueryClient();
  const invalidate = useInvalidatePlace();
  const apply = (status: Awaited<ReturnType<typeof api.vision.clearCity>>) => {
    qc.setQueryData<Me>(keys.me, (m) => (m ? { ...m, identity: { ...m.identity, location: status } } : m));
    invalidate();
  };
  const choose = useMutation({ mutationFn: (city: ChosenCity) => api.vision.chooseCity(city), onSuccess: apply });
  const clear = useMutation({ mutationFn: () => api.vision.clearCity(), onSuccess: apply });
  return { choose, clear };
}
