/**
 * 14 · Ta place en 1 tap (V5-Compte) · 15 · Selfie vérifié (V5-Verif) · 57 · Selfie non vérifié
 * (V5-Verif-echec) · 16 · Notifications (V5-Notifs) · 58 · Notifications refusées (V5-Notifs-refus).
 * Le compte arrive APRÈS « Je viens » quand la personne a déjà vu sa sortie, ou après les
 * créneaux si aucune session n'existe encore (aperçu anonyme impossible sans compte : écart API).
 */
import { AuthButton, BackButton, Blob, bodyFont, BodyText, Button, CardV5, CheckLine, DisplayText, Frame, Glyph, Pill, PopIn, Portrait, Sprite, StepTag, SwitchCard, Tap, v5, v5Alpha } from '@blowy/ui-mobile';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { localAuthEnabled, env } from '../../../core/config/env';
import { paths } from '../../../core/navigation/paths';
import { useServices } from '../../../core/providers/services';
import { t } from '../../../i18n';
import { createAccountRepository, useMe, useSignIn, useStartVerification } from '../../account';
import { createPetsRepository } from '../../pets';
import { createOutingsRepository, useMyOuting, schedule } from '../../outings';
import { submitOnboarding } from '../model/submit';
import { useOnboarding } from '../model/store';
import { useDevicePrefs } from '../../settings';

function useSubmit() {
  const { api, newCommandId } = useServices();
  return useMemo(() => {
    const acc = createAccountRepository(api, 'other');
    const pets = createPetsRepository(api);
    const outings = createOutingsRepository(api);
    return (displayName: string, discreet: boolean) =>
      submitOnboarding(useOnboarding.getState(), { displayName, discreet }, {
        updateProfile: (b) => acc.updateProfile(newCommandId(), b),
        searchNeighborhoods: (q) => acc.neighborhoods(q),
        setNeighborhood: (id) => acc.setNeighborhood(newCommandId(), id),
        consentVersions: async () => (await acc.consents()).currentVersions,
        recordConsents: (items) => acc.recordConsents(newCommandId(), { items: items as never }),
        putIntentions: (b) => acc.putIntentions(newCommandId(), b),
        putPrivacy: (b) => acc.putPrivacyV5(newCommandId(), b),
        // L'API exige encore la « vision » V4 (POST /v1/pets) que l'onboarding V5.3 ne demande plus :
        // la création échoue honnêtement (écart rapporté, docs/agents/handoffs/V5-T7.md).
        createPet: (species) => pets.create({ name: t(`petName.${species}`), species } as never, newCommandId()),
        completeOnboarding: () => acc.completeOnboarding(newCommandId()),
        joinTeam: (ref) => outings.joinTeam(ref, newCommandId()),
      });
  }, [api, newCommandId]);
}

