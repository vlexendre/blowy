/** Carte d'une proposition de rendez-vous (score de vision, expiration, accepter / verrouillé). */
import type { MatchProposalView } from '@blowy/api-contract';
import { resolveSprite } from '@blowy/sprites';
import { Button, Sprite, StatusPill, Surface, Text, space } from '@blowy/ui-mobile';
import { View } from 'react-native';
import { formatRelative, t } from '../../../i18n';
import { speciesName } from '../../pets';

export function ProposalCard({ p, unlocked, onAccept, onLocked, busy }: { p: MatchProposalView; unlocked: boolean; onAccept: () => void; onLocked: () => void; busy: boolean }) {
  return (
    <Surface style={{ gap: space.sm }}>
      <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
        <Sprite path={resolveSprite(p.otherPet.species, p.otherPet.stage, p.otherPet.pose).path} size={72} accessibilityLabel={`${p.otherPet.name}, ${speciesName(p.otherPet.species)}`} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="displayM">{p.otherPet.name}</Text>
          <StatusPill kind="info" label={t('onboarding.matches.score', { score: p.visionScore })} />
          <Text variant="caption" tone="muted">
            {t('onboarding.matches.expires', { when: formatRelative(p.expiresAt) })}
          </Text>
        </View>
      </View>
      {p.acceptedByMe ? (
        <StatusPill kind="pending" label={t('onboarding.matches.accepted')} />
      ) : unlocked ? (
        <Button label={t('onboarding.matches.accept')} onPress={onAccept} loading={busy} size="md" testID={`accept-${p.id}`} />
      ) : (
        <Button label={t('onboarding.matches.locked')} variant="violet" icon="lock" size="md" onPress={onLocked} />
      )}
    </Surface>
  );
}
