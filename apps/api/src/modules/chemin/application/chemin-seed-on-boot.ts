import { Inject, Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import type { CheminContentRepository } from '../ports';
import { buildSeedContent } from '../seed/build';
import { CHEMIN_CONTENT } from '../tokens';

/**
 * Au démarrage de l'API : ajoute le contenu de départ de Ton chemin qui manque en base (unités avec leurs étapes,
 * questions), sans jamais réécrire l'existant (une question modifiée ou dépubliée dans l'administration reste telle
 * quelle). Même effet que `chemin:seed` sans `--update`, sans avoir besoin de la clé secrète hors de l'API.
 * Un échec n'empêche jamais l'API de démarrer : il est seulement journalisé.
 */
@Injectable()
export class CheminSeedOnBoot implements OnApplicationBootstrap {
  private readonly log = new Logger('CheminSeed');

  constructor(@Inject(CHEMIN_CONTENT) private readonly content: CheminContentRepository) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const added = await this.seedMissing(new Date().toISOString());
      if (added > 0) this.log.log(`contenu de départ : ${added} élément(s) ajouté(s)`);
    } catch (err) {
      this.log.warn(`contenu de départ non chargé : ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /** Ajoute ce qui manque ; renvoie le nombre d'unités et de questions ajoutées. */
  async seedMissing(at: string): Promise<number> {
    const current = await this.content.load();
    const seed = buildSeedContent(at);
    const units = new Set(current.units.map((u) => u.id));
    const questions = new Set(current.questions.map((q) => q.id));
    let added = 0;
    for (const u of seed.units) {
      if (units.has(u.id)) continue;
      await this.content.upsertUnit(u);
      added += 1;
    }
    const missing = seed.questions.filter((q) => !questions.has(q.id));
    if (missing.length > 0) await this.content.insertMissingQuestions(missing);
    added += missing.length;
    return added;
  }
}
