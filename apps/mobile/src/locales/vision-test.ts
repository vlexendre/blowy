/** Test de vision passé après l'inscription (route `/vision-test`) : le reste des textes vient de `onboarding.vision`. */
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
  en: {
    close: 'Close',
    saving: 'Your minimoa is taking notes…',
    saveError: 'Your vision wasn’t saved. Try again.',
    retry: 'Try again',
    resultTitle: [{ text: 'YOUR VISION,\n' }, { text: 'FOR NOW.', dim: true }] as TitleSegment[],
    done: 'That’s me',
  },
  es: {
    close: 'Cerrar',
    saving: 'Tu minimoa lo apunta todo…',
    saveError: 'Tu visión no se ha guardado. Inténtalo de nuevo.',
    retry: 'Reintentar',
    resultTitle: [{ text: 'TU VISIÓN,\n' }, { text: 'POR AHORA.', dim: true }] as TitleSegment[],
    done: 'Así soy yo',
  },
  pt: {
    close: 'Fechar',
    saving: 'Seu minimoa está anotando tudo…',
    saveError: 'Sua visão não foi salva. Tente de novo.',
    retry: 'Tentar de novo',
    resultTitle: [{ text: 'SUA VISÃO,\n' }, { text: 'POR ENQUANTO.', dim: true }] as TitleSegment[],
    done: 'Tem a minha cara',
  },
  nl: {
    close: 'Sluiten',
    saving: 'Je minimoa schrijft alles op…',
    saveError: 'Je visie is niet opgeslagen. Probeer het opnieuw.',
    retry: 'Opnieuw',
    resultTitle: [{ text: 'JOUW VISIE,\n' }, { text: 'VOOR NU.', dim: true }] as TitleSegment[],
    done: 'Dat ben ik',
  },
});
