/** Personnes bloquées : liste et déblocage. */
import { space } from '@blowy/tokens';
import { Avatar, Banner, Button, Card, EmptyState, Header, ListRow, ScreenTemplate, Skeleton, Text } from '@blowy/ui';
import { View } from 'react-native';

import { useMe } from '@/features/me';
import { useBlocks, useUnblock } from '@/features/safety';
import { errorMessage, goBack } from '@/features/session';
import { common } from '@/locales/common';
import { moi } from '@/locales/moi';

const t = moi.bloques;

export default function Bloques() {
  const blocks = useBlocks();
  const unblock = useUnblock();
  const me = useMe();
  const header = <Header onBack={() => goBack('/(tabs)/moi')} backLabel={common.back} title={t.title} />;

  return (
    <ScreenTemplate header={header}>
      <View style={{ gap: space.lg }}>
        {blocks.isError ? (
          <Banner tone="error" title={common.errorTitle} text={errorMessage(blocks.error)} actionLabel={common.retry} onAction={() => void blocks.refetch()} />
        ) : blocks.isLoading ? (
          <View style={{ gap: space.sm }} accessibilityLabel={common.loading}>
            <Skeleton height={64} radius="md" />
            <Skeleton height={64} radius="md" />
          </View>
        ) : !blocks.data?.length ? (
          <EmptyState species={me.data?.pet.species} mood="joie" title={t.emptyTitle} text={t.emptyText} />
        ) : (
          <>
            <Text muted>{t.text}</Text>
            <Card padding="none">
              {blocks.data.map((b, i) => (
                <ListRow
                  key={b.userId}
                  title={b.displayName}
                  left={<Avatar size={40} name={b.displayName} />}
                  divider={i < (blocks.data?.length ?? 0) - 1}
                  right={
                    <Button
                      label={t.unblock}
                      variant="white"
                      size="sm"
                      block={false}
                      loading={unblock.isPending && unblock.variables === b.userId}
                      disabled={unblock.isPending}
                      accessibilityLabel={t.unblockLabel(b.displayName)}
                      onPress={() => unblock.mutate(b.userId)}
                    />
                  }
                />
              ))}
            </Card>
            {unblock.isError ? <Banner tone="error" text={errorMessage(unblock.error)} /> : null}
          </>
        )}
      </View>
    </ScreenTemplate>
  );
}
