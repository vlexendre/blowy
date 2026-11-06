/**
 * DÉVELOPPEMENT LOCAL UNIQUEMENT : affiche le code TOTP courant d'un compte staff seedé
 * (`staff.<rôle>`), dérivé de la clé maîtresse LOCALE par défaut. Refusé hors local/test.
 *   pnpm --filter @blowy/api staff:totp -- staff.admin
 * En staging/production, l'enrôlement se fait dans l'admin avec une application TOTP ; aucun
 * secret n'est imprimable.
 */
import { createDb } from '@blowy/database';
import { loadConfig } from '../../../../config/env.js';
import { SystemClock } from '../../../../shared/infrastructure/system-clock.js';
import { loadAdminConfig } from '../../infrastructure/admin-config.js';
import { PrismaStaffRepository } from '../../infrastructure/prisma-staff.repository.js';
import { base32Encode, deriveTotpSecret, stepOf, totpAt } from '../../domain/totp.js';

const cfg = loadConfig();
if (cfg.BLOWY_ENV !== 'local' && cfg.BLOWY_ENV !== 'test') {
  console.error('staff:totp refusé hors local/test');
  process.exit(2);
}
const key = process.argv.slice(2).find((a) => a !== '--') ?? 'staff.admin';
const db = createDb({ connectionString: cfg.DATABASE_URL, max: 1 });
try {
  const repo = new PrismaStaffRepository(db);
  const userId = await repo.findUserIdByIdentity('LOCAL', key);
  if (!userId) throw new Error(`compte local inconnu : ${key}`);
  const st = await repo.mfaState(userId);
  if (st.generation === 0) {
    console.warn(`${key} : MFA non enrôlée — se connecter à l'admin pour démarrer l'enrôlement, puis relancer.`);
  } else {
    const secret = deriveTotpSecret(loadAdminConfig().staffMfaKey, userId, st.generation);
    console.warn(`${key} (génération ${st.generation}, ${st.enrolled ? 'confirmée' : 'à confirmer'}) secret=${base32Encode(secret)} code=${totpAt(secret, stepOf(new SystemClock().now()))}`);
  }
} finally {
  await db.$disconnect();
}
