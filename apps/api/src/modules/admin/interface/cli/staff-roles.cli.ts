/**
 * Commande d'administration SÉCURISÉE des rôles staff (§18 : « pas d'email admin codé en dur ni de
 * route publique d'auto-promotion »). S'exécute dans l'environnement de déploiement (accès base),
 * jamais via HTTP. Chaque opération est auditée (AuditLog, acteur = opérateur déclaré).
 *
 *   node dist/modules/admin/interface/cli/staff-roles.cli.js grant  --subject <uid> --provider firebase|local --role <rôle> --operator "<nom>" --reason "<motif>"
 *   node dist/modules/admin/interface/cli/staff-roles.cli.js revoke --subject <uid> --provider … --role <rôle> --operator … --reason …
 *   node dist/modules/admin/interface/cli/staff-roles.cli.js reset-mfa --subject <uid> --provider … --operator … --reason …
 *   node dist/modules/admin/interface/cli/staff-roles.cli.js list
 * (en dev : `pnpm --filter @blowy/api staff:roles -- grant …`)
 * En production, `--provider local` est refusé.
 */
import { createDb } from '@blowy/database';
import { STAFF_ROLES_V5 as STAFF_ROLES, type StaffRoleV5 as StaffRole } from '@blowy/domain';
import { loadConfig } from '../../../../config/env.js';
import { PrismaUnitOfWork } from '../../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import { SystemClock } from '../../../../shared/infrastructure/system-clock.js';
import { PrismaAuditLog } from '../../infrastructure/prisma-admin.repositories.js';
import { PrismaStaffRepository } from '../../infrastructure/prisma-staff.repository.js';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function fail(msg: string): never {
  console.error(`staff-roles : ${msg}`);
  process.exit(2);
}

const cmd = process.argv.slice(2).find((a) => a !== '--');
const cfg = loadConfig();
const db = createDb({ connectionString: cfg.DATABASE_URL, max: 2 });
const repo = new PrismaStaffRepository(db);
const clock = new SystemClock();
const audit = new PrismaAuditLog(db, clock);
const uow = new PrismaUnitOfWork(db, clock);

try {
  if (cmd === 'list') {
    const rows = await db.staffRoleAssignment.findMany({ where: { revokedAt: null }, include: { user: { select: { authIdentities: { select: { provider: true, subject: true } } } } }, orderBy: { createdAt: 'asc' } });
    for (const r of rows) console.warn(`${r.role.padEnd(16)} ${r.userId}  mfa=${r.mfaEnrolled ? 'oui' : 'non'}  ${r.user.authIdentities.map((i) => `${i.provider}:${i.subject}`).join(',')}`);
  } else if (cmd === 'grant' || cmd === 'revoke' || cmd === 'reset-mfa') {
    const subject = arg('subject') ?? fail('--subject requis');
    const provider = (arg('provider') ?? 'firebase').toUpperCase();
    if (provider !== 'FIREBASE' && provider !== 'LOCAL') fail('--provider firebase|local');
    if (provider === 'LOCAL' && cfg.isProduction) fail('identité locale interdite en production');
    const operator = arg('operator') ?? fail('--operator requis (personne qui exécute la commande)');
    const reason = arg('reason') ?? fail('--reason requis');
    if (reason.trim().length < 5) fail('motif trop court');
    const userId = (await repo.findUserIdByIdentity(provider, subject)) ?? fail('identité inconnue (le compte doit exister : première connexion préalable)');
    const role = arg('role') as StaffRole | undefined;
    if (cmd !== 'reset-mfa' && (!role || !(STAFF_ROLES as readonly string[]).includes(role))) fail(`--role parmi ${STAFF_ROLES.join(', ')}`);
    await uow.run(async (scope) => {
      let changed: boolean;
      if (cmd === 'grant') changed = await repo.grantRole(scope, userId, role!, null);
      else if (cmd === 'revoke') {
        changed = await repo.revokeRole(scope, userId, role!, scope.now);
        // Retrait de rôle : sessions staff révoquées immédiatement.
        if (changed) await repo.revokeAllFor(scope, userId, scope.now);
      } else {
        await repo.setMfaEnrolled(scope, userId, false);
        await repo.revokeAllFor(scope, userId, scope.now);
        changed = true;
      }
      await audit.record(scope, { actorUserId: null, actorRole: `cli:${operator}`, action: `staff.cli.${cmd}`, targetType: 'StaffUser', targetId: userId, reason, data: { role: role ?? null, changed, provider } });
      console.warn(changed ? `OK ${cmd} ${role ?? ''} → ${userId}` : `Inchangé (${cmd} ${role ?? ''} déjà dans cet état)`);
    });
  } else {
    fail('commande : grant | revoke | reset-mfa | list');
  }
} finally {
  await db.$disconnect();
}
