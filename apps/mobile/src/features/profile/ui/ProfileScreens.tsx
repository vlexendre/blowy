/**
 * Profil et compte : profil (âge exact ou tranche, fiabilité, vérification), réglages,
 * confidentialité, notifications, préférences de rencontre, signaler, supprimer (un seul
 * écran de décision lisible, sans succession de rétention).
 */
import type { PhotoPreference, ReportCategory } from '@blowy/domain';
import {
  Banner,
  Button,
  DetailScreenTemplate,
  KeyValue,
  ListRow,
  LoadingState,
  OptionCard,
  PetRenderer,
  SectionTitle,
  StatusPill,
  Surface,
  TabScreenTemplate,
  TextField,
  Toggle,
  petAccessibilityLabel,
  space,
  useA11yPrefs,
} from '@blowy/ui-mobile';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';
import { paths, type ProfileScreen } from '../../../core/navigation/paths';
import { useNetwork } from '../../../core/network/network';
import { useServices } from '../../../core/providers/services';
import { t, tDynamic } from '../../../i18n';
import { useGlobalPause, useMe, useRequestDeletion, useRequestExport, useSavePrivacy, useSignOut } from '../../account';
import { petLabelWords, useMyPet } from '../../pets';
import { SubscriptionScreen } from '../../subscription';
import { callEmergency, useSafetyActions } from '../../trust';
import { REPORT_CATEGORIES_ORDER, ageRange } from '../model/report';

const back = () => router.back();

export function ProfileHomeScreen() {
  const me = useMe();
  const pet = useMyPet();
  const signOut = useSignOut();
  if (me.isLoading) return <LoadingState label={t('common.loading')} />;
  const m = me.data;
  const items: { key: ProfileScreen; icon: 'gear' | 'star' | 'lock' | 'bell' | 'flag' | 'heart'; label: string }[] = [
    { key: 'preferences', icon: 'heart', label: t('profile.matching') },
    { key: 'settings', icon: 'gear', label: t('profile.settings') },
    { key: 'subscription', icon: 'star', label: t('profile.subscription') },
    { key: 'privacy', icon: 'lock', label: t('profile.privacy') },
    { key: 'notifications', icon: 'bell', label: t('profile.notifications') },
    { key: 'report', icon: 'flag', label: t('profile.report') },
  ];
  return (
    <TabScreenTemplate title={t('profile.title')} testID="screen-profile">
      {pet.data ? (
        <View style={{ alignItems: 'center' }}>
          <PetRenderer species={pet.data.species} stage={pet.data.stage} pose={pet.data.pose} bodyHeight={130} accessibilityLabel={petAccessibilityLabel({ name: pet.data.name, pose: pet.data.pose }, petLabelWords)} onTap={() => router.push(paths.fiche)} />
        </View>
      ) : null}
      {m ? (
        <Surface style={{ gap: space.xs }}>
          {m.displayName ? <KeyValue label={t('profile.account')} value={m.displayName} /> : null}
          {m.age !== null ? <KeyValue label={t('privacy.age')} value={m.privacy.ageDisplay === 'EXACT' ? t('profile.age', { age: m.age }) : t('profile.ageRange', { range: ageRange(m.age) })} /> : null}
          <KeyValue label={t('profile.reliability', { value: '' }).replace(/\s*:\s*%?$/, '')} value={`${m.reliability} %`} />
          <StatusPill kind={m.verification.status === 'VERIFIED' ? 'confirmed' : 'info'} label={m.verification.status === 'VERIFIED' ? t('profile.verified') : t('profile.notVerified')} />
        </Surface>
      ) : null}
      <Surface padding="sm">
        {items.map((i) => (
          <ListRow key={i.key} icon={i.icon} title={i.label} onPress={() => router.push(paths.profileScreen(i.key))} testID={`profile-${i.key}`} />
        ))}
        <ListRow icon="pause" title={t('profile.pause')} onPress={() => router.push(paths.profileScreen('settings'))} />
        <ListRow icon="phone" title={t('common.help')} subtitle={t('common.helpHint')} onPress={() => void callEmergency()} />
        <ListRow icon="back" title={t('profile.logout')} onPress={() => void signOut.mutateAsync().then(() => router.replace(paths.root))} />
        <ListRow icon="close" title={t('profile.delete')} destructive onPress={() => router.push(paths.profileScreen('delete'))} testID="profile-delete" />
      </Surface>
    </TabScreenTemplate>
  );
}

