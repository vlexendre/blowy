/** Les mots du kit d'interface (`@blowy/ui`), fournis par `UiStringsProvider` à la racine de l'app. */
import { TODO } from '@blowy/content';
import type { UiStrings } from '@blowy/ui';
import { messages } from './runtime';

export const ui: UiStrings = messages<UiStrings>({
  fr: {
    back: 'Retour',
    close: 'Fermer',
    add: 'Ajouter',
    send: 'Envoyer',
    options: 'Options',
    percent: (n: number) => `${n} %`,
    labelValue: (label: string, value: string) => `${label} : ${value}`,
  },
  en: {
    back: 'Back',
    close: 'Close',
    add: 'Add',
    send: 'Send',
    options: 'Options',
    percent: (n: number) => `${n}%`,
    labelValue: (label: string, value: string) => `${label}: ${value}`,
  },
  es: TODO,
  pt: TODO,
  nl: TODO,
});
