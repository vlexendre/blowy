/** Lien d'invitation (blowy://i/CODE, https://blowy.app/i/CODE) : voir qui t'invite et accepter. */
import { ApiError } from '@blowy/api-client';
import { space } from '@blowy/tokens';
import { Banner, Button, EmptyState, Header, InvitationPanel, ScreenTemplate, Skeleton, Stack, usePetBump } from '@blowy/ui';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { ScreenMotion } from '@/core';
import { useAcceptInvite, useInvite, usePendingInvite } from '@/features/encounters';
import { useMe } from '@/features/me';
import { useDraft } from '@/features/onboarding';
import { usePet } from '@/features/pet';
import { errorMessage, goBack, useGate } from '@/features/session';
import { common } from '@/locales/common';
import { invitation as copy } from '@/locales/rencontres';

const t = common.invite;
const home = () => router.replace('/(tabs)/pet');

export default function InviteLink() {
  const params = useLocalSearchParams<{ code: string }>();
  const code = (params.code ?? '').trim().toUpperCase();
  const gate = useGate();
  const setPending = usePendingInvite((p) => p.set);
  const draftPet = useDraft((d) => d.petName.trim());
  const ready = gate === 'ready';
  const invite = useInvite(ready && code ? code : null);
  const accept = useAcceptInvite();
  const mine = usePet().data?.pet;
  const bump = usePetBump();
  const myCode = useMe(ready).data?.inviteCode;

  // Pas encore de compte complet : on garde le code, l'inscription le reprendra.
  useEffect(() => {
    if (!code) return;
    if (gate === 'signedOut' || gate === 'needsOnboarding') setPending(code);
    else if (gate === 'ready') setPending(null);
  }, [gate, code, setPending]);

  if (!code) return <Redirect href="/" />;
  if (gate === 'signedOut') return <Redirect href="/(onboarding)/welcome" />;
  if (gate === 'needsOnboarding') return <Redirect href={draftPet ? '/(onboarding)/profil' : '/(onboarding)/craft'} />;

  const header = <Header onBack={() => goBack('/')} backGlyph="close" backLabel={common.close} />;
  const notFound = invite.error instanceof ApiError && invite.error.code === 'not_found';
  // Son propre lien : on le dit tout de suite, sans attendre le refus de l'API.
  const own = myCode === code || (accept.error instanceof ApiError && accept.error.code === 'conflict');

  if (notFound || own) {
    return (
      <ScreenMotion>
      <ScreenTemplate header={header} scroll={false}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState peek mood={own ? 'smug' : 'triste'} title={own ? t.ownTitle : t.notFoundTitle} text={own ? t.ownText : t.notFoundText} actionLabel={t.home} onAction={home} />
        </View>
      </ScreenTemplate>
      </ScreenMotion>
    );
  }

  if (!invite.data) {
    return (
      <ScreenMotion>
      <ScreenTemplate header={header}>
        {invite.isError || gate === 'offline' ? (
          <Banner tone="error" title={common.errorTitle} text={invite.isError ? errorMessage(invite.error) : common.offlineText} actionLabel={common.retry} onAction={() => void invite.refetch()} />
        ) : (
          <View style={{ gap: space.lg }} accessibilityLabel={common.loading}>
            <Skeleton height={380} radius="xl" />
            <Skeleton height={56} radius="pill" />
          </View>
        )}
      </ScreenTemplate>
      </ScreenMotion>
    );
  }

  const inv = invite.data;
  return (
    <ScreenMotion>
    <ScreenTemplate
      footer={
        <>
          <Button
            label={copy.accept}
            loading={accept.isPending}
            onPress={() =>
              accept.mutate(code, {
                onSuccess: (link) => {
                  router.replace({ pathname: '/link/[id]', params: { id: link.id } });
                  // Les deux pets de l'invitation se courent dessus pendant que le lien s'ouvre.
                  if (mine) bump({ left: mine.species, right: inv.pet.species });
                },
              })
            }
          />
          <Button label={copy.later} variant="ghost" onPress={home} />
        </>
      }
    >
      <Stack top={12} gap={12} grow>
        <InvitationPanel
          kicker={copy.kicker}
          title={copy.title(inv.displayName, inv.pet.name)}
          theirs={inv.pet.species}
          theirsOutfit={inv.pet.outfit}
          mine={mine?.species}
          mineOutfit={mine?.outfit}
          note={{ before: copy.note, bold: copy.noteBold, after: copy.noteEnd }}
          accessibilityLabel={mine ? copy.a11y(inv.pet.name, mine.name) : inv.pet.name}
        />
        {accept.isError && !own ? (
          <Banner
            tone="error"
            text={accept.error instanceof ApiError && accept.error.code === 'forbidden' ? t.blocked : errorMessage(accept.error)}
            actionLabel={common.retry}
            onAction={() => accept.reset()}
          />
        ) : null}
      </Stack>
    </ScreenTemplate>
    </ScreenMotion>
  );
}
