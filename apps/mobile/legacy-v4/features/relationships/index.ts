/**
 * Feature relations : liste/détail, commandes emménager, consentements, vote secret, révélation,
 * départ propre, pause. Toutes ces commandes exigent le réseau (jamais en file).
 * Routes et DTO : BlowyClient (agent C). La révélation photo est une offre de consentement
 * PHOTO_REVEAL acceptée via /consents/respond (pas de route dédiée).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { createRelationshipsRepository } from './api/relationships.repository';
import { useServices } from '../../core/providers/services';
import { useSession } from '../../core/session/session-store';

export const relationKeys = { list: ['relationships'] as const, one: (id: string) => ['relationships', id] as const };

function useRepo() {
  const { api } = useServices();
  return useMemo(() => createRelationshipsRepository(api), [api]);
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
    downgrade: useMutation({ mutationFn: () => repo.downgrade(newCommandId(), id), onSuccess: done }),
    leave: useMutation({ mutationFn: (r: 'CLEAN_LEAVE' | 'REPORT_SAFETY_EXIT') => repo.leave(newCommandId(), id, r), onSuccess: done }),
    pause: useMutation({ mutationFn: (days: number) => repo.pause(newCommandId(), id, days), onSuccess: done }),
  };
}

export { createRelationshipsRepository } from './api/relationships.repository';
export { gateStates, linkProgress, type GateState } from './model/link';
