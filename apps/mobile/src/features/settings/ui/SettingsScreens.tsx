/**
 * 54 · Réglages (V5-Reglages) · 55 · Confidentialité (V5-Confidentialite, V5.4 §A2–A4) ·
 * 56 · Signaler (V5-Signaler) · 57 · Supprimer (V5-Supprimer) · 47 · Affiner plus tard (V5-Affiner) ·
 * 48 · Une histoire (V5-Affiner-histoire) · 58 · Éviter (V5-Eviter, V5.4 §A6 : proposé avant la
 * 1ʳᵉ composition). Rien de ce qui est réglé ici n'est montré au groupe.
 */
import type { CreateReportRequest } from '@blowy/api-contract';
import {
  BackButton,
  BodyText,
  Button,
  CardV5,
  ChoicePills,
  DetailScreen,
  Frame,
  StepTag,
  DisplayText,
  Glyph,
  NoteCard,
  Pill,
  PopIn,
  Row,
  RowGroup,
  SectionLabel,
  Switch,
  Tap,
  v5,
} from '@blowy/ui-mobile';
import type { KIDS_HORIZONS } from '@blowy/domain';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';
import { clock } from '../../../core/clock';
import { dayLong, dayShort } from '../../../core/format/dates';
import { paths } from '../../../core/navigation/paths';
import { ruleV57 } from '../../../core/content/rules';
import { KnowsSomeonePanel } from '../../outings';
import { t, tDynamic, type TKey } from '../../../i18n';
import {
  useConsents,
  useIntentions,
  useMyNeighborhood,
  useOutingPreferences,
  useRecordConsents,
  useRequestDeletion,
  useRequestExport,
  useSaveIntentions,
  useSavePrivacyV5,
  useSignOut,
} from '../../account';
import { useBand } from '../../band';
import { useDuos } from '../../duos';
import { useOnboarding } from '../../onboarding';
import { outingPhase, useMyOuting } from '../../outings';
import { useAllowances } from '../../payments';
import { useMemories, useMyPet } from '../../pets';
import { useRaiseAlert } from '../../safety';
import { useSafetyActions } from '../../trust';
import {
  useDeclineContactAvoidance,
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '../api/hooks';
import { useDevicePrefs } from '../model/device-prefs';
import { REPORT_REASONS, reportRequest, type ReportReasonKey } from '../model/report';

const back = (fallback: string) => () =>
  router.canGoBack() ? router.back() : router.replace(fallback as never);

// ---------------------------------------------------------------- 54 · Réglages
export function SettingsScreen() {
  const draftSlots = useOnboarding((s) => s.slots);
  const hood = useMyNeighborhood();
  const prefs = useOutingPreferences();
  const intentions = useIntentions();
  const allowances = useAllowances();
  const notif = useNotificationSettings();
  const setNotif = useUpdateNotificationSettings();
  const my = useMyOuting();
  const petSize = useDevicePrefs((s) => s.petSize);
  const weeksAlternate = useDevicePrefs((s) => s.weeksAlternate);
  const setPrefs = useDevicePrefs((s) => s.set);
  const signOut = useSignOut();
  const slots = draftSlots.map((k) => t(`settings5.slotShort.${k}` as TKey)).join(', ');
  const extra = Math.max(0, (prefs.data?.neighborhoodIds.length ?? 1) - 1);
  const hoodName = hood.data?.neighborhood?.name ?? '';
  const mode = intentions.data?.meetingMode;
  const messagesOn = notif.data?.categories.HUMAN_MESSAGE ?? true;
  return (
    <DetailScreen
      title={t('settings5.title')}
      titleSize={40}
      backLabel={t('common.back')}
      onBack={back(paths.profile)}
      pad={[52, 16, 24]}
      gap={10}
      scroll
      testID="settings"
    >
      <PopIn>
        <Tap
          onPress={() => router.push(paths.pause)}
          accessibilityRole="link"
          pressDepth={0}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            minHeight: 56,
            paddingHorizontal: 14,
            borderRadius: 20,
            backgroundColor: v5.ink,
          }}
        >
          <Glyph name="pause" size={20} color={v5.lime} />
          <BodyText size={15} weight={800} color={v5.white}>
            {t('settings5.pause')}
          </BodyText>
          <BodyText size={12} weight={600} color={v5.mist} style={{ marginLeft: 'auto' }}>
            {t('settings5.pauseValue')}
          </BodyText>
          <Glyph name="chevron" size={14} color={v5.white} />
        </Tap>
      </PopIn>
      <SectionLabel>{t('settings5.outings')}</SectionLabel>
      <RowGroup>
        <Row
          first
          label={t('settings5.slots')}
          value={slots || t('settings5.toChoose')}
          chevron
          onPress={() => router.push(paths.onboarding('slots'))}
        />
        <Row
          label={t('settings5.weeksOff')}
          value={
            weeksAlternate || prefs.data?.everyOtherWeekOffFrom
              ? t('settings5.weeksAlternate')
              : t('settings5.weeksOffValue')
          }
          chevron
          onPress={() => router.push(paths.weeks)}
        />
        <Row
          label={t('settings5.hoods')}
          value={extra ? t('settings5.hoodsValue', { name: hoodName, n: extra }) : hoodName}
          chevron
          onPress={() => router.push(paths.onboarding('city'))}
        />
        <Row
          label={t('settings5.format')}
          value={
            mode ? t('settings5.formatValue', { mode: tDynamic(`settings5.mode.${mode}`) }) : ''
          }
          chevron
          onPress={() => router.push(paths.onboarding('meet'))}
        />
        <Row
          label={t('settings5.petSize')}
          value={petSize === 'large' ? t('settings5.petLarge') : t('settings5.petSmall')}
          chevron
          onPress={() => setPrefs({ petSize: petSize === 'large' ? 'small' : 'large' })}
        />
        <Row
          label={t('settings5.refine')}
          value={t('settings5.refineValue')}
          chevron
          onPress={() => router.push(paths.refine)}
        />
      </RowGroup>
      <SectionLabel>{t('settings5.notifications')}</SectionLabel>
      <RowGroup>
        <Row
          first
          label={t('settings5.proposals')}
          value={t('settings5.proposalsValue', { n: notif.data?.maxOutingProposalsPerWeek ?? 1 })}
        />
        <Row
          label={t('settings5.messages')}
          trailing={
            <Switch
              value={messagesOn}
              disabled={!notif.data}
              accessibilityLabel={
                messagesOn ? t('settings5.messagesOn') : t('settings5.messagesOff')
              }
              onValueChange={(v) => setNotif.mutate({ categories: { HUMAN_MESSAGE: v } })}
            />
          }
        />
      </RowGroup>
      <SectionLabel>{t('settings5.account')}</SectionLabel>
      <RowGroup>
        <Row
          first
          label={t('settings5.privacy')}
          value={t('settings5.privacyValue')}
          chevron
          onPress={() => router.push(paths.privacy)}
        />
        <Row
          label={t('settings5.guardian')}
          value={t('settings5.guardianValue')}
          chevron
          onPress={
            my.outing.data
              ? () => router.push(paths.outingStep(my.outing.data!.id, 'guardian'))
              : undefined
          }
        />
        <Row
          label={t('settings5.pricing')}
          value={allowances.data?.plus.active ? t('plus.active') : t('plus.free')}
          chevron
          onPress={() => router.push(paths.pricing)}
        />
        <Row
          label={t('settings5.leave')}
          value={t('settings5.leaveValue')}
          chevron
          onPress={() => router.push(paths.leave)}
        />
        <Row
          label={t('settings5.help')}
          value={t('settings5.helpValue')}
          chevron
          onPress={() => router.push(paths.report)}
        />
      </RowGroup>
      <RowGroup>
        <Row
          first
          label={t('settings5.logout')}
          onPress={() =>
            signOut.mutate(undefined, { onSettled: () => router.replace(paths.welcome) })
          }
        />
        <Row
          label={t('settings5.delete')}
          color={v5.danger}
          onPress={() => router.push(paths.deleteAccount)}
        />
      </RowGroup>
    </DetailScreen>
  );
}

