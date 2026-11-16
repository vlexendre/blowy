/** Invitations (V6-Invite) : partager son lien d'invitation (le lien « 3 mots » est dans l'onglet Moi). */
import { Appear, Banner, InvitePanel, OnboardingTemplate } from '@blowy/ui';
import { router } from 'expo-router';

import { inviteUrl, ScreenMotion } from '@/core';
import { displayUrl, useCopyShare, useMe } from '@/features/me';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';

const t = onboarding.invite;

export default function Invite() {
  const me = useMe();
  const invite = useCopyShare();
  // Blowy+ monte en feuille par-dessus cet écran ; la fermer (croix, glisser, « continuer ») mène à l'app.
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
        onShare={() => void invite.share(t.shareMessage(pet?.name ?? '', link), link)}
      />
    </OnboardingTemplate>
    </ScreenMotion>
  );
}
