/**
 * Feuille de paiement de DÉMONSTRATION locale (provider `LOCAL_DEMO`, jamais en production) : elle
 * reprend la mise en page de la feuille système (V5-Paiement) pour que le parcours se teste sans
 * carte. Avec Stripe, c'est la vraie feuille Apple Pay du système qui s'affiche à la place.
 * Aucune carte réelle n'est montrée : la ligne « Carte » dit « Démo locale · aucun débit ».
 */
import { BodyText, DisplayText, Glyph, PopIn, Tap, v5 } from '@blowy/ui-mobile';
import { View } from 'react-native';
import { t } from '../../../i18n';

const SYS = {
  bg: '#F2F2F7',
  line: '#E5E5EA',
  grey: '#3C3C43',
  black: '#000000',
  white: '#FFFFFF',
  scrim: 'rgba(0,0,0,0.45)',
} as const;

export interface DemoPaySheetProps {
  /** Détail avant la carte (place, activité prépayée). */
  lines?: readonly { label: string; value: string }[];
  title: string;
  sub: string;
  total: string;
  note: string;
  onPay: () => void;
  onCancel: () => void;
  busy?: boolean;
}

export function DemoPaySheet({
  title,
  sub,
  total,
  note,
  lines,
  onPay,
  onCancel,
  busy,
}: DemoPaySheetProps) {
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 30,
        backgroundColor: SYS.scrim,
        justifyContent: 'flex-end',
      }}
    >
      <PopIn
        style={{
          backgroundColor: SYS.bg,
          borderTopLeftRadius: 14,
          borderTopRightRadius: 14,
          paddingTop: 14,
          paddingHorizontal: 16,
          paddingBottom: 30,
          gap: 12,
        }}
      >
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <BodyText size={17} weight={700} color={SYS.black}>
            {t('pay.applePay')}
          </BodyText>
          <Tap
            onPress={onCancel}
            accessibilityLabel={t('pay.cancel')}
            pressDepth={0}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: SYS.line,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Glyph name="close" size={12} color={SYS.grey} />
            </View>
          </Tap>
        </View>
        <View style={{ backgroundColor: SYS.white, borderRadius: 12, overflow: 'hidden' }}>
          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderBottomWidth: 1,
              borderBottomColor: SYS.line,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: v5.coralBtn,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DisplayText size={18} color={SYS.white} heading={false}>
                b.
              </DisplayText>
            </View>
            <View style={{ flexShrink: 1 }}>
              <BodyText size={15} weight={600} color={SYS.black}>
                {title}
              </BodyText>
              <BodyText size={13} weight={400} color={SYS.grey}>
                {sub}
              </BodyText>
            </View>
          </View>
          {(lines ?? []).map((l) => (
            <View
              key={l.label}
              style={{
                flexDirection: 'row',
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderBottomWidth: 1,
                borderBottomColor: SYS.line,
              }}
            >
              <BodyText size={15} weight={400} color={SYS.black} style={{ flexShrink: 1 }}>
                {l.label}
              </BodyText>
              <BodyText size={15} weight={400} color={SYS.grey} style={{ marginLeft: 'auto' }}>
                {l.value}
              </BodyText>
            </View>
          ))}
          <View
            style={{
              flexDirection: 'row',
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderBottomWidth: 1,
              borderBottomColor: SYS.line,
            }}
          >
            <BodyText size={15} weight={400} color={SYS.black}>
              {t('pay.card')}
            </BodyText>
            <BodyText size={15} weight={400} color={SYS.grey} style={{ marginLeft: 'auto' }}>
              {t('pay.demoCard')}
            </BodyText>
          </View>
          <View style={{ flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 14 }}>
            <BodyText size={15} weight={600} color={SYS.black}>
              {t('pay.total')}
            </BodyText>
            <BodyText size={15} weight={700} color={SYS.black} style={{ marginLeft: 'auto' }}>
              {total}
            </BodyText>
          </View>
        </View>
        <BodyText size={13} weight={400} lh={1.4} color={SYS.grey}>
          {note}
        </BodyText>
        <Tap
          onPress={busy ? undefined : onPay}
          accessibilityRole="button"
          accessibilityLabel={t('pay.confirm')}
          pressDepth={0}
          testID="pay-confirm"
          style={{
            minHeight: 52,
            borderRadius: 12,
            backgroundColor: SYS.black,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: busy ? 0.6 : 1,
          }}
        >
          <BodyText size={17} weight={600} color={SYS.white}>
            {t('pay.confirm')}
          </BodyText>
        </Tap>
      </PopIn>
    </View>
  );
}
