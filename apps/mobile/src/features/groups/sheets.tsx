/**
 * Signalement dans un groupe (spéc. §26) : un message, un membre ou le groupe entier, avec une raison du contrat et
 * des détails facultatifs. Composition de @blowy/ui uniquement.
 */
import { REPORT_REASONS, type ReportBody } from '@blowy/contract';
import { Banner, Button, Glyph, ListRow, SheetTemplate, Text, TextField } from '@blowy/ui';
import { useEffect, useState } from 'react';

import { errorText } from '@/features/links';
import { reportReasonLabel } from '@/locales/content';
import { groupes } from '@/locales/groupes';

import { useReportGroup } from './index';

const t = groupes.report;
type Reason = ReportBody['reason'];

export type GroupReportTarget = { kind: 'group' } | { kind: 'member'; userId: string; name: string } | { kind: 'message'; messageId: string; quote: string };

export function GroupReportSheet({ groupId, target, onClose, onDone }: { groupId: string; target: GroupReportTarget | null; onClose: () => void; onDone: () => void }) {
  const report = useReportGroup(groupId);
  const [reason, setReason] = useState<Reason | null>(null);
  const [details, setDetails] = useState('');
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    if (!target) return;
    setReason(null);
    setDetails('');
    setMissing(false);
    report.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const send = () => {
    if (!target) return;
    if (!reason) return setMissing(true);
    const trimmed = details.trim();
    report.mutate(
      {
        reason,
        details: trimmed || undefined,
        ...(target.kind === 'member' ? { userId: target.userId } : target.kind === 'message' ? { messageId: target.messageId } : {}),
      },
      { onSuccess: onDone },
    );
  };
  const title = !target ? undefined : target.kind === 'group' ? t.titleGroup : target.kind === 'member' ? t.titleMember(target.name) : t.titleMessage;

  return (
    <SheetTemplate
      visible={!!target}
      onClose={onClose}
      title={title}
      scroll
      closeLabel={groupes.group.cancel}
      footer={<Button label={t.send} variant="danger" onPress={send} loading={report.isPending} />}
    >
      {target?.kind === 'message' ? (
        <Text variant="bodyBold" size={15} numberOfLines={3}>
          {`« ${target.quote} »`}
        </Text>
      ) : null}
      <Text variant="label" muted>
        {t.reason}
      </Text>
      {REPORT_REASONS.map((r, i) => (
        <ListRow
          key={r}
          title={reportReasonLabel[r] ?? r}
          onPress={() => {
            setReason(r);
            setMissing(false);
          }}
          right={reason === r ? <Glyph name="check" size={18} /> : undefined}
          chevron={false}
          accessibilityLabel={`${reportReasonLabel[r] ?? r}${reason === r ? `, ${t.selected}` : ''}`}
          divider={i < REPORT_REASONS.length - 1}
        />
      ))}
      <TextField label={t.details} value={details} onChangeText={setDetails} multiline maxLength={1000} />
      {missing ? <Banner tone="error" text={t.pickFirst} /> : null}
      {report.isError ? <Banner tone="error" text={errorText(report.error, t.error)} /> : null}
    </SheetTemplate>
  );
}