export function AccountScreen() {
  const draft = useOnboarding();
  const signIn = useSignIn();
  const submit = useSubmit();
  const [name, setName] = useState('');
  // V5.4 §A5 : « Discret » / « Normal » choisi explicitement, aucun des deux présélectionné.
  const [mode, setMode] = useState<'DISCREET' | 'NORMAL' | null>(null);
  const [failedSteps, setFailedSteps] = useState<string[] | null>(null);
  const go = async (provider: 'apple' | 'google') => {
    if (!mode) return;
    useDevicePrefs.getState().set({ discreet: mode === 'DISCREET', discreetChosen: true });
    const res = await signIn.mutateAsync(provider).catch(() => null);
    if (!res) return;
    if (draft.completed) {
      const report = await submit(name || res.givenName || '', mode === 'DISCREET');
      if (!report.ok) return setFailedSteps(report.failed.map((f) => f.step));
    }
    router.replace(paths.verify);
  };
  const MODES = [
    { key: 'DISCREET', title: t('account.discreetOpt'), sub: t('account.discreetSub') },
    { key: 'NORMAL', title: t('account.normal'), sub: t('account.normalSub') },
  ] as const;
  return (
    <Frame pad={[52, 20, 22]} testID="account">
      <PopIn style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace(paths.welcome))} label={t('common.back')} />
        <StepTag step={9} total={9} badge="✓" progress={null} label={t('account.tag')} accessibilityLabel={t('account.tag')} />
      </PopIn>
      <PopIn delayMs={60} style={{ marginTop: 16 }}>
        <DisplayText size={42} lineHeight={0.92}>
          {t('account.title')}
        </DisplayText>
      </PopIn>
      <BodyText size={14} weight={600} lh={1.45} color={v5.inkSoft} style={{ marginTop: 8 }}>
        {t('account.intro')}
      </BodyText>
      <CardV5 style={{ marginTop: 12, paddingHorizontal: 14, minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <BodyText size={14} weight={800}>
          {t('account.displayName')}
        </BodyText>
        <TextInput value={name} onChangeText={setName} placeholder={t('account.namePlaceholder')} placeholderTextColor={v5.grey} accessibilityLabel={t('account.displayName')} style={{ marginLeft: 'auto', width: 130, height: 44, borderBottomWidth: 2, borderBottomColor: v5.ink, ...bodyFont(15, 700), textAlign: 'right', color: v5.ink, padding: 0 }} />
      </CardV5>
      <BodyText size={11} weight={800} ls={0.14} upper color={v5.grey} style={{ marginTop: 14 }}>
        {t('account.appearsAs')}
      </BodyText>
      <View accessibilityRole="radiogroup" accessibilityLabel={t('account.modeA11y')} style={{ marginTop: 8, flexDirection: 'row', gap: 8 }}>
        {MODES.map((m) => {
          const on = mode === m.key;
          return (
            <Tap key={m.key} onPress={() => setMode(m.key)} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={`${m.title}, ${m.sub}`} pressDepth={0} testID={`mode-${m.key}`} style={{ flex: 1, minHeight: 92, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 18, gap: 4, backgroundColor: on ? v5.ink : v5.white, boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 0, spreadDistance: 0, color: v5.shadowCream }] }}>
              <DisplayText size={22} color={on ? v5.white : v5.ink} heading={false}>
                {m.title}
              </DisplayText>
              <BodyText size={12} weight={600} lh={1.35} color={on ? v5.mist : v5.inkSoft}>
                {m.sub}
              </BodyText>
            </Tap>
          );
        })}
      </View>
      {failedSteps ? (
        <CardV5 style={{ marginTop: 10, padding: 12 }}>
          <BodyText size={13} weight={700} lh={1.45} color={v5.danger}>
            {t('account.submitFailed', { steps: failedSteps.map((s) => t(`account.steps.${s}` as never)).join(', ') })}
          </BodyText>
        </CardV5>
      ) : null}
      <View style={{ marginTop: 'auto', gap: 10 }}>
        {mode ? (
          <>
            <AuthButton provider="apple" label={t('account.apple')} loading={signIn.isPending} onPress={() => void go('apple')} testID="auth-apple" />
            <AuthButton provider="google" label={t('account.google')} loading={signIn.isPending} onPress={() => void go('google')} testID="auth-google" />
          </>
        ) : (
          <Button variant="bdis" disabled label={t('account.chooseMode')} />
        )}
        <Button variant="ghost" tint={v5.inkSoft} label={t('account.phone')} onPress={localAuthEnabled(env) ? () => router.push(paths.devLogin) : undefined} />
        <BodyText size={12} weight={600} color={v5.inkSoft} align="center">
          {t('account.hold')}
        </BodyText>
      </View>
    </Frame>
  );
}

