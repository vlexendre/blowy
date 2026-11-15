/**
 * Mon compte (V6-MonCompte) : photo de profil (cachée à un lien jusqu'au niveau 4), prénom, e-mail.
 * Photo de profil : vérifiée automatiquement par le prestataire d'IA nommé par l'API (`GET /v1/me/ai`) avant d'être
 * publiée (App Review 1.2 et 5.1.2(i)) ; c'est dit sous la photo et dans la feuille, avant de choisir. Un refus du
 * filtre (`content_refused`, photo ou prénom) affiche la raison de l'API, sans « réessayer » qui referait la même chose.
 */
import { ApiError } from '@blowy/api-client';
import { Appear, Banner, Button, InlineField, PhotoEditCard, SettingsTemplate, SheetTemplate, Skeleton, Stagger, Text } from '@blowy/ui';
import { space } from '@blowy/tokens';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { ScreenMotion, useSession } from '@/core';
import { useAiConsents } from '@/features/ai';
import { maskEmail, useMe, useSetAvatar, useUpdateMe } from '@/features/me';
import { errorMessage, goBack } from '@/features/session';
import { common } from '@/locales/common';
import { moi } from '@/locales/moi';

const t = moi.compte;
const refusedOf = (e: unknown): string | null => (e instanceof ApiError && e.code === 'content_refused' ? e.message : null);

export default function Compte() {
  const me = useMe();
  const session = useSession();
  const update = useUpdateMe();
  const avatar = useSetAvatar();
  const ai = useAiConsents();
  const provider = ai.data?.provider ?? null;
  const photoCheck = t.photoCheck(provider?.name ?? null, provider?.country ?? null);
  const [name, setName] = useState('');
  const [sheet, setSheet] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (me.data) setName(me.data.displayName);
  }, [me.data?.displayName]);

  const pick = (source: 'camera' | 'library') => {
    setSheet(false);
    avatar.mutate(source);
  };

  const dirty = !!me.data && name.trim() !== me.data.displayName;
  const save = () => {
    if (!name.trim()) return;
    setSaved(false);
    update.mutate({ displayName: name.trim() }, { onSuccess: () => setSaved(true) });
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
        note={photoCheck}
      />
      {avatar.isError ? (
        <Appear key="photo-error">
          <Banner
            tone="error"
            title={refusedOf(avatar.error) ? t.photoRefusedTitle : undefined}
            text={refusedOf(avatar.error) ?? t.photoError}
            onClose={() => avatar.reset()}
            closeLabel={common.close}
          />
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
          if (update.isError) update.reset();
        }}
        error={!name.trim() ? t.nameError : null}
        maxLength={24}
        autoCapitalize="words"
        textContentType="givenName"
      />
      {session?.email ? <InlineField key="email" label={t.emailLabel} value={maskEmail(session.email)} editable={false} /> : null}
      </Stagger>
      {update.isError ? (
        <Appear key="save-error">
          {refusedOf(update.error) ? (
            <Banner tone="error" text={refusedOf(update.error) ?? ''} />
          ) : (
            <Banner tone="error" text={errorMessage(update.error)} actionLabel={common.retry} onAction={save} />
          )}
        </Appear>
      ) : null}
      {saved && !dirty ? (
        <Appear key="saved">
          <Banner tone="success" text={t.saved} />
        </Appear>
      ) : null}

      <SheetTemplate visible={sheet} onClose={() => setSheet(false)} title={t.sheetTitle} closeLabel={common.close}>
        <View style={{ gap: space.sm }}>
          <Text size={15} muted>
            {photoCheck} {t.photoCheckAccept}
          </Text>
          <Button label={t.camera} icon="camera" onPress={() => pick('camera')} />
          <Button label={t.library} variant="white" onPress={() => pick('library')} />
        </View>
      </SheetTemplate>
    </SettingsTemplate>
    </ScreenMotion>
  );
}
