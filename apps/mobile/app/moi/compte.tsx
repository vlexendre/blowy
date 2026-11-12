/** Mon compte (V6-MonCompte) : photo de profil (cachée à un lien jusqu'au niveau 4), prénom, ville, e-mail. */
import { Appear, Banner, Button, InlineField, PhotoEditCard, SettingsTemplate, SheetTemplate, Skeleton, Stagger } from '@blowy/ui';
import { space } from '@blowy/tokens';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { ScreenMotion, useSession } from '@/core';
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
      <ScreenMotion>
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
      </ScreenMotion>
    );
  }

  const m = me.data;
  // Champs qui s'allument au focus (InlineField), bannières qui arrivent en douceur, feuille à ressort.
  return (
    <ScreenMotion>
    <SettingsTemplate
      title={t.title}
      onBack={back}
      backLabel={common.back}
      footer={<Button label={t.save} onPress={save} loading={update.isPending} disabled={!dirty || !name.trim()} />}
    >
      <Stagger step={50}>
      <PhotoEditCard
        key="photo"
        uri={m.avatarUrl}
        photoLabel={t.photoLabel}
        hint={t.photoHint}
        actionLabel={m.avatarUrl ? t.photoChange : t.photoAdd}
        loading={avatar.isPending}
        onPress={() => setSheet(true)}
      />
      {avatar.isError ? (
        <Appear key="photo-error">
          <Banner tone="error" text={t.photoError} onClose={() => avatar.reset()} closeLabel={common.close} />
        </Appear>
      ) : null}
      {avatar.data === true ? (
        <Appear key="photo-saved">
          <Banner tone="success" text={t.photoSaved} onClose={() => avatar.reset()} closeLabel={common.close} />
        </Appear>
      ) : null}

      <InlineField
        key="name"
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
        key="city"
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
      {session?.email ? <InlineField key="email" label={t.emailLabel} value={maskEmail(session.email)} editable={false} /> : null}
      </Stagger>
      {update.isError ? (
        <Appear key="save-error">
          <Banner tone="error" text={errorMessage(update.error)} actionLabel={common.retry} onAction={save} />
        </Appear>
      ) : null}
      {saved && !dirty ? (
        <Appear key="saved">
          <Banner tone="success" text={t.saved} />
        </Appear>
      ) : null}

      <SheetTemplate visible={sheet} onClose={() => setSheet(false)} title={t.sheetTitle} closeLabel={common.close}>
        <View style={{ gap: space.sm }}>
          <Button label={t.camera} icon="camera" onPress={() => pick('camera')} />
          <Button label={t.library} variant="white" onPress={() => pick('library')} />
        </View>
      </SheetTemplate>
    </SettingsTemplate>
    </ScreenMotion>
  );
}
