/**
 * Planification des jobs récurrents (BullMQ job schedulers, Redis) — chaque exécution
 * porte une clé métier d'unicité (JobExecution.jobKey) qui empêche un double effet
 * en cas de reprise après arrêt ou de double livraison.
 */
import type { Db } from '@blowy/database';
import { isUniqueViolation } from '@blowy/database';

export interface RecurringJob {
  name: string;
  everyMs: number;
  /** Clé métier de la fenêtre courante (ex. heure UTC) ; null = pas de déduplication. */
  windowKey?: (now: Date) => string | null;
  run(now: Date): Promise<unknown>;
}

/** Exécute un job au plus une fois par fenêtre (JobExecution unique). */
export async function runOnce(db: Db, job: RecurringJob, now: Date): Promise<'RAN' | 'SKIPPED'> {
  const wk = job.windowKey?.(now) ?? null;
  const jobKey = wk ? `${job.name}:${wk}` : null;
  let execId: string | null = null;
  if (jobKey) {
    try {
      execId = (await db.jobExecution.create({ data: { jobKey, jobName: job.name, startedAt: now } })).id;
    } catch (err) {
      if (isUniqueViolation(err)) {
        const prev = await db.jobExecution.findUnique({ where: { jobKey } });
        if (prev && prev.status !== 'FAILED') return 'SKIPPED';
        execId = (await db.jobExecution.update({ where: { jobKey }, data: { status: 'RUNNING', startedAt: now, error: null } })).id;
      } else throw err;
    }
  }
  try {
    const stats = await job.run(now);
    if (execId) await db.jobExecution.update({ where: { id: execId }, data: { status: 'SUCCEEDED', finishedAt: new Date(), stats: (stats ?? null) as object } });
    return 'RAN';
  } catch (err) {
    if (execId) await db.jobExecution.update({ where: { id: execId }, data: { status: 'FAILED', finishedAt: new Date(), error: String((err as Error).message).slice(0, 500) } });
    throw err;
  }
}

export const hourKey = (d: Date) => d.toISOString().slice(0, 13);
export const quarterKey = (d: Date) => `${d.toISOString().slice(0, 14)}${String(Math.floor(d.getUTCMinutes() / 15) * 15).padStart(2, '0')}`;
