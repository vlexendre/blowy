import { randomBytes } from 'node:crypto';
import { uuidv7 } from '@blowy/database';
import type { Clock, RandomSource } from '../application/clock.js';

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

/** Horloge contrôlable (tests, rattrapage). */
export class FixedClock implements Clock {
  constructor(private current: Date) {}
  now(): Date {
    return new Date(this.current);
  }
  set(d: Date): void {
    this.current = new Date(d);
  }
  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}

export class CryptoRandom implements RandomSource {
  constructor(private readonly clock: Clock) {}
  hex(bytes: number): string {
    return randomBytes(bytes).toString('hex');
  }
  uuid(): string {
    return uuidv7(this.clock.now().getTime());
  }
}
