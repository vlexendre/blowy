/** Souvenirs privés : les photos de preuve ou du défi que la personne a gardées. Personne d'autre ne les voit. */
import { Banner, Button, EmptyState, PrivateMemoryGrid, SettingsTemplate, Skeleton } from '@blowy/ui';

import { ScreenMotion } from '@/core';
import { usePet } from '@/features/pet';
import { usePrivateMemories } from '@/features/rituals';
import { goBack } from '@/features/session';
import { rituels } from '@/locales/rituels';

const t = rituels.memories;

export default function PrivateMemoriesScreen() {
  const memories = usePrivateMemories();
  const pet = usePet().data?.pet;
  const back = () => goBack('/pet/caractere');
  const items = memories.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <ScreenMotion>
      <SettingsTemplate title={t.title} titleSize={40} onBack={back} backLabel={t.back} intro={t.intro}>
        {memories.isPending ? (
          <>
            <Skeleton height={200} radius="lg" />
            <Skeleton height={200} radius="lg" delay={120} />
          </>
        ) : memories.isError ? (
          <Banner tone="error" title={t.loadError} text="" actionLabel={t.retry} onAction={() => void memories.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState species={pet?.species} mood="neutre" peek seed={pet?.id} title={t.empty} text={t.emptyText} />
        ) : (
          <>
            <PrivateMemoryGrid items={items.map((m) => ({ id: m.id, url: m.url, caption: m.caption, dayLabel: t.day(m.day) }))} />
            {memories.hasNextPage ? (
              <Button label={t.more} variant="glass" loading={memories.isFetchingNextPage} onPress={() => void memories.fetchNextPage()} />
            ) : null}
          </>
        )}
      </SettingsTemplate>
    </ScreenMotion>
  );
}
