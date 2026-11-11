import type { UpdateMeBody } from '@blowy/contract';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { keys, useApi, usePorts } from '@/core';

export function useMe() {
  const api = useApi();
  return useQuery({ queryKey: keys.me, queryFn: api.me.get });
}

export function useUpdateMe() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateMeBody) => api.me.update(body),
    onSuccess: (me) => qc.setQueryData(keys.me, me),
  });
}

/** Choisit une photo, l'envoie, puis l'enregistre comme photo de profil. Rend false si la personne annule. */
export function useSetAvatar() {
  const api = useApi();
  const { media } = usePorts();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (source: 'camera' | 'library') => {
      const image = await media.pick(source);
      if (!image) return false;
      const ticket = await api.me.avatarTicket(image.contentType);
      await media.upload(ticket, image);
      qc.setQueryData(keys.me, await api.me.setAvatar(ticket.path));
      return true;
    },
  });
}

/** Supprime le compte et toutes ses données, puis ferme la session. */
export function useDeleteAccount() {
  const api = useApi();
  const { auth } = usePorts();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.me.remove();
      await auth.signOut();
    },
    onSuccess: () => qc.clear(),
  });
}
