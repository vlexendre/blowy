/**
 * Preuve en photo (V6-GPreuve) : `?ref=<habitude>` pour une habitude, `?daily=1` pour la photo du défi du jour.
 * Le minimoa demande, la photo se prend ici (appareil photo de l'app, jamais la galerie), part avec un ticket, et le
 * verdict arrive avec sa phrase (« pas sûr » compte). Aucun humain ne la voit ; supprimée sous 24 h sauf si on la garde.
 *
 * IA tierce (App Review 5.1.2(i), audit B5) : avant la première preuve d'habitude, une feuille dit ce qui part, à qui,
 * pourquoi et combien de temps, avec deux choix égaux. Sans accord, ni appareil photo ni IA : l'habitude se valide
 * « sur parole » (`POST …/done`), la série avance pareil. La photo du défi du jour, elle, ne part jamais à une IA.
 */
import { ApiError } from '@blowy/api-client';
import type { ProofResult } from '@blowy/contract';
import { Banner, Button, ConsentFacts, EmptyState, ProofStage, type ProofVerdictLook, SheetTemplate, StageTemplate } from '@blowy/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';

import { useAiConsents, useSetAiProofs } from '@/features/ai';
import { errorText } from '@/features/links';
import { openLegal } from '@/features/me';
import { usePet } from '@/features/pet';
import { type Shot, useChallengePhoto, useHabitDone, useHabits, useKeepPhoto, useProof, useRitualsToday } from '@/features/rituals';
import { type CameraHandle, openSettings, ProofCamera, ShotPreview, useCameraPermissions } from '@/features/rituals/camera';
import { ia } from '@/locales/ia';
import { rituels } from '@/locales/rituels';

const t = rituels.proof;
const c = ia.consent;

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
  const ai = useAiConsents(!daily);
  const setAi = useSetAiProofs();
  const habitDone = useHabitDone(ref);
  /** Feuille d'accord ouverte à la demande depuis la preuve sans IA (« Vérifier par une IA plutôt »). */
  const [askAi, setAskAi] = useState(false);
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
  if (!p || (!daily && !habit) || (daily && !today.data) || (!daily && !ai.data)) {
    const gone = !daily && habits.isSuccess && !habit;
    const failed = pet.isError || habits.isError || today.isError || (!daily && ai.isError);
    return (
      <StageTemplate onBack={close} backLabel={t.close} align="center">
        {gone || failed ? (
          <EmptyState
            species={p?.species}
            mood="triste"
            peek
            title={gone ? t.notFound : rituels.habits.loadError}
            actionLabel={gone ? t.back : rituels.habits.retry}
            onAction={gone ? close : () => void Promise.all([pet.refetch(), habits.refetch(), today.refetch(), ai.refetch()])}
          />
        ) : null}
      </StageTemplate>
    );
  }

  // Preuve d'habitude : accord pour l'IA jamais demandé (null) → la feuille ; refusé ou retiré (false) → sans IA.
  const consent = daily ? true : (ai.data?.proofs.consent ?? null);
  const provider = ai.data?.provider;
  const choose = (accept: boolean) => setAi.mutate(accept, { onSuccess: () => setAskAi(false) });
  const consentSheet = provider ? (
    <SheetTemplate
      visible={consent === null || askAi}
      onClose={consent === null ? close : () => setAskAi(false)}
      closeLabel={t.close}
      scroll
      footer={
        <>
          {setAi.isError ? <Banner tone="error" text={c.error} /> : null}
          <Button label={c.accept} onPress={() => choose(true)} loading={setAi.isPending && setAi.variables === true} disabled={setAi.isPending} />
          <Button label={c.refuse} variant="ghost" onPress={() => choose(false)} loading={setAi.isPending && setAi.variables === false} disabled={setAi.isPending} />
          <Button label={c.policy} variant="link" onPress={openLegal('confidentialite')} />
        </>
      }
    >
      <ConsentFacts
        title={c.title}
        subtitle={c.subtitle(provider.name)}
        pet={{ species: p.species }}
        facts={[
          { key: 'sent', glyph: 'camera', label: c.sent.label, text: c.sent.text },
          { key: 'to', glyph: 'people', label: c.to.label, text: c.to.text(provider.name, provider.country) },
          { key: 'why', glyph: 'check', label: c.why.label, text: c.why.text },
          { key: 'kept', glyph: 'lock', label: c.kept.label, text: c.kept.text },
          { key: 'without', glyph: 'heart', label: c.without.label, text: c.without.text },
        ]}
      />
    </SheetTemplate>
  ) : null;

  // Sans IA (ou pas encore choisi) : ni appareil photo, ni photo. On valide sur parole.
  if (!daily && consent !== true) {
    const done = habitDone.data;
    const noAiVerdict: ProofVerdictLook | null = done
      ? { tone: 'yes', title: ia.noAi.doneTitle, badge: done.counted ? t.badge(done.habit.streak, done.habit.rhythm === 'three_per_week') : null, text: done.line }
      : null;
    return (
      <>
        <ProofStage
          pet={{ species: p.species, outfit: p.outfit, name: p.name, id: p.id }}
          chip={chip}
          ask={ask}
          askHighlight={lastWord(ask)}
          // Une fois compté, le verdict amène son propre minimoa : le cadre se vide.
          viewfinder={done ? null : <EmptyState species={p.species} mood="salut" seed={p.id} title={ia.noAi.title} text={ia.noAi.text} />}
          busy={habitDone.isPending}
          busyLabel={t.busy}
          verdict={noAiVerdict}
          privacy={ia.noAi.privacy}
          footer={
            done ? (
              <Button label={t.continue} onPress={close} />
            ) : habitDone.error && habitDone.error instanceof ApiError && habitDone.error.code === 'already_done' ? (
              <>
                <Banner tone="info" text={errorText(habitDone.error, t.sendError)} />
                <Button label={t.continue} onPress={close} />
              </>
            ) : (
              <>
                {habitDone.isError ? <Banner tone="error" text={errorText(habitDone.error, t.sendError)} /> : null}
                <Button label={ia.noAi.done} icon="check" onPress={() => habitDone.mutate()} loading={habitDone.isPending} disabled={consent === null} />
                <Button label={ia.noAi.enable} variant="link" onPress={() => setAskAi(true)} />
              </>
            )
          }
          onClose={close}
          closeLabel={t.close}
        />
        {consentSheet}
      </>
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
