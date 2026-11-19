/**
 * Client typé de l'API Minimoa. Sans dépendance à React ni à Supabase :
 * on lui fournit l'URL de base et une fonction qui rend le jeton d'accès courant.
 */
import {
  ApiErrorZ,
  EncounterHistoryZ,
  EncountersZ,
  type ErrorCode,
  type RefusedField,
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
import { PaywallZ, type PlusMomentBody, type PlusOpenBody, PlusMomentZ, type SubmitPurchaseBody, SubscriptionZ, billingRoutes } from '@blowy/contract';
import { AiConsentsZ, HabitDoneResultZ, aiRoutes } from '@blowy/contract';
import {
  type LinkMinimoasBody,
  LinkMinimoasZ,
  MyMinimoasZ,
  NotificationSettingsZ,
  type NotificationSettingsBody,
  type PresenceBody,
  type RegisterDeviceBody,
  plateformeRoutes,
  type ChatReadingDefaultDto,
  ReadingAllZ,
  ReadingDefaultZ,
  AppleAuthorizationZ,
  compteRoutes,
} from '@blowy/contract';
import { ReviewResetZ, type ReviewSessionBody, ReviewSessionZ, reviewRoutes } from '@blowy/contract';
import {
  type CreateGroupBody,
  GroupActionZ,
  GroupDetailZ,
  GroupMessagesPageZ,
  type GroupReportBody,
  GroupsZ,
  TogetherResultZ,
  TogetherZ,
  groupRoutes,
} from '@blowy/contract';
import {
  type AttributionDto,
  CodeLookupZ,
  GroupInviteLinkZ,
  GroupPreviewZ,
  MyWordsZ,
  type ShareBody,
  growthRoutes,
} from '@blowy/contract';
import {
  MyQuartierZ,
  QuartierConfirmedZ,
  QuartierJoinedZ,
  type QuartierJoinBody,
  QuizResultZ,
  type QuizSubmitBody,
  ZoneStatusZ,
  QuartierBoardZ,
  quizRoutes,
} from '@blowy/contract';
import { APP_HEADERS, type AppConfig, AppConfigZ, ERROR_CODES, appRoutes } from '@blowy/contract';
import { z } from 'zod';
import { type Tolerated, parseTolerant } from './tolerant';

export { parseTolerant, type Tolerated } from './tolerant';

export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode | 'network',
    message: string,
    readonly status: number,
    /** `content_refused` : le champ refusé (prénom, nom du minimoa), quand l'API le précise. */
    readonly field?: RefusedField,
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
  /**
   * Qui appelle (docs/VERSIONING.md) : version, numéro de build natif et plateforme, envoyés en `x-app-version`,
   * `x-app-build`, `x-app-platform` sur chaque requête. L'API refuse (426) un build sous son minimum.
   */
  getClientInfo?: () => ClientInfo | null;
  /** L'API a répondu `426 app_update_required` : ce build n'est plus servi (écran « Mets à jour »). */
  onUpdateRequired?: () => void;
  /** Une réponse a été lue en retirant des valeurs inconnues de cette version de l'app (à journaliser). */
  onTolerated?: (path: string, tolerated: Tolerated) => void;
}

export interface ClientInfo {
  version?: string | null;
  build?: string | number | null;
  platform?: string | null;
}

const KNOWN_CODES = new Set<string>(ERROR_CODES);

