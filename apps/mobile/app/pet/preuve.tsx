/**
 * Preuve en photo (V6-GPreuve) : `?ref=<habitude>` pour une habitude, `?daily=1` pour la photo du défi du jour.
 * Le minimoa demande, la photo se prend ici (appareil photo de l'app, jamais la galerie), part avec un ticket, et le
 * verdict arrive avec sa phrase (« pas sûr » compte). Aucun humain ne la voit (une IA vérifie la preuve) ; supprimée sous 24 h sauf si on la garde.
 */
import { ApiError } from '@blowy/api-client';
import type { ProofResult } from '@blowy/contract';
import { Banner, Button, EmptyState, ProofStage, type ProofVerdictLook, StageTemplate } from '@blowy/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';

import { errorText } from '@/features/links';
import { usePet } from '@/features/pet';
import { type Shot, useChallengePhoto, useHabits, useKeepPhoto, useProof, useRitualsToday } from '@/features/rituals';
import { type CameraHandle, openSettings, ProofCamera, ShotPreview, useCameraPermissions } from '@/features/rituals/camera';
import { rituels } from '@/locales/rituels';

const t = rituels.proof;

/** Le dernier mot de la demande, mis en couleur (« Montre-moi tes **baskets**. »). */
const lastWord = (s: string): string | undefined => s.replace(/[.!?…\s]+$/u, '').split(/\s+/).pop();

