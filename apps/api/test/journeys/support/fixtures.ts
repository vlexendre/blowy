/**
 * Écritures DIRECTES en base — seulement là où l'API n'offre aucun moyen réaliste d'atteindre un
 * état dans un test (ex. 500 XP de Lien = plusieurs semaines de plafonds journaliers). Chaque
 * usage est signalé dans le rapport comme « raccourci de test », jamais comme un résultat.
 */
import type { World } from './world.js';

const THRESHOLDS = [0, 150, 500, 900, 1400, 2000, 3000];

/** Force le niveau atteint d'une relation (XP au seuil). */
export async function forceLevel(w: World, relId: string, level: number) {
  const th = THRESHOLDS[level - 1]!;
  await w.db.relationshipContext.update({ where: { id: relId }, data: { reachedLevel: level, eligibleLevel: level, xpMilli: th * 1000 } });
}

/** Attribue un slug public (aucune route API ne le fait — voir rapport). */
export async function forcePublicSlug(w: World, userId: string, slug: string) {
  await w.db.profile.update({ where: { userId }, data: { publicSlug: slug, slugEnabled: true } });
}
