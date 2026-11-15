/**
 * Compte suspendu par la modération (erreur `suspended` de l'API, au lancement ou n'importe quand) : le message de l'API
 * (jusqu'à quand, qui contacter), écrire à l'assistance, et le droit de supprimer son compte (la seule action que l'API
 * accepte encore). On peut aussi se déconnecter.
 */
import { ApiError } from '@blowy/api-client';
import { brand } from '@blowy/content';
import { Banner, Button, EmptyState, ScreenTemplate } from '@blowy/ui';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Linking, View } from 'react-native';

import { keys, ScreenMotion, useApi, useSession } from '@/core';
import { useDraft } from '@/features/onboarding';
import { useDeleteAccount } from '@/features/me';
import { confirmAction, useSignOut } from '@/features/session';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';

const t = onboarding.suspendu;

export default function Suspendu() {
  const api = useApi();
  const session = useSession();
  const species = useDraft((d) => d.species);
  const me = useQuery({ queryKey: keys.me, queryFn: api.me.get, enabled: !!session, retry: false });
  const remove = useDeleteAccount();
  const signOut = useSignOut();
  const message = me.error instanceof ApiError && me.error.code === 'suspended' ? me.error.message : t.fallback;
  const toWelcome = () => router.replace('/(onboarding)/welcome');

  const askDelete = () =>
    confirmAction({
      title: t.deleteTitle,
      message: t.deleteText,
      confirm: t.deleteConfirm,
      cancel: common.cancel,
      destructive: true,
      onConfirm: () => remove.mutate(undefined, { onSuccess: toWelcome }),
    });

  return (
    <ScreenMotion>
      <ScreenTemplate
        scroll={false}
        footer={
          <View style={{ gap: 8 }}>
            {remove.isError ? <Banner tone="error" text={t.deleteError} /> : null}
            <Button
              label={t.support}
              onPress={() => void Linking.openURL(`mailto:${brand.supportEmail}?subject=${encodeURIComponent(t.supportSubject)}`)}
            />
            <Button label={t.deleteLabel} variant="danger" onPress={askDelete} loading={remove.isPending} />
            <Button label={t.signOut} variant="ghost" onPress={() => signOut.mutate(undefined, { onSettled: toWelcome })} loading={signOut.isPending} />
          </View>
        }
      >
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState peek species={species} mood="triste" title={t.title} text={message} />
        </View>
      </ScreenTemplate>
    </ScreenMotion>
  );
}
