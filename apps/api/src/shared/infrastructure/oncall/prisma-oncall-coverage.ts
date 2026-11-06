/**
 * V5.5 (D-058) : couverture d'astreinte lue de `SafetyOnCallShift` (par fuseau). `DevOpenOnCallCoverage` :
 * local/test seulement (`ONCALL_COVERAGE=dev_open`, refusé en production) — tout est couvert.
 */
import type { Db } from '@blowy/database';
import { intervalCovered, type OnCallCoverage } from '../../application/ports/oncall-coverage.port.js';

export class PrismaOnCallCoverage implements OnCallCoverage {
  constructor(private readonly db: Db) {}
  async covered(timezone: string, from: Date, to: Date): Promise<boolean> {
    const shifts = await this.db.safetyOnCallShift.findMany({ where: { timezone, startsAt: { lt: to }, endsAt: { gt: new Date(from.getTime() - 24 * 3_600_000) } }, select: { startsAt: true, endsAt: true } });
    return intervalCovered(shifts, from, to);
  }
}

export class DevOpenOnCallCoverage implements OnCallCoverage {
  constructor(isProduction: boolean) {
    if (isProduction) throw new Error('DevOpenOnCallCoverage interdit en production');
  }
  async covered(): Promise<boolean> {
    return true;
  }
}

export function selectOnCallCoverage(db: Db, cfg: { isProduction: boolean; ONCALL_COVERAGE?: 'enforce' | 'dev_open' | undefined }): OnCallCoverage {
  const mode = cfg.ONCALL_COVERAGE ?? (cfg.isProduction ? 'enforce' : 'dev_open');
  return mode === 'dev_open' ? new DevOpenOnCallCoverage(cfg.isProduction) : new PrismaOnCallCoverage(db);
}
