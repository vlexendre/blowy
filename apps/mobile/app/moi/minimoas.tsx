/**
 * Minimoas dans tes chats (spéc §9) : l'accord de lecture par une IA, chat par chat, et pour tous d'un coup.
 * La phrase de confidentialité est celle de l'API, telle quelle. Changer d'avis est possible à tout moment.
 */
import type { LinkMinimoas } from '@blowy/contract';
import { Appear, Banner, Button, DotNote, EmptyState, ListRow, SettingsSection, SettingsTemplate, Skeleton, Stack, Stagger, Text } from '@blowy/ui';
import { useState } from 'react';

import { ScreenMotion } from '@/core';
import { useLinks, useMyMinimoas, useSetReadingEverywhere, useUpdateLinkMinimoas } from '@/features/links';
import { useMe } from '@/features/me';
import { goBack } from '@/features/session';
import { common } from '@/locales/common';
import { moi } from '@/locales/moi';

const t = moi.minimoas;

export default function Minimoas() {
  const me = useMe();
  const links = useLinks();
  const list = useMyMinimoas();
  const all = useSetReadingEverywhere();
  const [done, setDone] = useState<number | null>(null);
  const back = () => goBack('/moi/reglages');
  const names = new Map((links.data ?? []).map((l) => [l.id, l.other.displayName]));
  const items = list.items.filter((i) => names.has(i.linkId));

  const setAll = (consent: boolean) => {
    setDone(null);
    all.mutate({ consent, linkIds: items.filter((i) => i.consent.mine !== consent).map((i) => i.linkId) }, { onSuccess: setDone });
  };

  return (
    <ScreenMotion>
      <SettingsTemplate title={t.title} onBack={back} backLabel={common.back}>
        {list.isPending || links.isPending ? (
          <Stack>
            <Skeleton height={110} radius="lg" />
            <Skeleton height={120} radius="lg" />
            <Skeleton height={200} radius="lg" />
          </Stack>
        ) : list.isError || links.isError ? (
          <Banner tone="error" title={t.loadError} text={(list.error ?? links.error)?.message ?? ''} actionLabel={common.retry} onAction={() => void Promise.all([list.refetch(), links.refetch()])} />
        ) : (
          <Stagger onceKey="moi:minimoas" step={50}>
            <Text key="lead" size={15} muted>
              {t.lead}
            </Text>
            {/* La phrase exacte de l'API. */}
            {list.text ? (
              <Text key="text" variant="bodyBold" size={17}>
                {list.text}
              </Text>
            ) : null}
            {items.length === 0 ? (
              <EmptyState key="empty" peek species={me.data?.pet.species ?? 'nino'} mood="salut" seed={me.data?.pet.id} title={t.title} text={t.empty} />
            ) : (
              <SettingsSection
                key="all"
                title={t.allTitle}
                rows={[
                  { key: 'on', title: t.allOn, onPress: () => setAll(true), disabled: all.isPending },
                  { key: 'off', title: t.allOff, onPress: () => setAll(false), disabled: all.isPending },
                ]}
                footer={t.allNote}
              />
            )}
            {items.length > 0 ? (
              <SettingsSection key="links" title={t.perLink}>
                {items.map((i, n) => (
                  <LinkRow key={i.linkId} item={i} name={names.get(i.linkId) ?? ''} divider={n < items.length - 1} />
                ))}
              </SettingsSection>
            ) : null}
            {list.hasNextPage ? <Button key="more" label={t.more} variant="ghost" onPress={() => void list.fetchNextPage()} loading={list.isFetchingNextPage} /> : null}
          </Stagger>
        )}
        {all.isError ? <Banner tone="error" text={t.error} onClose={() => all.reset()} closeLabel={common.close} /> : null}
        {done !== null ? (
          <Appear key={`done:${done}`}>
            <DotNote text={t.allDone(done)} />
          </Appear>
        ) : null}
      </SettingsTemplate>
    </ScreenMotion>
  );
}

/** Une ligne par chat : l'interrupteur de lecture (ton accord), et l'état (l'autre, coupure). */
function LinkRow({ item, name, divider }: { item: LinkMinimoas; name: string; divider: boolean }) {
  const update = useUpdateLinkMinimoas(item.linkId);
  return (
    <ListRow
      title={t.row(name)}
      subtitle={update.isError ? t.error : t.sub(item.consent.mine, item.consent.reading, item.muted)}
      switchValue={item.consent.mine === true}
      onSwitchChange={(on: boolean) => update.mutate({ consent: on })}
      accessibilityLabel={t.readA11y(name)}
      divider={divider}
    />
  );
}
