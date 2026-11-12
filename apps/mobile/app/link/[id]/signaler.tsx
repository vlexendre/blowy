import { reportReasonLabel } from '@blowy/content';
import { REPORT_REASONS, type ReportBody } from '@blowy/contract';
import { Banner, Button, Card, Header, ListRow, NoteField, Radio, ScreenTemplate, SettingsSection, Skeleton, Text, Title, Toggle } from '@blowy/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { errorText, useBackToLink, useLink } from '@/features/links';
import { useBlock, useReport } from '@/features/safety';
import { link as linkText, options as t } from '@/locales/chats';

type Reason = ReportBody['reason'];

const lowerFirst = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);

/** Signaler la personne d'un lien (V6-Signaler) : une raison, une précision, et bloquer dans la foulée. */
export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const link = useLink(id);
  const report = useReport();
  const block = useBlock();
  const [reason, setReason] = useState<Reason | null>(null);
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [missing, setMissing] = useState(false);
  const [done, setDone] = useState(false);
  const l = link.data;

  const back = useBackToLink(id);
  const toChats = () => {
    if (router.canDismiss()) router.dismissAll();
    router.replace('/(tabs)/chats');
  };

  const send = () => {
    if (!l) return;
    if (!reason) {
      setMissing(true);
      return;
    }
    const trimmed = details.trim();
    report.mutate(
      { userId: l.other.id, linkId: l.id, reason, details: trimmed ? trimmed : undefined },
      {
        onSuccess: () => {
          if (alsoBlock) block.mutate(l.other.id, { onSuccess: toChats });
          else setDone(true);
        },
      },
    );
  };

  const name = l?.other.displayName ?? '';
  const header = <Header onBack={back} backLabel={linkText.back} style={styles.edge} center={l ? <Title text={t.reportTitle(name)} size={40} numberOfLines={1} /> : undefined} />;
  const error = report.isError ? errorText(report.error, t.error) : block.isError ? errorText(block.error, t.error) : null;

  return (
    <ScreenTemplate
      header={header}
      padded={false}
      contentStyle={styles.edge}
      footer={
        l ? (
          <View style={styles.footer}>
            {done ? (
              <Button label={linkText.backToChats} variant="ghost" onPress={back} />
            ) : (
              <Button label={t.reportSend} variant="accent" onPress={send} loading={report.isPending || block.isPending} />
            )}
            <Text variant="body" size={11} muted center>
              {t.reportEmergency}
            </Text>
          </View>
        ) : undefined
      }
    >
      {!l ? (
        link.isPending ? (
          <Skeleton height={280} radius="lg" />
        ) : (
          <Banner tone="error" title={linkText.loadError} text={link.error?.message ?? ''} actionLabel={linkText.retry} onAction={() => void link.refetch()} />
        )
      ) : (
        <View style={styles.body}>
          <Text variant="body" size={14} muted style={styles.intro}>
            {t.reportIntro(name)}
          </Text>
          <SettingsSection
            rows={REPORT_REASONS.map((r) => ({
              key: r,
              title: lowerFirst(reportReasonLabel[r] ?? r),
              onPress: () => {
                setReason(r);
                setMissing(false);
              },
              right: <Radio selected={reason === r} />,
              chevron: false,
              accessibilityLabel: `${reportReasonLabel[r] ?? r}${reason === r ? `, ${t.selected}` : ''}`,
            }))}
          />
          <NoteField label={t.reportNote} value={details} onChangeText={setDetails} placeholder={t.reportNotePlaceholder} />
          <Card>
            <ListRow
              title={t.reportAlsoBlock(name)}
              subtitle={t.reportAlsoBlockSub}
              left={<Toggle value={alsoBlock} onValueChange={setAlsoBlock} accessibilityLabel={t.reportAlsoBlock(name)} />}
              divider={false}
              style={styles.blockRow}
            />
          </Card>
          {missing ? <Banner tone="error" text={t.reportPickFirst} /> : null}
          {error ? <Banner tone="error" text={error} /> : null}
          {done ? <Banner tone="success" text={t.reportDone} /> : null}
        </View>
      )}
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  body: { gap: 10 },
  intro: { paddingHorizontal: 6 },
  blockRow: { minHeight: 0, paddingVertical: 0 },
  // Maquette : marges de 14 ; pied à 26 du bas (la zone de sécurité le remplace).
  edge: { paddingHorizontal: 14 },
  footer: { gap: 8, paddingHorizontal: 14 },
});
