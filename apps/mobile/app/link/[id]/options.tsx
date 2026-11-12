import { dayOf } from '@blowy/domain';
import { Avatar, Banner, Button, SettingsSection, SheetTemplate, Skeleton, Text, Title } from '@blowy/ui';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ConfirmSheet, errorText, shortDay, useArchiveLink, useBackToLink, useLink } from '@/features/links';
import { useBlock } from '@/features/safety';
import { link as linkText, options as t } from '@/locales/chats';

type Sheet = 'block' | 'leave' | null;

/** Options d'un lien (V6-LienOptions) : feuille posée sur le lien, niveaux, signaler, bloquer, quitter. */
export default function LinkOptionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const link = useLink(id);
  const block = useBlock();
  const archive = useArchiveLink();
  const [sheet, setSheet] = useState<Sheet>(null);
  const l = link.data;

  // Ouvert par un lien profond, la feuille arrive seule dans la pile du lien : on la rouvre avec le lien dessous.
  const navigation = useNavigation();
  useEffect(() => {
    if (navigation.getState()?.routes[0]?.name !== 'options') return;
    router.replace(`/link/${id}`);
    setTimeout(() => router.push(`/link/${id}/options`), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = useBackToLink(id);
  const toChats = () => {
    if (router.canDismiss()) router.dismissAll();
    router.replace('/(tabs)/chats');
  };

  const header = l ? (
    <View style={styles.head}>
      <Avatar size={52} pet={l.other.pet} uri={l.other.avatarUrl} face={l.other.face} name={l.other.displayName} />
      <View style={styles.grow}>
        <Title text={t.title(l.other.displayName, l.other.pet.name)} size={28} numberOfLines={1} />
        <Text variant="body" size={12} muted>
          {t.meta(shortDay(dayOf(new Date(l.createdAt))), l.level, l.lives)}
        </Text>
      </View>
    </View>
  ) : (
    <Skeleton height={52} width="70%" />
  );

  return (
    <>
      <SheetTemplate asScreen visible onClose={close} closeLabel={t.close} header={header} footer={<Button label={t.cancel} variant="ghost" onPress={close} />}>
        {!l ? (
          link.isPending ? (
            <Skeleton height={180} radius="lg" />
          ) : (
            <Banner tone="error" title={linkText.loadError} text={link.error?.message ?? ''} actionLabel={linkText.retry} onAction={() => void link.refetch()} />
          )
        ) : (
          <>
            <SettingsSection tone="raised" rows={[{ key: 'levels', title: t.levels, onPress: () => router.push(`/link/${l.id}/niveaux`), chevron: true }]} />
            <SettingsSection
              tone="raised"
              rows={[
                { key: 'report', title: t.report(l.other.displayName), subtitle: t.reportSub, onPress: () => router.push(`/link/${l.id}/signaler`), chevron: true },
                { key: 'block', title: t.block(l.other.displayName), subtitle: t.blockSub, onPress: () => setSheet('block'), destructive: true, chevron: true },
                { key: 'leave', title: t.leave, subtitle: t.leaveSub, onPress: () => setSheet('leave'), destructive: true, chevron: true },
              ]}
            />
            <ConfirmSheet
              visible={sheet === 'block'}
              onClose={() => setSheet(null)}
              title={t.blockTitle(l.other.displayName)}
              text={t.blockText(l.other.displayName)}
              confirmLabel={t.blockConfirm}
              loading={block.isPending}
              error={block.isError ? errorText(block.error, t.error) : null}
              onConfirm={() =>
                block.mutate(l.other.id, {
                  onSuccess: () => {
                    setSheet(null);
                    toChats();
                  },
                })
              }
            />
            <ConfirmSheet
              visible={sheet === 'leave'}
              onClose={() => setSheet(null)}
              title={t.leaveTitle}
              text={t.leaveText(l.other.displayName)}
              confirmLabel={t.leaveConfirm}
              loading={archive.isPending}
              error={archive.isError ? errorText(archive.error, t.error) : null}
              onConfirm={() =>
                archive.mutate(l.id, {
                  onSuccess: () => {
                    setSheet(null);
                    toChats();
                  },
                })
              }
            />
          </>
        )}
      </SheetTemplate>
    </>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grow: { flex: 1, minWidth: 0 },
});
