/**
 * « Déjà croisés » (rencontres passées, `useEncounterHistory`) : une ligne par personne, son issue et sa date ; une
 * rencontre acceptée dont le lien existe encore ouvre son chat. Montré replié en bas des Chats (docs/ADA-2027.md).
 */
import type { EncounterHistoryItem } from '@blowy/contract';
import type { EncounterHistoryEntry } from '@blowy/ui';

import { timeLabel } from '@/features/links/format';
import { rencontres as t } from '@/locales/rencontres';

export function historyEntry(item: EncounterHistoryItem, openLink: (linkId: string) => void): EncounterHistoryEntry {
  const when = timeLabel(item.at);
  const { linkId } = item;
  return {
    key: item.id,
    person: item.person,
    title: item.person.displayName,
    detail: item.direction === 'received' ? t.history.received(item.person.pet.name, when) : t.history.sent(item.person.pet.name, when),
    statusLabel: t.history.outcome[item.outcome],
    tone: item.outcome,
    onPress: linkId ? () => openLink(linkId) : undefined,
    accessibilityLabel: linkId ? `${t.history.openA11y(item.person.displayName)}, ${t.history.outcome[item.outcome]}, ${when}` : undefined,
  };
}
