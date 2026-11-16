/** Ses bilans : tous les bilans du dimanche, du plus récent au plus ancien, par pages. */
import { Appear, Banner, Button, Chip, EmptyState, SettingsSection, SettingsTemplate, Skeleton } from '@blowy/ui';
import { useRouter } from 'expo-router';

import { ScreenMotion } from '@/core';
import { usePet } from '@/features/pet';
import { useReviews } from '@/features/rituals';
import { goBack } from '@/features/session';
import { rituels } from '@/locales/rituels';

const t = rituels.review;

export default function ReviewsScreen() {
  const router = useRouter();
  const reviews = useReviews();
  const pet = usePet().data?.pet;
  const list = reviews.data?.pages.flatMap((p) => p.reviews) ?? [];

  return (
    <ScreenMotion>
      <SettingsTemplate title={t.listTitle} titleSize={40} onBack={() => goBack('/pet/caractere')} backLabel={t.back}>
        {reviews.isPending ? (
          <>
            <Skeleton height={64} radius="lg" />
            <Skeleton height={64} radius="lg" delay={80} />
            <Skeleton height={64} radius="lg" delay={160} />
          </>
        ) : reviews.isError ? (
          <Banner tone="error" title={t.loadError} text="" actionLabel={t.retry} onAction={() => void reviews.refetch()} />
        ) : list.length === 0 ? (
          <EmptyState species={pet?.species} mood="neutre" peek seed={pet?.id} title={t.empty} text={t.emptyText} />
        ) : (
          <>
            <Appear once="reviews:list">
              <SettingsSection
                rows={list.map((r) => ({
                  key: r.id,
                  title: t.row(r.weekStart),
                  subtitle: r.did[0] ?? r.noticed,
                  right: r.read ? undefined : <Chip label={t.unread} tone="accent" />,
                  chevron: true,
                  onPress: () => router.push({ pathname: '/pet/bilan/[id]', params: { id: r.id } }),
                }))}
              />
            </Appear>
            {reviews.hasNextPage ? (
              <Button label={t.more} variant="glass" loading={reviews.isFetchingNextPage} onPress={() => void reviews.fetchNextPage()} />
            ) : null}
          </>
        )}
      </SettingsTemplate>
    </ScreenMotion>
  );
}
