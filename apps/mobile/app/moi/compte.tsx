/** Mon compte : prénom, ville, photo de profil (cachée à un lien jusqu'au niveau 4). */
import { space } from '@blowy/tokens';
import { Avatar, Banner, Button, Card, Header, ScreenTemplate, SheetTemplate, Skeleton, Text, TextField } from '@blowy/ui';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useSession } from '@/core';
import { useMe, useSetAvatar, useUpdateMe } from '@/features/me';
import { errorMessage, goBack } from '@/features/session';
import { common } from '@/locales/common';
import { moi } from '@/locales/moi';

const t = moi.compte;

export default function Compte() {
  const me = useMe();
  const session = useSession();
  const update = useUpdateMe();
  const avatar = useSetAvatar();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [sheet, setSheet] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (me.data) {
      setName(me.data.displayName);
      setCity(me.data.city ?? '');
    }
  }, [me.data?.displayName, me.data?.city]);

  const pick = (source: 'camera' | 'library') => {
    setSheet(false);
    avatar.mutate(source);
  };

  const dirty = !!me.data && (name.trim() !== me.data.displayName || (city.trim() || null) !== me.data.city);
  const save = () => {
    if (!name.trim()) return;
    setSaved(false);
    update.mutate({ displayName: name.trim(), city: city.trim() || null }, { onSuccess: () => setSaved(true) });
  };

  const header = <Header onBack={() => goBack('/(tabs)/moi')} backLabel={common.back} title={t.title} />;

  if (!me.data) {
    return (
      <ScreenTemplate header={header}>
        {me.isError ? (
          <Banner tone="error" title={common.errorTitle} text={errorMessage(me.error)} actionLabel={common.retry} onAction={() => void me.refetch()} />
        ) : (
          <View style={{ gap: space.lg }} accessibilityLabel={common.loading}>
            <Skeleton height={180} radius="lg" />
            <Skeleton height={70} radius="md" />
            <Skeleton height={70} radius="md" />
          </View>
        )}
      </ScreenTemplate>
    );
  }

  const m = me.data;
  return (
    <ScreenTemplate
      header={header}
      footer={<Button label={t.save} onPress={save} loading={update.isPending} disabled={!dirty || !name.trim()} />}
    >
      <View style={{ gap: space.lg }}>
        <Card padding="lg">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
            <Avatar size={88} uri={m.avatarUrl} name={m.displayName} face="clear" />
            <View style={{ flex: 1, gap: space.sm }}>
              <Text variant="label" muted>
                {t.photoTitle}
              </Text>
              <Button
                label={m.avatarUrl ? t.photoChange : t.photoAdd}
                icon="camera"
                variant="white"
                size="sm"
                block={false}
                loading={avatar.isPending}
                onPress={() => setSheet(true)}
              />
            </View>
          </View>
          <Text variant="small" muted style={{ marginTop: space.md }}>
            {t.photoHint}
          </Text>
        </Card>
        {avatar.isError ? <Banner tone="error" text={t.photoError} onClose={() => avatar.reset()} closeLabel={common.close} /> : null}
        {avatar.data === true ? <Banner tone="success" text={t.photoSaved} onClose={() => avatar.reset()} closeLabel={common.close} /> : null}

        <TextField
          label={t.nameLabel}
          value={name}
          onChangeText={(v) => {
            setName(v);
            setSaved(false);
          }}
          error={!name.trim() ? t.nameError : null}
          maxLength={24}
          autoCapitalize="words"
          textContentType="givenName"
        />
        <TextField
          label={t.cityLabel}
          value={city}
          onChangeText={(v) => {
            setCity(v);
            setSaved(false);
          }}
          placeholder={t.cityPlaceholder}
          maxLength={40}
          autoCapitalize="words"
          textContentType="addressCity"
        />
        {session?.email ? (
          <Text variant="small" muted>
            {t.email(session.email)}
          </Text>
        ) : null}
        {update.isError ? <Banner tone="error" text={errorMessage(update.error)} actionLabel={common.retry} onAction={save} /> : null}
        {saved && !dirty ? <Banner tone="success" text={t.saved} /> : null}
      </View>

      <SheetTemplate visible={sheet} onClose={() => setSheet(false)} title={t.sheetTitle} closeLabel={common.close}>
        <View style={{ gap: space.sm }}>
          <Button label={t.camera} icon="camera" onPress={() => pick('camera')} />
          <Button label={t.library} variant="white" onPress={() => pick('library')} />
        </View>
      </SheetTemplate>
    </ScreenTemplate>
  );
}
