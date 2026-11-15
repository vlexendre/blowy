/**
 * Contrat « plateforme » : les minimoas dans le chat (accord de lecture, coupure, rôles), les notifications
 * (appareils, réglages, données des push pour l'app, les widgets et les activités en direct), le minuteur
 * et l'usage de l'IA. Ne dépend que de zod et du domaine (pas de `../index`, pour éviter un import circulaire).
 */
import { CHAT_MAX_INTERVENTIONS_PER_DAY, CHAT_READING_DEFAULTS, LINK_HEALTH_KEYS, NOTIFICATION_KINDS, PET_ROLES, THEIR_CONSENT_STATES } from '@blowy/domain';
import { z } from 'zod';

const Iso = z.string();
const Id = z.string().uuid();
const API = '/v1';

// ── Minimoas dans le chat ──────────────────────────────────────────────────

/**
 * Rôle d'une réplique de minimoa (champ `petRole` des messages) :
 * icebreaker (début du lien) · nudge (relance après un silence) · remark (de temps en temps) ·
 * guard (le ton monte ; visible par toi seul) · event (niveau, vies, série).
 */
export const PetRoleZ = z.enum(PET_ROLES);
export type PetRoleDto = z.infer<typeof PetRoleZ>;

/**
 * Réglages des minimoas d'un lien, vus par toi.
 * - `consent.mine` : null tant que la question n'a pas été posée → l'app la pose à la première ouverture du chat,
 *   avec `consent.text` (texte exact de la spéc, à afficher tel quel partout) ;
 * - `consent.reading` : vrai seulement si vous avez dit oui tous les deux ;
 * - `consent.theirs` : agreed (l'autre a dit oui) · not_yet (pas encore activé de son côté). Un refus de l'autre et
 *   une question qu'il n'a pas encore vue donnent tous deux `not_yet` : on ne dit jamais « Léa a refusé » ;
 * - `consent.byDefault` : ton accord vient de ton réglage par défaut (« Moi ») et non d'une réponse dans ce chat :
 *   la question n'est pas posée, mais le chat montre l'état en une ligne avec de quoi le changer ;
 * - sans lecture, les minimoas ne réagissent qu'au rythme (silences, défis, série, niveau).
 */
export const TheirConsentZ = z.enum(THEIR_CONSENT_STATES);
export const LinkMinimoasZ = z.object({
  linkId: Id,
  consent: z.object({
    mine: z.boolean().nullable(),
    reading: z.boolean(),
    text: z.string(),
    theirs: TheirConsentZ.optional(),
    byDefault: z.boolean().optional(),
  }),
  /** Tu as coupé les interventions pour ce lien (si l'un des deux coupe, les minimoas se taisent, sauf annonces de jeu). */
  muted: z.boolean(),
  interventionsToday: z.number().int().min(0),
  maxPerDay: z.literal(CHAT_MAX_INTERVENTIONS_PER_DAY),
});
export type LinkMinimoas = z.infer<typeof LinkMinimoasZ>;

/** Changer son accord ou couper les minimoas d'un lien (au moins un champ). */
export const LinkMinimoasBody = z
  .object({ consent: z.boolean().optional(), muted: z.boolean().optional() })
  .refine((b) => b.consent !== undefined || b.muted !== undefined, { message: 'au moins un champ' });
export type LinkMinimoasBody = z.infer<typeof LinkMinimoasBody>;

/**
 * Accord de lecture appliqué à chaque nouveau lien : ask (question à la première ouverture du chat) · on · off.
 */
export const ChatReadingDefaultZ = z.enum(CHAT_READING_DEFAULTS);
export type ChatReadingDefaultDto = z.infer<typeof ChatReadingDefaultZ>;

/** Tous tes liens et leurs réglages (écran « Moi »), par pages (`?cursor=<nextCursor>`), et ton réglage par défaut. */
export const MyMinimoasZ = z.object({
  items: z.array(LinkMinimoasZ),
  nextCursor: z.string().nullable(),
  text: z.string(),
  readingDefault: ChatReadingDefaultZ.optional(),
});
export type MyMinimoas = z.infer<typeof MyMinimoasZ>;

/** `PUT /v1/me/minimoas/default` : le réglage par défaut des nouveaux liens (les liens existants ne changent pas). */
export const ReadingDefaultBody = z.object({ readingDefault: ChatReadingDefaultZ });
export type ReadingDefaultBody = z.infer<typeof ReadingDefaultBody>;
export const ReadingDefaultZ = z.object({ readingDefault: ChatReadingDefaultZ });
export type ReadingDefault = z.infer<typeof ReadingDefaultZ>;

/** `POST /v1/me/minimoas/all` : ton accord pour tous tes liens d'un coup (non archivés). */
export const ReadingAllBody = z.object({ consent: z.boolean() });
export type ReadingAllBody = z.infer<typeof ReadingAllBody>;
/** Nombre de liens dont ton accord a changé. */
export const ReadingAllZ = z.object({ updated: z.number().int().min(0) });
export type ReadingAll = z.infer<typeof ReadingAllZ>;
export const PageQuery = z.object({ cursor: z.string().max(80).optional(), limit: z.coerce.number().int().min(1).max(50).default(20) });

