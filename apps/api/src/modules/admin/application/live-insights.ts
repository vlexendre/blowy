import { Inject, Injectable } from '@nestjs/common';
import { type Day, SHAPES, dayOf, type Shape, VISION_AXES, VISION_BUCKETS, entitlements, settleStreak, shapeOf, visionBucketOf } from '@blowy/domain';
import type { Clock } from '../../../shared/clock';
import { CLOCK, PETS, PROFILES } from '../../../shared/tokens';
import { ENCOUNTER_PROPOSALS, type ProposalsRepository } from '../../encounters/ports';
import { hasPlus } from '../../me/application/plus';
import type { Profile, ProfilesRepository } from '../../me/ports';
import { needsNow } from '../../pets/application/pet-catch-up';
import type { PetRecord, PetsRepository } from '../../pets/ports';
import type { RitualStateRecord, RitualStatesRepository } from '../../rituels/ports';
import { RITUAL_STATES } from '../../rituels/tokens';
import type { VisionSnapshot, VisionStore } from '../../vision/ports';
import { VISION_STORE } from '../../vision/tokens';
import type { AdminInsights } from '../insights';
import type { ActivityRepository, DailyMetrics } from '../ports';
import { ACTIVITY } from '../tokens';

/** Comptes actifs du jour lus au plus pour les moyennes et répartitions (échantillon : identifiants aléatoires). */
export const INSIGHTS_SAMPLE = 5_000;
const PAGE = 1_000;

interface Sample {
  ids: string[];
  profiles: Map<string, Profile>;
  pets: Map<string, PetRecord>;
  states: Map<string, RitualStateRecord>;
  visions: VisionSnapshot[];
}

/**
 * Apports de « vision » et « rituels » aux statistiques quotidiennes (port `ADMIN_INSIGHTS`), appelés une fois par
 * jour terminé par `AdminStatsJobs` — jamais à l'affichage :
 * - rencontres proposées et compatibilité moyenne : total du jour de `encounter_proposals` (une requête) ;
 * - série moyenne, formes, répartition des visions : sur les comptes actifs du jour (`user_activity_days`), au plus
 *   INSIGHTS_SAMPLE, lus par paquets de 1 000 (profils, minimoas, séries, visions) ;
 * - forme et série du classement : les 100 personnes du classement.
 * Formes et séries sont prises au moment du calcul (comme les autres instantanés), séries rattrapées (jokers).
 */
@Injectable()
export class LiveAdminInsights implements AdminInsights {
  private sample: { day: Day; value: Promise<Sample> } | null = null;

  constructor(
    @Inject(ACTIVITY) private readonly activity: ActivityRepository,
    @Inject(ENCOUNTER_PROPOSALS) private readonly proposals: ProposalsRepository,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(RITUAL_STATES) private readonly states: RitualStatesRepository,
    @Inject(VISION_STORE) private readonly vision: VisionStore,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async averageStreak(day: Day): Promise<number | null> {
    const s = await this.sampleOf(day);
    if (s.ids.length === 0) return null;
    const total = s.ids.reduce((sum, id) => sum + this.streakOf(id, s, day), 0);
    return Math.round((total / s.ids.length) * 10) / 10;
  }

  async encountersProposed(day: Day): Promise<number | null> {
    return (await this.proposals.summary(day)).proposed;
  }

  async averageCompatibility(day: Day): Promise<number | null> {
    const { proposed, scoreSum } = await this.proposals.summary(day);
    return proposed > 0 ? Math.round(scoreSum / proposed) : null;
  }

  async shapes(day: Day): Promise<Record<Shape, number> | null> {
    const s = await this.sampleOf(day);
    if (s.ids.length === 0) return null;
    const now = this.clock.now();
    const out = Object.fromEntries(SHAPES.map((k) => [k, 0])) as Record<Shape, number>;
    for (const pet of s.pets.values()) out[shapeOf(needsNow(pet, now))] += 1;
    return out;
  }

  async visions(day: Day): Promise<DailyMetrics['visions']> {
    const s = await this.sampleOf(day);
    const known = s.visions.filter((v) => v.testDone);
    if (known.length === 0) return null;
    return VISION_AXES.map((axis) => {
      const buckets = Array<number>(VISION_BUCKETS).fill(0);
      for (const v of known) {
        const r = v.profile[axis];
        if (r.confidence > 0) buckets[visionBucketOf(r.value)] = (buckets[visionBucketOf(r.value)] ?? 0) + 1;
      }
      return { axis, buckets };
    });
  }

  async minimoaDetails(userIds: readonly string[]): Promise<DailyMetrics['topDetails']> {
    if (userIds.length === 0) return {};
    const day = this.today();
    const s = await this.load([...userIds], false);
    const now = this.clock.now();
    return Object.fromEntries(
      userIds.map((id) => {
        const pet = s.pets.get(id);
        return [id, { shape: pet ? shapeOf(needsNow(pet, now)) : null, streak: s.states.has(id) ? this.streakOf(id, s, day) : null }];
      }),
    );
  }

  private today(): Day {
    return dayOf(this.clock.now());
  }

  /** Série rattrapée au jour donné (jokers selon l'abonnement). */
  private streakOf(id: string, s: Pick<Sample, 'profiles' | 'states'>, day: Day): number {
    const state = s.states.get(id);
    if (!state) return 0;
    const perWeek = entitlements(hasPlus(s.profiles.get(id) ?? null, this.clock.now())).jokersPerWeek;
    return settleStreak(state.streak, day, perWeek).current;
  }

  /** Échantillon d'un jour, lu une fois pour les quatre statistiques qui en dépendent. */
  private sampleOf(day: Day): Promise<Sample> {
    if (this.sample?.day !== day) {
      const value = this.activeIds(day).then((ids) => this.load(ids, true));
      this.sample = { day, value };
      // Pas de cache d'un échec : le prochain calcul relira.
      value.catch(() => {
        if (this.sample?.value === value) this.sample = null;
      });
    }
    return this.sample.value;
  }

  private async activeIds(day: Day): Promise<string[]> {
    const ids: string[] = [];
    let after: string | null = null;
    while (ids.length < INSIGHTS_SAMPLE) {
      const page = await this.activity.usersOn(day, after, Math.min(PAGE, INSIGHTS_SAMPLE - ids.length));
      ids.push(...page);
      if (page.length < PAGE) break;
      after = page[page.length - 1] ?? null;
    }
    return ids;
  }

  private async load(ids: string[], withVisions: boolean): Promise<Sample> {
    const out: Sample = { ids, profiles: new Map(), pets: new Map(), states: new Map(), visions: [] };
    for (let i = 0; i < ids.length; i += PAGE) {
      const chunk = ids.slice(i, i + PAGE);
      const [profiles, pets, states, visions] = await Promise.all([
        this.profiles.findByIds(chunk),
        this.pets.findByOwners(chunk),
        this.states.findMany(chunk),
        withVisions ? this.vision.findSnapshots(chunk) : Promise.resolve([]),
      ]);
      for (const p of profiles) out.profiles.set(p.id, p);
      for (const p of pets) out.pets.set(p.ownerId, p);
      for (const st of states) out.states.set(st.userId, st);
      out.visions.push(...visions);
    }
    // Les profils supprimés depuis ne comptent pas.
    out.ids = ids.filter((id) => out.profiles.has(id));
    return out;
  }
}