/** En-têtes d'identité de l'app (vides si inconnus). */
export function clientInfoHeaders(info: ClientInfo | null | undefined): Record<string, string> {
  if (!info) return {};
  const out: Record<string, string> = {};
  if (info.version) out[APP_HEADERS.version] = String(info.version);
  if (info.build !== null && info.build !== undefined && String(info.build) !== '') out[APP_HEADERS.build] = String(info.build);
  if (info.platform) out[APP_HEADERS.platform] = String(info.platform);
  return out;
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
          ...clientInfoHeaders(opts.getClientInfo?.()),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiError('network', opts.messages?.network() ?? 'Network error.', 0);
    }
    const json: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const error = readError(json);
      if (error?.code === 'app_update_required') opts.onUpdateRequired?.();
      if (error) throw new ApiError(error.code, error.message, res.status, error.field);
      throw new ApiError('internal', opts.messages?.internal() ?? 'Unexpected error.', res.status);
    }
    // Tolérant : des valeurs ajoutées par une API plus récente que l'app sont retirées au lieu de tout refuser.
    // Une réponse illisible malgré tout (changement cassant de l'API) devient une erreur de l'API, pas une exception
    // de Zod : les écrans montrent leur état d'erreur avec « Réessayer » au lieu de rester bloqués.
    let parsed: { data: z.infer<S>; tolerated: Tolerated | null };
    try {
      parsed = parseTolerant(schema, json);
    } catch {
      throw new ApiError('internal', opts.messages?.internal() ?? 'Unexpected error.', res.status);
    }
    if (parsed.tolerated) opts.onTolerated?.(`${method} ${path.split('?')[0]}`, parsed.tolerated);
    return parsed.data;
  }

  /** Erreur au format du contrat ; un code inconnu de cette version (ajouté plus tard) devient `internal`, avec le message de l'API. */
  function readError(json: unknown): { code: ErrorCode; message: string; field?: RefusedField } | null {
    const parsed = ApiErrorZ.safeParse(json);
    if (parsed.success) return parsed.data.error;
    const loose = z.object({ error: z.object({ code: z.string(), message: z.string() }) }).safeParse(json);
    if (!loose.success) return null;
    const { code, message } = loose.data.error;
    return { code: KNOWN_CODES.has(code) ? (code as ErrorCode) : 'internal', message };
  }

  const Links = z.array(LinkZ);
  const BlockedList = z.array(BlockedZ);

  return {
    /** Versions de l'app (public) : minimum servi, dernier build publié, fiche du magasin. */
    app: {
      config: (): Promise<AppConfig> => call('GET', appRoutes.config(), AppConfigZ),
    },
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
      /**
       * IA tierce : le prestataire (nom, pays) et l'accord pour la vérification des preuves par l'IA (null : jamais
       * demandé). La lecture des chats a ses accords par lien (`minimoas`).
       */
      ai: () => call('GET', aiRoutes.consents(), AiConsentsZ),
      /** Accepter, refuser ou retirer la vérification des preuves d'habitude par l'IA. */
      setAiProofs: (consent: boolean) => call('PUT', aiRoutes.proofsConsent(), AiConsentsZ, { consent }),
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
      /** Minimoa+ : changer de ville sans bouger. */
      chooseCity: (city: ChosenCity) => call('PUT', visionRoutes.city(), LocationStatusZ, city),
      clearCity: () => call('DELETE', visionRoutes.city(), LocationStatusZ),
      /** Sans localisation : choisir sa zone à la main (gratuit ; une fois tous les 30 jours sans Minimoa+). */
      chooseArea: (city: ChosenCity) => call('PUT', visionRoutes.area(), LocationStatusZ, city),
      /** La carte : sa zone (gratuit) ; avec Minimoa+, `at` pour regarder ailleurs. */
      map: (at?: { lat: number; lng: number; radiusKm?: number }) =>
        call(
          'GET',
          visionRoutes.map() + (at ? `?lat=${at.lat}&lng=${at.lng}${at.radiusKm !== undefined ? `&radiusKm=${at.radiusKm}` : ''}` : ''),
          MapZ,
        ),
    },
    /** Compte de revue d'Apple : session par adresse et code (public), remise à neuf de son monde d'exemple. */
    review: {
      session: (body: ReviewSessionBody) => call('POST', reviewRoutes.session(), ReviewSessionZ, body),
      reset: () => call('POST', reviewRoutes.reset(), ReviewResetZ),
    },
    invites: {
      get: (code: string) => call('GET', routes.invite(code), InviteZ),
      accept: (code: string) => call('POST', routes.inviteAccept(code), LinkZ),
    },
    words: {
      get: (code: string) => call('GET', routes.words(code), WordsPageZ),
      send: (code: string, words: string[]) => call('POST', routes.words(code), OkZ, { words }),
      /** Ton lien et ton résultat (les 3 mots les plus choisis, à partir de 3 votes). */
      mine: () => call('GET', growthRoutes.myWords(), MyWordsZ),
    },
    /**
     * Croissance (docs/VIRALITE.md), sans SDK tiers ni identifiant d'appareil : premier lancement (public, une fois par
     * installation), inscription terminée, partages ; ce qu'est un code tapé ou lu dans un lien.
     */
    growth: {
      firstOpen: (body: AttributionDto) => call('POST', growthRoutes.firstOpen(), OkZ, body),
      signup: (body: AttributionDto) => call('POST', growthRoutes.signup(), OkZ, body),
      share: (kind: ShareBody['kind']) => call('POST', growthRoutes.share(), OkZ, { kind }),
      /** `page: true` : visite de la page d'un créateur (site). */
      code: (code: string, page = false) => call('GET', growthRoutes.code(code) + (page ? '?page=c' : ''), CodeLookupZ),
    },
    /** « Quel minimoa es-tu ? » (site, sans compte) : commencé, réponses → résultat gardé sous un code, partage. */
    quiz: {
      start: (ref?: string) => call('POST', quizRoutes.start(), OkZ, ref ? { ref } : {}),
      submit: (body: QuizSubmitBody) => call('POST', quizRoutes.submit(), QuizResultZ, body),
      result: (code: string) => call('GET', quizRoutes.result(code), QuizResultZ),
      share: (kind: 'story' | 'link' | 'challenge') => call('POST', quizRoutes.share(), OkZ, { kind }),
    },
    /** « Ouvre ton quartier » : compteur réel, inscription (double opt-in), confirmation, désinscription ; le tien (compte). */
    quartiers: {
      /** Les quartiers qui ont du monde, du plus proche de l'ouverture au plus loin (compteurs seulement). */
      board: () => call('GET', quizRoutes.board(), QuartierBoardZ),
      status: (zone: string) => call('GET', quizRoutes.zone(zone), ZoneStatusZ),
      join: (body: QuartierJoinBody) => call('POST', quizRoutes.join(), QuartierJoinedZ, body),
      confirm: (token: string) => call('POST', quizRoutes.confirm(), QuartierConfirmedZ, { token }),
      unsubscribe: (token: string) => call('POST', quizRoutes.unsubscribe(), OkZ, { token }),
      mine: () => call('GET', quizRoutes.mine(), MyQuartierZ),
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
      /** Habitude tenue sans photo ni IA (« Sans vérification par IA ») : compte comme un « pas sûr ». */
      habitDone: (ref: string) => call('POST', ritualRoutes.habitDone(ref), HabitDoneResultZ),
      keepPhoto: (photoId: string, keep: boolean) => call('POST', ritualRoutes.photoKeep(photoId), OkZ, { keep }),
      /** Souvenirs privés (photos gardées), par pages : passer le `nextBefore` de la page précédente. */
      memories: (before?: string) => call('GET', ritualRoutes.memories() + (before ? `?before=${encodeURIComponent(before)}` : ''), PrivateMemoriesZ),
      /** Bilans de la semaine, du plus récent au plus ancien (`before` : un lundi, le `nextBefore` de la page précédente). */
      reviews: (before?: string) => call('GET', ritualRoutes.reviews() + (before ? `?before=${encodeURIComponent(before)}` : ''), WeeklyReviewsZ),
      review: (id: string) => call('GET', ritualRoutes.review(id), WeeklyReviewZ),
      readReview: (id: string) => call('POST', ritualRoutes.reviewRead(id), WeeklyReviewZ),
    },
    /**
     * Groupes (spéc §26) : libres (un chat) ou d'habitude (série, vies, état du jour de chacun, jokers). Aucune IA ne
     * lit un groupe. Le temps réel (`group_messages`, membres seulement) sert à rafraîchir `messages`.
     */
    groups: {
      list: () => call('GET', groupRoutes.groups(), GroupsZ),
      create: (body: CreateGroupBody) => call('POST', groupRoutes.groups(), GroupDetailZ, body),
      get: (id: string) => call('GET', groupRoutes.group(id), GroupDetailZ),
      rename: (id: string, name: string) => call('PATCH', groupRoutes.group(id), GroupActionZ, { name }),
      invite: (id: string, memberIds: string[]) => call('POST', groupRoutes.invite(id), GroupDetailZ, { memberIds }),
      accept: (id: string) => call('POST', groupRoutes.accept(id), GroupDetailZ),
      decline: (id: string) => call('POST', groupRoutes.decline(id), OkZ),
      leave: (id: string) => call('POST', groupRoutes.leave(id), OkZ),
      wake: (id: string) => call('POST', groupRoutes.wake(id), GroupActionZ),
      /** Par pages : passer le `nextBefore` de la page précédente. */
      messages: (id: string, before?: string) => call('GET', groupRoutes.messages(id) + (before ? `?before=${encodeURIComponent(before)}` : ''), GroupMessagesPageZ),
      /** `clientId` : clé d'idempotence (envoi optimiste) ; un réessai avec la même clé n'écrit pas deux fois. */
      send: (id: string, body: string, clientId?: string) => call('POST', groupRoutes.messages(id), GroupActionZ, clientId ? { body, clientId } : { body }),
      read: (id: string) => call('POST', groupRoutes.read(id), OkZ),
      /** Joker pour le jour du groupe : aujourd'hui, ou hier jusqu'à midi (`GroupDetail.jokers.canPlaceFor`). */
      joker: (id: string, day: string) => call('POST', groupRoutes.joker(id), GroupActionZ, { day }),
      report: (id: string, body: GroupReportBody) => call('POST', groupRoutes.report(id), OkZ, body),
      /** Le lien d'invitation (`minimoa.app/g/<code>`), créé à la première demande. */
      link: (id: string) => call('POST', growthRoutes.groupLink(id), GroupInviteLinkZ),
      /** Un nouveau code (créateur du groupe) : l'ancien lien ne marche plus. */
      resetLink: (id: string) => call('POST', growthRoutes.groupLinkReset(id), GroupInviteLinkZ),
      /** Public : la page d'un groupe par son code (nom, habitude, jours tenus, nombre de membres). */
      preview: (code: string) => call('GET', growthRoutes.groupByCode(code), GroupPreviewZ),
      join: (code: string) => call('POST', growthRoutes.groupJoin(code), GroupDetailZ),
      /** « La tenir ensemble » : un nombre par habitude, jamais d'identité ni de position. */
      together: () => call('GET', groupRoutes.together(), TogetherZ),
      proposeTogether: (habitId: string) => call('POST', groupRoutes.together(), TogetherResultZ, { habitId }),
      withdrawTogether: (habitId: string) => call('DELETE', groupRoutes.togetherHabit(habitId), OkZ),
    },
    safety: {
      blocks: () => call('GET', routes.blocks(), BlockedList),
      block: (userId: string) => call('POST', routes.blocks(), OkZ, { userId }),
      unblock: (userId: string) => call('DELETE', routes.block(userId), OkZ),
      report: (body: ReportBody) => call('POST', routes.reports(), OkZ, body),
    },
    /**
     * Minimoa+ (paywall et abonnement). Après un achat ou « Restaurer mes achats » StoreKit 2 (avec
     * `appAccountToken` = `Me.id`), envoyer `Transaction.jwsRepresentation` à `submitPurchase`.
     */
    plus: {
      /** Offres (identifiants produit, montants facturés en repli), essai, avantages, personnes compatibles, mentions. */
      paywall: () => call('GET', billingRoutes.plusPaywall(), PaywallZ),
      /** État de l'abonnement (essai jusqu'au…, se renouvelle le…, expiré) et lien pour le gérer. */
      subscription: () => call('GET', billingRoutes.plusSubscription(), SubscriptionZ),
      /** Achat ou restauration : la transaction signée est vérifiée par le serveur, qui ouvre Minimoa+. */
      submitPurchase: (body: SubmitPurchaseBody) => call('POST', billingRoutes.plusPurchases(), SubscriptionZ, body),
      /** La feuille s'est ouverte, avec son déclencheur (mesure seulement ; jamais bloquant). */
      opened: (trigger: PlusOpenBody['trigger']) => call('POST', billingRoutes.plusOpens(), OkZ, { trigger }),
      /**
       * Moment clé à saluer maintenant, décidé et plafonné par le serveur (null : rien). `accepts` : les moments que l'app
       * sait ouvrir (sans : ceux des versions d'avant).
       */
      moment: (body?: PlusMomentBody) => call('POST', billingRoutes.plusMoment(), PlusMomentZ, body),
    },
    /**
     * Les minimoas dans le chat : accord de lecture par l'IA (à demander après quelques messages échangés quand
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
      /** Premier plan et conversation ouverte : pas de push pour ce qu'on a déjà sous les yeux. */
      presence: (body: PresenceBody) => call('POST', plateformeRoutes.notificationPresence(), OkZ, body),
    },
  };
}
export type ApiClient = ReturnType<typeof createApiClient>;

export { createAdminClient, type AdminClient, type AdminClientOptions } from './admin';
