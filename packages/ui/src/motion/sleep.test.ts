import { describe, expect, it } from 'vitest';

import { AWAKE_FIRST_MS, IDLE_SLEEP_MS, petSleep } from './sleep';

const at = (h: number, m = 0, day = 19) => new Date(2026, 10, day, h, m);

describe('sommeil du minimoa', () => {
  it('jamais endormi les premières 24 h, même la nuit (installée à 23 h 19)', () => {
    const born = at(23, 19);
    const r = petSleep({ now: at(23, 20), bornAt: born.toISOString() });
    expect(r).toEqual({ night: true, firstDay: true, sleepAfter: null });
    // Le lendemain en journée, toujours son premier jour.
    expect(petSleep({ now: at(15, 0, 20), bornAt: born }).sleepAfter).toBeNull();
    // 1 min avant ses 24 h : toujours éveillé.
    expect(petSleep({ now: born.getTime() + AWAKE_FIRST_MS - 60_000, bornAt: born }).firstDay).toBe(true);
  });

  it('jamais endormi pendant l’inscription', () => {
    expect(petSleep({ now: at(14), bornAt: at(10, 0, 1), onboarding: true })).toMatchObject({ firstDay: true, sleepAfter: null });
  });

  it('naissance inconnue, illisible ou dans le futur : comme un nouveau-né', () => {
    expect(petSleep({ now: at(14) }).sleepAfter).toBeNull();
    expect(petSleep({ now: at(14), bornAt: null }).sleepAfter).toBeNull();
    expect(petSleep({ now: at(14), bornAt: 'pas une date' }).sleepAfter).toBeNull();
    expect(petSleep({ now: at(14), bornAt: at(16) }).firstDay).toBe(true);
  });

  it('après 24 h, la nuit : ambiance de nuit, mais il ne s’endort pas tout seul', () => {
    expect(petSleep({ now: at(23, 30), bornAt: at(10, 0, 1) })).toEqual({ night: true, firstDay: false, sleepAfter: null });
    expect(petSleep({ now: at(3), bornAt: at(10, 0, 1) }).sleepAfter).toBeNull();
  });

  it('après 24 h, le jour : il s’endort au repos après 25 s (ou le délai donné)', () => {
    expect(petSleep({ now: at(14), bornAt: at(10, 0, 1) })).toEqual({ night: false, firstDay: false, sleepAfter: IDLE_SLEEP_MS });
    expect(petSleep({ now: at(14).getTime(), bornAt: at(10, 0, 1).getTime(), idleSleepMs: 2000 }).sleepAfter).toBe(2000);
  });
});
