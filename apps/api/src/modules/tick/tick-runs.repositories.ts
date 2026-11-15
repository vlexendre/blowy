import type { Db } from '../../persistence/database.types';
import type { MemoryDb } from '../../persistence/memory-db';
import { check, isUniqueViolation } from '../../persistence/supabase';
import type { TickRunsRepository } from './ports';

export class MemoryTickRunsRepository implements TickRunsRepository {
  constructor(private readonly db: MemoryDb) {}

  async claim(job: string, slot: string): Promise<boolean> {
    const key = `${job}|${slot}`;
    if (this.db.tickRuns.has(key)) return false;
    this.db.tickRuns.add(key);
    return true;
  }

  async finish(): Promise<void> {}

  async purge(before: string): Promise<number> {
    let n = 0;
    for (const key of [...this.db.tickRuns]) {
      if ((key.split('|')[1] ?? '') < before) {
        this.db.tickRuns.delete(key);
        n += 1;
      }
    }
    return n;
  }
}

export class SupabaseTickRunsRepository implements TickRunsRepository {
  constructor(private readonly client: Db) {}

  async claim(job: string, slot: string, at: string): Promise<boolean> {
    const { error } = await this.client.from('tick_runs').insert({ job, slot, started_at: at });
    if (isUniqueViolation(error)) return false;
    check(error, 'créneau du minuteur');
    return true;
  }

  async finish(job: string, slot: string, at: string, done: number): Promise<void> {
    const { error } = await this.client.from('tick_runs').update({ finished_at: at, done }).eq('job', job).eq('slot', slot);
    check(error, 'créneau du minuteur');
  }

  async purge(before: string): Promise<number> {
    const { count, error } = await this.client.from('tick_runs').delete({ count: 'exact' }).lt('started_at', before);
    check(error, 'ménage du minuteur');
    return count ?? 0;
  }
}
