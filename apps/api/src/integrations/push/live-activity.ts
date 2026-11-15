/**
 * Emplacement prévu pour les activités en direct iOS (Dynamic Island, spéc §19) : mises à jour par push APNs
 * (`apns-push-type: liveactivity`) vers les jetons d'activité enregistrés avec `kind = 'apns_live_activity'`.
 * Aujourd'hui : aucun envoi (`NoLiveActivities`). Un futur adaptateur (clé APNs .p8 dans apps/api/.env) implémente
 * ce port et se branche dans `PlatformModule` sous le jeton LIVE_ACTIVITIES, sans changer le notifieur.
 */
import type { WidgetState } from '@blowy/contract';
import type { NotificationKind } from './notifier';

export const LIVE_ACTIVITIES = Symbol('LIVE_ACTIVITIES');

export interface LiveActivityUpdate {
  userId: string;
  kind: NotificationKind;
  /** start : l'événement commence (défi accepté, photo de l'autre) · update · end : fini (fin de journée locale). */
  event: 'start' | 'update' | 'end';
  state: WidgetState;
  /** Jetons d'activité en direct de la personne. */
  tokens: readonly string[];
}

export interface LiveActivityPusher {
  push(update: LiveActivityUpdate): Promise<void>;
}

export class NoLiveActivities implements LiveActivityPusher {
  async push(): Promise<void> {}
}
