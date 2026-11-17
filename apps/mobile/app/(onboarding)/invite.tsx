/**
 * Invitations (V6-Invite) : partager son lien d'invitation (le lien « 3 mots » est dans l'onglet Moi). « Partager en
 * story » envoie une image (`StoryCard`, capturée hors de l'écran) dans l'éditeur de story d'Instagram.
 */
import { Appear, Banner, InvitePanel, OnboardingTemplate, StoryCard } from '@blowy/ui';
import { router } from 'expo-router';

import { inviteUrl, ScreenMotion } from '@/core';
import { displayUrl, useMe, useStoryShare } from '@/features/me';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';

const t = onboarding.invite;

export default function Invite() {
  const me = useMe();
  const invite = useStoryShare();
  // Minimoa+ monte en feuille par-dessus cet écran ; la fermer (croix, glisser, « continuer ») mène à l'app.
  const next = () => router.push('/(onboarding)/paywall');

  const pet = me.data?.pet;
  const link = me.data ? inviteUrl(me.data.inviteCode) : '';

  return (
    <ScreenMotion>
    <OnboardingTemplate centerBody primaryLabel={t.cta} onPrimary={next}>
      {me.isError ? (
        <Appear key="error">
          <Banner tone="error" title={common.errorTitle} text={common.genericError} actionLabel={common.retry} onAction={() => void me.refetch()} />
        </Appear>
      ) : null}
      <InvitePanel
        title={t.title}
        text={t.text}
        pet={pet ? { name: pet.name, species: pet.species } : undefined}
        url={me.data ? displayUrl(link) : undefined}
        copyLabel={t.copy}
        copied={invite.copied}
        copiedLabel={t.copied}
        onCopy={() => void invite.copy(link)}
        shareLabel={t.share}
        sharing={invite.busy}
        onShare={() => void invite.share(t.shareMessage(pet?.name ?? '', link), link)}
      />
      {pet && me.data ? (
        <StoryCard
          ref={invite.card}
          offscreen
          brand={onboarding.welcome.brand}
          title={t.story.title}
          line={t.story.line(pet.name)}
          pet={{ name: pet.name, species: pet.species }}
          callout={t.story.callout}
          url={displayUrl(link)}
        />
      ) : null}
    </OnboardingTemplate>
    </ScreenMotion>
  );
}
