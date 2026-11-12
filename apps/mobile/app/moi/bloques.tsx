/** Personnes bloquées (V6-Bloques) : liste, déblocage, comment bloquer. */
import { Appear, Avatar, Banner, Button, ListRow, PetTip, SettingsSection, SettingsTemplate, Skeleton, staggerDelay } from '@blowy/ui';

import { ScreenMotion } from '@/core';
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
    <ScreenMotion>
    <SettingsTemplate title={t.title} onBack={() => goBack('/moi/reglages')} backLabel={common.back} intro={t.text}>
      {blocks.isError ? (
        <Appear key="error">
          <Banner tone="error" title={common.errorTitle} text={errorMessage(blocks.error)} actionLabel={common.retry} onAction={() => void blocks.refetch()} />
        </Appear>
      ) : blocks.isLoading ? (
        <Skeleton height={120} radius="lg" />
      ) : (
        <Appear>
        <SettingsSection>
          {list.length ? (
            list.map((b, i) => (
              // Chaque ligne arrive une seule fois (cascade) ; débloquée, elle disparaît de la liste.
              <Appear key={b.userId} once={`bloques:${b.userId}`} delay={staggerDelay(i)}>
              <ListRow
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
              </Appear>
            ))
          ) : (
            <ListRow title={t.empty} divider={false} />
          )}
        </SettingsSection>
        </Appear>
      )}
      {unblock.isError ? (
        <Appear key="unblock-error">
          <Banner tone="error" text={errorMessage(unblock.error)} />
        </Appear>
      ) : null}
      <Appear delay={120}>
        <PetTip tone="card" text={t.howTo} species={me.data?.pet.species ?? 'nino'} />
      </Appear>
    </SettingsTemplate>
    </ScreenMotion>
  );
}
