/** Les mots du kit d'interface (`@blowy/ui`), fournis par `UiStringsProvider` à la racine de l'app. */
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
  es: {
    back: 'Atrás',
    close: 'Cerrar',
    add: 'Añadir',
    send: 'Enviar',
    options: 'Opciones',
    percent: (n: number) => `${n} %`,
    labelValue: (label: string, value: string) => `${label}: ${value}`,
  },
  pt: {
    back: 'Voltar',
    close: 'Fechar',
    add: 'Adicionar',
    send: 'Enviar',
    options: 'Opções',
    percent: (n: number) => `${n}%`,
    labelValue: (label: string, value: string) => `${label}: ${value}`,
  },
  nl: {
    back: 'Terug',
    close: 'Sluiten',
    add: 'Toevoegen',
    send: 'Versturen',
    options: 'Opties',
    percent: (n: number) => `${n}%`,
    labelValue: (label: string, value: string) => `${label}: ${value}`,
  },
});
