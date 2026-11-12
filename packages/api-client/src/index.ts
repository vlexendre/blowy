/**
 * Client typé de l'API Blowy. Sans dépendance à React ni à Supabase :
 * on lui fournit l'URL de base et une fonction qui rend le jeton d'accès courant.
 */
import {
  ApiErrorZ,
  EncountersZ,
  type ErrorCode,
  InviteZ,
  LinkActionZ,
  LinkZ,
  MemoriesZ,
  MessagesPageZ,
  MeZ,
  OkZ,
  type OnboardBody,
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
  fetch?: typeof fetch;
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export function createApiClient(opts: ApiClientOptions) {
  const doFetch = opts.fetch ?? fetch;
  const base = opts.baseUrl.replace(/\/$/, '');

  async function call<S extends z.ZodType>(method: Method, path: string, schema: S, body?: unknown): Promise<z.infer<S>> {
    const token = opts.getToken ? await opts.getToken() : null;
    let res: Response;
    try {
      res = await doFetch(base + path, {
        method,
        headers: {
          ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiError('network', 'Connexion impossible. Vérifie ton réseau.', 0);
    }
    const json: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const parsed = ApiErrorZ.safeParse(json);
      if (parsed.success) throw new ApiError(parsed.data.error.code, parsed.data.error.message, res.status);
      throw new ApiError('internal', 'Une erreur est survenue.', res.status);
    }
    return schema.parse(json);
  }

  const Links = z.array(LinkZ);
  const BlockedList = z.array(BlockedZ);

  return {
    me: {
      get: () => call('GET', routes.me(), MeZ),
      onboard: (body: OnboardBody) => call('POST', routes.onboard(), MeZ, body),
      update: (body: UpdateMeBody) => call('PATCH', routes.me(), MeZ, body),
      remove: () => call('DELETE', routes.me(), OkZ),
      avatarTicket: (contentType: string) => call('POST', routes.avatarTicket(), UploadTicketZ, { contentType }),
      setAvatar: (path: string) => call('POST', routes.avatar(), MeZ, { path }),
    },
    pet: {
      get: () => call('GET', routes.pet(), PetViewZ),
      rename: (name: string) => call('PATCH', routes.pet(), PetViewZ, { name }),
      answerChallenge: (choice: 0 | 1) => call('POST', routes.petChallenge(), PetViewZ, { choice }),
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
      photoTicket: (id: string, contentType: string) => call('POST', routes.linkPhotoTicket(id), UploadTicketZ, { contentType }),
      sendPhoto: (id: string, path: string) => call('POST', routes.linkPhoto(id), LinkActionZ, { path }),
      memories: (id: string) => call('GET', routes.linkMemories(id), MemoriesZ),
    },
    encounters: {
      list: () => call('GET', routes.encounters(), EncountersZ),
      wave: (userId: string) => call('POST', routes.wave(), OkZ, { userId }),
      accept: (id: string) => call('POST', routes.encounterAccept(id), LinkZ),
      decline: (id: string) => call('POST', routes.encounterDecline(id), OkZ),
    },
    invites: {
      get: (code: string) => call('GET', routes.invite(code), InviteZ),
      accept: (code: string) => call('POST', routes.inviteAccept(code), LinkZ),
    },
    words: {
      get: (code: string) => call('GET', routes.words(code), WordsPageZ),
      send: (code: string, words: string[]) => call('POST', routes.words(code), OkZ, { words }),
    },
    safety: {
      blocks: () => call('GET', routes.blocks(), BlockedList),
      block: (userId: string) => call('POST', routes.blocks(), OkZ, { userId }),
      unblock: (userId: string) => call('DELETE', routes.block(userId), OkZ),
      report: (body: ReportBody) => call('POST', routes.reports(), OkZ, body),
    },
  };
}
export type ApiClient = ReturnType<typeof createApiClient>;
