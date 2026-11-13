/**
 * La promesse (avant le compte) : le pet demande une seule chose, venir le voir chaque jour, et dit pourquoi (un pet
 * négligé boude et ne fait plus de rencontres : la vraie règle de `packages/domain/src/care.ts`). On maintient « promis »
 * (un simple tap marche aussi) : l'anneau se remplit, le pet saute de joie dans des cœurs, puis on continue.
 * Rien n'est enregistré : c'est un moment, pas un réglage.
 */
import { HoldButton, PromiseStage, StageTemplate, Text } from '@blowy/ui';
import { Redirect, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { ScreenMotion, useSession } from '@/core';
import { hasDraftPet, progressAt, useDraft } from '@/features/onboarding';
import { goBack } from '@/features/session';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';

const t = onboarding.promesse;
/** Le temps de voir le pet sauter avant de continuer ; toucher le bouton plein continue tout de suite. */
const AFTER = 1400;

export default function Promesse() {
  const [ok] = useState(hasDraftPet);
  return ok ? <PromesseStep /> : <Redirect href="/" />;
}

function PromesseStep() {
  const species = useDraft((d) => d.species);
  const petName = useDraft((d) => d.petName);
  // Déjà connecté (compte sans pet) : pas besoin de repasser par l'e-mail.
  const session = useSession();
  const [promised, setPromised] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const next = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    router.push(session ? '/(onboarding)/preparation' : '/(onboarding)/compte');
  };
  const done = () => {
    setPromised(1);
    timer.current = setTimeout(next, AFTER);
  };

  return (
    <ScreenMotion>
      <StageTemplate
        onBack={() => {
          if (timer.current) clearTimeout(timer.current);
          goBack('/(onboarding)/ville');
        }}
        backLabel={common.back}
        {...progressAt('promesse')}
        footer={
          <>
            <HoldButton
              label={t.hold}
              doneLabel={t.held}
              onDone={done}
              done={promised > 0}
              onPressDone={next}
              doneA11yLabel={t.cta}
              accessibilityHint={t.holdA11y}
            />
            <Text variant="bodyBold" size={14} muted center>
              {promised ? t.after(petName) : t.holdHint}
            </Text>
          </>
        }
      >
        <PromiseStage species={species} kicker={t.kicker(petName)} title={t.title} text={t.text} cheerKey={promised} seed={petName} petLabel={petName} />
      </StageTemplate>
    </ScreenMotion>
  );
}
