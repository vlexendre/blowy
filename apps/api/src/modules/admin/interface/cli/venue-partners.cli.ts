/**
 * Accès des lieux partenaires (rôle `venue_partner`, spec-v5 §10.2) depuis l'environnement de
 * déploiement — même usage que la route admin (ops/admin + step-up), pour l'amorçage. Audité.
 *
 *   node dist/modules/admin/interface/cli/venue-partners.cli.js grant  --venue <id|nom exact> --subject <uid> --provider firebase|local --operator "<nom>" --reason "<motif>"
 *   node dist/modules/admin/interface/cli/venue-partners.cli.js revoke --venue … --subject … --provider … --operator … --reason …
 *   node dist/modules/admin/interface/cli/venue-partners.cli.js list
 *   node dist/modules/admin/interface/cli/venue-partners.cli.js totp --subject <clé locale>   (LOCAL/TEST UNIQUEMENT : code TOTP courant)
 * (en dev : `pnpm --filter @blowy/api venue:partners -- grant …`). `--provider local` est refusé en production.
 */
import { createDb } from '@blowy/database';
import { loadConfig } from '../../../../config/env.js';
import { PrismaUnitOfWork } from '../../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import { SystemClock } from '../../../../shared/infrastructure/system-clock.js';
import { venueTotpSubject } from '../../application/use-cases/venue-partner.use-cases.js';
import { reduceVenuePartner } from '../../domain/venue-partner.js';
import { base32Encode, deriveTotpSecret, stepOf, totpAt } from '../../domain/totp.js';
import { loadAdminConfig } from '../../infrastructure/admin-config.js';
import { PrismaAuditLog } from '../../infrastructure/prisma-admin.repositories.js';
import { PrismaVenuePartnerStore } from '../../infrastructure/prisma-ops.repositories.js';
import { PrismaVenueSessionRepository } from '../../infrastructure/prisma-venue-sessions.repository.js';
import { PrismaStaffRepository } from '../../infrastructure/prisma-staff.repository.js';

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
function fail(msg: string): never {
  console.error(`venue-partners : ${msg}`);
  process.exit(2);
}

const cmd = process.argv.slice(2).find((a) => a !== '--');
const cfg = loadConfig();
const db = createDb({ connectionString: cfg.DATABASE_URL, max: 2 });
const clock = new SystemClock();
const store = new PrismaVenuePartnerStore(db);
const uow = new PrismaUnitOfWork(db, clock);
const audit = new PrismaAuditLog(db, clock);
const identities = new PrismaStaffRepository(db);

async function userOf(): Promise<string> {
  const subject = arg('subject') ?? fail('--subject requis');
  const provider = (arg('provider') ?? 'firebase').toUpperCase();
  if (provider !== 'FIREBASE' && provider !== 'LOCAL') fail('--provider firebase|local');
  if (provider === 'LOCAL' && cfg.isProduction) fail('identité locale interdite en production');
  return (await identities.findUserIdByIdentity(provider, subject)) ?? fail('identité inconnue (le compte doit exister : première connexion préalable)');
}

try {
  if (cmd === 'list') {
    for (const v of await db.venue.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })) {
      const s = reduceVenuePartner(await store.load(null, v.id));
      console.warn(`${v.name.padEnd(32)} ${v.id}  partenaires=${[...s.partners].join(',') || '—'}  contrat=${s.contract?.version ?? 'non signé'}`);
    }
  } else if (cmd === 'grant' || cmd === 'revoke') {
    const ref = arg('venue') ?? fail('--venue requis (id ou nom exact)');
    const venue = (await db.venue.findFirst({ where: /^[0-9a-f-]{36}$/i.test(ref) ? { id: ref } : { name: ref }, select: { id: true, name: true } })) ?? fail('lieu inconnu');
    const operator = arg('operator') ?? fail('--operator requis');
    const reason = arg('reason') ?? fail('--reason requis');
    if (reason.trim().length < 5) fail('motif trop court');
    const userId = await userOf();
    await uow.run(async (scope) => {
      const s = reduceVenuePartner(await store.load(scope, venue.id));
      const changed = cmd === 'grant' ? !s.partners.has(userId) : s.partners.has(userId);
      if (changed) {
        await store.append(scope, venue.id, cmd === 'grant' ? { type: 'ACCESS_GRANTED', userId } : { type: 'ACCESS_REVOKED', userId }, null);
        if (cmd === 'revoke') await new PrismaVenueSessionRepository(db).revokeAllFor(scope, userId, scope.now);
      }
      await audit.record(scope, { actorUserId: null, actorRole: `cli:${operator}`, action: `venue.cli.${cmd}`, targetType: 'Venue', targetId: venue.id, reason, data: { partnerUserId: userId, changed } });
      console.warn(changed ? `OK ${cmd} ${venue.name} → ${userId}` : `Inchangé (${cmd} déjà dans cet état)`);
    });
  } else if (cmd === 'totp') {
    if (cfg.BLOWY_ENV !== 'local' && cfg.BLOWY_ENV !== 'test') fail('totp refusé hors local/test');
    const subject = arg('subject') ?? fail('--subject requis');
    const userId = (await identities.findUserIdByIdentity('LOCAL', subject)) ?? fail('compte local inconnu');
    const st = await store.partnerMfa(userId);
    if (st.generation === 0) console.warn(`${subject} : MFA non enrôlée — se connecter à /lieu/login pour démarrer l'enrôlement, puis relancer.`);
    else {
      const secret = deriveTotpSecret(loadAdminConfig().staffMfaKey, venueTotpSubject(userId), st.generation);
      console.warn(`${subject} (génération ${st.generation}, ${st.enrolled ? 'confirmée' : 'à confirmer'}) secret=${base32Encode(secret)} code=${totpAt(secret, stepOf(clock.now()))}`);
    }
  } else {
    fail('commande : grant | revoke | list | totp');
  }
} finally {
  await db.$disconnect();
}
