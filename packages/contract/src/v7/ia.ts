/**
 * Contrat « IA tierce » (App Review 5.1.2(i), audit B5) : qui est le prestataire d'IA, et l'accord de la personne pour
 * chaque usage qui lui envoie des données personnelles. Ne dépend que de zod.
 *
 * Les trois usages de l'IA :
 * - preuves d'habitude en photo : accord explicite, demandé avant la première preuve, retirable (`proofs`). Sans
 *   accord, aucune image ne part au prestataire : l'habitude se valide sans photo (`POST …/habits/:ref/done`) ;
 * - lecture des chats : accord par lien, déjà porté par `LinkMinimoasZ` (`/v1/links/:id/minimoas`, `/v1/me/minimoas`) ;
 * - bilan de la semaine : reformulé sans aucun prénom ni nom (le texte envoyé ne contient que des compteurs et des
 *   phrases génériques) ; rien à accepter.
 */
import { z } from 'zod';

const API = '/v1';
const Iso = z.string();

/** Le prestataire d'IA, tel que la configuration de l'API le nomme (même nom que dans la politique de confidentialité). */
export const AiProviderZ = z.object({
  /** « Anthropic ». */
  name: z.string(),
  /** Pays où il traite les données, dans la langue de la requête (« États-Unis »). */
  country: z.string(),
});
export type AiProvider = z.infer<typeof AiProviderZ>;

/** `GET /v1/me/ai` : le prestataire et tes accords. */
export const AiConsentsZ = z.object({
  provider: AiProviderZ,
  /** Vérification des preuves d'habitude par l'IA : null tant que la question n'a pas été posée. */
  proofs: z.object({ consent: z.boolean().nullable(), at: Iso.nullable() }),
});
export type AiConsents = z.infer<typeof AiConsentsZ>;

/** `PUT /v1/me/ai/proofs` : accepter ou refuser (ou retirer) la vérification des preuves par l'IA. */
export const AiProofsConsentBody = z.object({ consent: z.boolean() });
export type AiProofsConsentBody = z.infer<typeof AiProofsConsentBody>;

export const aiRoutes = {
  consents: () => `${API}/me/ai`,
  proofsConsent: () => `${API}/me/ai/proofs`,
} as const;
