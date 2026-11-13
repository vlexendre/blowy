/**
 * Préparation (après le code) : c'est ici que le compte et le pet sont vraiment créés (`useOnboard`). Le pet au milieu,
 * un pourcentage, une barre et 4 lignes qui se cochent. La barre est un décor honnête : la dernière ligne et 100 %
 * n'arrivent qu'une fois la création réussie, 2,5 s au plus de plus que le serveur, et un tap passe le reste.
 * Erreur : tout s'arrête sur place, le message et « réessayer » ; jamais de faux 100 %.
 */
import { ApiError } from '@blowy/api-client';
import type { Species } from '@blowy/domain';
import { AgeGate, Appear, Banner, PrepChecklist, ScreenTemplate, StageTemplate } from '@blowy/ui';
import { Redirect, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { ScreenMotion } from '@/core';
import { usePendingInvite } from '@/features/encounters';
import { isDraftComplete, PREP_LINES, useDraft, useOnboard, usePrepTicker } from '@/features/onboarding';
import { errorMessage, useSignOut } from '@/features/session';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';

const t = onboarding.preparation;
const handled = (e: unknown): boolean => e instanceof ApiError && ['too_young', 'already_onboarded'].includes(e.code);

export default function Preparation() {
  // Lu une fois : le brouillon est vidé dès que la création a réussi (et vide après un rechargement web).
  const [ok] = useState(() => isDraftComplete());
  return ok ? <Prep /> : <Redirect href="/" />;
}

function Prep() {
  // Ce qu'on montre ne dépend plus du brouillon (il est vidé à la réussite).
  const [pet] = useState(() => {
    const d = useDraft.getState();
    return { name: d.petName.trim() || common.speciesNames[d.species], species: d.species as Species };
  });
  const pending = usePendingInvite();
  const onboard = useOnboard();
  const signOut = useSignOut();
  const [tooYoung, setTooYoung] = useState(false);
  const started = useRef(false);

  const run = () =>
    onboard.mutate(undefined, {
      onSuccess: () => {
        const used = useDraft.getState().inviteCode.trim().toUpperCase();
        if (used && usePendingInvite.getState().code?.toUpperCase() === used) pending.set(null);
        useDraft.getState().reset();
      },
      onError: (e) => {
        if (e instanceof ApiError && e.code === 'too_young') {
          setTooYoung(true);
          useDraft.getState().reset();
        } else if (e instanceof ApiError && e.code === 'already_onboarded') {
          useDraft.getState().reset();
          router.replace('/(tabs)/pet');
        }
      },
    });

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const failed = onboard.isError && !handled(onboard.error);
  const tick = usePrepTicker({ succeeded: onboard.isSuccess, failed });
  useEffect(() => {
    if (tick.finished) router.replace('/(onboarding)/pret');
  }, [tick.finished]);

  if (tooYoung) {
    return (
      <ScreenMotion>
        <ScreenTemplate scroll={false} gutter={14}>
          <AgeGate
            species={pet.species}
            title={onboarding.toi.tooYoungTitle}
            text={onboarding.toi.tooYoungText(pet.name)}
            note={onboarding.toi.tooYoungNote}
            actionLabel={onboarding.toi.tooYoungAction}
            loading={signOut.isPending}
            onAction={() => signOut.mutate(undefined, { onSettled: () => router.replace('/(onboarding)/welcome') })}
          />
        </ScreenTemplate>
      </ScreenMotion>
    );
  }

  const items = t.items(pet.name).map((label, i) => ({
    label,
    state: i < tick.done ? ('done' as const) : i === tick.done && i < PREP_LINES ? ('doing' as const) : ('todo' as const),
  }));
  return (
    <ScreenMotion>
      <StageTemplate
        align="center"
        onTap={failed ? undefined : tick.skip}
        tapLabel={failed ? undefined : t.tap}
        tapHintDelay={1200}
        footer={
          failed ? (
            <Appear key="error">
              <Banner
                tone="error"
                title={t.errorTitle}
                text={errorMessage(onboard.error)}
                actionLabel={common.retry}
                onAction={() => {
                  tick.resume();
                  run();
                }}
              />
            </Appear>
          ) : undefined
        }
      >
        <PrepChecklist species={pet.species} title={t.title(pet.name)} percent={tick.percent} items={items} stalled={failed} percentLabel={t.percent} />
      </StageTemplate>
    </ScreenMotion>
  );
}
