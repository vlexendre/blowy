/**
 * Pont vers les widgets iOS et les activités en direct (module natif local `BlowyWidgets`, dans
 * `modules/blowy-widgets`). Hors d'un build iOS qui l'embarque (Android, web, Expo Go), le module est absent :
 * chaque fonction ne fait rien et rend une valeur neutre. Une erreur native n'interrompt jamais l'app.
 *
 * Les types des activités viennent du contrat (`LiveActivityAttributesZ`, `LiveActivityStateZ`) : ce sont aussi
 * ceux des push APNs que l'API enverra. L'état des widgets ne concerne que l'app et l'extension : il est défini ici
 * et décodé côté Swift par `BlowySnapshot` (modules/blowy-widgets/ios/BlowyShared.swift).
 */
import type { LiveActivityAttributes, LiveActivityKind, LiveActivityState } from '@blowy/contract';
import { type EventSubscription, NativeModule, requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

/** Un moment de la timeline du widget, calculé d'avance par l'app. */
export interface WidgetFrame {
  /** Début de validité, en secondes Unix. */
  at: number;
  sociability: number;
  shape: 'en_forme' | 'bof' | 'boude';
  streak: number;
  challenge: 'todo' | 'accepted' | 'done';
  /** Texte du défi ; null : phrase générique de l'extension. */
  challengeText: string | null;
}

/** État publié pour les widgets (version 1). */
export interface WidgetSnapshot {
  v: 1;
  pet: { name: string; species: string };
  /** Lien profond ouvert au toucher. */
  url: string;
  frames: WidgetFrame[];
}

export interface RunningActivity {
  id: string;
  attributes: LiveActivityAttributes;
  state: LiveActivityState;
}

/** Jeton APNs reçu d'ActivityKit (hexadécimal). */
export interface ActivityToken {
  /** start : jeton « push-to-start » de l'app · update : jeton d'une activité en cours. */
  use: 'start' | 'update';
  token: string;
  activityId?: string;
  activity?: LiveActivityKind;
}

type Events = { onActivityToken: (event: ActivityToken) => void };

declare class NativeBlowyWidgets extends NativeModule<Events> {
  setSnapshot(json: string): boolean;
  clearSnapshot(): void;
  appGroup(): string;
  activitiesEnabled(): boolean;
  listActivities(): string;
  startActivity(key: string, attributes: string, state: string, withPush: boolean): Promise<string | null>;
  updateActivity(id: string, state: string): Promise<boolean>;
  endActivity(id: string, state: string | null, dismissAfter: number): Promise<boolean>;
}

const native: NativeBlowyWidgets | null = Platform.OS === 'ios' ? requireOptionalNativeModule<NativeBlowyWidgets>('BlowyWidgets') : null;

function attempt<T>(fallback: T, run: (m: NativeBlowyWidgets) => T): T {
  if (!native) return fallback;
  try {
    return run(native);
  } catch (error) {
    if (__DEV__) console.warn('[widgets]', error);
    return fallback;
  }
}

async function attemptAsync<T>(fallback: T, run: (m: NativeBlowyWidgets) => Promise<T>): Promise<T> {
  if (!native) return fallback;
  try {
    return await run(native);
  } catch (error) {
    if (__DEV__) console.warn('[widgets]', error);
    return fallback;
  }
}

/** Fin d'une activité : `immediate` la retire tout de suite, `afterSeconds` la laisse un moment sur l'écran verrouillé. */
export type Dismissal = { immediate: true } | { afterSeconds: number } | 'default';

export const widgets = {
  /** Vrai dans un build iOS qui embarque l'extension. */
  available: native !== null,

  /** Publie l'état et recharge les widgets s'il a changé. Rend vrai si quelque chose a changé. */
  publish(snapshot: WidgetSnapshot): boolean {
    return attempt(false, (m) => m.setSnapshot(JSON.stringify(snapshot)));
  },

  /** Déconnexion : les widgets repassent sur « Ouvre Blowy ». */
  clear(): void {
    attempt(undefined, (m) => m.clearSnapshot());
  },

  activities: {
    /** La personne autorise les activités en direct (Réglages › Blowy) et l'iPhone les gère (iOS 17+). */
    enabled(): boolean {
      return attempt(false, (m) => m.activitiesEnabled());
    },

    list(): RunningActivity[] {
      // Swift n'écrit pas les valeurs absentes : `title` nul revient sans clé.
      return attempt([], (m) =>
        (JSON.parse(m.listActivities()) as RunningActivity[]).map((a) => ({ ...a, state: { ...a.state, title: a.state.title ?? null } })),
      );
    },

    /**
     * Démarre une activité (app au premier plan). `key` : une seule fois par clé, même après que la personne l'a
     * retirée (ex. `challenge:2026-11-15`). `push` : demander un jeton pour les mises à jour par APNs.
     * Rend l'identifiant, ou null (déjà démarrée, activités coupées, pas iOS 17).
     */
    start(key: string, attributes: LiveActivityAttributes, state: LiveActivityState, push = false): Promise<string | null> {
      return attemptAsync(null, (m) => m.startActivity(key, JSON.stringify(attributes), JSON.stringify(state), push));
    },

    /** Met à jour une activité ; rien si l'état n'a pas changé. */
    update(id: string, state: LiveActivityState): Promise<boolean> {
      return attemptAsync(false, (m) => m.updateActivity(id, JSON.stringify(state)));
    },

    end(id: string, finalState: LiveActivityState | null, dismissal: Dismissal = 'default'): Promise<boolean> {
      const after = dismissal === 'default' ? -1 : 'immediate' in dismissal ? 0 : Math.max(1, dismissal.afterSeconds);
      return attemptAsync(false, (m) => m.endActivity(id, finalState ? JSON.stringify(finalState) : null, after));
    },

    /** Jetons APNs des activités (et jeton « push-to-start », iOS 17.2+). Rend une fonction pour arrêter d'écouter. */
    onToken(listener: (token: ActivityToken) => void): () => void {
      const sub: EventSubscription | null = attempt(null, (m) => m.addListener('onActivityToken', listener));
      return () => sub?.remove();
    },
  },
} as const;