export function VerifyScreen() {
  const start = useStartVerification();
  const me = useMe();
  const first = me.data?.displayName ?? t('outing.group.me');
  return (
    <Frame pad={[52, 20, 22]} testID="verify" decor={<Blob size={300} top={160} left={-170} color={v5.violet} opacity={0.18} />}>
      <PopIn style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace(paths.home))} label={t('verify.back')} />
        <Pill label={t('verify.chip')} background={v5.ink} color={v5.lime} padding={[7, 12]} />
      </PopIn>
      <PopIn delayMs={60} style={{ marginTop: 16 }}>
        <DisplayText size={40} lineHeight={0.92}>
          {t('verify.title')}
        </DisplayText>
      </PopIn>
      <BodyText size={14} weight={600} lh={1.45} color={v5.inkSoft} style={{ marginTop: 8 }}>
        {t('verify.intro')}
      </BodyText>
      <Tap onPress={() => start.mutate(undefined, { onError: () => router.push(paths.verifyFailed) })} accessibilityLabel={t('verify.start')} testID="verify-start" style={{ marginTop: 12, height: 170, borderRadius: 26, overflow: 'hidden', backgroundImage: `linear-gradient(160deg, ${v5.plumDark}, ${v5.ink})`, alignItems: 'center', justifyContent: 'center', boxShadow: [{ offsetX: 0, offsetY: 5, blurRadius: 0, spreadDistance: 0, color: v5.black }] }}>
        <Sprite path="icons/hidden-photo.webp" size={150} style={{ opacity: 0.9 }} />
        <View style={{ position: 'absolute', bottom: 12, alignSelf: 'center' }}>
          <Pill label={t('verify.start')} background={v5.white} style={{ minHeight: 34 }} />
        </View>
      </Tap>
      <View style={{ marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <DisplayText size={22} heading={false}>
          {t('verify.face')}
        </DisplayText>
        <BodyText size={12} weight={700} color={v5.grey}>
          {t('verify.faceHint')}
        </BodyText>
      </View>
      <View style={{ marginTop: 8, flexDirection: 'row', gap: 10 }}>
        <View accessible accessibilityRole="image" accessibilityLabel={t('verify.photoA11y')} style={{ flex: 1, height: 96, borderRadius: 18, overflow: 'hidden' }}>
          <Portrait who="alex" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          <View style={{ position: 'absolute', left: 6, bottom: 6, backgroundColor: v5Alpha.ink80, borderRadius: 8, paddingVertical: 2, paddingHorizontal: 6 }}>
            <BodyText size={10} weight={800} color={v5.white}>
              {t('verify.photoHere')}
            </BodyText>
          </View>
        </View>
        {[0, 1].map((i) => (
          <Tap key={i} accessibilityLabel={t('verify.add')} style={{ flex: 1, height: 96, borderRadius: 18, borderWidth: 2, borderStyle: 'dashed', borderColor: v5.greyLight, backgroundColor: v5.white, alignItems: 'center', justifyContent: 'center' }} onPress={() => undefined}>
            <Glyph name="plus" size={26} color={v5.coralText} />
          </Tap>
        ))}
      </View>
      <View style={{ marginTop: 10, gap: 6 }}>
        {(['tip1', 'tip2', 'tip3'] as const).map((k) => (
          <View key={k} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Glyph name="check" size={18} color={v5.lime} />
            <BodyText size={13} weight={600}>
              {t(`verify.${k}`)}
            </BodyText>
          </View>
        ))}
      </View>
      <BodyText size={12} weight={600} color={v5.inkSoft} style={{ marginTop: 8 }}>
        {t('verify.groupSees', { name: first })}
      </BodyText>
      <View style={{ marginTop: 'auto' }}>
        <Button variant="b1" label={t('common.continue')} icon="arrow" iconPosition="trailing" onPress={() => router.replace(paths.notifications)} testID="verify-next" />
      </View>
    </Frame>
  );
}

export function VerifyFailedScreen() {
  return (
    <Frame pad={[52, 20, 22]} testID="verify-failed">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <BackButton onPress={() => router.replace(paths.verify)} label={t('common.back')} />
      </View>
      <Sprite path="nino/young/presentation.webp" size={120} style={{ marginTop: 20 }} />
      <DisplayText size={42} lineHeight={0.92} style={{ marginTop: 8 }}>
        {t('verify.failed.title')}
      </DisplayText>
      <BodyText size={15} weight={600} lh={1.5} color={v5.inkSoft} style={{ marginTop: 10 }}>
        {t('verify.failed.body')}
      </BodyText>
      <CardV5 style={{ marginTop: 14, padding: 14, gap: 8 }}>
        {(['t1', 't2', 't3'] as const).map((k) => (
          <CheckLine key={k} text={t(`verify.failed.${k}`)} size={14} color={v5.ink} checkColor={v5.lime} checkSize={18} />
        ))}
      </CardV5>
      <BodyText size={13} weight={600} lh={1.45} color={v5.inkSoft} style={{ marginTop: 12 }}>
        {t('verify.failed.id')}
      </BodyText>
      <View style={{ marginTop: 'auto', gap: 4 }}>
        <Button variant="b1" label={t('verify.failed.retry')} icon="arrow" iconPosition="trailing" onPress={() => router.replace(paths.verify)} />
        <Button variant="ghost" tint={v5.inkSoft} label={t('verify.failed.team')} onPress={() => router.push(paths.report)} />
      </View>
    </Frame>
  );
}

