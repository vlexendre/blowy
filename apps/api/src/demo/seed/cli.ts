/**
 * `pnpm --filter @blowy/api seed:test` : semis d'un environnement de test (docs/SEED-TEST.md).
 * Cible : un projet Supabase de test ou de préproduction, ou un Supabase local (`supabase start`), donné par
 * SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY lus dans le shell (jamais écrits dans le code). Avec BLOWY_ADAPTERS=memory,
 * le semis tourne dans ce seul processus (vérification) : pour remplir l'API locale, voir BLOWY_SEED_CITIES.
 * Les garde-fous sont vérifiés ici, avant de monter quoi que ce soit, puis de nouveau par `Seeder` (avec la base).
 */
import 'reflect-metadata';
import { type DynamicModule, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { type Env, loadEnv } from '../../config/env';
import { ShiftedClock } from '../../shared/clock';
import { parseSeedArgs, SEED_USAGE } from './args';
import { SeedRefused, type SeedTargetMode, configRefusals } from './guards';
import { SeedModule } from './seed.module';
import { Seeder } from './seeder';

@Module({})
class SeedCliModule {
  static forRoot(env: Env, clock: ShiftedClock): DynamicModule {
    return { module: SeedCliModule, imports: [AppModule.forRoot(env, { clock }), SeedModule] };
  }
}

/** Configuration de l'API pour le semis : seulement la base et le compte de revue ; ni IA, ni push, ni e-mail. */
function seedEnv(mode: SeedTargetMode): Env {
  const pick = (k: string): Record<string, string> => (process.env[k] ? { [k]: process.env[k] as string } : {});
  return loadEnv({
    BLOWY_ENV: 'local',
    BLOWY_ADAPTERS: mode,
    PORT: '0',
    AI_PROVIDER: 'off',
    PUSH_PROVIDER: 'off',
    WEB_URL: process.env.WEB_URL ?? 'http://localhost:4321',
    ...pick('SUPABASE_URL'),
    ...pick('SUPABASE_SERVICE_ROLE_KEY'),
    ...pick('API_URL'),
    ...pick('REVIEW_EMAIL'),
    ...pick('REVIEW_CODE'),
  });
}

async function main(): Promise<number> {
  const args = parseSeedArgs(process.argv.slice(2));
  if (args.help) {
    console.log(SEED_USAGE);
    return 0;
  }
  const rawMode = process.env.BLOWY_ADAPTERS ?? 'memory';
  if (rawMode !== 'memory' && rawMode !== 'supabase') throw new Error(`BLOWY_ADAPTERS=${rawMode} : memory ou supabase`);
  const mode: SeedTargetMode = rawMode;
  const reasons = configRefusals(process.env, mode);
  if (reasons.length > 0) throw new SeedRefused(reasons);
  if (mode === 'memory' && !args.dryRun) console.warn('Adaptateurs mémoire : le semis vit dans ce processus seulement (pour l’API locale : BLOWY_SEED_CITIES).');

  const app = await NestFactory.createApplicationContext(SeedCliModule.forRoot(seedEnv(mode), new ShiftedClock()), { logger: ['warn', 'error'] });
  try {
    const seeder = app.get(Seeder);
    if (args.purge) console.log(JSON.stringify(await seeder.purge(process.env), null, 2));
    else if (args.adopt.length > 0 && !args.dryRun) console.log(JSON.stringify(await seeder.adopt(args.adopt, process.env), null, 2));
    else {
      const started = Date.now();
      const report = await seeder.run({ options: { cities: args.cities, perCity: args.perCity, seed: args.seed }, dryRun: args.dryRun, source: process.env });
      console.log(JSON.stringify({ ...report, seconds: Math.round((Date.now() - started) / 1000) }, null, 2));
    }
  } finally {
    await app.close();
  }
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    console.error(err instanceof SeedRefused ? err.message : `Semis arrêté : ${err instanceof Error ? err.message : String(err)}`);
    process.exit(err instanceof SeedRefused ? 2 : 1);
  },
);
