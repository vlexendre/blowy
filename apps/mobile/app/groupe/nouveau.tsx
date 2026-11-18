/**
 * Créer un groupe (spéc. §26), en trois temps sur un même écran : le nom et le type (libre, ou une de mes habitudes),
 * puis 2 à 7 personnes parmi mes liens vivants, puis la confirmation (« Chacun doit accepter. Le groupe démarre à 3. »).
 * Limite atteinte : Minimoa+ (on n'arrive ici que si `canCreate`, sinon l'onglet Chats ouvre Minimoa+).
 */
import type { GroupKind } from '@blowy/domain';
import { GROUP_MAX_INVITES, GROUP_NAME_MAX } from '@blowy/domain';
import { Avatar, AvatarStack, Banner, Button, ListRow, PickTiles, Radio, SegmentedTabs, SettingsSection, SettingsTemplate, Skeleton, Text, TextField } from '@blowy/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { ScreenMotion } from '@/core';
import { useCreateGroup, useGroups } from '@/features/groups';
import { errorText, useLinks } from '@/features/links';
import { openPlus } from '@/features/plus';
import { useHabits } from '@/features/rituals';
import { goBack } from '@/features/session';
import { groupes } from '@/locales/groupes';
import { rituels } from '@/locales/rituels';

const t = groupes.create;
type Step = 'name' | 'who' | 'confirm';

export default function NewGroup() {
  const router = useRouter();
  const links = useLinks();
  const habits = useHabits();
  const groups = useGroups();
  const create = useCreateGroup();
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [kind, setKind] = useState<GroupKind>('free');
  const [habitId, setHabitId] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);

  const live = (links.data ?? []).filter((l) => l.status === 'active');
  const myHabits = habits.data?.habits ?? [];
  const habitLabel = myHabits.find((h) => h.habitId === habitId)?.label ?? null;
  const back = () => {
    if (step === 'confirm') return setStep('who');
    if (step === 'who') return setStep('name');
    goBack('/(tabs)/chats');
  };
  const toggle = (userId: string) =>
    setPicked((p) => (p.includes(userId) ? p.filter((x) => x !== userId) : p.length < GROUP_MAX_INVITES ? [...p, userId] : p));

  const nameOk = name.trim().length > 0 && (kind === 'free' || !!habitId);
  const submit = () => {
    if (groups.data && !groups.data.canCreate) return openPlus('generic');
    create.mutate(
      { name: name.trim(), kind, ...(kind === 'habit' && habitId ? { habitId } : {}), memberIds: picked },
      { onSuccess: (g) => router.replace(`/groupe/${g.id}`) },
    );
  };

  const footer =
    step === 'name' ? (
      <Button label={t.next} disabled={!nameOk} onPress={() => setStep('who')} />
    ) : step === 'who' ? (
      // Personne à inviter : possible, le lien du groupe le remplira (docs/VIRALITE.md).
      <Button label={t.next} onPress={() => setStep('confirm')} />
    ) : (
      <Button label={t.submit} loading={create.isPending} onPress={submit} />
    );

  const people = live.filter((l) => picked.includes(l.other.id));

  return (
    <ScreenMotion>
      <SettingsTemplate title={t.title} onBack={back} backLabel={t.back} footer={footer}>
        {step === 'name' ? (
          <>
            <TextField label={t.nameLabel} placeholder={t.namePlaceholder} value={name} onChangeText={setName} maxLength={GROUP_NAME_MAX} autoFocus />
            <SegmentedTabs
              items={[
                { key: 'free', label: t.free },
                { key: 'habit', label: t.habit },
              ]}
              activeKey={kind}
              onChange={(k) => setKind(k)}
            />
            <Text size={13} muted>
              {kind === 'free' ? t.freeText : t.habitText}
            </Text>
            {kind === 'habit' ? (
              habits.isPending ? (
                <Skeleton height={52} radius="md" />
              ) : myHabits.length === 0 ? (
                <Banner tone="info" text={t.noHabit} actionLabel={t.addHabit} onAction={() => router.push('/pet/habitudes')} />
              ) : (
                <>
                  <Text variant="label" size={13} muted>
                    {t.whichHabit}
                  </Text>
                  <PickTiles
                    items={myHabits.map((h) => ({ key: h.habitId, label: h.label, emoji: rituels.habits.emoji[h.habitId] }))}
                    selected={habitId ? [habitId] : []}
                    onToggle={(k) => setHabitId((cur) => (cur === k ? null : k))}
                    selectedLabel={t.selected}
                  />
                </>
              )
            ) : null}
          </>
        ) : null}

        {step === 'who' ? (
          links.isPending ? (
            <Skeleton height={220} radius="lg" />
          ) : live.length === 0 ? (
            <Banner tone="info" text={t.noLinks} />
          ) : (
            <>
            <Text size={13} muted>
              {t.noLinks}
            </Text>
            <SettingsSection
              title={`${t.whoLabel} · ${t.whoCount(picked.length, GROUP_MAX_INVITES)}`}
              rows={live.map((l) => {
                const on = picked.includes(l.other.id);
                const full = !on && picked.length >= GROUP_MAX_INVITES;
                return {
                  key: l.id,
                  title: l.other.displayName,
                  left: <Avatar size={36} pet={l.other.pet} hidden />,
                  right: <Radio selected={on} />,
                  chevron: false,
                  disabled: full,
                  onPress: () => toggle(l.other.id),
                  accessibilityLabel: on ? `${l.other.displayName}, ${t.selected}` : l.other.displayName,
                };
              })}
            />
            </>
          )
        ) : null}

        {step === 'confirm' ? (
          <>
            <SettingsSection>
              <ListRow
                title={name.trim()}
                subtitle={t.summaryKind(kind === 'habit' ? habitLabel : null)}
                left={<AvatarStack people={people.map((l) => ({ pet: l.other.pet, hidden: true }))} size={30} max={4} />}
                chevron={false}
                divider={false}
              />
            </SettingsSection>
            <Text size={15}>{t.rule}</Text>
            {create.isError ? <Banner tone="error" text={errorText(create.error, t.error)} /> : null}
          </>
        ) : null}
      </SettingsTemplate>
    </ScreenMotion>
  );
}
