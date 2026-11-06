import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useServices } from '../../../core/providers/services';
import { useSession } from '../../../core/session/session-store';
import type { ShareCardKind } from '../model/cards';
import { createShareRepository } from './share.repository';

/** Lien de la carte (null tant que la route n'existe pas : « lien indisponible »). */
export function useShareLink(card: ShareCardKind | null) {
  const { api, newCommandId } = useServices();
  const repo = useMemo(() => createShareRepository(api), [api]);
  return useQuery({
    queryKey: ['share-link', card],
    queryFn: () =>
      card && card !== 'invitation' ? repo.link(card, newCommandId()).catch(() => null) : null,
    enabled: !!card && useSession((s) => s.status === 'signedIn'),
    staleTime: Infinity,
    retry: false,
  });
}

/** Aperçu public d'une invitation reçue (sans compte) ; erreur → texte générique. */
export function useInvitePreview(ref: string | undefined) {
  const { api } = useServices();
  const repo = useMemo(() => createShareRepository(api), [api]);
  return useQuery({
    queryKey: ['invite-preview', ref],
    queryFn: () => repo.invitePreview(ref!),
    enabled: !!ref,
    retry: false,
    staleTime: Infinity,
  });
}
