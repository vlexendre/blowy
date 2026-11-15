/**
 * Activités en direct iOS (Dynamic Island, écran verrouillé ; spéc §19, docs/WIDGETS.md) : push ActivityKit par APNs.
 * Port `LiveActivityPusher` : un envoi vers un jeton (adaptateurs APNs, mémoire, aucun). Les charges sont construites
 * ici, validées contre le contrat (`LiveActivityAttributesZ`, `LiveActivityStateZ` : clés exactes, dates en secondes
 * Unix), selon « Starting and updating Live Activities with ActivityKit push notifications » (Apple) :
 * `aps.timestamp` (secondes), `aps.event` start | update | end, `aps.content-state` ; au démarrage `attributes-type`,
 * `attributes` et une `alert` OBLIGATOIRE ; `input-push-token: 1` (iOS 18+) pour recevoir le jeton de mise à jour ;
 * `dismissal-date` à la fin ; `stale-date` facultative. 4 Ko au plus.
 */
import {
  LIVE_ACTIVITY_ATTRIBUTES_TYPE,
  type LiveActivityAttributes,
  LiveActivityAttributesZ,
  type LiveActivityState,
  LiveActivityStateZ,
} from '@blowy/contract';

export const LIVE_ACTIVITIES = Symbol('LIVE_ACTIVITIES');

/** Taille maximale d'une charge APNs. */
export const APNS_MAX_PAYLOAD_BYTES = 4096;

export interface LiveActivityAps {
  timestamp: number;
  event: 'start' | 'update' | 'end';
  'content-state': LiveActivityState;
  'stale-date'?: number;
  'dismissal-date'?: number;
  'relevance-score'?: number;
  'attributes-type'?: typeof LIVE_ACTIVITY_ATTRIBUTES_TYPE;
  attributes?: LiveActivityAttributes;
  alert?: { title: string; body: string };
  'input-push-token'?: 1;
}
export interface LiveActivityPayload {
  aps: LiveActivityAps;
}

export interface LiveActivitySend {
  token: string;
  payload: LiveActivityPayload;
  /** 10 : démarrage, fin, changement important (compte dans le budget d'Apple) · 5 : le reste. */
  priority: 5 | 10;
}

export type LiveActivityResult = { ok: true } | { ok: false; status: number; reason: string; /** Jeton mort : 410, BadDeviceToken… */ invalidToken: boolean };

export interface LiveActivityPusher {
  /** Faux : pas d'adaptateur (clé APNs absente) ; rien n'est envoyé. */
  readonly enabled: boolean;
  send(push: LiveActivitySend): Promise<LiveActivityResult>;
}

/** Aucun envoi (clé APNs absente). */
export class NoLiveActivities implements LiveActivityPusher {
  readonly enabled = false;
  async send(): Promise<LiveActivityResult> {
    return { ok: false, status: 0, reason: 'disabled', invalidToken: false };
  }
}

/** Raisons APNs qui disent que le jeton ne servira plus jamais (ne pas réessayer). */
export const DEAD_TOKEN_REASONS: ReadonlySet<string> = new Set(['BadDeviceToken', 'Unregistered', 'ExpiredToken', 'DeviceTokenNotForTopic']);

export const unixSeconds = (d: Date | string | number): number => Math.floor((typeof d === 'number' ? d : new Date(d).getTime()) / 1000);

/** Copie stricte : seulement les clés du contrat (un champ en trop fait échouer le décodage Swift). */
const strictState = (s: LiveActivityState): LiveActivityState => LiveActivityStateZ.strict().parse({ endsAt: s.endsAt, streak: s.streak, title: s.title, done: s.done });
const strictAttributes = (a: LiveActivityAttributes): LiveActivityAttributes =>
  LiveActivityAttributesZ.strict().parse({ kind: a.kind, pet: { name: a.pet.name, species: a.pet.species }, startedAt: a.startedAt, url: a.url, ...(a.otherName !== undefined ? { otherName: a.otherName } : {}) });

const checkSize = (p: LiveActivityPayload): LiveActivityPayload => {
  if (Buffer.byteLength(JSON.stringify(p)) > APNS_MAX_PAYLOAD_BYTES) throw new Error('charge d’activité en direct trop grosse');
  return p;
};

/** Démarrage par push (jeton « push-to-start ») : alerte obligatoire, jeton de mise à jour demandé. */
export function liveStartPayload(input: { now: Date; attributes: LiveActivityAttributes; state: LiveActivityState; alert: { title: string; body: string }; relevance?: number }): LiveActivityPayload {
  return checkSize({
    aps: {
      timestamp: unixSeconds(input.now),
      event: 'start',
      'content-state': strictState(input.state),
      'stale-date': input.state.endsAt,
      ...(input.relevance !== undefined ? { 'relevance-score': input.relevance } : {}),
      'attributes-type': LIVE_ACTIVITY_ATTRIBUTES_TYPE,
      attributes: strictAttributes(input.attributes),
      alert: { title: input.alert.title, body: input.alert.body },
      'input-push-token': 1,
    },
  });
}

export function liveUpdatePayload(input: { now: Date; state: LiveActivityState }): LiveActivityPayload {
  return checkSize({ aps: { timestamp: unixSeconds(input.now), event: 'update', 'content-state': strictState(input.state), 'stale-date': input.state.endsAt } });
}

/** Fin : état final, retiré de l'écran verrouillé à `dismissAt` (dans le passé : tout de suite). */
export function liveEndPayload(input: { now: Date; state: LiveActivityState; dismissAt: Date }): LiveActivityPayload {
  return checkSize({ aps: { timestamp: unixSeconds(input.now), event: 'end', 'content-state': strictState(input.state), 'dismissal-date': unixSeconds(input.dismissAt) } });
}
