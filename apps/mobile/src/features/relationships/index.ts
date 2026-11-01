/**
 * Feature relations : liste/détail, commandes emménager, consentements, vote secret, révélation,
 * départ propre, pause. Toutes ces commandes exigent le réseau (jamais en file).
 * Routes prévues (contrat C relationships.ts) ; contrôleur pas encore monté au 2026-11-01.
 */
import { MoveInResultSchema, RelationshipListSchema, RelationshipViewSchema } from '@blowy/api-contract';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { z } from 'zod';
import type { Http } from '../../core/api/http';
import { routes } from '../../core/api/routes';
import { useServices } from '../../core/providers/services';
import { useSession } from '../../core/session/session-store';

export function createRelationshipsRepository(http: Http) {
  const ack = z.unknown();
  return {
    list: () => http.request({ method: 'GET', path: routes.relationships.list }, RelationshipListSchema),
    one: (id: string) => http.request({ method: 'GET', path: routes.relationships.one(id) }, RelationshipViewSchema),
    moveIn: (cid: string, id: string) => http.request({ method: 'POST', path: routes.relationships.moveIn(id), commandId: cid }, MoveInResultSchema),
    respond: (cid: string, id: string, body: { offerId: string; decision: 'ACCEPT' | 'DECLINE'; version: number }) =>
      http.request({ method: 'POST', path: routes.relationships.respond(id), body, commandId: cid }, RelationshipViewSchema),
    ballot: (cid: string, id: string, choice: 'FRIEND' | 'PLUS') => http.request({ method: 'POST', path: routes.relationships.ballot(id), body: { choice }, commandId: cid }, RelationshipViewSchema),
    reveal: (cid: string, id: string) => http.request({ method: 'POST', path: routes.relationships.reveal(id), commandId: cid }, RelationshipViewSchema),
    leave: (cid: string, id: string, reason: 'CLEAN_LEAVE' | 'REPORT_SAFETY_EXIT') => http.request({ method: 'POST', path: routes.relationships.leave(id), body: { reason }, commandId: cid }, ack),
    pause: (cid: string, id: string, days: number) => http.request({ method: 'POST', path: routes.relationships.pause(id), body: { days }, commandId: cid }, ack),
  };
}

export const relationKeys = { list: ['relationships'] as const, one: (id: string) => ['relationships', id] as const };

function useRepo() {
  const { http } = useServices();
  return useMemo(() => createRelationshipsRepository(http), [http]);
}

export function useRelationships() {
  const repo = useRepo();
  const signedIn = useSession((s) => s.status === 'signedIn');
  return useQuery({ queryKey: relationKeys.list, queryFn: repo.list, enabled: signedIn });
}

export function useRelationship(id: string | null) {
  const repo = useRepo();
  return useQuery({ queryKey: relationKeys.one(id ?? ''), queryFn: () => repo.one(id!), enabled: !!id });
}

/** Commandes relationnelles : réseau requis, commandId par appel, invalidation de la liste. */
export function useRelationshipCommands(id: string) {
  const repo = useRepo();
  const { newCommandId } = useServices();
  const qc = useQueryClient();
  const done = () => void qc.invalidateQueries({ queryKey: relationKeys.list });
  return {
    moveIn: useMutation({ mutationFn: () => repo.moveIn(newCommandId(), id), onSuccess: done }),
    respond: useMutation({ mutationFn: (b: { offerId: string; decision: 'ACCEPT' | 'DECLINE'; version: number }) => repo.respond(newCommandId(), id, b), onSuccess: done }),
    ballot: useMutation({ mutationFn: (c: 'FRIEND' | 'PLUS') => repo.ballot(newCommandId(), id, c), onSuccess: done }),
    reveal: useMutation({ mutationFn: () => repo.reveal(newCommandId(), id), onSuccess: done }),
    leave: useMutation({ mutationFn: (r: 'CLEAN_LEAVE' | 'REPORT_SAFETY_EXIT') => repo.leave(newCommandId(), id, r), onSuccess: done }),
    pause: useMutation({ mutationFn: (days: number) => repo.pause(newCommandId(), id, days), onSuccess: done }),
  };
}

export { gateStates, linkProgress, type GateState } from './model/link';
