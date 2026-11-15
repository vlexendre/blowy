/**
 * Les quelques mots que les composants disent d'eux-mêmes (boutons retour, fermer, envoyer, libellés lus par le
 * lecteur d'écran, « 91 % »). Aucun texte n'est écrit dans le kit : l'app fournit ce dictionnaire, dans sa langue,
 * avec `UiStringsProvider` (apps/mobile/src/locales/ui.ts). Une prop explicite l'emporte toujours.
 */
import { type ReactNode, createContext, useContext } from 'react';

export interface UiStrings {
  back: string;
  close: string;
  add: string;
  send: string;
  options: string;
  /** « 91 % » (espace insécable en français, « 91% » en anglais). */
  percent: (n: number) => string;
  /** Libellé et valeur lus ensemble : « Ville : Paris ». */
  labelValue: (label: string, value: string) => string;
}

/** Sans fournisseur (tests, galerie isolée) : rien n'est inventé, les libellés restent vides. */
const EMPTY: UiStrings = {
  back: '',
  close: '',
  add: '',
  send: '',
  options: '',
  percent: (n) => String(n),
  labelValue: (label, value) => `${label} ${value}`,
};

const UiStringsContext = createContext<UiStrings>(EMPTY);

export function UiStringsProvider({ value, children }: { value: UiStrings; children: ReactNode }) {
  return <UiStringsContext.Provider value={value}>{children}</UiStringsContext.Provider>;
}

export const useUiStrings = (): UiStrings => useContext(UiStringsContext);
