/**
 * Notifications (V6-Notifications). Pas encore de push ni de route d'API pour ces préférences :
 * les interrupteurs sont gardés en mémoire (voir `useNotificationPrefs`).
 */
import { PetTip, SettingsSection, SettingsTemplate } from '@blowy/ui';

import { type NotificationKey, useMe, useNotificationPrefs } from '@/features/me';
import { goBack } from '@/features/session';
import { common } from '@/locales/common';
import { moi } from '@/locales/moi';

const t = moi.notifications;

export default function Notifications() {
  const me = useMe();
  const { prefs, set } = useNotificationPrefs();
  const pet = me.data?.pet;
  const row = (key: NotificationKey) => ({ key, ...t.rows[key], switchValue: prefs[key], onSwitchChange: (on: boolean) => set(key, on) });

  return (
    <SettingsTemplate title={t.title} onBack={() => goBack('/moi/reglages')} backLabel={common.back}>
      <PetTip text={t.banner(pet?.name ?? common.speciesNames.nino)} species={pet?.species ?? 'nino'} />
      <SettingsSection title={t.sections.links} rows={[row('messages'), row('dailyPhoto'), row('lifeAtRisk'), row('levelUp')]} />
      <SettingsSection title={t.sections.pet} rows={[row('encounters'), row('challenge'), row('words')]} />
      <SettingsSection rows={[row('quiet')]} />
    </SettingsTemplate>
  );
}
