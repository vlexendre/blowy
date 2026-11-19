import { Inject, Injectable } from '@nestjs/common';
import { type CheminCatalogue, type CheminQuestion, type CheminUnit, liveCatalogue } from '@blowy/domain';
import type { Clock } from '../../../shared/clock';
import { CLOCK } from '../../../shared/tokens';
import type { CheminContent, CheminContentRepository, ContentQuestion, ContentScene, ContentStep, ContentUnit } from '../ports';
import { CHEMIN_CONTENT } from '../tokens';

/** Le contenu en ligne une minute au plus en cache : une question publiée dans l'administration arrive vite. */
export const CONTENT_TTL_MS = 60_000;

export interface LiveContent {
  catalogue: CheminCatalogue;
  questions: ReadonlyMap<string, ContentQuestion>;
  units: ReadonlyMap<string, ContentUnit>;
  steps: ReadonlyMap<string, ContentStep>;
  scenes: readonly ContentScene[];
}

export const toDomainQuestion = (q: ContentQuestion): CheminQuestion => ({
  id: q.id,
  format: q.format,
  axis: q.axis,
  direction: q.direction,
  minBuild: q.minBuild,
  status: q.status,
  legacyTestId: q.legacyTestId,
  options: [...q.options]
    .sort((a, b) => a.position - b.position)
    .map((o) => ({ id: o.id, icon: o.icon, weight: o.weight, tag: o.tag, reaction: { animation: o.animation, minBuild: o.reactionMinBuild } })),
});

/** Le parcours vu par l'app : unités et étapes en ligne, leurs questions en ligne, dans l'ordre. */
export function toLiveContent(content: CheminContent): LiveContent {
  const questionsByStep = new Map<string, ContentQuestion[]>();
  for (const q of content.questions) if (q.stepId) questionsByStep.set(q.stepId, [...(questionsByStep.get(q.stepId) ?? []), q]);
  const units: CheminUnit[] = content.units.map((u) => ({
    id: u.id,
    position: u.position,
    icon: u.icon,
    minBuild: u.minBuild,
    status: u.status,
    steps: u.steps.map((s) => ({
      id: s.id,
      unitId: u.id,
      position: s.position,
      status: s.status,
      questionIds: [...(questionsByStep.get(s.id) ?? [])].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id)).map((q) => q.id),
    })),
  }));
  return {
    catalogue: liveCatalogue(units, content.questions.map(toDomainQuestion)),
    questions: new Map(content.questions.map((q) => [q.id, q])),
    units: new Map(content.units.map((u) => [u.id, u])),
    steps: new Map(content.units.flatMap((u) => u.steps.map((s) => [s.id, s] as const))),
    scenes: content.scenes.filter((s) => s.status === 'live'),
  };
}

@Injectable()
export class CheminContentService {
  private cache: { at: number; live: LiveContent } | null = null;

  constructor(
    @Inject(CHEMIN_CONTENT) private readonly repo: CheminContentRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async live(): Promise<LiveContent> {
    const now = this.clock.now().getTime();
    if (this.cache && now - this.cache.at < CONTENT_TTL_MS && now >= this.cache.at) return this.cache.live;
    const live = toLiveContent(await this.repo.load());
    this.cache = { at: now, live };
    return live;
  }

  /** Après une modification dans l'administration (cette instance ; les autres suivent sous une minute). */
  invalidate(): void {
    this.cache = null;
  }
}
