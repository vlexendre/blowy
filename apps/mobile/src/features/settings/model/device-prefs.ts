/**
 * Préférences propres à l'appareil (mode discret : icône et notifications neutres ; taille du pet
 * sur l'Accueil). Le mode discret est aussi envoyé au serveur (`PUT /v1/preferences/privacy`),
 * mais la vue serveur V5 ne le relit pas encore (`SelfProfile.privacy` reste V4) : l'appareil fait foi.
 */
import { create } from 'zustand';
import type { StoragePort } from '../../../core/ports/storage';

const KEY = 'blowy.device-prefs.v1';
let storage: StoragePort | null = null;

export interface DevicePrefs {
  discreet: boolean;
  petSize: 'large' | 'small';
  /** Proches déjà choisis comme ange gardien (saisis par la personne, jamais importés du carnet). */
  recentGuardians: { name: string; note: string }[];
  lastGuardian: string | null;
  /** Aperçus de messages masqués sur l'écran verrouillé (activé par défaut). */
  hidePreviews: boolean;
  /** V5.4 §B9 : « une semaine sur deux » (garde alternée), à partir de la semaine ISO indiquée. */
  weeksAlternate: { fromWeek: string } | null;
  /** V5.4 §A5 : choix explicite du mode discret à l'onboarding (null = pas encore choisi). */
  discreetChosen: boolean;
  /** V5.4 §A6 : « éviter les personnes que je connais » déjà proposé (oui ou pas maintenant). */
  avoidAsked: boolean;
}

const FIELDS = ['discreet', 'petSize', 'recentGuardians', 'lastGuardian', 'hidePreviews', 'weeksAlternate', 'discreetChosen', 'avoidAsked'] as const;

interface Store extends DevicePrefs {
  set(p: Partial<DevicePrefs>): void;
  hydrate(s: StoragePort): Promise<void>;
}

export const useDevicePrefs = create<Store>((set, get) => ({
  discreet: false,
  petSize: 'large',
  recentGuardians: [],
  lastGuardian: null,
  hidePreviews: true,
  weeksAlternate: null,
  discreetChosen: false,
  avoidAsked: false,
  set(p) {
    set(p);
    const cur = get();
    void storage?.setItem(KEY, JSON.stringify(Object.fromEntries(FIELDS.map((f) => [f, cur[f]]))));
  },
  async hydrate(s) {
    storage = s;
    try {
      const raw = await s.getItem(KEY);
      if (raw) set(JSON.parse(raw) as Partial<DevicePrefs>);
    } catch {
      /* préférences par défaut */
    }
  },
}));
