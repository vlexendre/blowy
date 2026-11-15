import { Inject, Injectable } from '@nestjs/common';
import { VISION_AXES, VISION_SOURCES, type VisionAnswer, type VisionProfile, type VisionSignal, clampVision, testSignals, visionProfile } from '@blowy/domain';
import type { Clock } from '../../../shared/clock';
import { CLOCK } from '../../../shared/tokens';
import type { MatchCacheRepository, PlacesRepository, VisionSnapshot, VisionStore } from '../ports';
import { MATCH_CACHE, PLACES, VISION_STORE, type VisionReader, type VisionSignals } from '../tokens';

/** Observations relues pour calculer un profil (les plus récentes ; au-delà, leur poids est négligeable). */
export const SIGNAL_WINDOW = 1000;

const isValid = (s: VisionSignal): boolean =>
  (VISION_AXES as readonly string[]).includes(s.axis) && (VISION_SOURCES as readonly string[]).includes(s.source) && Number.isFinite(s.value) && !Number.isNaN(Date.parse(s.at));

/**
 * Seule porte d'écriture de la vision. Chaque observation recalcule le profil stocké (lecture rapide pour
 * l'appariement) et vide le cache des personnes compatibles de la personne.
 */
@Injectable()
export class VisionRecorder implements VisionSignals, VisionReader {
  constructor(
    @Inject(VISION_STORE) private readonly store: VisionStore,
    @Inject(PLACES) private readonly places: PlacesRepository,
    @Inject(MATCH_CACHE) private readonly cache: MatchCacheRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** Port partagé (habitudes, question du jour, soins, « 3 mots »). Les observations invalides sont ignorées. */
  async record(userId: string, signals: VisionSignal[]): Promise<void> {
    const clean = signals.filter(isValid).map((s) => ({ ...s, value: clampVision(s.value), at: new Date(s.at).toISOString() }));
    if (clean.length === 0) return;
    await this.store.addSignals(userId, clean);
    await this.refresh(userId);
  }

  /** Test passé ou repassé : ses réponses remplacent les précédentes. */
  async answerTest(userId: string, answers: readonly VisionAnswer[]): Promise<VisionSnapshot> {
    await this.store.replaceTest(userId, testSignals(answers, this.clock.now().toISOString()));
    return this.refresh(userId);
  }

  /** Profil recalculé à l'instant présent, sans l'enregistrer. */
  async current(userId: string): Promise<VisionSnapshot> {
    const signals = await this.store.listSignals(userId, SIGNAL_WINDOW);
    const now = this.clock.now();
    return { userId, profile: visionProfile(signals, now), testDone: signals.some((s) => s.source === 'test'), computedAt: now.toISOString() };
  }

  async profileOf(userId: string): Promise<VisionProfile> {
    return (await this.current(userId)).profile;
  }

  async lastAwayAt(userId: string): Promise<string | null> {
    return (await this.places.find(userId))?.lastAwayAt ?? null;
  }

  private async refresh(userId: string): Promise<VisionSnapshot> {
    const snapshot = await this.current(userId);
    await this.store.saveSnapshot(snapshot);
    await this.cache.clear(userId);
    return snapshot;
  }
}
