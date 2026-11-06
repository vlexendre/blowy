/**
 * Hooks pets : lecture de mon pet, création (fin d'onboarding), actions avec état
 * pending → confirmé/corrigé, file hors ligne pour les soins (FEED/HEAL).
 */
import type { CreatePrimaryPetRequest, PetActionResult } from '@blowy/api-contract';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { isNetworkError } from '../../../core/api/errors';
import { reduceOptimistic, type OptimisticState } from '../../../core/offline/optimistic';
import { onSettled, registerSender } from '../../../core/offline/runner';
import { useOfflineQueue } from '../../../core/offline/store';
import { useNetwork } from '../../../core/network/network';
import { useServices } from '../../../core/providers/services';
import { useSession } from '../../../core/session/session-store';
import { QUEUEABLE_ACTIONS, actionKey, wasCorrected, type PetActionKind } from '../model/actions';
import { createPetsRepository } from './pets.repository';

export const petKeys = { mine: ['pets', 'mine'] as const };

export function usePetsRepository() {
  const { api } = useServices();
  return useMemo(() => createPetsRepository(api), [api]);
}

export function useMyPet() {
  const repo = usePetsRepository();
  const signedIn = useSession((s) => s.status === 'signedIn');
  return useQuery({ queryKey: petKeys.mine, queryFn: repo.mine, enabled: signedIn, retry: false });
}

export function useCreatePet() {
  const repo = usePetsRepository();
  const { newCommandId } = useServices();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePrimaryPetRequest) => repo.create(newCommandId(), body),
    onSuccess: (pet) => qc.setQueryData(petKeys.mine, pet),
  });
}

/**
 * Déplacement du pet vers le lieu d'un rendez-vous (commande serveur dédupliquée) : « Nino va
 * retrouver Suzie ». Réseau requis ; le pet ne part jamais seul hors ligne.
 */
export function useMovePet() {
  const repo = usePetsRepository();
  const { newCommandId } = useServices();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ petId, relationshipId }: { petId: string; relationshipId: string | null }) =>
      repo.move(newCommandId(), petId, relationshipId ? { destination: 'DATE_SPOT', relationshipId } : { destination: 'HOME' }),
    onSuccess: (pet) => {
      qc.setQueryData(petKeys.mine, pet);
      void qc.invalidateQueries({ queryKey: ['relationships'] });
    },
  });
}

/** Enregistre l'envoi des actions de pet mises en file (monté une fois dans le provider racine). */
export function usePetActionSender() {
  const repo = usePetsRepository();
  const qc = useQueryClient();
  useEffect(
    () =>
      registerSender('PET_ACTION', async (cmd) => {
        const p = cmd.payload as { petId: string; action: PetActionKind; relationshipId?: string };
        const r = await repo.act(cmd.commandId, p.petId, { action: p.action, relationshipId: p.relationshipId });
        qc.setQueryData(petKeys.mine, r.pet);
        return { corrected: wasCorrected(r) };
      }),
    [repo, qc],
  );
}

/**
 * Actions du Nid : chaque appel crée un commandId ; en ligne → envoi direct (pending puis
 * confirmé/corrigé) ; hors ligne → file pour FEED/HEAL uniquement (état « en file »).
 */
export function usePetActions(petId: string | null, relationshipId: string | null) {
  const repo = usePetsRepository();
  const { newCommandId, haptics } = useServices();
  const online = useNetwork((s) => s.online);
  const dispatchQueue = useOfflineQueue((s) => s.dispatch);
  const qc = useQueryClient();
  const [state, dispatch] = useReducer(reduceOptimistic<PetActionResult>, {} as OptimisticState<PetActionResult>);

  useEffect(
    () =>
      onSettled((cmd, ok) => {
        if (cmd.kind !== 'PET_ACTION') return;
        const p = cmd.payload as { action: PetActionKind; relationshipId?: string };
        const key = actionKey(p.action, p.relationshipId ?? null);
        if (!ok) dispatch({ type: 'fail', key, commandId: cmd.commandId, error: 'REJECTED' });
        else void qc.invalidateQueries({ queryKey: petKeys.mine });
      }),
    [qc],
  );

  const run = useCallback(
    async (action: PetActionKind) => {
      if (!petId) return;
      const commandId = newCommandId();
      const key = actionKey(action, relationshipId);
      dispatch({ type: 'start', key, commandId, now: Date.now() });
      haptics.tap();
      const enqueue = () => {
        dispatchQueue({ type: 'enqueue', command: { commandId, kind: 'PET_ACTION', payload: { petId, action, relationshipId: relationshipId ?? undefined }, scope: relationshipId ?? petId, createdAt: Date.now() } });
        dispatch({ type: 'queued', key });
      };
      if (!online && QUEUEABLE_ACTIONS.includes(action)) return enqueue();
      try {
        const r = await repo.act(commandId, petId, { action, relationshipId: relationshipId ?? undefined });
        qc.setQueryData(petKeys.mine, r.pet);
        dispatch({ type: 'settle', key, commandId, result: r, corrected: wasCorrected(r) });
        if (!wasCorrected(r)) haptics.success();
      } catch (e) {
        if (isNetworkError(e) && QUEUEABLE_ACTIONS.includes(action)) return enqueue();
        dispatch({ type: 'fail', key, commandId, error: e instanceof Error ? e.message : 'ERROR' });
      }
    },
    [petId, relationshipId, newCommandId, haptics, online, repo, qc, dispatchQueue],
  );

  return { run, state, keyOf: (a: PetActionKind) => actionKey(a, relationshipId) };
}