function LockNotice({ text, when }: { text: string; when: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: v5.white, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 12, boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 0, spreadDistance: 0, color: v5.shadowCream }] }}>
      <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: v5.white, borderWidth: 1, borderColor: v5.systemGrey, alignItems: 'center', justifyContent: 'center' }}>
        <Glyph name="calendar" size={22} color={v5.coralBtn} />
      </View>
      <View style={{ gap: 2, minWidth: 0, flexShrink: 1 }}>
        <BodyText size={12} weight={800}>
          {when}
        </BodyText>
        <BodyText size={13} weight={500} lh={1.35} color={v5.inkSoft}>
          {text}
        </BodyText>
      </View>
    </View>
  );
}

export function NotificationsScreen() {
  const { notifications } = useServices();
  // Reflète le choix explicite fait au compte (V5.4 §A5) ; modifiable ici.
  const discreet = useDevicePrefs((s) => s.discreet);
  const setDiscreet = (v: boolean) => useDevicePrefs.getState().set({ discreet: v, discreetChosen: true });
  const ask = async () => {
    const status = await notifications.requestPermission().catch(() => 'denied' as const);
    router.replace(status === 'granted' ? paths.home : paths.notificationsRefused);
  };
  return (
    <Frame pad={[56, 20, 22]} testID="notifications">
      <PopIn style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pill label={t('notif.reserved')} background={v5.lime} color={v5.ink} padding={[7, 12]} leading={<Glyph name="check" size={18} color={v5.lime} />} />
      </PopIn>
      <PopIn delayMs={50} style={{ marginTop: 16 }}>
        <DisplayText size={46} lineHeight={0.9}>
          {t('notif.title')}
        </DisplayText>
      </PopIn>
      <BodyText size={14} weight={600} lh={1.45} color={v5.inkSoft} style={{ marginTop: 10 }}>
        {t('notif.intro')}
      </BodyText>
      <View style={{ marginTop: 14 }}>
        <SwitchCard titleSize={15} title={discreet ? t('notif.discreetOn') : t('notif.discreetOff')} sub={discreet ? t('notif.discreetOnSub') : t('notif.discreetOffSub')} value={discreet} onChange={setDiscreet} a11y={`${t('account.discreetShort')}, ${discreet ? t('common.on') : t('common.off')}`} />
      </View>
      <BodyText size={11} weight={800} ls={0.14} upper color={v5.grey} style={{ marginTop: 14 }}>
        {t('notif.lockScreen')}
      </BodyText>
      <View style={{ marginTop: 8, gap: 8 }}>
        <LockNotice when={t('notif.n1When')} text={discreet ? t('notif.neutral') : t('notif.n1')} />
        <LockNotice when={t('notif.n2When')} text={discreet ? t('notif.neutral') : t('notif.n2')} />
        <LockNotice when={t('notif.n3When')} text={discreet ? t('notif.neutral') : t('notif.n3')} />
      </View>
      <View style={{ marginTop: 'auto', gap: 4 }}>
        <Button variant="b1" label={t('notif.allow')} onPress={() => void ask()} testID="notif-allow" />
        <Button variant="ghost" tint={v5.inkSoft} label={t('notif.later')} onPress={() => router.replace(paths.notificationsRefused)} />
      </View>
    </Frame>
  );
}

export function NotificationsRefusedScreen() {
  const { outing } = useMyOuting();
  const s = outing.data ? schedule(outing.data) : null;
  return (
    <Frame pad={[56, 20, 22]} testID="notifications-refused">
      <Sprite path="nino/young/asleep.webp" size={130} style={{ marginTop: 30 }} />
      <DisplayText size={42} lineHeight={0.92} style={{ marginTop: 10 }}>
        {t('notif.refused.title')}
      </DisplayText>
      <BodyText size={15} weight={600} lh={1.5} color={v5.inkSoft} style={{ marginTop: 10 }}>
        {s ? t('notif.refused.body', { lock: s.lock, faces: s.faces }) : t('notif.refused.bodyNoOuting')}
      </BodyText>
      <CardV5 style={{ marginTop: 14, padding: 14, gap: 6 }}>
        <BodyText size={14} weight={800}>
          {t('notif.refused.howTitle')}
        </BodyText>
        <BodyText size={13} weight={600} color={v5.inkSoft}>
          {t('notif.refused.how')}
        </BodyText>
      </CardV5>
      <View style={{ marginTop: 'auto', gap: 4 }}>
        <Button variant="b2" label={t('outing.addCalendar')} onPress={() => router.replace(paths.home)} />
        <Button variant="ghost" tint={v5.inkSoft} label={t('common.continue')} onPress={() => router.replace(paths.home)} />
      </View>
    </Frame>
  );
}