function SettingsScreen() {
  const { reduceMotion } = useA11yPrefs();
  const pause = useGlobalPause();
  const online = useNetwork((s) => s.online);
  return (
    <DetailScreenTemplate title={t('settings.title')} onBack={back} backLabel={t('common.back')} testID="screen-settings">
      <Surface padding="sm">
        <ListRow title={t('settings.reduceMotion')} subtitle={t('settings.reduceMotionSystem')} trailing={<StatusPill kind={reduceMotion ? 'confirmed' : 'info'} label={reduceMotion ? t('common.yes') : t('common.no')} />} />
        <ListRow title={t('settings.language')} />
        <ListRow title={t('profile.sessions')} />
      </Surface>
      <SectionTitle label={t('relation.pause.title')} />
      <Surface style={{ gap: space.sm }}>
        <ListRow title={t('relation.pause.lead')} />
        {pause.isSuccess ? <StatusPill kind="confirmed" label={t('chats.paused')} /> : null}
        <Button label={t('relation.pause.cta')} variant="secondary" disabled={!online} loading={pause.isPending} onPress={() => void pause.mutateAsync(7)} />
      </Surface>
    </DetailScreenTemplate>
  );
}

function PrivacyScreen() {
  const me = useMe();
  const save = useSavePrivacy();
  const p = me.data?.privacy;
  if (!p) return <LoadingState label={t('common.loading')} />;
  const setPhoto = (photoPreference: PhotoPreference) => void save.mutateAsync({ ...p, photoPreference });
  return (
    <DetailScreenTemplate title={t('privacy.title')} onBack={back} backLabel={t('common.back')} testID="screen-privacy">
      <SectionTitle label={t('privacy.photos')} />
      <OptionCard title={t('privacy.photosFrom4')} selected={p.photoPreference === 'FROM_LEVEL_4_WITH_CONSENT'} onPress={() => setPhoto('FROM_LEVEL_4_WITH_CONSENT')} />
      <OptionCard title={t('privacy.photosNever')} selected={p.photoPreference === 'NEVER'} onPress={() => setPhoto('NEVER')} />
      <SectionTitle label={t('privacy.age')} />
      <OptionCard title={t('privacy.ageExact')} selected={p.ageDisplay === 'EXACT'} onPress={() => void save.mutateAsync({ ...p, ageDisplay: 'EXACT' })} />
      <OptionCard title={t('privacy.ageRange')} selected={p.ageDisplay === 'RANGE'} onPress={() => void save.mutateAsync({ ...p, ageDisplay: 'RANGE' })} />
      <Surface padding="sm">
        <ListRow title={t('privacy.map')} trailing={<Toggle value={p.mapVisible} onValueChange={(mapVisible) => void save.mutateAsync({ ...p, mapVisible })} accessibilityLabel={t('privacy.map')} />} />
      </Surface>
    </DetailScreenTemplate>
  );
}

function NotificationsSettingsScreen() {
  const { notifications } = useServices();
  const perm = useQuery({ queryKey: ['notifications', 'perm'], queryFn: () => notifications.getPermission() });
  const cats = ['messages', 'waiting', 'streak', 'neighborhood', 'mission', 'guardian'] as const;
  return (
    <DetailScreenTemplate title={t('notifications.title')} lead={t('notifications.quiet')} onBack={back} backLabel={t('common.back')} testID="screen-notifications-settings">
      {perm.data === 'denied' ? <Banner message={t('notifications.osDenied')} actionLabel={t('notifications.openSettings')} onAction={() => void Linking.openSettings()} /> : null}
      <Surface padding="sm">
        {cats.map((c) => (
          <ListRow key={c} title={tDynamic(`notifications.${c}`)} subtitle={t('common.unavailableTitle')} />
        ))}
      </Surface>
      <StatusPill kind="info" label={t('notifications.lockScreen')} />
    </DetailScreenTemplate>
  );
}