/** Santé d'un lien sur la semaine (données du bilan ; assemblées par le chantier « rituels »). */
export const LinkHealthZ = z.object({
  linkId: Id,
  otherName: z.string(),
  key: z.enum(LINK_HEALTH_KEYS),
  /** De 0 à 100, jamais montré seul. */
  score: z.number().int().min(0).max(100),
  /** Une phrase positive (« Avec Léa : vous vous répondez vite. »). */
  line: z.string(),
});
export type LinkHealthDto = z.infer<typeof LinkHealthZ>;

// ── Notifications ──────────────────────────────────────────────────────────

export const NotificationKindZ = z.enum(NOTIFICATION_KINDS);
export type NotificationKindDto = z.infer<typeof NotificationKindZ>;

/**
 * Activités en direct iOS (Dynamic Island, écran verrouillé ; spéc §19), toujours bornées dans le temps :
 * challenge : défi du jour accepté, jusqu'à minuit · link : la série d'un lien, « Léa t'a écrit : à toi avant minuit »
 * (le soir, l'autre a écrit aujourd'hui et pas toi) · outing : une sortie en cours.
 */
export const LIVE_ACTIVITY_KINDS = ['challenge', 'link', 'outing'] as const;
export const LiveActivityKindZ = z.enum(LIVE_ACTIVITY_KINDS);
export type LiveActivityKind = z.infer<typeof LiveActivityKindZ>;

/**
 * Enregistrer l'appareil (à chaque ouverture : c'est aussi ce qui met à jour le fuseau).
 * `token` : jeton Expo (`ExponentPushToken[…]`). `timeZone` : fuseau IANA du téléphone.
 */
export const RegisterDeviceBody = z.object({
  token: z.string().min(10).max(200),
  platform: z.enum(['ios', 'android']),
  timeZone: z.string().min(1).max(64),
  /**
   * Absent ou `expo` : jeton Expo. `apns_live_activity` : jeton APNs d'activité en direct (hexadécimal), à ne jamais
   * envoyer au service Expo. L'app n'envoie ce type que lorsque l'API sait le ranger (voir docs/WIDGETS.md).
   */
  kind: z.enum(['expo', 'apns_live_activity']).optional(),
  /** Jetons d'activité en direct seulement : à quoi sert le jeton. */
  liveActivity: z
    .object({
      /** start : jeton « push-to-start » de l'app (iOS 17.2+) · update : jeton d'une activité en cours. */
      use: z.enum(['start', 'update']),
      /** Activité concernée (jetons `update`). */
      activity: LiveActivityKindZ.optional(),
      /** Identifiant ActivityKit de l'activité (jetons `update`). */
      activityId: z.string().max(80).optional(),
      /**
       * Série d'un lien (`link`) : le lien concerné (facultatif). Avec lui, l'API termine l'activité de ce lien seulement
       * quand la personne y écrit ; sans lui, toutes ses activités `link` en cours.
       */
      linkId: Id.optional(),
    })
    .optional(),
});
export type RegisterDeviceBody = z.infer<typeof RegisterDeviceBody>;
/** Se déconnecter / refuser les notifications : retirer le jeton. */
export const RemoveDeviceBody = z.object({ token: z.string().min(10).max(200) });

export const NotificationSettingsZ = z.object({
  /** Un interrupteur par type (tous activés par défaut). */
  kinds: z.record(NotificationKindZ, z.boolean()),
  /** Heure locale du défi du jour (8 à 21). */
  morningHour: z.number().int().min(8).max(21),
  timeZone: z.string(),
  /** Rappel : heures calmes de 22 h à 8 h, 3 notifications par jour au plus hors messages. */
  quietHours: z.object({ start: z.literal(22), end: z.literal(8) }),
  dailyCap: z.literal(3),
  /** Libellés des types, dans la langue du profil. */
  labels: z.record(NotificationKindZ, z.string()),
  /** Au moins un appareil enregistré. */
  hasDevice: z.boolean(),
});
export type NotificationSettings = z.infer<typeof NotificationSettingsZ>;

export const NotificationSettingsBody = z.object({
  kinds: z.partialRecord(NotificationKindZ, z.boolean()).optional(),
  morningHour: z.number().int().min(8).max(21).optional(),
  timeZone: z.string().min(1).max(64).optional(),
});
export type NotificationSettingsBody = z.infer<typeof NotificationSettingsBody>;

/**
 * État compact pour les widgets iOS et les activités en direct (spéc §19). Présent dans `data.state`
 * quand le type s'y prête ; les champs absents ne changent pas.
 */
export const WidgetStateZ = z.object({
  /** Défi du jour pas encore fait. */
  challengePending: z.boolean().optional(),
  streak: z.number().int().optional(),
  /** Jusqu'à quand l'activité a un sens (fin de journée locale, ISO). */
  endsAt: Iso.optional(),
  /** Série d'un lien : prénom de qui t'a écrit aujourd'hui, à toi d'écrire avant minuit. */
  writeTo: z.string().optional(),
  livesLeft: z.number().int().optional(),
});
export type WidgetState = z.infer<typeof WidgetStateZ>;