// ---------------------------------------------------------------- 55 · Confidentialité
function WhoRow({ who, what, first }: { who: string; what: string; first?: boolean }) {
  return (
    <View
      accessible
      accessibilityLabel={`${who} : ${what}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 64,
        paddingHorizontal: 14,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: v5.line,
      }}
    >
      <BodyText size={14} weight={700} style={{ width: 96 }}>
        {who}
      </BodyText>
      <BodyText size={12} weight={600} color={v5.grey} align="right" style={{ flex: 1 }}>
        {what}
      </BodyText>
    </View>
  );
}

export function PrivacyScreen() {
  const discreet = useDevicePrefs((s) => s.discreet);
  const hidePreviews = useDevicePrefs((s) => s.hidePreviews);
  const setPrefs = useDevicePrefs((s) => s.set);
  const savePrivacy = useSavePrivacyV5();
  const setNotif = useUpdateNotificationSettings();
  const consents = useConsents();
  const record = useRecordConsents();
  const exportData = useRequestExport();
  const [withdrawn, setWithdrawn] = useState(false);
  const sensitive = consents.data?.items.find(
    (i) => i.purpose === 'SENSITIVE_PREFERENCES' && i.granted,
  );
  const toggleDiscreet = (v: boolean) => {
    setPrefs({ discreet: v });
    savePrivacy.mutate({ discreetMode: v });
    setNotif.mutate({ discreetMode: v });
  };
  const withdraw = () => {
    const version = consents.data?.currentVersions.SENSITIVE_PREFERENCES;
    if (!version) return;
    record.mutate(
      { items: [{ purpose: 'SENSITIVE_PREFERENCES', version, granted: false }] },
      { onSuccess: () => setWithdrawn(true) },
    );
  };
  return (
    <DetailScreen
      title={t('privacy5.title')}
      titleSize={32}
      backLabel={t('common.back')}
      onBack={back(paths.settings)}
      pad={[52, 16, 24]}
      gap={10}
      scroll
      testID="privacy"
    >
      <SectionLabel>{t('privacy5.who')}</SectionLabel>
      <RowGroup>
        <WhoRow first who={t('privacy5.group')} what={t('privacy5.groupWhat')} />
        <WhoRow who={t('privacy5.band')} what={t('privacy5.bandWhat')} />
        <WhoRow
          who={t('privacy5.reliability')}
          what={ruleV57('reliability_self').replace(/\.$/, '').toLowerCase()}
        />
        <WhoRow who={t('privacy5.avoided')} what={t('privacy5.avoidedWhat')} />
        <WhoRow who={t('privacy5.cards')} what={t('privacy5.cardsWhat')} />
        <WhoRow who={t('privacy5.venue')} what={t('privacy5.venueWhat')} />
        <WhoRow who={t('privacy5.duo')} what={t('privacy5.duoWhat')} />
        <WhoRow who={t('privacy5.guardian')} what={t('privacy5.guardianWhat')} />
        <WhoRow who={t('privacy5.nobody')} what={t('privacy5.nobodyWhat')} />
      </RowGroup>
      <BodyText size={13} weight={700} lh={1.25} style={{ paddingHorizontal: 4 }}>
        {t('privacy5.promise')}
      </BodyText>
      <SectionLabel>{t('privacy5.discretion')}</SectionLabel>
      <RowGroup>
        <Row
          first
          minHeight={60}
          wrap
          label={t('privacy5.discreet')}
          sub={discreet ? t('privacy5.discreetOn') : t('privacy5.discreetOff')}
          trailing={
            <Switch
              value={discreet}
              onValueChange={toggleDiscreet}
              accessibilityLabel={
                discreet ? t('privacy5.discreetA11yOn') : t('privacy5.discreetA11yOff')
              }
            />
          }
        />
        <Row
          minHeight={60}
          wrap
          label={t('privacy5.previews')}
          sub={hidePreviews ? t('privacy5.previewsOn') : t('privacy5.previewsOff')}
          trailing={
            <Switch
              value={hidePreviews}
              onValueChange={(v) => setPrefs({ hidePreviews: v })}
              accessibilityLabel={
                hidePreviews ? t('privacy5.previewsA11yOn') : t('privacy5.previewsA11yOff')
              }
            />
          }
        />
      </RowGroup>
      <RowGroup>
        <Row
          first
          minHeight={56}
          wrap
          label={t('privacy5.avoid')}
          value={t('privacy5.avoidValue')}
          chevron
          onPress={() => router.push(paths.avoid)}
        />
      </RowGroup>
      <SectionLabel>{t('privacy5.sensitive')}</SectionLabel>
      <RowGroup>
        <Row
          first
          wrap
          label={
            sensitive && !withdrawn
              ? t('privacy5.consentGiven', { day: dayLong(sensitive.recordedAt) })
              : t('privacy5.consentNone')
          }
          value={t('privacy5.consentWhat')}
        />
        {sensitive && !withdrawn ? (
          <Row label={t('privacy5.withdraw')} color={v5.danger} chevron onPress={withdraw} />
        ) : null}
      </RowGroup>
      <SectionLabel>{t('privacy5.retention')}</SectionLabel>
      <RowGroup>
        <Row first label={t('privacy5.selfie')} value={t('privacy5.selfieValue')} />
        <Row label={t('privacy5.votes')} value={t('privacy5.votesValue')} />
        <Row wrap label={t('privacy5.position')} value={t('privacy5.positionValue')} />
        <Row
          label={t('privacy5.export')}
          value={
            exportData.isSuccess
              ? t('privacy5.exportAsked')
              : exportData.isError
                ? t('common.unavailableShort')
                : t('privacy5.exportValue')
          }
          chevron
          onPress={exportData.isSuccess ? undefined : () => exportData.mutate(undefined)}
        />
      </RowGroup>
    </DetailScreen>
  );
}

// ---------------------------------------------------------------- 56 · Signaler
const EMERGENCY: { n: string; label: TKey; url: string }[] = [
  { n: '17', label: 'report5.police', url: 'tel:17' },
  { n: '112', label: 'report5.urgences', url: 'tel:112' },
  { n: '114', label: 'report5.sms', url: 'sms:114' },
  { n: '3919', label: 'report5.violences', url: 'tel:3919' },
];

export function ReportScreen() {
  const params = useLocalSearchParams<{
    outing?: string;
    user?: string;
    message?: string;
    block?: string;
    knows?: string;
  }>();
  const [reason, setReason] = useState<ReportReasonKey | null>(null);
  const [block, setBlock] = useState(params.block === '1');
  const [sent, setSent] = useState(false);
  const { report } = useSafetyActions();
  const callback = useRaiseAlert(params.outing ? { kind: 'OUTING', id: params.outing } : null);
  const req: CreateReportRequest | null = reason
    ? reportRequest(
        reason,
        { outingId: params.outing, userId: params.user, messageId: params.message },
        block,
      )
    : null;
  const send = () => {
    if (!req) return;
    report(req);
    setSent(true);
  };
  return (
    <DetailScreen
      title={t('report5.title')}
      titleSize={40}
      backLabel={t('common.back')}
      onBack={back(paths.home)}
      pad={[52, 16, 24]}
      gap={10}
      scroll
      testID="report"
    >
      <PopIn style={{ backgroundColor: v5.danger, borderRadius: 20, padding: 14, gap: 10 }}>
        <DisplayText size={22} color={v5.white}>
          {t('report5.danger')}
        </DisplayText>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {EMERGENCY.map((e) => (
            <Tap
              key={e.n}
              onPress={() => void Linking.openURL(e.url)}
              accessibilityRole="link"
              accessibilityLabel={t('report5.callA11y', { n: e.n, what: t(e.label) })}
              pressDepth={0}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: 14,
                backgroundColor: v5.white,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BodyText size={13} weight={800} lh={1.1} color={v5.danger}>
                {e.n}
              </BodyText>
              <BodyText size={10} weight={700} lh={1.1} color={v5.danger}>
                {t(e.label)}
              </BodyText>
            </Tap>
          ))}
        </View>
        <Tap
          onPress={params.outing ? () => callback.mutate() : () => void Linking.openURL('tel:17')}
          accessibilityRole="button"
          pressDepth={0}
          style={{
            minHeight: 44,
            borderRadius: 14,
            backgroundColor: 'rgba(0,0,0,0.22)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 6,
            paddingHorizontal: 14,
          }}
        >
          <BodyText size={14} weight={800} color={v5.white} align="center">
            {callback.data?.callbackTargetMinutes
              ? ruleV57('help_callback')
              : callback.isSuccess
                ? t('report5.callbackAsked')
                : t('report5.callback')}
          </BodyText>
        </Tap>
      </PopIn>
      <BodyText
        size={12}
        weight={600}
        lh={1.45}
        color={v5.inkSoft}
        style={{ paddingHorizontal: 4 }}
      >
        {t('report5.delays')}
      </BodyText>
      {params.knows === '1' && params.outing ? (
        <KnowsSomeonePanel outingId={params.outing} />
      ) : null}
      {(['during', 'messages'] as const).map((g) => (
        <View key={g} style={{ gap: 6 }}>
          <SectionLabel style={{ marginTop: 4 }}>{t(`report5.group.${g}`)}</SectionLabel>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel={t(`report5.group.${g}`)}
            style={{ gap: 6 }}
          >
            {REPORT_REASONS.filter((r) => r.group === g).map((r) => {
              const on = reason === r.key;
              return (
                <Tap
                  key={r.key}
                  onPress={() => setReason(r.key)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  pressDepth={0}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    minHeight: 48,
                    paddingHorizontal: 14,
                    borderRadius: 16,
                    backgroundColor: on ? v5.ink : v5.white,
                    boxShadow: [
                      {
                        offsetX: 0,
                        offsetY: 3,
                        blurRadius: 0,
                        spreadDistance: 0,
                        color: v5.shadowCream,
                      },
                    ],
                  }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      borderWidth: 3,
                      borderColor: on ? v5.lime : v5.greyWarm,
                      backgroundColor: on ? v5.lime : 'transparent',
                    }}
                  />
                  <BodyText
                    size={14}
                    weight={700}
                    color={on ? v5.white : v5.ink}
                    style={{ flexShrink: 1 }}
                  >
                    {t(`report5.reason.${r.key}`)}
                  </BodyText>
                </Tap>
              );
            })}
          </View>
        </View>
      ))}
      <CardV5 style={{ paddingVertical: 12, paddingHorizontal: 14, gap: 8 }}>
        <Tap
          onPress={() => setBlock(!block)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: block }}
          pressDepth={0}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 7,
              borderWidth: 2.5,
              borderColor: v5.greyWarm,
              backgroundColor: block ? v5.ink : v5.white,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {block ? <Glyph name="check" size={14} color={v5.white} /> : null}
          </View>
          <BodyText size={14} weight={800} style={{ flexShrink: 1 }}>
            {t('report5.block')}
          </BodyText>
        </Tap>
        <Pill
          label={t('report5.capture')}
          background={v5.sand}
          padding={[13, 12]}
          fontSize={13}
          style={{ alignSelf: 'flex-start', borderRadius: 14, opacity: 0.6 }}
          accessibilityLabel={t('report5.captureA11y')}
        />
      </CardV5>
      <BodyText
        size={13}
        weight={600}
        lh={1.45}
        color={v5.inkSoft}
        style={{ paddingHorizontal: 4 }}
      >
        {t('report5.anonymous')}
      </BodyText>
      <View style={{ marginTop: 4 }}>
        {sent ? (
          <BodyText size={15} weight={800} align="center" accessibilityLiveRegion="polite">
            {t('report5.sent')}
          </BodyText>
        ) : req ? (
          <Button
            variant="b1"
            tint={v5.danger}
            label={t('report5.send')}
            onPress={send}
            testID="report-send"
          />
        ) : (
          <Button
            variant="bdis"
            disabled
            label={reason ? t('report5.noTarget') : t('report5.pick')}
          />
        )}
      </View>
    </DetailScreen>
  );
}

// ---------------------------------------------------------------- 57 · Supprimer
const LEAVE_REASONS = ['few', 'met', 'notForMe'] as const;

export function DeleteAccountScreen() {
  const [why, setWhy] = useState<string | null>(null);
  const memories = useMemories();
  const pet = useMyPet();
  const band = useBand();
  const duos = useDuos();
  const my = useMyOuting();
  const allowances = useAllowances();
  const del = useRequestDeletion();
  const signOut = useSignOut();
  const o = my.outing.data;
  const seatBeforeLock =
    o &&
    ['invited', 'going'].includes(outingPhase(o, clock.now())) &&
    o.mySeat.status === 'CONFIRMED';
  const hasDuo = (duos.data?.items ?? []).some((d) => d.status !== 'CLOSED');
  const items: { text: string; keep?: boolean }[] = [
    {
      text: t('delete5.memories', {
        n: memories.data?.items.length ?? 0,
        pet: pet.data?.name ?? '',
      }),
    },
    {
      text: hasDuo
        ? t('delete5.bandDuo', { n: band.data?.items.length ?? 0 })
        : t('delete5.band', { n: band.data?.items.length ?? 0 }),
    },
    { text: t('delete5.messages') },
    ...(seatBeforeLock && o
      ? [{ text: t('delete5.seat', { day: dayShort(o.startsAt) }), keep: true }]
      : []),
  ];
  const doDelete = () =>
    del.mutate(undefined, {
      onSuccess: () =>
        signOut.mutate(undefined, { onSettled: () => router.replace(paths.welcome) }),
    });
  return (
    <DetailScreen
      title={t('delete5.title')}
      titleSize={40}
      backLabel={t('common.back')}
      onBack={back(paths.settings)}
      pad={[52, 16, 22]}
      gap={12}
      testID="delete"
    >
      <BodyText size={14} weight={600} lh={1.45} color={v5.inkSoft}>
        {t('delete5.intro')}
      </BodyText>
      <CardV5
        style={{
          paddingVertical: 10,
          paddingHorizontal: 14,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 6,
          alignItems: 'center',
        }}
      >
        <BodyText size={13} weight={800} style={{ width: '100%' }}>
          {t('delete5.why')}
        </BodyText>
        {LEAVE_REASONS.map((r) => (
          <Tap
            key={r}
            onPress={() => setWhy(why === r ? null : r)}
            accessibilityRole="radio"
            accessibilityState={{ checked: why === r }}
            pressDepth={0}
            style={{
              minHeight: 44,
              paddingHorizontal: 12,
              borderRadius: 14,
              backgroundColor: why === r ? v5.ink : v5.sand,
              justifyContent: 'center',
            }}
          >
            <BodyText size={13} weight={800} color={why === r ? v5.white : v5.ink} nowrap>
              {t(`delete5.reason.${r}`)}
            </BodyText>
          </Tap>
        ))}
      </CardV5>
      <RowGroup>
        {items.map((it, i) => (
          <Row
            key={it.text}
            first={i === 0}
            minHeight={44}
            fontSize={13}
            wrap
            label={it.text}
            leading={
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: it.keep ? v5.green : v5.danger,
                }}
              />
            }
          />
        ))}
      </RowGroup>
      <CardV5 style={{ paddingVertical: 12, paddingHorizontal: 14, gap: 4 }}>
        <BodyText size={14} weight={800}>
          {t('delete5.subscription')}
        </BodyText>
        <BodyText size={13} weight={600} lh={1.45} color={v5.inkSoft}>
          {allowances.data?.plus.active
            ? t('delete5.subscriptionActive')
            : t('delete5.subscriptionNone')}
        </BodyText>
      </CardV5>
      <BodyText size={12} weight={600} lh={1.45} color={v5.inkSoft}>
        {t('delete5.legal')}
      </BodyText>
      {del.isError ? (
        <BodyText size={13} weight={700} color={v5.danger} accessibilityLiveRegion="polite">
          {t('common.unavailableShort')}
        </BodyText>
      ) : null}
      <View style={{ marginTop: 'auto', flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Button
            variant="b3"
            label={t('delete5.pause')}
            onPress={() => router.replace(paths.pause)}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            variant="b3"
            tint={v5.danger}
            label={t('delete5.confirm')}
            loading={del.isPending}
            onPress={doDelete}
            testID="delete-confirm"
          />
        </View>
      </View>
    </DetailScreen>
  );
}

// ---------------------------------------------------------------- 47 · Affiner plus tard
export function RefineScreen() {
  const prefs = useOutingPreferences();
  const p = prefs.data;
  const activities = p?.activities.length
    ? p.activities.map((a) => tDynamic(`activity.${a}`)).join(', ')
    : t('refine5.petChooses', { pet: t('petName.NINO') });
  const ages = p ? t('refine5.ages', { a: p.groupAge.min, b: p.groupAge.max }) : '';
  const lock = <Glyph name="lock" size={16} color={v5.ink} color2={v5.white} />;
  return (
    <DetailScreen
      title={t('refine5.title')}
      titleSize={40}
      backLabel={t('common.back')}
      onBack={back(paths.profile)}
      pad={[52, 16, 24]}
      gap={10}
      testID="refine"
    >
      <BodyText size={14} weight={600} lh={1.45} color={v5.inkSoft}>
        {t('refine5.introV55')}
      </BodyText>
      <SectionLabel>{t('refine5.outings')}</SectionLabel>
      <RowGroup>
        <Row
          first
          minHeight={54}
          wrap
          label={t('refine5.ambiance')}
          value={p ? t(`refine5.ambianceValue.${p.ambiance ?? 'ANY'}`) : ''}
          chevron
          onPress={() => router.push(paths.refineAmbiance)}
        />
        <Row minHeight={54} wrap label={t('refine5.activities')} value={activities} chevron />
        <Row
          minHeight={54}
          wrap
          label={t('refine5.topics')}
          value={t('refine5.toChoose')}
          chevron
        />
        <Row minHeight={54} wrap label={t('refine5.groupAge')} value={ages} chevron />
      </RowGroup>
      <SectionLabel>{t('refine5.storySection')}</SectionLabel>
      <RowGroup>
        <Row
          first
          minHeight={54}
          wrap
          leading={lock}
          label={t('refine5.storyV55')}
          value={t('refine5.secret')}
          chevron
          onPress={() => router.push(paths.refineStory)}
        />
        <Row
          minHeight={54}
          wrap
          leading={lock}
          label={t('refine5.storyAge')}
          value={ages}
          chevron
          onPress={() => router.push(paths.refineAge)}
        />
      </RowGroup>
    </DetailScreen>
  );
}

// ---------------------------------------------------------------- 48 · Une histoire
type Tone = 'SERIOUS' | 'SEE_HOW_IT_GOES';
type Kids = (typeof KIDS_HORIZONS)[number];

/** Ordre des maquettes V5.6 (Affiner-histoire). */
const KIDS_HORIZONS_ORDER: readonly Kids[] = [
  'IN_1_2_YEARS',
  'IN_3_5_YEARS',
  'HAS_ALREADY',
  'NO_PLAN',
  'DONT_KNOW',
];

export function RefineStoryScreen() {
  const intentions = useIntentions();
  const consents = useConsents();
  const putIntentions = useSaveIntentions();
  const i = intentions.data;
  const [tone, setTone] = useState<Tone | null>(null);
  const [kids, setKids] = useState<Kids | null>(null);
  const curTone = tone ?? i?.storySeriousness ?? null;
  const curKids = kids ?? i?.kidsHorizon ?? null;
  const sensitive = consents.data?.items.find(
    (c) => c.purpose === 'SENSITIVE_PREFERENCES' && c.granted,
  );
  const save = () => {
    if (!i) return;
    putIntentions.mutate(
      { ...i, storySeriousness: curTone, kidsSomeday: null, kidsHorizon: curKids },
      { onSuccess: () => router.replace(paths.refine) },
    );
  };
  return (
    <DetailScreen
      title={t('story5.title')}
      titleSize={38}
      backLabel={t('common.back')}
      onBack={back(paths.refine)}
      pad={[52, 20, 22]}
      gap={10}
      testID="refine-story"
    >
      {sensitive ? (
        <Pill
          label={t('story5.covered', { day: dayLong(sensitive.recordedAt) })}
          background={v5.ink}
          color={v5.lime}
          padding={[7, 12]}
          leading={<Glyph name="lock" size={14} color={v5.lime} color2={v5.ink} />}
          style={{ alignSelf: 'flex-start' }}
        />
      ) : null}
      <BodyText size={15} weight={800} style={{ marginTop: 8 }}>
        {t('story5.tone')}
      </BodyText>
      <ChoicePills
        label={t('story5.tone')}
        options={(['SERIOUS', 'SEE_HOW_IT_GOES'] as const).map((k) => ({
          key: k,
          label: t(`story5.toneOpt.${k}`),
        }))}
        value={curTone}
        onChange={setTone}
      />
      <BodyText size={15} weight={800} style={{ marginTop: 8 }}>
        {t('story5.kids')}
      </BodyText>
      <ChoicePills
        label={t('story5.kids')}
        keepGrid
        options={KIDS_HORIZONS_ORDER.map((k) => ({ key: k, label: t(`story5.horizonOpt.${k}`) }))}
        value={curKids}
        onChange={setKids}
      />
      <NoteCard style={{ marginTop: 8 }} lines={[t('story5.note1'), t('story5.note2')]} />
      <View style={{ marginTop: 'auto' }}>
        <Button
          variant="b2"
          label={t('story5.save')}
          loading={putIntentions.isPending}
          disabled={!i || !sensitive}
          onPress={save}
        />
      </View>
    </DetailScreen>
  );
}

// ---------------------------------------------------------------- 58 · Éviter les personnes que je connais
export function AvoidScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const onboarding = from === 'onboarding';
  const setPrefs = useDevicePrefs((s) => s.set);
  const [unavailable, setUnavailable] = useState(false);
  const decline = useDeclineContactAvoidance();
  const next = () => (onboarding ? router.replace(paths.found) : back(paths.privacy)());
  const yes = () => {
    // L'activation exige un jeton de numéro VÉRIFIÉ (`phoneVerificationToken`) et le client OPRF P-256 :
    // aucun fournisseur de vérification de numéro n'est branché côté app au 2026-11-06 → on n'ouvre PAS
    // l'accès aux contacts (permission inutile) et on le dit, plutôt que de simuler une protection.
    setUnavailable(true);
    setPrefs({ avoidAsked: true });
  };
  const no = () => {
    setPrefs({ avoidAsked: true });
    // Réponse enregistrée côté serveur (`askBeforeFirstOuting` passe à faux) ; hors ligne : retenue sur l'appareil.
    decline.mutate(undefined, { onSettled: next });
  };
  return (
    <Frame pad={[52, 20, 22]} gap={10} testID="avoid">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <BackButton
          onPress={
            onboarding ? () => router.replace(paths.onboarding('slots')) : back(paths.refine)
          }
          label={t('common.back')}
        />
        <StepTag
          step={0}
          total={0}
          badge="+"
          progress={null}
          label={t('avoid5.tag')}
          accessibilityLabel={t('avoid5.tag')}
        />
      </View>
      <DisplayText size={38} lineHeight={0.92} style={{ marginTop: 16 }}>
        {t('avoid5.title')}
      </DisplayText>
      <BodyText size={14} weight={600} lh={1.5} color={v5.inkSoft}>
        {t('avoid5.intro')}
      </BodyText>
      <NoteCard
        tone="light"
        style={{ marginTop: 4 }}
        lines={[t('avoid5.l1'), t('avoid5.l2'), t('avoid5.l3')]}
      />
      <BodyText
        size={12}
        weight={600}
        lh={1.45}
        color={v5.inkSoft}
        style={{ paddingHorizontal: 4 }}
        accessibilityLiveRegion="polite"
      >
        {unavailable ? t('avoid5.unavailable') : t('avoid5.off')}
      </BodyText>
      <View style={{ marginTop: 'auto', flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          {unavailable ? (
            <Button variant="b3" label={t('avoid5.continue')} onPress={next} />
          ) : (
            <Button variant="b3" label={t('avoid5.yes')} onPress={yes} testID="avoid-yes" />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Button variant="b3" label={t('avoid5.no')} onPress={no} testID="avoid-no" />
        </View>
      </View>
    </Frame>
  );
}
