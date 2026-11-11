/** Invitations (V6-Invite) : partager son lien d'invitation et son lien « 3 mots ». */
import { space } from '@blowy/tokens';
import { Banner, Button, Chip, OnboardingTemplate, Panel, PetImage, Skeleton, Text, Title, WordsShareCard } from '@blowy/ui';
import { router } from 'expo-router';
import { View } from 'react-native';

import { inviteUrl, wordsUrl } from '@/core';
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
    <OnboardingTemplate step={5} total={onboarding.total} primaryLabel={t.cta} onPrimary={next} secondaryLabel={t.later} onSecondary={next}>
      {me.isError ? <Banner tone="error" title={common.errorTitle} text={common.genericError} actionLabel={common.retry} onAction={() => void me.refetch()} /> : null}
      <Panel gradient="violet" padding="lg">
        <View pointerEvents="none" style={{ position: 'absolute', right: -34, top: 96 }}>
          {pet ? <PetImage species={pet.species} mood="salut" size={150} animation="bob" outline accessibilityLabel={pet.name} /> : null}
        </View>
        <Title text={t.title} size={56} />
        <Text variant="bodyBold" size={15} style={{ marginTop: space.sm, maxWidth: '68%' }}>
          {t.text}
        </Text>
        <View style={{ marginTop: space.lg, gap: space.sm }}>
          {me.data ? (
            <>
              <Chip label={displayUrl(link)} tone="light" size="lg" accessibilityLabel={link} />
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <Button label={invite.copied ? common.copied : t.copy} variant="white" size="md" block={false} onPress={() => void invite.copy(link)} style={{ flex: 1 }} />
                <Button
                  label={t.share}
                  icon="share"
                  variant="dark"
                  size="md"
                  block={false}
                  onPress={() => void invite.share(t.shareMessage(pet?.name ?? '', link), link)}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          ) : (
            <>
              <Skeleton height={44} radius="pill" />
              <Skeleton height={48} radius="pill" />
            </>
          )}
        </View>
      </Panel>
      {me.data ? (
        <WordsShareCard
          title={t.wordsTitle}
          words={[]}
          emptyText={t.wordsEmpty(pet?.name ?? '')}
          url={displayUrl(wordsLink)}
          copyLabel={t.copy}
          copiedLabel={common.copied}
          copied={words.copied}
          shareLabel={t.wordsShare}
          onCopy={() => void words.copy(wordsLink)}
          onShare={() => void words.share(t.wordsMessage(wordsLink), wordsLink)}
        />
      ) : me.isLoading ? (
        <Skeleton height={150} radius="lg" />
      ) : null}
    </OnboardingTemplate>
  );
}
