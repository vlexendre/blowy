/**
 * Semis au démarrage de la démo locale en mémoire (`BLOWY_DEMO=1 BLOWY_SEED_CITIES=paris,lyon`, docs/SEED-TEST.md) :
 * lancé par `DemoWorld` après son propre monde (l'horloge est reculée pendant le semis : rien d'autre ne doit tourner).
 * Un refus des garde-fous arrête le démarrage.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Env } from '../../config/env';
import { ENV } from '../../shared/tokens';
import { DEFAULT_PER_CITY } from './plan';
import { Seeder } from './seeder';

@Injectable()
export class SeedBoot {
  private readonly logger = new Logger('Semis');
  private seeded = false;

  constructor(
    @Inject(ENV) private readonly env: Env,
    @Inject(Seeder) private readonly seeder: Seeder,
  ) {}

  async start(): Promise<void> {
    const cfg = this.env.seed;
    if (!cfg || this.seeded) return;
    const started = Date.now();
    const report = await this.seeder.run({ options: { cities: cfg.cities, perCity: cfg.perCity ?? DEFAULT_PER_CITY, seed: cfg.seed }, source: cfg.source });
    this.seeded = true;
    this.logger.log(`semis de test prêt en ${Math.round((Date.now() - started) / 1000)} s : ${report.done.accounts ?? 0} comptes (${report.cities.join(', ')})`);
  }

  /** Nouvelle inscription locale : rattachée au monde du semis si `BLOWY_SEED_ADOPT=1` (rend vrai, la démo est sautée). */
  async onOnboarded(userId: string): Promise<boolean> {
    if (!this.seeded || !this.env.seed?.adoptNewcomers) return false;
    return this.seeder.adoptUser(userId);
  }
}
