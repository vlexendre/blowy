/**
 * Contrats du web public (agent F) : page « Décris-moi en 3 mots », invitations, routes réservées.
 * Aucun DTO public ne contient email, id interne d'utilisateur, date de naissance, identité de
 * répondant ni position.
 */
import { z } from 'zod';
import { ANONYMOUS_WORDS, SPECIES } from '@blowy/domain';

/**
 * Segments réservés au système : un slug public ne peut jamais les prendre (sinon il écraserait
 * une route). Partagé par l'API (génération/validation de slug) et le web (routage).
 */
export const RESERVED_PUBLIC_SLUGS = [
  'invite', 'r', 'c', 'support', 'aide', 'help', 'confidentialite', 'privacy', 'conditions', 'terms', 'cgu', 'legal',
  'api', 'v1', 'admin', 'staff', 'app', 'apps', 'download', 'telecharger', 'login', 'logout', 'signin', 'signup',
  'auth', 'oauth', 'callback', 'settings', 'reglages', 'account', 'compte', 'me', 'moi', 'nest', 'nid', 'widget',
  'well-known', '.well-known', 'apple-app-site-association', 'assetlinks.json', 'robots.txt', 'sitemap.xml',
  'favicon.ico', 'manifest.json', '_next', 'static', 'assets', 'sprites', 'healthz', 'readyz', 'status', 'blog',
  'press', 'presse', 'jobs', 'about', 'a-propos', 'contact', 'report', 'signaler', 'blowy', 'www', 'mail', 'null', 'undefined',
] as const;

/** Slug public : minuscules, chiffres, tirets ; 3–40 caractères ; jamais un segment réservé. */
export const PublicSlugSchema = z
  .string()
  .min(3)
  .max(40)
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/)
  .refine((s) => !(RESERVED_PUBLIC_SLUGS as readonly string[]).includes(s), { message: 'slug réservé' });

export const AnonymousWordSchema = z.enum(ANONYMOUS_WORDS);

/** Profil public minimal : prénom affichable + pet. Rien d'autre. */
export const PublicProfileSchema = z.object({
  slug: z.string(),
  displayName: z.string(),
  pet: z.object({ name: z.string(), species: z.enum(SPECIES), stage: z.enum(['BABY', 'YOUNG', 'ADULT']) }).nullable(),
  acceptingResponses: z.boolean(),
  /** Les 12 mots validés (ids + libellés), dans l'ordre du référentiel. */
  words: z.array(z.object({ id: AnonymousWordSchema, label: z.string() })).length(12),
  /** Jeton de formulaire signé, à usage unique, TTL court (anti-rejeu). */
  formToken: z.string(),
  formTokenExpiresAt: z.string(),
  maxWords: z.literal(3),
});
export type PublicProfile = z.infer<typeof PublicProfileSchema>;

export const SubmitAnonymousResponseRequestSchema = z.object({
  /** 1 à 3 mots distincts parmi les 12 ; aucun texte libre n'est accepté. */
  words: z.array(AnonymousWordSchema).min(1).max(3).refine((w) => new Set(w).size === w.length, { message: 'mots en double' }),
  formToken: z.string().min(20).max(400),
  /** Identifiant opaque de visiteur (cookie HttpOnly du web) ; seul son HMAC est conservé. */
  visitorToken: z.string().regex(/^[A-Za-z0-9_-]{22,64}$/),
});
export type SubmitAnonymousResponseRequest = z.infer<typeof SubmitAnonymousResponseRequestSchema>;

export const SubmitAnonymousResponseResultSchema = z.object({
  status: z.enum(['RECORDED', 'ALREADY_ANSWERED']),
  /** Prénom affiché pour l'écran de confirmation. */
  displayName: z.string(),
});
export type SubmitAnonymousResponseResult = z.infer<typeof SubmitAnonymousResponseResultSchema>;

/** Réponse reçue, vue par le propriétaire : jamais d'identité ni d'empreinte visiteur. */
export const OwnAnonymousResponseSchema = z.object({
  id: z.string().uuid(),
  words: z.array(AnonymousWordSchema),
  receivedAt: z.string(),
  hidden: z.boolean(),
  reported: z.boolean(),
});
export const OwnAnonymousResponsesSchema = z.object({
  items: z.array(OwnAnonymousResponseSchema),
  nextCursor: z.string().nullable(),
  page: z.object({ slug: z.string().nullable(), enabled: z.boolean() }),
});
export type OwnAnonymousResponses = z.infer<typeof OwnAnonymousResponsesSchema>;

/** Indices « Qui a écrit ? » : seulement des données consenties ; sinon « aucun indice ». */
export const AnonymousHintsSchema = z.object({
  available: z.boolean(),
  hints: z.array(z.object({ key: z.string(), label: z.string() })),
  reason: z.enum(['NO_CONSENTED_DATA', 'SET_TOO_SMALL', 'ENTITLEMENT_REQUIRED']).nullable(),
});
export type AnonymousHints = z.infer<typeof AnonymousHintsSchema>;

export const UpdatePublicPageRequestSchema = z.object({ enabled: z.boolean() });
export const PublicPageStateSchema = z.object({ slug: z.string().nullable(), enabled: z.boolean() });
export type PublicPageState = z.infer<typeof PublicPageStateSchema>;
