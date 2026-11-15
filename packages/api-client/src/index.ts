/**
 * Client typé de l'API Blowy. Sans dépendance à React ni à Supabase :
 * on lui fournit l'URL de base et une fonction qui rend le jeton d'accès courant.
 */
import {
  ApiErrorZ,
  EncounterHistoryZ,
  EncountersZ,
  type ErrorCode,
  InviteZ,
  LinkActionZ,
  LinkZ,
  MemoriesZ,
  MessagesPageZ,
  MeZ,
  OkZ,
  type OnboardInput,
  type ChosenCity,
  type LatLng,
  LocationStatusZ,
  MapZ,
  type VisionAnswer,
  VisionProfileZ,
  VisionTestZ,
  visionRoutes,
  PetViewZ,
  type ReportBody,
  routes,
  type SendMessageBody,
  type UpdateMeBody,
  type OutfitDto,
  WardrobeZ,
  UploadTicketZ,
  WordsPageZ,
  BlockedZ,
  // Rituels (V7)
  type AddHabitBody,
  DailyResultZ,
  HabitCatalogueZ,
  HabitsZ,
  type OutingAnswer,
  OutingResultZ,
  PrivateMemoriesZ,
  ProofResultZ,
  RitualsTodayZ,
  StreakZ,
  type UpdateHabitBody,
  WeeklyReviewZ,
  WeeklyReviewsZ,
  ritualRoutes,
} from '@blowy/contract';
import { PaywallZ, type SubmitPurchaseBody, SubscriptionZ, billingRoutes } from '@blowy/contract';
import {
  type LinkMinimoasBody,
  LinkMinimoasZ,
  MyMinimoasZ,
  NotificationSettingsZ,
  type NotificationSettingsBody,
  type RegisterDeviceBody,
  plateformeRoutes,
  type ChatReadingDefaultDto,
  ReadingAllZ,
  ReadingDefaultZ,
  AppleAuthorizationZ,
  compteRoutes,
} from '@blowy/contract';
import { z } from 'zod';

