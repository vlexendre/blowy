/** Lien d'invitation (blowy://i/CODE, https://blowy.app/i/CODE) : voir qui t'invite et accepter. */
import { ApiError } from '@blowy/api-client';
import { speciesGradient, space } from '@blowy/tokens';
import { Banner, Button, EmptyState, Header, Panel, PetImage, ScreenTemplate, Skeleton, SpeechBubble, Text, Title } from '@blowy/ui';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { useAcceptInvite, useInvite, usePendingInvite } from '@/features/encounters';
import { useDraft } from '@/features/onboarding';
import { errorMessage, goBack, useGate } from '@/features/session';
import { common } from '@/locales/common';

const t = common.invite;
const home = () => router.replace('/(tabs)/chats');

export default function InviteLink() {
  const params = useLocalSearchParams<{ code: string }>();
  const code = (params.code ?? '').trim().toUpperCase();
  const gate = useGate();
  const setPending = usePendingInvite((p) => p.set);
  const draftPet = useDraft((d) => d.petName.trim());
  const ready = gate === 'ready';
  const invite = useInvite(ready && code ? code : null);
  const accept = useAcceptInvite();

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
  const own = accept.error instanceof ApiError && accept.error.code === 'conflict';

  if (notFound || own) {
    return (
      <ScreenTemplate header={header} scroll={false}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState mood={own ? 'smug' : 'triste'} title={own ? t.ownTitle : t.notFoundTitle} text={own ? t.ownText : t.notFoundText} actionLabel={t.home} onAction={home} />
        </View>
      </ScreenTemplate>
    );
  }

  if (!invite.data) {
    return (
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
    );
  }

  const inv = invite.data;
  return (
    <ScreenTemplate
      header={header}
      footer={
        <>
          <Button
            label={t.accept}
            iconRight="arrow"
            loading={accept.isPending}
            onPress={() => accept.mutate(code, { onSuccess: (link) => router.replace({ pathname: '/link/[id]', params: { id: link.id } }) })}
          />
          <Button label={t.later} variant="ghost" onPress={home} />
        </>
      }
    >
      <View style={{ gap: space.lg }}>
        <Panel gradient={speciesGradient[inv.pet.species]} padding="lg" style={{ minHeight: 400 }}>
          <Text variant="label" dim>
            {t.kicker}
          </Text>
          <Title text={t.title(inv.displayName, inv.pet.name)} size={48} />
          <View style={{ flexGrow: 1, minHeight: space.lg }} />
          <View style={{ maxWidth: '60%', zIndex: 1 }}>
            <SpeechBubble text={t.speech(inv.pet.name)} highlight={inv.pet.name.toLowerCase()} />
          </View>
          <View pointerEvents="none" style={{ position: 'absolute', right: -30, bottom: -40 }}>
            <PetImage species={inv.pet.species} mood="salut" size={200} outline animation="breathe" accessibilityLabel={inv.pet.name} />
          </View>
        </Panel>
        <Text muted>{t.text(inv.pet.name)}</Text>
        <Text variant="small" muted>
          {t.already}
        </Text>
        {accept.isError && !own ? (
          <Banner
            tone="error"
            text={accept.error instanceof ApiError && accept.error.code === 'forbidden' ? t.blocked : errorMessage(accept.error)}
            actionLabel={common.retry}
            onAction={() => accept.reset()}
          />
        ) : null}
      </View>
    </ScreenTemplate>
  );
}
