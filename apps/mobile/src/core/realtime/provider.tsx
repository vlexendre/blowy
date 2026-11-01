/**
 * Provider temps réel : un seul client socket par session ; les écrans s'abonnent aux rooms
 * via `useRealtimeRoom(room, onEvents)`. Révocation (blocage/départ) → callback onRevoked.
 */
import type { WsEnvelope } from '@blowy/api-contract';
import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { create } from 'zustand';
import { env } from '../config/env';
import { currentToken, useSession } from '../session/session-store';
import { RealtimeClient, type RealtimeStatus } from './socket';

type Listener = (events: WsEnvelope[]) => void;

export const useRealtimeStatus = create<{ status: RealtimeStatus; revoked: string[] }>(() => ({ status: 'idle', revoked: [] }));

interface Ctx {
  subscribe(room: string, l: Listener): () => void;
}
const RealtimeContext = createContext<Ctx | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const token = useSession((s) => s.token);
  const listeners = useRef(new Map<string, Set<Listener>>());
  const client = useMemo(
    () =>
      new RealtimeClient({
        url: env.wsUrl,
        getToken: currentToken,
        onEvents: (room, events) => listeners.current.get(room)?.forEach((l) => l(events)),
        onRevoked: (room) => useRealtimeStatus.setState((s) => ({ revoked: [...s.revoked, room] })),
        onStatus: (status) => useRealtimeStatus.setState({ status }),
      }),
    [],
  );

  useEffect(() => {
    if (!token) return;
    void client.start();
    return () => client.stop();
  }, [client, token]);

  const ctx = useMemo<Ctx>(
    () => ({
      subscribe(room, l) {
        let set = listeners.current.get(room);
        if (!set) {
          set = new Set();
          listeners.current.set(room, set);
          client.join(room);
        }
        set.add(l);
        return () => {
          set!.delete(l);
          if (set!.size === 0) {
            listeners.current.delete(room);
            client.leave(room);
          }
        };
      },
    }),
    [client],
  );
  return <RealtimeContext.Provider value={ctx}>{children}</RealtimeContext.Provider>;
}

export function useRealtimeRoom(room: string | null, onEvents: Listener): void {
  const ctx = useContext(RealtimeContext);
  const cb = useRef(onEvents);
  cb.current = onEvents;
  useEffect(() => {
    if (!ctx || !room) return;
    return ctx.subscribe(room, (e) => cb.current(e));
  }, [ctx, room]);
}
