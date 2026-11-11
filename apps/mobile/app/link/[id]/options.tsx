import { Banner, Header, ScreenTemplate, SettingsSection, Skeleton, Text, Title } from '@blowy/ui';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ConfirmSheet, errorText, ReportSheet, useArchiveLink, useLink } from '@/features/links';
import { useBlock } from '@/features/safety';
import { link as linkText, options as t } from '@/locales/chats';

type Sheet = 'report' | 'block' | 'leave' | null;

/** Options d'un lien (présentées en modale) : signaler, bloquer, quitter. */
export default function LinkOptionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const link = useLink(id);
  const block = useBlock();
  const archive = useArchiveLink();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [reported, setReported] = useState(false);
  const l = link.data;

  const close = () => (router.canGoBack() ? router.back() : router.replace(`/link/${id}`));
  const toChats = () => {
    if (router.canDismiss()) router.dismissAll();
    router.replace('/(tabs)/chats');
  };

  return (
    <ScreenTemplate header={<Header onBack={close} backGlyph="close" backLabel={t.close} />}>
      <Stack.Screen options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      {!l ? (
        link.isPending ? (
          <View style={styles.body}>
            <Skeleton height={48} width="70%" />
            <Skeleton height={180} radius="lg" />
          </View>
        ) : (
          <Banner tone="error" title={linkText.loadError} text={link.error?.message ?? ''} actionLabel={linkText.retry} onAction={() => void link.refetch()} />
        )
      ) : (
        <View style={styles.body}>
          <Title text={t.title(l.other.displayName)} variant="h1" />
          {reported ? <Banner tone="success" text={t.reportDone} onClose={() => setReported(false)} closeLabel={t.close} /> : null}
          <SettingsSection
            title={t.safetyTitle}
            rows={[
              { key: 'report', title: t.report(l.other.displayName), subtitle: t.reportSub, onPress: () => setSheet('report'), chevron: true },
              { key: 'block', title: t.block(l.other.displayName), subtitle: t.blockSub, onPress: () => setSheet('block'), destructive: true },
            ]}
          />
          <SettingsSection
            title={t.linkTitle}
            rows={[
              { key: 'levels', title: t.levels, onPress: () => router.push(`/link/${l.id}/niveaux`), chevron: true },
              { key: 'leave', title: t.leave, subtitle: t.leaveSub, onPress: () => setSheet('leave'), destructive: true },
            ]}
          />
          <Text variant="small" muted>
            {t.footer}
          </Text>

          <ReportSheet
            visible={sheet === 'report'}
            onClose={() => setSheet(null)}
            userId={l.other.id}
            linkId={l.id}
            name={l.other.displayName}
            onDone={() => {
              setSheet(null);
              setReported(true);
            }}
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
        </View>
      )}
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  body: { gap: 20, paddingTop: 8 },
});
