/** Ports des minimoas du chat : accord de lecture et coupure par personne, compteurs d'interventions par lien. */
import type { ChatConsent, ChatPetState } from '@blowy/domain';

export const CHAT_SETTINGS = Symbol('CHAT_SETTINGS');
export const CHAT_PET_STATE = Symbol('CHAT_PET_STATE');

export interface ChatLinkSettingRecord {
  linkId: string;
  userId: string;
  /** null tant que la question n'a pas été posée. */
  consent: ChatConsent;
  consentAt: string | null;
  muted: boolean;
  updatedAt: string;
}

export interface ChatSettingsRepository {
  /** Réglages des membres d'un lien (0, 1 ou 2 lignes). */
  forLink(linkId: string): Promise<ChatLinkSettingRecord[]>;
  /** Réglages d'une personne pour plusieurs liens. */
  forUserLinks(userId: string, linkIds: readonly string[]): Promise<ChatLinkSettingRecord[]>;
  upsert(record: ChatLinkSettingRecord): Promise<void>;
}

export interface ChatPetStateRepository {
  /** État du lien (vide s'il n'existe pas encore). */
  get(linkId: string): Promise<ChatPetState>;
  save(linkId: string, state: ChatPetState): Promise<void>;
}
