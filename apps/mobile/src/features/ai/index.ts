/**
 * IA tierce (App Review 5.1.2(i), audit B5) : le prestataire nommé par l'API et l'accord pour la vérification des
 * preuves d'habitude. La lecture des chats a ses accords par lien (`@/features/links`, écran Moi › Minimoas).
 */
import type { AiConsents } from '@blowy/contract';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { optimistic, patch, rollback, useApi } from '@/core';

export const aiKeys = { consents: ['me', 'ai'] as const };

/** Prestataire (nom, pays) et accords. `proofs.consent` null : la question n'a jamais été posée. */
export function useAiConsents(enabled = true) {
  const api = useApi();
  return useQuery({ queryKey: aiKeys.consents, queryFn: api.me.ai, enabled, staleTime: 60_000 });
}

/** Accepter, refuser ou retirer la vérification des preuves par l'IA. */
export function useSetAiProofs() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (consent: boolean) => api.me.setAiProofs(consent),
    // Le choix s'affiche à l'appui (l'API horodate l'accord) ; refusé : il revient.
    onMutate: (consent) => optimistic(qc, [patch<AiConsents>(aiKeys.consents, (c) => ({ ...c, proofs: { ...c.proofs, consent } }))]),
    onError: (_e, _c, snap) => rollback(qc, snap),
    onSuccess: (r: AiConsents) => qc.setQueryData(aiKeys.consents, r),
  });
}
