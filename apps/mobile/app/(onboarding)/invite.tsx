/** Invitations (V6-Invite) : partager son lien d'invitation et son lien « 3 mots ». */
import { Appear, Banner, InvitePanel, OnboardingTemplate, Skeleton, WordsShareCard } from '@blowy/ui';
import { router } from 'expo-router';

import { inviteUrl, ScreenMotion, wordsUrl } from '@/core';
import { displayUrl, useCopyShare, useMe } from '@/features/me';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';

const t = onboarding.invite;

export default function Invite() {
  const me = useMe();
  const invite = useCopyShare();
  const words = useCopyShare();
  const next = () => router.replace('/(onboarding)/paywall');

  const pet = me.data?.pet;
  const link = me.data ? inviteUrl(me.data.inviteCode) : '';
  const wordsLink = me.data ? wordsUrl(me.data.wordsCode) : '';

  return (
    <ScreenMotion>
    <OnboardingTemplate step={4} total={onboarding.total} primaryLabel={t.cta} onPrimary={next} secondaryLabel={t.later} onSecondary={next}>
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
        onShare={() => void invite.share(t.shareMessage(pet?.name ?? '', link), link)}
      />
      {me.data ? (
        <Appear key="words" delay={120}>
        <WordsShareCard
          title={t.wordsTitle}
          words={[]}
          emptyText={t.wordsEmpty(pet?.name ?? '')}
          url={displayUrl(wordsLink)}
          copyLabel={t.copy}
          copiedLabel={t.copied}
          copied={words.copied}
          shareLabel={t.wordsShare}
          onCopy={() => void words.copy(wordsLink)}
          onShare={() => void words.share(t.wordsMessage(wordsLink), wordsLink)}
        />
        </Appear>
      ) : me.isLoading ? (
        <Skeleton height={150} radius="lg" />
      ) : null}
    </OnboardingTemplate>
    </ScreenMotion>
  );
}
