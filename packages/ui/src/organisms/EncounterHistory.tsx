import { StyleSheet, View } from 'react-native';

import { Avatar } from '../atoms/Avatar';
import { Button } from '../atoms/Button';
import { Chip, type ChipTone } from '../atoms/Chip';
import { Text } from '../atoms/Text';
import { ListRow } from '../molecules/ListRow';
import { color, size, space, type, veil } from '../theme';
import type { PersonLook } from '../types';

/** Issue d'une rencontre passée (compatible avec `EncounterHistoryItem.outcome`). */
export type EncounterHistoryTone = 'linked' | 'ended' | 'declined' | 'waiting';

export interface EncounterHistoryEntry {
  key: string;
  person: PersonLook;
  /** Nom de la personne. */
  title: string;
  /** Ligne sous le nom, déjà formatée (« le pet de Léa · 12 nov. »). */
  detail: string;
  /** Libellé de l'issue (« liés », « en attente »…). */
  statusLabel: string;
  tone: EncounterHistoryTone;
  /** Ouvre le lien (rencontre acceptée dont le lien existe encore). */
  onPress?: () => void;
  accessibilityLabel?: string;
}

export interface EncounterHistoryProps {
  /** Titre de la section en capitales. */
  title: string;
  entries: readonly EncounterHistoryEntry[];
  /** « voir plus » : page suivante. */
  moreLabel?: string;
  onMore?: () => void;
  loadingMore?: boolean;
}

const CHIP_TONE: Record<EncounterHistoryTone, ChipTone> = { linked: 'accent', ended: 'glass', declined: 'glass', waiting: 'glass' };

/** Historique des rencontres : une ligne par personne croisée, son issue et sa date ; les liens vivants s'ouvrent. */
export function EncounterHistory({ title, entries, moreLabel, onMore, loadingMore }: EncounterHistoryProps) {
  if (entries.length === 0) return null;
  return (
    <View style={styles.base}>
      <Text variant="label" size={11} muted style={styles.sec} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.group}>
        {entries.map((e, i) => {
          const quiet = e.tone === 'ended' || e.tone === 'declined';
          return (
            <ListRow
              key={e.key}
              title={e.title}
              subtitle={e.detail}
              onPress={e.onPress}
              divider={i < entries.length - 1}
              accessibilityLabel={e.accessibilityLabel ?? `${e.title}, ${e.statusLabel}, ${e.detail}`}
              left={<Avatar size={40} pet={e.person.pet} face={e.person.face} uri={e.person.avatarUrl} name={e.person.displayName} dimmed={quiet} />}
              right={<Chip label={e.statusLabel} tone={CHIP_TONE[e.tone]} size="sm" />}
              chevron={!!e.onPress}
            />
          );
        })}
      </View>
      {onMore && moreLabel ? <Button label={moreLabel} variant="link" size="md" onPress={onMore} loading={loadingMore} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { gap: space.sm + 2, marginTop: space.md },
  sec: { fontFamily: type.bodyHeavy.fontFamily, letterSpacing: 11 * 0.12, paddingHorizontal: space.xs + 2 },
  group: {
    backgroundColor: color.panel,
    borderWidth: size.border,
    borderColor: veil.line,
    borderRadius: 24,
    paddingHorizontal: space.lg,
    paddingVertical: 2,
  },
});
