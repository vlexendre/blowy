/**
 * « Mets à jour Minimoa » (docs/VERSIONING.md) : l'API ne sert plus ce build (`426 app_update_required`). Le bouton
 * ouvre la fiche de l'App Store ; « C'est fait » relit tout (une nouvelle réponse 426 ramène ici).
 */
import { UpdateTemplate } from '@blowy/ui';

import { ScreenMotion } from '@/core';
import { useAppUpdate, useRetryAfterUpdate } from '@/features/app-update';
import { useDraft } from '@/features/onboarding';
import { versions } from '@/locales/versions';

const t = versions.required;

export default function MiseAJour() {
  const { openStore } = useAppUpdate();
  const { retry, retrying } = useRetryAfterUpdate();
  const species = useDraft((d) => d.species);
  return (
    <ScreenMotion>
      <UpdateTemplate title={t.title} text={t.text} actionLabel={t.action} onAction={openStore} retryLabel={t.retry} onRetry={retry} retrying={retrying} species={species} />
    </ScreenMotion>
  );
}
