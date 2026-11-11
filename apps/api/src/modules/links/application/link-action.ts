import type { LinkRecord, MessageRecord } from '../ports';

/** Résultat d'une action dans un lien : le lien à jour et les messages ajoutés. */
export interface LinkActionResult {
  link: LinkRecord;
  messages: MessageRecord[];
}