export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode | 'network',
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  getToken?: () => Promise<string | null> | string | null;
  /** Langue de l'app (« fr », « en »…), envoyée en `Accept-Language` sur chaque requête : l'API y répond (erreurs, textes). */
  getLocale?: () => string;
  /** Messages des erreurs nées dans le client (pas de réseau, réponse illisible), dans la langue de l'app. */
  messages?: { network: () => string; internal: () => string };
  fetch?: typeof fetch;
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export function createApiClient(opts: ApiClientOptions) {
  const doFetch = opts.fetch ?? fetch;
  const base = opts.baseUrl.replace(/\/$/, '');

  async function call<S extends z.ZodType>(method: Method, path: string, schema: S, body?: unknown): Promise<z.infer<S>> {
    const token = opts.getToken ? await opts.getToken() : null;
    const locale = opts.getLocale?.();
    let res: Response;
    try {
      res = await doFetch(base + path, {
        method,
        headers: {
          ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          ...(locale ? { 'accept-language': locale } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiError('network', opts.messages?.network() ?? 'Network error.', 0);
    }
    const json: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const parsed = ApiErrorZ.safeParse(json);
      if (parsed.success) throw new ApiError(parsed.data.error.code, parsed.data.error.message, res.status);
      throw new ApiError('internal', opts.messages?.internal() ?? 'Unexpected error.', res.status);
    }
    return schema.parse(json);
  }

  const Links = z.array(LinkZ);
  const BlockedList = z.array(BlockedZ);

  return {
    me: {
      get: () => call('GET', routes.me(), MeZ),
      /** Inscription : prénom, date de naissance, minimoa, sexe, ce que tu cherches, accords, position et réponses au test. */
      onboard: (body: OnboardInput) => call('POST', routes.onboard(), MeZ, body),
      update: (body: UpdateMeBody) => call('PATCH', routes.me(), MeZ, body),
      remove: () => call('DELETE', routes.me(), OkZ),
      avatarTicket: (contentType: string) => call('POST', routes.avatarTicket(), UploadTicketZ, { contentType }),
      setAvatar: (path: string) => call('POST', routes.avatar(), MeZ, { path }),
      /**
       * Sign in with Apple : le code d'autorisation reçu à la connexion (iPhone), pour que l'API puisse révoquer
       * l'accès à Apple quand le compte est supprimé. Sans effet si la révocation n'est pas configurée côté serveur.
       */
      appleAuthorization: (authorizationCode: string) => call('POST', compteRoutes.appleAuthorization(), AppleAuthorizationZ, { authorizationCode }),
    },
    pet: {
      get: () => call('GET', routes.pet(), PetViewZ),
      rename: (name: string) => call('PATCH', routes.pet(), PetViewZ, { name }),
      care: (action: 'feed' | 'play' | 'nap' | 'cuddle') => call('POST', routes.petCare(), PetViewZ, { action }),
      wardrobe: () => call('GET', routes.petWardrobe(), WardrobeZ),
      setOutfit: (outfit: OutfitDto) => call('PUT', routes.petOutfit(), PetViewZ, { outfit }),
    },
    links: {
      list: () => call('GET', routes.links(), Links),
      get: (id: string) => call('GET', routes.link(id), LinkZ),
      archive: (id: string) => call('DELETE', routes.link(id), OkZ),
      messages: (id: string, before?: string) =>
        call('GET', routes.linkMessages(id) + (before ? `?before=${encodeURIComponent(before)}` : ''), MessagesPageZ),
      send: (id: string, body: SendMessageBody) => call('POST', routes.linkMessages(id), LinkActionZ, body),
      read: (id: string) => call('POST', routes.linkRead(id), OkZ),
      revive: (id: string) => call('POST', routes.linkRevive(id), LinkActionZ),
      memories: (id: string) => call('GET', routes.linkMemories(id), MemoriesZ),
    },
    encounters: {
      list: () => call('GET', routes.encounters(), EncountersZ),
      /** Rencontres passées, par pages : passer le `nextBefore` de la page précédente. */
      history: (before?: string) =>
        call('GET', routes.encounterHistory() + (before ? `?before=${encodeURIComponent(before)}` : ''), EncounterHistoryZ),
      wave: (userId: string) => call('POST', routes.wave(), OkZ, { userId }),
      accept: (id: string) => call('POST', routes.encounterAccept(id), LinkZ),
      decline: (id: string) => call('POST', routes.encounterDecline(id), OkZ),
    },
    /** Vision : le test, ta vision, ta position et la carte. */
    vision: {
      /** Public (avant la connexion) : les 12 situations. */
      test: () => call('GET', visionRoutes.visionTest(), VisionTestZ),
      /** Repasser le test : les réponses remplacent les précédentes. */
      retakeTest: (answers: VisionAnswer[]) => call('POST', visionRoutes.visionTest(), VisionProfileZ, { answers }),
      /** Ta vision, pour l'instant (5 axes, confiance, formulations). */
      mine: () => call('GET', visionRoutes.vision(), VisionProfileZ),
      /** Position relevée à l'ouverture de l'app ; `consent: true` la première fois. */
      locate: (point: LatLng, consent?: boolean) => call('POST', visionRoutes.location(), LocationStatusZ, { ...point, ...(consent !== undefined ? { consent } : {}) }),
      /** Oublier la position et retirer l'accord. */
      forgetLocation: () => call('DELETE', visionRoutes.location(), LocationStatusZ),
      /** Blowy+ : changer de ville sans bouger. */
      chooseCity: (city: ChosenCity) => call('PUT', visionRoutes.city(), LocationStatusZ, city),
      clearCity: () => call('DELETE', visionRoutes.city(), LocationStatusZ),
      /** La carte : sa zone (gratuit) ; avec Blowy+, `at` pour regarder ailleurs. */
      map: (at?: { lat: number; lng: number; radiusKm?: number }) =>
        call(
          'GET',
          visionRoutes.map() + (at ? `?lat=${at.lat}&lng=${at.lng}${at.radiusKm !== undefined ? `&radiusKm=${at.radiusKm}` : ''}` : ''),
          MapZ,
        ),
    },
    invites: {
      get: (code: string) => call('GET', routes.invite(code), InviteZ),
      accept: (code: string) => call('POST', routes.inviteAccept(code), LinkZ),
    },
    words: {
      get: (code: string) => call('GET', routes.words(code), WordsPageZ),
      send: (code: string, words: string[]) => call('POST', routes.words(code), OkZ, { words }),
    },
    /**
     * Rituels : sortie du jour, défi du jour, série, habitudes et preuves en photo, souvenirs privés, bilans.
     * Envoi d'une photo (défi ou preuve) : `…Ticket` → envoi direct du fichier sur `uploadUrl` → `dailyPhoto` / `proof`.
     */
    rituals: {
      /** Accueil : défi du jour (`challenge.present` : montrer la carte en plein écran), série, sortie, sociabilité, habitudes, bilan non lu. */
      today: () => call('GET', ritualRoutes.today(), RitualsTodayZ),
      /** Série seule, lecture légère (widget). */
      streak: () => call('GET', ritualRoutes.streak(), StreakZ),
      /** « Tu es sorti aujourd'hui ? » ; `awayFromHome` si l'app sait que la position actuelle est hors de la zone du domicile. */
      outing: (answer: OutingAnswer, awayFromHome?: boolean) =>
        call('POST', ritualRoutes.outing(), OutingResultZ, { answer, ...(awayFromHome !== undefined ? { awayFromHome } : {}) }),
      /** La carte du défi a été montrée (acceptée ou rangée) : elle ne remonte plus aujourd'hui. */
      seenChallenge: () => call('POST', ritualRoutes.dailySeen(), DailyResultZ),
      acceptChallenge: () => call('POST', ritualRoutes.dailyAccept(), DailyResultZ),
      answerChallenge: (choice: 0 | 1) => call('POST', ritualRoutes.dailyAnswer(), DailyResultZ, { choice }),
      challengePhotoTicket: (contentType: 'image/jpeg' | 'image/webp') => call('POST', ritualRoutes.dailyPhotoTicket(), UploadTicketZ, { contentType }),
      challengePhoto: (path: string, keep = false) => call('POST', ritualRoutes.dailyPhoto(), DailyResultZ, { path, keep }),
      /** Défis « écrire à un lien » et « sortir » : le serveur vérifie que c'est fait. */
      completeChallenge: () => call('POST', ritualRoutes.dailyComplete(), DailyResultZ),
      habitCatalogue: () => call('GET', ritualRoutes.habitCatalogue(), HabitCatalogueZ),
      habits: () => call('GET', ritualRoutes.habits(), HabitsZ),
      addHabit: (body: AddHabitBody) => call('POST', ritualRoutes.habits(), HabitsZ, body),
      updateHabit: (ref: string, body: UpdateHabitBody) => call('PATCH', ritualRoutes.habit(ref), HabitsZ, body),
      removeHabit: (ref: string) => call('DELETE', ritualRoutes.habit(ref), HabitsZ),
      proofTicket: (ref: string, contentType: 'image/jpeg' | 'image/webp') => call('POST', ritualRoutes.habitProofTicket(ref), UploadTicketZ, { contentType }),
      /** Preuve envoyée : verdict, phrase du minimoa ; `keep` la garde dans les souvenirs privés (sinon supprimée sous 24 h). */
      proof: (ref: string, path: string, keep = false) => call('POST', ritualRoutes.habitProof(ref), ProofResultZ, { path, keep }),
      keepPhoto: (photoId: string, keep: boolean) => call('POST', ritualRoutes.photoKeep(photoId), OkZ, { keep }),
      /** Souvenirs privés (photos gardées), par pages : passer le `nextBefore` de la page précédente. */
      memories: (before?: string) => call('GET', ritualRoutes.memories() + (before ? `?before=${encodeURIComponent(before)}` : ''), PrivateMemoriesZ),
      /** Bilans de la semaine, du plus récent au plus ancien (`before` : un lundi, le `nextBefore` de la page précédente). */
      reviews: (before?: string) => call('GET', ritualRoutes.reviews() + (before ? `?before=${encodeURIComponent(before)}` : ''), WeeklyReviewsZ),
      review: (id: string) => call('GET', ritualRoutes.review(id), WeeklyReviewZ),
      readReview: (id: string) => call('POST', ritualRoutes.reviewRead(id), WeeklyReviewZ),
    },
    safety: {
      blocks: () => call('GET', routes.blocks(), BlockedList),
      block: (userId: string) => call('POST', routes.blocks(), OkZ, { userId }),
      unblock: (userId: string) => call('DELETE', routes.block(userId), OkZ),
      report: (body: ReportBody) => call('POST', routes.reports(), OkZ, body),
    },
    /**
     * Blowy+ (paywall et abonnement). Après un achat ou « Restaurer mes achats » StoreKit 2 (avec
     * `appAccountToken` = `Me.id`), envoyer `Transaction.jwsRepresentation` à `submitPurchase`.
     */
    plus: {
      /** Offres (identifiants produit, montants facturés en repli), essai, avantages, personnes compatibles, mentions. */
      paywall: () => call('GET', billingRoutes.plusPaywall(), PaywallZ),
      /** État de l'abonnement (essai jusqu'au…, se renouvelle le…, expiré) et lien pour le gérer. */
      subscription: () => call('GET', billingRoutes.plusSubscription(), SubscriptionZ),
      /** Achat ou restauration : la transaction signée est vérifiée par le serveur, qui ouvre Blowy+. */
      submitPurchase: (body: SubmitPurchaseBody) => call('POST', billingRoutes.plusPurchases(), SubscriptionZ, body),
    },
    /**
     * Les minimoas dans le chat : accord de lecture par l'IA (à demander à la première ouverture du chat quand
     * `consent.mine` est null, avec `consent.text` tel quel) et coupure, par lien ; liste pour l'écran « Moi ».
     */
    minimoas: {
      get: (linkId: string) => call('GET', plateformeRoutes.linkMinimoas(linkId), LinkMinimoasZ),
      update: (linkId: string, body: LinkMinimoasBody) => call('PATCH', plateformeRoutes.linkMinimoas(linkId), LinkMinimoasZ, body),
      /** Tous tes liens, par pages : passer le `nextCursor` de la page précédente. */
      mine: (cursor?: string) => call('GET', plateformeRoutes.myMinimoas() + (cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''), MyMinimoasZ),
      /** Réglage par défaut des nouveaux liens : demander à chaque fois, toujours oui, toujours non. */
      setDefault: (readingDefault: ChatReadingDefaultDto) => call('PUT', plateformeRoutes.myMinimoasDefault(), ReadingDefaultZ, { readingDefault }),
      /** Ton accord pour tous tes liens d'un coup (un seul appel) ; rend le nombre de liens changés. */
      setAll: (consent: boolean) => call('POST', plateformeRoutes.myMinimoasAll(), ReadingAllZ, { consent }),
    },
    /**
     * Notifications : enregistrer le jeton Expo et le fuseau à chaque ouverture (`registerDevice`), le retirer à la
     * déconnexion ; réglages par type et heure du défi du jour. Les push portent `data` au format `PushDataZ`.
     */
    notifications: {
      registerDevice: (body: RegisterDeviceBody) => call('POST', plateformeRoutes.devices(), NotificationSettingsZ, body),
      removeDevice: (token: string) => call('POST', plateformeRoutes.devicesRemove(), OkZ, { token }),
      settings: () => call('GET', plateformeRoutes.notificationSettings(), NotificationSettingsZ),
      updateSettings: (body: NotificationSettingsBody) => call('PATCH', plateformeRoutes.notificationSettings(), NotificationSettingsZ, body),
    },
  };
}
export type ApiClient = ReturnType<typeof createApiClient>;

export { createAdminClient, type AdminClient, type AdminClientOptions } from './admin';
