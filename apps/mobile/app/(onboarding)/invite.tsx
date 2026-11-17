/**
 * Invitations (V6-Invite), ouvertes depuis l'accueil (plus dans l'inscription) : partager son lien d'invitation (le lien
 * « 3 mots » est dans l'onglet Moi). « Partager en story » envoie une image (`StoryCard`, capturée hors de l'écran) dans
 * l'éditeur de story d'Instagram.
 */
import { Appear, Banner, InvitePanel, OnboardingTemplate, StoryCard } from '@blowy/ui';
import { router } from 'expo-router';

import { inviteUrl, ScreenMotion } from '@/core';
import { displayUrl, useMe, useStoryShare } from '@/features/me';
import { useTrackShare } from '@/features/growth';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';

const t = onboarding.invite;

export default function Invite() {
  const me = useMe();
  const invite = useStoryShare();
  const track = useTrackShare();
  const next = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/pet'));

  const pet = me.data?.pet;
  const link = me.data ? inviteUrl(me.data.inviteCode) : '';

  return (
    <ScreenMotion>
    <OnboardingTemplate centerBody onBack={next} backLabel={common.back} primaryLabel={t.cta} onPrimary={next}>
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
        onShare={() => {
          track('invite');
          void invite.share(t.shareMessage(pet?.name ?? '', link), link);
        }}
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
