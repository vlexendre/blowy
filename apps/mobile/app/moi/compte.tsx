/** Mon compte (V6-MonCompte) : photo de profil (cachée à un lien jusqu'au niveau 4), prénom, ville, e-mail. */
import { Banner, Button, InlineField, PhotoEditCard, SettingsTemplate, SheetTemplate, Skeleton } from '@blowy/ui';
import { space } from '@blowy/tokens';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useSession } from '@/core';
import { maskEmail, useMe, useSetAvatar, useUpdateMe } from '@/features/me';
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
  const back = () => goBack('/moi/reglages');

  if (!me.data) {
    return (
      <SettingsTemplate title={t.title} onBack={back} backLabel={common.back}>
        {me.isError ? (
          <Banner tone="error" title={common.errorTitle} text={errorMessage(me.error)} actionLabel={common.retry} onAction={() => void me.refetch()} />
        ) : (
          <View style={{ gap: space.sm }} accessibilityLabel={common.loading}>
            <Skeleton height={134} radius="lg" />
            <Skeleton height={60} radius="md" />
            <Skeleton height={60} radius="md" />
          </View>
        )}
      </SettingsTemplate>
    );
  }

  const m = me.data;
  return (
    <SettingsTemplate
      title={t.title}
      onBack={back}
      backLabel={common.back}
      footer={<Button label={t.save} onPress={save} loading={update.isPending} disabled={!dirty || !name.trim()} />}
    >
      <PhotoEditCard
        uri={m.avatarUrl}
        photoLabel={t.photoLabel}
        hint={t.photoHint}
        actionLabel={m.avatarUrl ? t.photoChange : t.photoAdd}
        loading={avatar.isPending}
        onPress={() => setSheet(true)}
      />
      {avatar.isError ? <Banner tone="error" text={t.photoError} onClose={() => avatar.reset()} closeLabel={common.close} /> : null}
      {avatar.data === true ? <Banner tone="success" text={t.photoSaved} onClose={() => avatar.reset()} closeLabel={common.close} /> : null}

      <InlineField
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
      <InlineField
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
      {session?.email ? <InlineField label={t.emailLabel} value={maskEmail(session.email)} editable={false} /> : null}
      {update.isError ? <Banner tone="error" text={errorMessage(update.error)} actionLabel={common.retry} onAction={save} /> : null}
      {saved && !dirty ? <Banner tone="success" text={t.saved} /> : null}

      <SheetTemplate visible={sheet} onClose={() => setSheet(false)} title={t.sheetTitle} closeLabel={common.close}>
        <View style={{ gap: space.sm }}>
          <Button label={t.camera} icon="camera" onPress={() => pick('camera')} />
          <Button label={t.library} variant="white" onPress={() => pick('library')} />
        </View>
      </SheetTemplate>
    </SettingsTemplate>
  );
}
