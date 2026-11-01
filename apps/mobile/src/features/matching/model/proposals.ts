import type { MatchFeed } from '@blowy/api-contract';

/**
 * Titre du paywall honnête (P-5.10) : « N pets veulent le rencontrer » seulement si N intérêts
 * humains réels (acceptés par l'autre) — le contrat n'expose pas cet état : on n'affiche donc
 * que « N rencontres à découvrir » avec N = propositions réelles, ou un titre générique.
 */
export function paywallHeadline(feed: MatchFeed | undefined): { kind: 'discover'; count: number } | { kind: 'generic' } {
  const n = feed?.items.length ?? 0;
  return n > 0 ? { kind: 'discover', count: n } : { kind: 'generic' };
}

/** Index de la proposition déverrouillée en gratuit (meilleur score). */
export function unlockedIndexes(feed: MatchFeed | undefined, capacity: number): Set<string> {
  const sorted = [...(feed?.items ?? [])].sort((a, b) => b.visionScore - a.visionScore);
  return new Set(sorted.slice(0, Math.max(0, capacity)).map((p) => p.id));
}
