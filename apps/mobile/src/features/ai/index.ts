/**
 * IA tierce (App Review 5.1.2(i), audit B5) : le prestataire nommé par l'API et son pays. La lecture des chats a ses accords par lien (`@/features/links`, écran Moi › Minimoas).
 */
import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/core';

export const aiKeys = { consents: ['me', 'ai'] as const };

/** Prestataire (nom, pays) et accords. */
export function useAiConsents(enabled = true) {
  const api = useApi();
  return useQuery({ queryKey: aiKeys.consents, queryFn: api.me.ai, enabled, staleTime: 60_000 });
}
