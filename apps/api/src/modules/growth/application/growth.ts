import { Inject, Injectable, Logger } from '@nestjs/common';
import type { AttributionDto } from '@blowy/contract';
import {
  type Attribution,
  type Day,
  type GrowthCounterMetric,
  type GrowthEventKind,
  type PlusStep,
  type PlusTrigger,
  type SharePage,
  type ShareKind,
  type WebStep,
  activeMilestone,
  dayOf,
  isCreatorCode,
  normalizeCode,
} from '@blowy/domain';
import type { Clock } from '../../../shared/clock';
import { CLOCK } from '../../../shared/tokens';
import {
  ACQUISITIONS,
  type AcquisitionsRepository,
  GROWTH_COUNTERS,
  GROWTH_EVENTS,
  type GrowthCountersRepository,
  type GrowthEventsRepository,
} from '../ports';

/**
 * Mesure de la croissance (docs/VIRALITE.md) : compteurs du jour (visites des pages de partage, premiers lancements,
 * inscriptions, votes, partages) et étapes de chaque compte (une fois chacune). Rien ici ne bloque le produit : une
 * mesure qui échoue est notée dans les journaux, jamais renvoyée à la personne.
 */
@Injectable()
export class Growth {
  private readonly logger = new Logger('Croissance');

  constructor(
    @Inject(ACQUISITIONS) readonly acquisitions: AcquisitionsRepository,
    @Inject(GROWTH_EVENTS) private readonly events: GrowthEventsRepository,
    @Inject(GROWTH_COUNTERS) private readonly counters: GrowthCountersRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  today(): Day {
    return dayOf(this.clock.now());
  }

  private async safely(what: string, run: () => Promise<unknown>): Promise<void> {
    try {
      await run();
    } catch (err) {
      this.logger.warn(`${what} non compté : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    }
  }

  private bump(metric: GrowthCounterMetric, source = '', ref = ''): Promise<void> {
    return this.safely(metric, () => this.counters.bump(this.today(), metric, source, ref));
  }

  /** Visite d'une page de partage (le code n'est gardé que pour un créateur : jamais celui d'une personne). */
  visit(page: SharePage, creatorCode?: string): Promise<void> {
    return this.bump(`visit_${page}`, '', page === 'c' && creatorCode ? creatorCode : '');
  }

  /** Premier lancement (une fois par installation, compté par l'app) ou inscription terminée. */
  arrival(metric: 'first_open' | 'signup', a: AttributionDto): Promise<void> {
    const ref = a.source === 'creator' && a.ref && isCreatorCode(a.ref) ? normalizeCode(a.ref) : '';
    return this.bump(metric, a.source, ref);
  }

  vote(): Promise<void> {
    return this.bump('words_vote');
  }

  share(kind: ShareKind): Promise<void> {
    return this.bump(`share_${kind}`);
  }

  /** Étape du site sans compte (quiz, quartier) ; `source` : `ref` (venu d'un défi) ou le type de partage. */
  web(step: WebStep, source = ''): Promise<void> {
    return this.bump(step, source);
  }

  /** Minimoa+ : feuille ouverte, essai, premier paiement, par déclencheur (aucune personne derrière ; docs/DESIR.md). */
  plus(step: PlusStep, trigger: PlusTrigger | null): Promise<void> {
    return this.bump(step, trigger ?? '');
  }

  /** Une étape d'un compte (premier lien, essai, payant…), une fois ; rien si la source du compte n'est pas connue. */
  step(userId: string, kind: GrowthEventKind): Promise<void> {
    return this.safely(kind, async () => {
      const a = await this.acquisitions.find(userId);
      if (a) await this.events.record({ userId, kind, source: a.source, cohortOn: a.cohortOn, createdAt: this.clock.now().toISOString() });
    });
  }

  /** Jour d'activité : J1, J7, J30 après l'inscription (appelé une fois par personne et par jour). */
  active(userId: string, day: Day): Promise<void> {
    return this.safely('activité', async () => {
      const a = await this.acquisitions.find(userId);
      const kind = a ? activeMilestone(a.cohortOn, day) : null;
      if (a && kind) await this.events.record({ userId, kind, source: a.source, cohortOn: a.cohortOn, createdAt: this.clock.now().toISOString() });
    });
  }

  /** Fin de l'inscription : la source du compte, puis l'étape « inscrit ». */
  onboarded(userId: string, attribution: Attribution): Promise<void> {
    return this.safely('inscription', async () => {
      const now = this.clock.now();
      const cohortOn = dayOf(now);
      await this.acquisitions.create({ userId, source: attribution.source, ref: attribution.ref, referredBy: attribution.referredBy, cohortOn, createdAt: now.toISOString() });
      const a = (await this.acquisitions.find(userId)) ?? { source: attribution.source, cohortOn };
      await this.events.record({ userId, kind: 'onboarded', source: a.source, cohortOn: a.cohortOn, createdAt: now.toISOString() });
    });
  }

  /** Parrainages qui comptent pour l'objet « Parrain » : ceux qu'on a fait venir, et soi-même si on a été invité. */
  async referrals(userId: string): Promise<number> {
    try {
      const [mine, by] = await Promise.all([this.acquisitions.find(userId), this.acquisitions.countReferredBy(userId)]);
      return by + (mine?.referredBy ? 1 : 0);
    } catch {
      return 0;
    }
  }
}
