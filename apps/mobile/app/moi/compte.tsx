/**
 * Mon compte (V6-MonCompte) : photo de profil (cachée à un lien jusqu'au niveau 4), prénom, e-mail.
 * Photo de profil : vérifiée automatiquement par le prestataire d'IA nommé par l'API (`GET /v1/me/ai`) avant d'être
 * publiée (App Review 1.2 et 5.1.2(i)) ; c'est dit sous la photo et dans la feuille, avant de choisir. Un refus du
 * filtre (`content_refused`, photo ou prénom) affiche la raison de l'API, sans « réessayer » qui referait la même chose.
 */
import { ApiError } from '@blowy/api-client';
import { cleanPetName, dayOf, nextRenameOn, PET_NAME_MAX, RENAME_COOLDOWN_DAYS } from '@blowy/domain';
import { Appear, Banner, Button, InlineField, PhotoEditCard, RenameCard, SettingsSection, SettingsTemplate, SheetTemplate, Shake, Skeleton, Stagger, Text } from '@blowy/ui';
import { space } from '@blowy/tokens';
import { useEffect, useRef, useState } from 'react';
import { Linking, View } from 'react-native';

import { MediaAccessError, ScreenMotion, useSession } from '@/core';
import { useAiConsents } from '@/features/ai';
import { errorText, shortDay } from '@/features/links';
import { maskEmail, useMe, useSetAvatar, useUpdateMe } from '@/features/me';
import { usePet, useRenamePet } from '@/features/pet';
import { openPlus } from '@/features/plus';
import { errorMessage, goBack } from '@/features/session';
import { common } from '@/locales/common';
import { moi } from '@/locales/moi';
import { pet as petText } from '@/locales/pet';

const t = moi.compte;
const refusedOf = (e: unknown): string | null => (e instanceof ApiError && e.code === 'content_refused' ? e.message : null);
const accessOf = (e: unknown): MediaAccessError | null => (e instanceof MediaAccessError ? e : null);

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
  // Le nom du minimoa (une fois tous les 60 jours, libre avec Minimoa+) : l'ancien écran « caractère » est fondu ici.
  const minimoa = usePet();
  const rename = useRenamePet();
  const [renaming, setRenaming] = useState(false);
  const [petName, setPetName] = useState('');
  const [renameFailed, setRenameFailed] = useState(0);

  useEffect(() => {
    if (me.data) setName(me.data.displayName);
  }, [me.data?.displayName]);

  // La feuille se ferme d'abord ; l'appareil photo ou la photothèque s'ouvre une fois la fenêtre retirée
  // (`onClosed`) : iOS ne présente rien par-dessus une fenêtre qui se ferme.
  const pending = useRef<'camera' | 'library' | null>(null);
  const pick = (source: 'camera' | 'library') => {
    pending.current = source;
    setSheet(false);
  };
  const onSheetClosed = () => {
    const source = pending.current;
    pending.current = null;
    if (source) avatar.mutate(source);
  };

  const dirty = !!me.data && name.trim() !== me.data.displayName;
  const save = () => {
    if (!name.trim()) return;
    setSaved(false);
    update.mutate({ displayName: name.trim() }, { onSuccess: () => setSaved(true) });
  };
  const back = () => goBack('/moi/reglages');
  const petNow = minimoa.data?.pet;
  const renameRule = minimoa.data?.rename;
  const renameLocked = !!renameRule && !renameRule.allowed;
  const renameNotice = !renameRule
    ? null
    : renameLocked
      ? renameRule.availableOn
        ? petText.renameLocked(shortDay(renameRule.availableOn))
        : null
      : renameRule.unlimited
        ? null
        : petText.renameNext(RENAME_COOLDOWN_DAYS, shortDay(nextRenameOn(dayOf(new Date()))));
  const startRename = () => {
    if (!petNow) return;
    setPetName(petNow.name);
    rename.reset();
    setRenaming(true);
  };
  const savePetName = () => {
    const clean = cleanPetName(petName);
    if (!petNow || !clean || clean === petNow.name) {
      setRenaming(false);
      return;
    }
    rename.mutate(clean, { onSuccess: () => setRenaming(false), onError: () => setRenameFailed((n) => n + 1) });
  };

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
        pet={m.pet}
        photoLabel={t.photoLabel}
        hint={t.photoHint}
        actionLabel={m.avatarUrl ? t.photoChange : t.photoAdd}
        loading={avatar.isPending}
        onPress={() => setSheet(true)}
        note={photoCheck}
      />
      {avatar.isError ? (
        <Appear key="photo-error">
          {accessOf(avatar.error) ? (
            <Banner
              tone="info"
              title={t.accessTitle}
              text={accessOf(avatar.error)?.source === 'camera' ? t.accessCamera : t.accessLibrary}
              actionLabel={t.openSettings}
              onAction={() => void Linking.openSettings()}
              onClose={() => avatar.reset()}
              closeLabel={common.close}
            />
          ) : (
            <Banner
              tone="error"
              title={refusedOf(avatar.error) ? t.photoRefusedTitle : undefined}
              text={refusedOf(avatar.error) ?? t.photoError}
              onClose={() => avatar.reset()}
              closeLabel={common.close}
            />
          )}
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
      {petNow ? (
        <SettingsSection
          rows={[{ key: 'minimoa', title: t.minimoaName, subtitle: petNow.name, onPress: startRename, accessibilityLabel: petText.renameA11y(petNow.name) }]}
        />
      ) : null}
      {petNow && renaming ? (
        <Shake trigger={renameFailed}>
          <RenameCard
            label={petText.renameLabel}
            hint={petText.renameHint}
            value={renameLocked ? petNow.name : petName}
            onChangeText={(v) => {
              setPetName(v);
              // Nom refusé par le filtre (raison de l'API) : l'erreur part dès que le nom change.
              if (rename.isError) rename.reset();
            }}
            maxLength={PET_NAME_MAX}
            locked={renameLocked}
            notice={renameNotice}
            noticeAction={renameLocked ? { label: petText.renamePlus, onPress: () => openPlus('rename') } : null}
            error={rename.isError ? errorText(rename.error, petText.renameError) : null}
            cancelLabel={renameLocked ? petText.renameClose : petText.renameCancel}
            saveLabel={petText.renameSave}
            onCancel={() => setRenaming(false)}
            onSave={savePetName}
            saving={rename.isPending}
            canSave={!!cleanPetName(petName)}
          />
        </Shake>
      ) : null}
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

      <SheetTemplate visible={sheet} onClose={() => setSheet(false)} onClosed={onSheetClosed} title={t.sheetTitle} closeLabel={common.close}>
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
