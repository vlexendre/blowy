/**
 * 50 · C'est payé (V5-Paiement-ok) · 51 · Le paiement n'est pas passé (V5-Paiement-echec) :
 * gabarits partagés par la place de sortie et Blowy+ (données passées par l'écran appelant).
 */
import {
  BodyText,
  Button,
  DetailScreen,
  DisplayText,
  Frame,
  Glyph,
  PopIn,
  Row,
  RowGroup,
  v5,
} from '@blowy/ui-mobile';
import { View } from 'react-native';
import { t } from '../../../i18n';

export function PaidView({
  title = t('pay.okTitle'),
  text,
  rows,
  cta,
  onCta,
}: {
  title?: string;
  text: string;
  rows: { label: string; value: string }[];
  cta: string;
  onCta: () => void;
}) {
  return (
    <Frame pad={[52, 18, 22]} testID="pay-ok">
      <View style={{ alignItems: 'center', gap: 12, marginTop: 30 }}>
        <PopIn
          style={{
            width: 96,
            height: 96,
            borderRadius: 32,
            backgroundColor: v5.lime,
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: [
              { offsetX: 0, offsetY: 6, blurRadius: 0, spreadDistance: 0, color: v5.ink },
            ],
          }}
        >
          <Glyph name="check" size={48} strokeWidth={2.4} />
        </PopIn>
        <DisplayText size={46} style={{ marginTop: 8, textAlign: 'center' }}>
          {title}
        </DisplayText>
        <BodyText size={15} weight={600} color={v5.inkSoft} align="center">
          {text}
        </BodyText>
      </View>
      <PopIn delayMs={100} style={{ marginTop: 20 }}>
        <RowGroup>
          {rows.map((r, i) => (
            <Row
              key={r.label}
              first={i === 0}
              label={r.label}
              value={r.value}
              valueColor={v5.ink}
              valueWeight={700}
            />
          ))}
        </RowGroup>
      </PopIn>
      <View style={{ marginTop: 'auto' }}>
        <Button variant="b2" label={cta} icon="arrow" iconPosition="trailing" onPress={onCta} />
      </View>
    </Frame>
  );
}

export function PayFailedView({
  text,
  onBack,
  onRetry,
  onOtherCard,
  onSkip,
}: {
  text: string;
  onBack: () => void;
  onRetry: () => void;
  onOtherCard: () => void;
  onSkip?: () => void;
}) {
  return (
    <DetailScreen
      title={t('pay.failedHeader')}
      titleSize={38}
      backLabel={t('common.back')}
      onBack={onBack}
      pad={[52, 18, 22]}
      gap={0}
      testID="pay-failed"
    >
      <View
        style={{
          marginTop: 26,
          width: 84,
          height: 84,
          borderRadius: 28,
          backgroundColor: v5.dangerPale,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Glyph name="warning" size={44} color={v5.danger} color2={v5.white} />
      </View>
      <DisplayText size={44} lineHeight={0.92} style={{ marginTop: 14 }}>
        {t('pay.failedTitle')}
      </DisplayText>
      <BodyText size={15} weight={600} lh={1.5} color={v5.inkSoft} style={{ marginTop: 10 }}>
        {text}
      </BodyText>
      <View style={{ marginTop: 'auto', gap: 4 }}>
        <Button
          variant="b1"
          label={t('pay.retry')}
          icon="arrow"
          iconPosition="trailing"
          onPress={onRetry}
        />
        <Button
          variant="ghost"
          tint={v5.inkSoft}
          label={t('pay.otherCard')}
          onPress={onOtherCard}
        />
        {onSkip ? (
          <Button variant="ghost" tint={v5.inkSoft} label={t('pay.skip')} onPress={onSkip} />
        ) : null}
      </View>
    </DetailScreen>
  );
}