export default function ProofScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ ref?: string; daily?: string }>();
  const daily = params.daily === '1';
  const ref = params.ref ?? '';
  const pet = usePet();
  const habits = useHabits();
  const today = useRitualsToday();
  const proof = useProof(ref);
  const dailyPhoto = useChallengePhoto();
  const keepPhoto = useKeepPhoto();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraHandle>(null);
  const [ready, setReady] = useState(false);
  const [broken, setBroken] = useState(false);
  const [shot, setShot] = useState<Shot | null>(null);
  const [result, setResult] = useState<ProofResult | null>(null);
  /** Défi photo envoyé : la photo enregistrée (`photoId` de l'API), pour proposer de la garder après coup. */
  const [dailyDone, setDailyDone] = useState<{ photoId: string; line: string | null } | null>(null);
  const [shooting, setShooting] = useState(false);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/pet'));
  const p = pet.data?.pet;
  const habit = habits.data?.habits.find((h) => h.ref === ref);
  const ask = daily ? (today.data?.challenge.text ?? '') : (habit?.ask ?? '');
  const chip = daily ? t.dailyChip : habit?.label;
  const sending = proof.isPending || dailyPhoto.isPending;
  const sendError = proof.error ?? dailyPhoto.error;

  // Rien à montrer sans le minimoa ni la demande : chargement, ou habitude disparue.
  if (!p || (!daily && !habit) || (daily && !today.data)) {
    const gone = !daily && habits.isSuccess && !habit;
    const failed = pet.isError || habits.isError || today.isError;
    return (
      <StageTemplate onBack={close} backLabel={t.close} align="center">
        {gone || failed ? (
          <EmptyState
            species={p?.species}
            mood="triste"
            peek
            title={gone ? t.notFound : rituels.habits.loadError}
            actionLabel={gone ? t.back : rituels.habits.retry}
            onAction={gone ? close : () => void Promise.all([pet.refetch(), habits.refetch(), today.refetch()])}
          />
        ) : null}
      </StageTemplate>
    );
  }

  // Accès à l'appareil photo : demandé ici, au moment utile ; refusé pour de bon → les réglages.
  if (permission && !permission.granted) {
    return (
      <StageTemplate
        onBack={close}
        backLabel={t.close}
        align="center"
        footer={
          permission.canAskAgain ? (
            <Button label={t.permissionAsk} icon="camera" onPress={() => void requestPermission()} />
          ) : (
            <Button label={t.permissionSettings} onPress={openSettings} />
          )
        }
      >
        <EmptyState species={p.species} mood="surpris" peek seed={p.id} title={t.permissionTitle} text={t.permissionText} />
      </StageTemplate>
    );
  }

  const shoot = async () => {
    if (shooting) return;
    setShooting(true);
    try {
      const s = await camera.current?.shoot();
      if (!s) return;
      setShot(s);
      send(s);
    } catch {
      setBroken(true);
    } finally {
      setShooting(false);
    }
  };

  const send = (s: Shot) => {
    if (daily) {
      // Défi fait : « la garder » se propose maintenant, comme pour une preuve ; la fête a lieu ensuite sur l'accueil.
      dailyPhoto.mutate({ shot: s, keep: false }, { onSuccess: (r) => (r.photoId ? setDailyDone({ photoId: r.photoId, line: r.line }) : close()) });
      return;
    }
    proof.mutate({ shot: s, keep: false }, { onSuccess: setResult });
  };

  const retake = () => {
    setShot(null);
    setResult(null);
    proof.reset();
    dailyPhoto.reset();
  };

  const verdict: ProofVerdictLook | null = result
    ? {
        tone: result.verdict,
        title: t.verdict[result.verdict],
        badge: result.counted ? t.badge(result.habit.streak, result.habit.rhythm === 'three_per_week') : null,
        text: result.line,
      }
    : dailyDone
      ? { tone: 'yes', title: t.dailyDone, badge: null, text: dailyDone.line ?? '' }
      : null;
  // La photo qu'on peut garder (preuve ou défi), et si elle l'est : la réponse de l'API, puis le dernier choix.
  const keepable = result ? { photoId: result.photoId, kept: result.kept } : dailyDone ? { photoId: dailyDone.photoId, kept: false } : null;
  const kept = keepable ? (keepPhoto.isSuccess ? keepPhoto.variables?.keep === true : keepable.kept) : false;
  const keepButton = keepable ? (
    kept ? (
      <Button
        label={t.kept}
        variant="link"
        icon="check"
        loading={keepPhoto.isPending}
        accessibilityHint={t.unkeep}
        onPress={() => keepPhoto.mutate({ photoId: keepable.photoId, keep: false })}
      />
    ) : (
      <Button label={t.keep} variant="link" loading={keepPhoto.isPending} onPress={() => keepPhoto.mutate({ photoId: keepable.photoId, keep: true })} />
    )
  ) : null;

  const viewfinder = shot ? (
    <ShotPreview shot={shot} />
  ) : broken ? (
    <EmptyState species={p.species} mood="triste" title={t.unavailable} />
  ) : (
    <ProofCamera ref={camera} onReady={() => setReady(true)} onError={() => setBroken(true)} />
  );

  const footer = (() => {
    if (result) {
      return (
        <>
          {result.verdict === 'no' ? <Button label={t.retry} icon="camera" onPress={retake} /> : <Button label={t.continue} onPress={close} />}
          {result.verdict === 'no' ? <Button label={t.continue} variant="link" onPress={close} /> : keepButton}
        </>
      );
    }
    if (dailyDone) {
      return (
        <>
          <Button label={t.continue} onPress={close} />
          {keepButton}
        </>
      );
    }
    if (sendError && sendError instanceof ApiError && sendError.code === 'already_done') {
      return (
        <>
          <Banner tone="info" text={errorText(sendError, t.sendError)} />
          <Button label={t.continue} onPress={close} />
        </>
      );
    }
    if (sendError) {
      return (
        <>
          <Banner tone="error" text={errorText(sendError, t.sendError)} />
          <Button label={t.retry} onPress={() => shot && send(shot)} />
          <Button label={t.retake} variant="link" onPress={retake} />
        </>
      );
    }
    return (
      <>
        <Button label={t.shutter} icon="camera" onPress={() => void shoot()} loading={shooting} disabled={!ready || broken || sending || !!shot} />
      </>
    );
  })();

  return (
    <ProofStage
      pet={{ species: p.species, outfit: p.outfit, name: p.name, id: p.id }}
      chip={chip}
      ask={ask}
      askHighlight={daily ? undefined : lastWord(ask)}
      viewfinder={viewfinder}
      busy={sending}
      busyLabel={t.busy}
      verdict={verdict}
      privacy={daily ? t.privacyDaily : t.privacy}
      footer={footer}
      onClose={close}
      closeLabel={t.close}
    />
  );
}
