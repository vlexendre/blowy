/** Personnes bloquées (V6-Bloques) : liste, déblocage, comment bloquer. */
import { Avatar, Banner, Button, ListRow, PetTip, SettingsSection, SettingsTemplate, Skeleton } from '@blowy/ui';

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
  const list = blocks.data ?? [];

  return (
    <SettingsTemplate title={t.title} onBack={() => goBack('/moi/reglages')} backLabel={common.back} intro={t.text}>
      {blocks.isError ? (
        <Banner tone="error" title={common.errorTitle} text={errorMessage(blocks.error)} actionLabel={common.retry} onAction={() => void blocks.refetch()} />
      ) : blocks.isLoading ? (
        <Skeleton height={120} radius="lg" />
      ) : (
        <SettingsSection>
          {list.length ? (
            list.map((b, i) => (
              <ListRow
                key={b.userId}
                title={b.displayName}
                left={<Avatar size={44} name={b.displayName} />}
                divider={i < list.length - 1}
                right={
                  <Button
                    label={t.unblock}
                    variant="ghost"
                    size="sm"
                    loading={unblock.isPending && unblock.variables === b.userId}
                    disabled={unblock.isPending}
                    accessibilityLabel={t.unblockLabel(b.displayName)}
                    onPress={() => unblock.mutate(b.userId)}
                  />
                }
              />
            ))
          ) : (
            <ListRow title={t.empty} divider={false} />
          )}
        </SettingsSection>
      )}
      {unblock.isError ? <Banner tone="error" text={errorMessage(unblock.error)} /> : null}
      <PetTip tone="card" text={t.howTo} species={me.data?.pet.species ?? 'nino'} />
    </SettingsTemplate>
  );
}