/**
 * Données jointes à chaque push (`notification.request.content.data`) : le type, le lien profond à ouvrir
 * (`blowy://…`), l'identifiant du lien concerné et l'état compact pour les widgets.
 */
export const PushDataZ = z.object({
  kind: NotificationKindZ,
  url: z.string(),
  linkId: Id.optional(),
  state: WidgetStateZ.optional(),
});
export type PushData = z.infer<typeof PushDataZ>;

/** Nom du type Swift des attributs : valeur de `aps.attributes-type` d'un push qui démarre une activité. */
export const LIVE_ACTIVITY_ATTRIBUTES_TYPE = 'BlowyActivityAttributes';

/**
 * Partie fixe d'une activité (`aps.attributes` d'un push de démarrage). Décodée par Swift sans stratégie
 * d'encodage : noms de clés exacts, dates en secondes Unix (nombres), pas de champ en plus.
 */
export const LiveActivityAttributesZ = z.object({
  kind: LiveActivityKindZ,
  pet: z.object({ name: z.string().max(40), species: z.string().max(20) }),
  /** Début de l'activité, en secondes Unix : sert à la barre de temps. */
  startedAt: z.number(),
  /** Lien profond ouvert au toucher (`blowy://pet`, `blowy://link/<id>`). */
  url: z.string().max(200),
  // Jamais le prénom de l'autre personne d'un lien : l'écran verrouillé est visible de tous (HIG Live Activities,
  // « Avoid displaying sensitive information » ; app de rencontre). Le texte de l'extension reste neutre.
});
export type LiveActivityAttributes = z.infer<typeof LiveActivityAttributesZ>;

/** Partie qui change (`aps.content-state` des push `update` et `end`). Mêmes règles d'encodage. */
export const LiveActivityStateZ = z.object({
  /**
   * Fin affichée, en secondes Unix (minuit local pour le défi et la série d'un lien). L'activité elle-même ne vit pas
   * plus de 8 h après `startedAt` (HIG) : périmée puis retirée à ce moment-là si minuit est plus loin.
   */
  endsAt: z.number(),
  /** Série en jeu : celle du défi (challenge) ou celle du lien (link) ; 0 : pas de série à montrer. */
  streak: z.number().int().min(0),
  /** challenge : texte du défi (déjà dans la langue de la personne) ; null : phrase générique de l'extension. */
  title: z.string().max(120).nullable(),
  /** C'est fait (défi relevé, tu as écrit, retour de sortie) : l'activité affiche son état final. */
  done: z.boolean(),
});
export type LiveActivityState = z.infer<typeof LiveActivityStateZ>;

// ── Minuteur (interne) ─────────────────────────────────────────────────────

/** Réponse de `POST /internal/tick` (en-tête `x-tick-secret`). */
export const TickResultZ = z.object({
  at: Iso,
  /** Faux si ce créneau d'une minute avait déjà été traité (appel répété : rien n'est refait). */
  ran: z.boolean(),
  jobs: z.array(z.object({ name: z.string(), done: z.number().int(), ms: z.number().int(), error: z.string().nullable(), skipped: z.boolean() })),
});
export type TickResult = z.infer<typeof TickResultZ>;

// ── Usage de l'IA (lu par l'administration) ────────────────────────────────

export const AiUsageRowZ = z.object({
  day: z.string(),
  feature: z.string(),
  tier: z.enum(['small', 'medium']),
  calls: z.number().int(),
  /** Appels refusés avant d'atteindre le modèle (coupé, plafond, budget) et échecs. */
  declined: z.number().int(),
  errors: z.number().int(),
  inputTokens: z.number().int(),
  outputTokens: z.number().int(),
  costUsd: z.number(),
});
export const AiUsageSummaryZ = z.object({
  provider: z.enum(['anthropic', 'memory', 'off']),
  killSwitch: z.boolean(),
  dailyCeilingUsd: z.number(),
  todaySpendUsd: z.number(),
  /** Taux utilisé pour l'affichage en euros (configurable, approximatif). */
  eurPerUsd: z.number(),
  rows: z.array(AiUsageRowZ),
});
export type AiUsageSummary = z.infer<typeof AiUsageSummaryZ>;

// ── Routes ─────────────────────────────────────────────────────────────────

export const plateformeRoutes = {
  linkMinimoas: (id: string) => `${API}/links/${id}/minimoas`,
  myMinimoas: () => `${API}/me/minimoas`,
  myMinimoasDefault: () => `${API}/me/minimoas/default`,
  myMinimoasAll: () => `${API}/me/minimoas/all`,
  devices: () => `${API}/devices`,
  devicesRemove: () => `${API}/devices/remove`,
  notificationSettings: () => `${API}/notifications/settings`,
  tick: () => '/internal/tick',
} as const;
