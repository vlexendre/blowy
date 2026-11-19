/**
 * Mise à jour de l’app (docs/VERSIONING.md) : l’écran « Mets à jour Minimoa » quand l’API ne sert plus ce build
 * (`426 app_update_required`), et le bandeau discret quand une version plus récente est publiée.
 */
import type { TitleSegment } from '@blowy/ui';

import { messages } from './runtime';

export const versions = messages({
  fr: {
    required: {
      title: [{ text: 'METS À JOUR\n' }, { text: 'MINIMOA.', dim: true }] as TitleSegment[],
      text: 'Cette version n’est plus prise en charge. La nouvelle t’attend, ton minimoa et tes liens aussi.',
      action: 'Mettre à jour',
      retry: 'C’est fait, réessayer',
    },
    banner: {
      title: 'Nouvelle version de Minimoa',
      text: 'Elle est prête à être installée.',
      action: 'Mettre à jour',
      close: 'Plus tard',
    },
  },
  en: {
    required: {
      title: [{ text: 'UPDATE\n' }, { text: 'MINIMOA.', dim: true }],
      text: 'This version is no longer supported. The new one is waiting for you, and so are your minimoa and your links.',
      action: 'Update',
      retry: 'Done, try again',
    },
    banner: {
      title: 'New version of Minimoa',
      text: 'It’s ready to install.',
      action: 'Update',
      close: 'Later',
    },
  },
  es: {
    required: {
      title: [{ text: 'ACTUALIZA\n' }, { text: 'MINIMOA.', dim: true }],
      text: 'Esta versión ya no es compatible. La nueva te espera, y tu minimoa y tus vínculos también.',
      action: 'Actualizar',
      retry: 'Listo, reintentar',
    },
    banner: {
      title: 'Nueva versión de Minimoa',
      text: 'Ya está lista para instalar.',
      action: 'Actualizar',
      close: 'Más tarde',
    },
  },
  pt: {
    required: {
      title: [{ text: 'ATUALIZE\n' }, { text: 'O MINIMOA.', dim: true }],
      text: 'Esta versão não é mais compatível. A nova está esperando por você, seu minimoa e seus vínculos também.',
      action: 'Atualizar',
      retry: 'Pronto, tentar de novo',
    },
    banner: {
      title: 'Nova versão do Minimoa',
      text: 'Ela está pronta para instalar.',
      action: 'Atualizar',
      close: 'Mais tarde',
    },
  },
  nl: {
    required: {
      title: [{ text: 'WERK MINIMOA\n' }, { text: 'BIJ.', dim: true }],
      text: 'Deze versie wordt niet meer ondersteund. De nieuwe wacht op je, net als je minimoa en je banden.',
      action: 'Bijwerken',
      retry: 'Gedaan, opnieuw proberen',
    },
    banner: {
      title: 'Nieuwe versie van Minimoa',
      text: 'Hij staat klaar om te installeren.',
      action: 'Bijwerken',
      close: 'Later',
    },
  },
});
