/**
 * Lien d'invitation d'un groupe (`https://minimoa.app/g/<code>`, `minimoa://g/<code>`) : ce que montre la page publique
 * (nom, habitude, jours tenus, nombre de membres et leurs minimoas, jamais de prénom) et « Rejoindre le groupe ». Ouvert
 * après l'inscription si besoin (lien gardé, docs/DEEPLINKS.md). Bloqué avec un membre, lien changé : introuvable.
 */
import { ApiError } from '@blowy/api-client';
import { space } from '@blowy/tokens';
import { AvatarStack, Banner, Button, Chip, EmptyState, Header, ScreenTemplate, Skeleton, Stack, Text, Title } from '@blowy/ui';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { ScreenMotion } from '@/core';
import { useGroupPreview, useJoinGroup } from '@/features/groups';
import { errorMessage, goBack, useGate } from '@/features/session';
import { croissance } from '@/locales/croissance';

const t = croissance.join;
const home = () => router.replace('/(tabs)/chats');

export default function JoinGroup() {
  const params = useLocalSearchParams<{ code: string }>();
  const code = (params.code ?? '').trim().toUpperCase();
  const gate = useGate();
  const preview = useGroupPreview(code || null);
  const join = useJoinGroup();
  if (!code) return <Redirect href="/" />;
  if (gate === 'signedOut' || gate === 'needsOnboarding') return <Redirect href="/" />;

  const header = <Header onBack={() => goBack('/(tabs)/chats')} backGlyph="close" backLabel={t.back} />;
  const gone = (preview.error instanceof ApiError && preview.error.code === 'not_found') || (join.error instanceof ApiError && join.error.code === 'not_found');
  if (gone) {
    return (
      <ScreenMotion>
        <ScreenTemplate header={header} scroll={false}>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <EmptyState peek mood="triste" title={t.goneTitle} text={t.goneText} actionLabel={t.home} onAction={home} />
          </View>
        </ScreenTemplate>
      </ScreenMotion>
    );
  }
  const g = preview.data;
  if (!g) {
    return (
      <ScreenMotion>
        <ScreenTemplate header={header}>
          {preview.isError ? (
            <Banner tone="error" text={errorMessage(preview.error)} actionLabel={croissance.words.retry} onAction={() => void preview.refetch()} />
          ) : (
            <View style={{ gap: space.lg }}>
              <Skeleton height={220} radius="xl" />
              <Skeleton height={56} radius="pill" />
            </View>
          )}
        </ScreenTemplate>
      </ScreenMotion>
    );
  }
  return (
    <ScreenMotion>
      <ScreenTemplate
        header={header}
        footer={
          <>
            <Button
              label={t.cta}
              loading={join.isPending}
              disabled={g.full}
              onPress={() => join.mutate(code, { onSuccess: (detail) => router.replace({ pathname: '/groupe/[id]', params: { id: detail.id } }) })}
            />
            <Button label={t.later} variant="ghost" onPress={home} />
          </>
        }
      >
        <Stack gap={14} top={8}>
          <Text variant="label" size={13} muted>
            {t.kicker}
          </Text>
          <Title text={g.name.toUpperCase()} size={40} accessibilityLabel={t.a11y(g.name, g.memberCount)} />
          <Stack direction="row" gap={8}>
            <Chip label={g.habitLabel ? t.habit(g.habitLabel) : t.free} tone="accent" />
            <Chip label={t.members(g.memberCount)} tone="glass" />
          </Stack>
          <AvatarStack people={g.species.map((species, i) => ({ pet: { name: String(i + 1), species }, hidden: true }))} size={44} max={8} />
          {g.kind === 'habit' ? (
            <Text size={15} muted>
              {t.daysKept(g.daysKept)}
            </Text>
          ) : null}
          {g.missing > 0 ? <Banner tone="info" text={t.missing(g.missing)} /> : null}
          {g.full ? <Banner tone="info" text={t.full} /> : null}
          {join.isError && !gone ? <Banner tone="error" text={errorMessage(join.error)} onClose={() => join.reset()} closeLabel={t.back} /> : null}
        </Stack>
      </ScreenTemplate>
    </ScreenMotion>
  );
}