function ReportScreen() {
  const params = useLocalSearchParams<{ conversationId?: string; relationshipId?: string }>();
  const safety = useSafetyActions();
  const online = useNetwork((s) => s.online);
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [sent, setSent] = useState(false);
  const target = { conversationId: params.conversationId || null, relationshipId: params.relationshipId || null };
  return (
    <DetailScreenTemplate
      title={t('report.title')}
      lead={t('report.lead')}
      onBack={back}
      backLabel={t('common.back')}
      testID="screen-report"
      footer={
        <Button
          label={t('report.submit')}
          variant="danger"
          disabled={!category || sent}
          onPress={() => {
            if (!category) return;
            safety.report({ ...target, category, alsoBlock });
            setSent(true);
          }}
          testID="report-submit"
        />
      }
    >
      {sent ? <Banner message={online ? t('report.sent') : t('report.queued')} tone="success" icon="check" live /> : null}
      <Button label={t('common.help')} variant="secondary" icon="phone" onPress={() => void callEmergency()} accessibilityHint={t('common.helpHint')} />
      {REPORT_CATEGORIES_ORDER.map((c) => (
        <OptionCard key={c} title={tDynamic(`report.category.${c}`)} selected={category === c} onPress={() => setCategory(c)} testID={`report-${c}`} />
      ))}
      {target.conversationId || target.relationshipId ? <OptionCard mode="checkbox" title={t('report.alsoBlock')} selected={alsoBlock} onPress={() => setAlsoBlock((v) => !v)} /> : null}
    </DetailScreenTemplate>
  );
}

function DeleteScreen() {
  const exp = useRequestExport();
  const del = useRequestDeletion();
  const online = useNetwork((s) => s.online);
  const [word, setWord] = useState('');
  const ok = word.trim().toUpperCase() === t('delete.confirmWord');
  return (
    <DetailScreenTemplate
      title={t('delete.title')}
      lead={t('delete.lead')}
      onBack={back}
      backLabel={t('common.back')}
      testID="screen-delete"
      footer={<Button label={t('delete.cta')} variant="danger" disabled={!ok || !online} loading={del.isPending} onPress={() => void del.mutateAsync()} testID="delete-confirm" />}
    >
      {!online ? <Banner message={t('delete.requiresNetwork')} /> : null}
      {del.isSuccess ? <Banner message={t('delete.requested')} tone="success" icon="check" live /> : null}
      {del.isError || exp.isError ? <Banner message={t('common.unavailableBody')} tone="danger" /> : null}
      <Surface padding="sm">
        {(['data', 'relations', 'children', 'subscription'] as const).map((k) => (
          <ListRow key={k} icon="check" title={tDynamic(`delete.items.${k}`)} />
        ))}
      </Surface>
      <Button label={t('delete.export')} variant="secondary" disabled={!online} loading={exp.isPending} onPress={() => void exp.mutateAsync()} />
      <TextField label={t('delete.confirmLabel')} value={word} onChangeText={setWord} autoCapitalize="characters" testID="delete-word" />
    </DetailScreenTemplate>
  );
}

function PreferencesEditScreen() {
  const me = useMe();
  const prefs = me.data?.preferences;
  return (
    <DetailScreenTemplate title={t('profile.matching')} onBack={back} backLabel={t('common.back')}>
      {prefs ? (
        <Surface style={{ gap: space.xs }}>
          <KeyValue label={t('onboarding.preferences.ageMin')} value={String(prefs.ageMin)} />
          <KeyValue label={t('onboarding.preferences.ageMax')} value={String(prefs.ageMax)} />
          <KeyValue label={t('onboarding.preferences.distance', { km: prefs.maxDistanceKm })} value={`${prefs.maxDistanceKm} km`} />
          <KeyValue label={t('onboarding.preferences.genders')} value={prefs.seekingGenders.map((g) => tDynamic(`onboarding.gender.${g}`)).join(', ')} />
        </Surface>
      ) : (
        <LoadingState label={t('common.loading')} />
      )}
      <Button label={t('profile.vision')} variant="secondary" onPress={() => router.push(paths.fiche)} />
    </DetailScreenTemplate>
  );
}

/** Routeur des sous-écrans du profil. */
export function ProfileScreenRouter() {
  const { screen } = useLocalSearchParams<{ screen: ProfileScreen }>();
  switch (screen) {
    case 'settings':
      return <SettingsScreen />;
    case 'privacy':
      return <PrivacyScreen />;
    case 'notifications':
      return <NotificationsSettingsScreen />;
    case 'report':
      return <ReportScreen />;
    case 'delete':
      return <DeleteScreen />;
    case 'subscription':
      return <SubscriptionScreen />;
    case 'preferences':
      return <PreferencesEditScreen />;
    default:
      return <ProfileHomeScreen />;
  }
}

