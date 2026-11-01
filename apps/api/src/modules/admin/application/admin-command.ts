/**
 * Exécution unique d'une mutation admin (pattern Command, écrite une seule fois) :
 *   autorisation par permission (serveur) → step-up si l'action est sensible → CommandBus
 *   (idempotence acteur/opération/commandId, transaction) → audit append-only DANS la transaction.
 * Aucune mutation admin ne contourne ce chemin.
 */
import type { CommandBus } from '../../../shared/application/command-bus.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { AppError } from '../../../shared/domain/errors.js';
import { can, STEP_UP_PERMISSIONS, type Permission } from '../domain/permissions.js';
import type { AuditLog } from './ports/admin.ports.js';
import type { StaffContext } from './use-cases/staff-auth.use-cases.js';

export interface AdminActor extends StaffContext {
  requestId: string | null;
  /** Step-up encore valide pour cette session. */
  stepUpValid: boolean;
}

export function authorize(actor: Pick<AdminActor, 'roles' | 'stepUpValid'>, permission: Permission): void {
  if (!can(actor.roles, permission)) {
    throw new AppError('FORBIDDEN', 'Permission insuffisante', { detailsSafe: { permission } });
  }
  if (STEP_UP_PERMISSIONS.has(permission) && !actor.stepUpValid) {
    throw new AppError('PRECONDITION_FAILED', 'Réauthentification MFA requise', { status: 403, detailsSafe: { reason: 'STEP_UP_REQUIRED', permission } });
  }
}

export interface AdminCommand<P, R> {
  permission: Permission;
  operation: string;
  commandId: string;
  payload: P;
  reason: string | null;
  target: { type: string; id: string | null };
  handle: (scope: TxScope, payload: P) => Promise<{ result: R; auditData?: Record<string, unknown> }>;
}

export class AdminCommandRunner {
  constructor(
    private readonly bus: CommandBus,
    private readonly audit: AuditLog,
  ) {}

  async run<P, R>(actor: AdminActor, cmd: AdminCommand<P, R>): Promise<{ auditId: string; replayed: boolean; result: R }> {
    authorize(actor, cmd.permission);
    const out = await this.bus.execute({
      actorId: actor.userId,
      operation: `admin.${cmd.operation}`,
      commandId: cmd.commandId,
      payload: cmd.payload,
      handle: async (scope, payload) => {
        const { result, auditData } = await cmd.handle(scope, payload);
        const auditId = await this.audit.record(scope, {
          actorUserId: actor.userId,
          actorRole: actor.roles.join(','),
          action: cmd.operation,
          targetType: cmd.target.type,
          targetId: cmd.target.id,
          reason: cmd.reason,
          data: { commandId: cmd.commandId, ...(auditData ?? {}) },
          requestId: actor.requestId,
        });
        return { auditId, result };
      },
    });
    return { auditId: out.result.auditId, replayed: out.replayed, result: out.result.result };
  }

  /** Mutation déléguée à un port externe (E, G) qui gère lui-même idempotence/transaction : on audite la tentative réussie. */
  async delegate<R>(actor: AdminActor, d: { permission: Permission; operation: string; reason: string | null; target: { type: string; id: string | null }; commandId: string; call: () => Promise<R>; auditData?: (r: R) => Record<string, unknown> }) {
    authorize(actor, d.permission);
    const result = await d.call();
    const auditId = await this.audit.recordNow({
      actorUserId: actor.userId,
      actorRole: actor.roles.join(','),
      action: d.operation,
      targetType: d.target.type,
      targetId: d.target.id,
      reason: d.reason,
      data: { commandId: d.commandId, delegated: true, ...(d.auditData?.(result) ?? {}) },
      requestId: actor.requestId,
    });
    return { auditId, replayed: false, result };
  }
}
