/**
 * Préparation (après la connexion) : c'est ici que le compte et le minimoa sont vraiment créés (`useOnboard`, avec
 * tout le brouillon : vision, sexe, ce que tu cherches et l'accord, position, langue du téléphone, invitation). Le pet au milieu,
 * un pourcentage, une barre et 4 lignes qui se cochent. La barre est un décor honnête : la dernière ligne et 100 %
 * n'arrivent qu'une fois la création réussie, 2,5 s au plus de plus que le serveur, et un tap passe le reste.
 * Erreur : tout s'arrête sur place, le message et « réessayer » ; jamais de faux 100 %. Un nom refusé par le filtre
 * (`content_refused`) renvoie au champ concerné (`?fix=1`), sans relance automatique.
 */
import { ApiError } from '@blowy/api-client';
import type { Species } from '@blowy/domain';
import { AgeGate, Appear, Banner, PrepChecklist, ScreenTemplate, StageTemplate } from '@blowy/ui';
import { Redirect, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { ScreenMotion } from '@/core';
import { usePendingInvite } from '@/features/encounters';
import { isDraftComplete, PREP_LINES, useDraft, useDraftHydrated, useOnboard, usePrepTicker } from '@/features/onboarding';
import { errorMessage, useSignOut } from '@/features/session';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';

const t = onboarding.preparation;
const handled = (e: unknown): boolean => e instanceof ApiError && ['too_young', 'already_onboarded'].includes(e.code);

export default function Preparation() {
  return useDraftHydrated() ? <PrepGate /> : null;
}

function PrepGate() {
  // Lu une fois : le brouillon est vidé dès que la création a réussi.
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
  // Prénom ou nom du minimoa refusé par le filtre : relancer ne servirait à rien. On ramène la personne au champ
  // concerné, avec la raison de l'API et son texte gardé dans le brouillon ; elle revient ici en le validant.
  const refused = onboard.error instanceof ApiError && onboard.error.code === 'content_refused' ? onboard.error : null;
  const fixRefused = () => {
    if (!refused) return;
    const pathname = refused.field === 'petName' ? '/(onboarding)/craft' : '/(onboarding)/prenom';
    router.replace({ pathname, params: { fix: '1', reason: refused.message } });
  };
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
            title={onboarding.naissance.tooYoungTitle}
            text={onboarding.naissance.tooYoungText(pet.name)}
            note={onboarding.naissance.tooYoungNote}
            actionLabel={onboarding.naissance.tooYoungAction}
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
              {refused ? (
                <Banner
                  tone="error"
                  title={t.refusedTitle}
                  text={refused.message}
                  actionLabel={refused.field === 'petName' ? t.refusedPetAction : t.refusedNameAction}
                  onAction={fixRefused}
                />
              ) : (
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
              )}
            </Appear>
          ) : undefined
        }
      >
        <PrepChecklist species={pet.species} title={t.title(pet.name)} percent={tick.percent} items={items} stalled={failed} percentLabel={t.percent} />
      </StageTemplate>
    </ScreenMotion>
  );
}
