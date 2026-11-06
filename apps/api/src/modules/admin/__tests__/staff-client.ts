/* eslint-disable @typescript-eslint/no-explicit-any -- réponses JSON dynamiques en test */
/**
 * Client staff de test : identité locale → rôle attribué comme le ferait la CLI (dépôt, audit)
 * → enrôlement TOTP → session (en-têtes équivalents aux cookies du BFF) + CSRF + step-up.
 */
import { randomUUID } from 'node:crypto';
import type { StaffRoleV5 as StaffRole } from '@blowy/domain';
import type { Harness } from '../../../../test/integration/harness.js';
import { TestClient } from '../../../../test/integration/harness.js';
import { PrismaUnitOfWork } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import { deriveTotpSecret, stepOf, totpAt } from '../domain/totp.js';
import { loadAdminConfig } from '../infrastructure/admin-config.js';
import { PrismaStaffRepository } from '../infrastructure/prisma-staff.repository.js';

export class StaffClient {
  session = '';
  csrf = '';
  userId = '';
  constructor(private readonly h: Harness) {}

  async raw(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
    const res = await fetch(`${this.h.baseUrl}${path}`, { method, headers: { 'content-type': 'application/json', ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null } as { status: number; body: any };
  }

  call(method: string, path: string, body?: unknown, opts: { commandId?: string; csrf?: string | null; session?: string } = {}) {
    const headers: Record<string, string> = { 'x-blowy-staff-session': opts.session ?? this.session };
    if (method !== 'GET') {
      headers['idempotency-key'] = opts.commandId ?? randomUUID();
      if (opts.csrf !== null) headers['x-blowy-csrf'] = opts.csrf ?? this.csrf;
    }
    return this.raw(method, path, body, headers);
  }

  private code() {
    return this.h.db.user.findUniqueOrThrow({ where: { id: this.userId } }).then(async () => {
      const st = await new PrismaStaffRepository(this.h.db).mfaState(this.userId);
      return totpAt(deriveTotpSecret(loadAdminConfig({ BLOWY_ENV: 'test' } as NodeJS.ProcessEnv).staffMfaKey, this.userId, st.generation), stepOf(this.h.clock.now()));
    });
  }

  /** Avance l'horloge d'un pas TOTP (anti-rejeu : un code ne sert qu'une fois). */
  nextStep() {
    this.h.clock.advance(31_000);
  }

  async login(key: string, roles: StaffRole[]) {
    const c = new TestClient(this.h);
    await c.signIn(key); // crée le compte (première connexion mobile)
    this.userId = c.userId;
    const repo = new PrismaStaffRepository(this.h.db);
    await new PrismaUnitOfWork(this.h.db, this.h.clock).run(async (scope) => {
      for (const r of roles) await repo.grantRole(scope, c.userId, r, null);
    });
    const l = await this.raw('POST', '/v1/admin/auth/login', { provider: 'local', credential: key });
    if (l.status !== 200) throw new Error(`login ${JSON.stringify(l.body)}`);
    const pending = { 'x-blowy-staff-pending': l.body.pendingToken };
    if (!l.body.mfaEnrolled) {
      const e = await this.raw('POST', '/v1/admin/auth/mfa/enroll', {}, pending);
      if (e.status !== 200) throw new Error(`enroll ${JSON.stringify(e.body)}`);
    }
    const v = await this.raw('POST', '/v1/admin/auth/mfa/verify', { code: await this.code() }, pending);
    if (v.status !== 200) throw new Error(`mfa ${JSON.stringify(v.body)}`);
    this.session = v.body.sessionToken;
    this.csrf = v.body.csrfToken;
    this.nextStep();
    return this;
  }

  async stepUp() {
    const r = await this.call('POST', '/v1/admin/auth/step-up', { code: await this.code() });
    this.nextStep();
    if (r.status !== 200) throw new Error(`step-up ${JSON.stringify(r.body)}`);
  }
}
