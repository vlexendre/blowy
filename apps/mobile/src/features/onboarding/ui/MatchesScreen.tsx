/**
 * Ses rendez-vous (V4-Match) : propositions réelles du serveur ou attente honnête selon
 * `emptyReason`. Gratuit : une place ; les autres affichées verrouillées → paywall.
 */
import { Banner, EmptyState, LoadingState, OnboardingStepTemplate } from '@blowy/ui-mobile';
import { router } from 'expo-router';
import { paths } from '../../../core/navigation/paths';
import { viewStateOf } from '../../../core/api/query';
import { formatRelative, t, tDynamic } from '../../../i18n';
import { ProposalCard, unlockedIndexes, useAcceptProposal, useMatchFeed } from '../../matching';
import { speciesName } from '../../pets';
import { useOnboarding } from '../model/store';
import { useOnboardingNav } from './useOnboardingNav';

const FREE_SLOTS = 1;

export function MatchesScreen() {
  const d = useOnboarding();
  const nav = useOnboardingNav('matches');
  const feed = useMatchFeed();
  const accept = useAcceptProposal();
  const state = viewStateOf(feed, (x) => (x as { items: unknown[] }).items.length === 0);
  const name = d.petName.trim() || speciesName(d.species);
  const items = feed.data?.items ?? [];
  const unlocked = unlockedIndexes(feed.data, FREE_SLOTS);
  const reason = feed.data?.emptyReason ?? 'NONE';

  return (
    <OnboardingStepTemplate
      testID="screen-matches"
      step={nav.step}
      title={items.length > 1 ? t('onboarding.matches.title', { name, count: items.length }) : items.length === 1 ? t('onboarding.matches.titleOne', { name }) : t('relation.noDates.title', { pet: name })}
      lead={items.length ? t('onboarding.matches.levelHint') : undefined}
      cta={{ label: items.some((p) => p.acceptedByMe) ? t('common.continue') : t('onboarding.matches.goNest'), onPress: nav.next, testID: 'matches-continue' }}
    >
      {state === 'loading' ? <LoadingState label={t('common.loading')} /> : null}
      {state === 'unavailable' || state === 'error' || state === 'offline' ? <EmptyState title={t('common.unavailableTitle')} message={t('common.unavailableBody')} actionLabel={t('common.retry')} onAction={() => void feed.refetch()} /> : null}
      {state === 'empty' ? (
        <Banner message={tDynamic(`onboarding.matches.empty.${reason}`, { when: feed.data?.nextBatchAt ? formatRelative(feed.data.nextBatchAt) : t('relation.noDates.next') })} tone="cream" icon="star" />
      ) : null}
      {items.map((p) => (
        <ProposalCard key={p.id} p={p} unlocked={unlocked.has(p.id)} busy={accept.isPending && accept.variables === p.id} onAccept={() => void accept.mutateAsync(p.id)} onLocked={() => router.push(paths.paywall)} />
      ))}
    </OnboardingStepTemplate>
  );
}
