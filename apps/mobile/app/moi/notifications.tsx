/**
 * Notifications (V6-Notifications). Pas encore de push ni de route d'API pour ces préférences :
 * les interrupteurs sont gardés en mémoire (voir `useNotificationPrefs`).
 */
import { PetTip, SettingsSection, SettingsTemplate, Stagger } from '@blowy/ui';

import { ScreenMotion } from '@/core';
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
    <ScreenMotion>
    <SettingsTemplate title={t.title} onBack={() => goBack('/moi/reglages')} backLabel={common.back}>
      <Stagger onceKey="notifications" step={50}>
        <PetTip key="tip" text={t.banner(pet?.name ?? common.speciesNames.nino)} species={pet?.species ?? 'nino'} />
        <SettingsSection key="links" title={t.sections.links} rows={[row('messages'), row('dailyPhoto'), row('lifeAtRisk'), row('levelUp')]} />
        <SettingsSection key="pet" title={t.sections.pet} rows={[row('encounters'), row('challenge'), row('words')]} />
        <SettingsSection key="quiet" rows={[row('quiet')]} />
      </Stagger>
    </SettingsTemplate>
    </ScreenMotion>
  );
}
