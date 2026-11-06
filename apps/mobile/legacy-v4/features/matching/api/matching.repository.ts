/** Repository matching : BlowyClient (agent C). */
import type { Api } from '../../../core/api/client';

export function createMatchingRepository({ client }: Api) {
  return {
    feed: () => client.matching.feed(),
    /** Lot d'onboarding (fin de parcours) : propositions réelles ou raison d'attente. */
    onboardingBatch: () => client.matching.requestOnboardingBatch(),
    accept: (commandId: string, id: string) => client.matching.accept(id, { commandId }),
  };
}
