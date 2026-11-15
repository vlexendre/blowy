/**
 * Accords pour l'IA tierce (App Review 5.1.2(i), audit B5). Aujourd'hui un seul accord en base : la vérification des
 * preuves d'habitude en photo. La lecture des chats a ses accords par lien (`modules/links/minimoas`) ; le bilan de la
 * semaine n'envoie aucune donnée qui nomme quelqu'un (`modules/rituels`, `reviewForAi`).
 */
export const AI_CONSENTS = Symbol('AI_CONSENTS');

export interface AiConsentRecord {
  /** null : jamais demandé · true : accepté · false : refusé ou retiré. */
  consent: boolean | null;
  /** Date de la dernière réponse (ISO). */
  at: string | null;
}

export interface AiConsentsRepository {
  proofs(userId: string): Promise<AiConsentRecord>;
  setProofs(userId: string, consent: boolean, at: string): Promise<void>;
}
