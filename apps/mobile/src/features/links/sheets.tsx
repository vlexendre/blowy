/**
 * Feuilles partagées par les écrans de lien et de rencontre : choix de la source de la photo du jour,
 * signalement (raisons du contrat) et confirmation d'une action lourde (bloquer, quitter).
 * Composition de @blowy/ui uniquement ; les écrans gardent la navigation.
 */
import { ApiError } from '@blowy/api-client';
import { reportReasonLabel } from '@blowy/content';
import { REPORT_REASONS, type ReportBody } from '@blowy/contract';
import { Banner, Button, Glyph, ListRow, SheetTemplate, Text, TextField, type TitleContent } from '@blowy/ui';
import { useEffect, useState } from 'react';

import { useReport } from '@/features/safety';
import { options as t, today as todayText } from '@/locales/chats';

type Reason = ReportBody['reason'];

export function PhotoSourceSheet({ visible, onClose, onPick }: { visible: boolean; onClose: () => void; onPick: (source: 'camera' | 'library') => void }) {
  return (
    <SheetTemplate
      visible={visible}
      onClose={onClose}
      title={todayText.pickTitle}
      closeLabel={t.close}
      footer={
        <>
          <Button label={todayText.camera} icon="camera" onPress={() => onPick('camera')} />
          <Button label={todayText.library} variant="ghost" onPress={() => onPick('library')} />
        </>
      }
    >
      <Text muted>{todayText.pickText}</Text>
    </SheetTemplate>
  );
}

export interface ReportSheetProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  linkId?: string;
  name: string;
  /** Appelé après un envoi réussi. */
  onDone?: () => void;
}

/** Signaler une personne : une raison du contrat, des détails facultatifs, puis `useReport`. */
export function ReportSheet({ visible, onClose, userId, linkId, name, onDone }: ReportSheetProps) {
  const report = useReport();
  const [reason, setReason] = useState<Reason | null>(null);
  const [details, setDetails] = useState('');
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setReason(null);
    setDetails('');
    setMissing(false);
    report.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const send = () => {
    if (!reason) {
      setMissing(true);
      return;
    }
    const trimmed = details.trim();
    report.mutate({ userId, linkId, reason, details: trimmed ? trimmed : undefined }, { onSuccess: () => onDone?.() });
  };

  return (
    <SheetTemplate
      visible={visible}
      onClose={onClose}
      title={t.reportTitle(name)}
      closeLabel={t.close}
      footer={<Button label={t.reportSend} variant="danger" onPress={send} loading={report.isPending} />}
    >
      <Text variant="label" muted>
        {t.reportReason}
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
      <TextField label={t.reportDetails} hint={t.reportDetailsHint} value={details} onChangeText={setDetails} multiline maxLength={1000} />
      {missing ? <Banner tone="error" text={t.reportPickFirst} /> : null}
      {report.isError ? <Banner tone="error" text={report.error instanceof ApiError ? report.error.message : t.error} /> : null}
    </SheetTemplate>
  );
}

export interface ConfirmSheetProps {
  visible: boolean;
  onClose: () => void;
  title: TitleContent;
  text: string;
  confirmLabel: string;
  onConfirm: () => void;
  loading?: boolean;
  error?: string | null;
}

/** Confirmation d'une action qui ne se rattrape pas (bloquer, quitter un lien). */
export function ConfirmSheet({ visible, onClose, title, text, confirmLabel, onConfirm, loading, error }: ConfirmSheetProps) {
  return (
    <SheetTemplate
      visible={visible}
      onClose={onClose}
      title={title}
      closeLabel={t.close}
      footer={
        <>
          <Button label={confirmLabel} variant="danger" onPress={onConfirm} loading={loading} />
          <Button label={t.cancel} variant="ghost" onPress={onClose} disabled={loading} />
        </>
      }
    >
      <Text>{text}</Text>
      {error ? <Banner tone="error" text={error} /> : null}
    </SheetTemplate>
  );
}
