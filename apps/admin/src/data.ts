import { ApiError, type AdminClient, createAdminClient } from '@blowy/api-client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { config } from './config';

export const ApiContext = createContext<AdminClient | null>(null);

export const makeClient = (getToken: () => Promise<string | null>): AdminClient => createAdminClient({ baseUrl: config.apiUrl, getToken });

export function useApi(): AdminClient {
  const api = useContext(ApiContext);
  if (!api) throw new Error('client d’administration absent');
  return api;
}

export interface Load<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

export const errorText = (err: unknown): string =>
  err instanceof ApiError ? err.message : err instanceof Error ? 'Réponse inattendue de l’API.' : 'Une erreur est survenue.';

/** Charge une ressource ; recharge quand `key` change. */
export function useLoad<T>(fn: (api: AdminClient) => Promise<T>, key: string): Load<T> {
  const api = useApi();
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({ data: null, error: null, loading: true });
  const [nonce, setNonce] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fnRef
      .current(api)
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((err: unknown) => alive && setState({ data: null, error: errorText(err), loading: false }));
    return () => {
      alive = false;
    };
  }, [api, key, nonce]);
  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}

/** Valeur retardée (recherche) : évite une requête par frappe. */
export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
