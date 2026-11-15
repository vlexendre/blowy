/** Ports des minimoas du chat : accord de lecture et coupure par personne, compteurs d'interventions par lien. */
import type { ChatConsent, ChatPetState, ChatReadingDefault } from '@blowy/domain';

export const CHAT_SETTINGS = Symbol('CHAT_SETTINGS');
export const CHAT_PET_STATE = Symbol('CHAT_PET_STATE');

export interface ChatLinkSettingRecord {
  linkId: string;
  userId: string;
  /** null tant que la question n'a pas été posée. */
  consent: ChatConsent;
  consentAt: string | null;
  muted: boolean;
  /** L'accord vient du réglage par défaut de la personne (pas d'une réponse dans ce chat). */
  byDefault: boolean;
  updatedAt: string;
}

export interface ChatSettingsRepository {
  /** Réglages des membres d'un lien (0, 1 ou 2 lignes). */
  forLink(linkId: string): Promise<ChatLinkSettingRecord[]>;
  /** Réglages d'une personne pour plusieurs liens. */
  forUserLinks(userId: string, linkIds: readonly string[]): Promise<ChatLinkSettingRecord[]>;
  upsert(record: ChatLinkSettingRecord): Promise<void>;
  upsertMany(records: readonly ChatLinkSettingRecord[]): Promise<void>;
  /** Réglage par défaut des nouveaux liens (« ask » si jamais choisi). */
  readingDefault(userId: string): Promise<ChatReadingDefault>;
  setReadingDefault(userId: string, value: ChatReadingDefault): Promise<void>;
}

export interface ChatPetStateRepository {
  /** État du lien (vide s'il n'existe pas encore). */
  get(linkId: string): Promise<ChatPetState>;
  save(linkId: string, state: ChatPetState): Promise<void>;
  /** Minuteur : liens dont le dernier message d'une personne date d'avant `before`, du plus ancien au plus récent, après le curseur. */
  listSilent(before: string, after: string | null, limit: number): Promise<{ linkId: string; state: ChatPetState }[]>;
}
