/**
 * Ton lien « 3 mots » et ton résultat (`minimoa://mots`, ouvert aussi depuis la page de vote du site : « J'ai déjà
 * Minimoa »). Dès 3 votes : la carte résultat au format story (le minimoa dans sa tenue, les 3 mots les plus choisis, le
 * lien pour voter encore), « Partager en story » ou « Autre app ». Les mots viennent toujours de la liste (jamais de
 * texte libre).
 */
import { space } from '@blowy/tokens';
import { Banner, Button, Header, ScreenTemplate, ShareCard, Skeleton, Stack, Text, Title } from '@blowy/ui';
import { View } from 'react-native';

import { ScreenMotion, wordsUrl } from '@/core';
import { useTrackShare } from '@/features/growth';
import { displayUrl, useCopyShare, useMe, useMyWords, useStoryShare } from '@/features/me';
import { goBack } from '@/features/session';
import { common } from '@/locales/common';
import { wordLabel } from '@/locales/content';
import { croissance } from '@/locales/croissance';

const t = croissance.words;

export default function MyWords() {
  const me = useMe();
  const words = useMyWords();
  const story = useStoryShare();
  const link = useCopyShare();
  const track = useTrackShare();
  const header = <Header onBack={() => goBack('/(tabs)/moi')} backLabel={t.back} />;
  const w = words.data;
  const pet = me.data?.pet;

  if (!w || !pet) {
    return (
      <ScreenMotion>
        <ScreenTemplate header={header}>
          {words.isError || me.isError ? (
            <Banner tone="error" title={t.error} actionLabel={t.retry} onAction={() => void words.refetch()} />
          ) : (
            <View style={{ gap: space.lg }}>
              <Skeleton height={60} radius="lg" />
              <Skeleton height={360} radius="xl" />
            </View>
          )}
        </ScreenTemplate>
      </ScreenMotion>
    );
  }

  const url = wordsUrl(w.code);
  const top = w.top.map((k) => wordLabel[k] ?? k);
  const card = {
    brand: croissance.brand,
    kicker: t.card.kicker,
    title: t.card.title,
    words: top.map((x) => x.toUpperCase()),
    pet: { name: pet.name, species: pet.species, outfit: pet.outfit },
    callout: t.card.callout,
    url: displayUrl(url),
    gradient: 'violet' as const,
  };
  const message = top.length ? t.resultMessage(top.join(', '), url) : t.linkMessage(url);
  const share = (target: 'story' | 'sheet') => {
    track('words');
    void story.share(message, url, target);
  };

  return (
    <ScreenMotion>
      <ScreenTemplate
        header={header}
        footer={
          top.length ? (
            <>
              <Button label={story.copied ? common.copied : croissance.share.story} icon="share" loading={story.busy} onPress={() => share('story')} />
              <Button label={croissance.share.sheet} variant="glass" disabled={story.busy} onPress={() => share('sheet')} />
            </>
          ) : (
            <Button
              label={link.copied ? common.copied : t.shareLink}
              icon="share"
              onPress={() => {
                track('words');
                void link.share(t.linkMessage(url), url);
              }}
            />
          )
        }
      >
        <Stack gap={14} top={4}>
          <Title text={t.title} size={44} />
          <Text size={15} muted>
            {t.lead}
          </Text>
          <Text variant="bodyHeavy" size={15}>
            {t.votes(w.votes)}
          </Text>
          {top.length ? (
            <ShareCard {...card} scale={0.62} accessibilityLabel={message} />
          ) : (
            <Banner tone="info" text={t.waiting(Math.max(0, w.minVotes - w.votes))} />
          )}
        </Stack>
        {top.length ? <ShareCard ref={story.card} {...card} offscreen /> : null}
      </ScreenTemplate>
    </ScreenMotion>
  );
}

