/** Test de vision passé après l'inscription (route `/vision-test`) : le reste des textes vient de `onboarding.vision`. */
import { TODO } from '@blowy/content';
import type { TitleSegment } from '@blowy/ui';
import { messages } from './runtime';

export const visionTest = messages({
  fr: {
    close: 'Fermer',
    saving: 'Ton minimoa note tout…',
    saveError: 'Ta vision n’a pas été enregistrée. Réessaie.',
    retry: 'Réessayer',
    resultTitle: [{ text: 'TA VISION,\n' }, { text: 'POUR L’INSTANT.', dim: true }] as TitleSegment[],
    done: 'C’est moi, ça',
  },
  en: TODO,
  es: TODO,
  pt: TODO,
  nl: TODO,
});
