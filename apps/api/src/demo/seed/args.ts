/** Options du script `seed:test` (docs/SEED-TEST.md). Volontairement sans `--force` : rien ne contourne les garde-fous. */
import { DEFAULT_PER_CITY } from './plan';

export interface SeedArgs {
  cities: string[];
  perCity: number;
  seed: number;
  dryRun: boolean;
  purge: boolean;
  adopt: string[];
  help: boolean;
}

export const SEED_USAGE = `Semis d'un environnement de test Minimoa (jamais la production).

  pnpm --filter @blowy/api seed:test [options]

  --cities paris,lyon   villes (défaut : toutes celles du site)
  --per-city 40         comptes par ville (Paris : trois fois plus)
  --seed 1              graine du tirage (même graine, même plan)
  --dry-run             montre le plan sans rien écrire
  --purge               supprime tout ce que le semis a créé, et seulement cela
  --adopt a@x,b@y       rattache ces comptes de test au monde du semis (ils en voient les comptes)
  --help                cette aide

Cible : BLOWY_ADAPTERS=supabase avec SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY d'un projet de test,
BLOWY_ENV=local|test|staging. Voir docs/SEED-TEST.md.`;

const positiveInt = (flag: string, raw: string | undefined, min: number, max: number): number => {
  const n = Number(raw);
  if (!raw || !Number.isInteger(n) || n < min || n > max) throw new Error(`${flag} attend un entier entre ${min} et ${max}`);
  return n;
};

export function parseSeedArgs(argv: readonly string[]): SeedArgs {
  const out: SeedArgs = { cities: [], perCity: DEFAULT_PER_CITY, seed: 1, dryRun: false, purge: false, adopt: [], help: false };
  for (let i = 0; i < argv.length; i++) {
    const [flag, inline] = (argv[i] as string).split(/=(.*)/s, 2) as [string, string | undefined];
    const value = (): string | undefined => inline ?? argv[++i];
    switch (flag) {
      case '--cities':
        out.cities = (value() ?? '').split(',').map((c) => c.trim()).filter(Boolean);
        break;
      case '--per-city':
        out.perCity = positiveInt('--per-city', value(), 1, 500);
        break;
      case '--seed':
        out.seed = positiveInt('--seed', value(), 0, 2 ** 31 - 1);
        break;
      case '--dry-run':
        out.dryRun = true;
        break;
      case '--purge':
        out.purge = true;
        break;
      case '--adopt':
        out.adopt = (value() ?? '').split(',').map((e) => e.trim()).filter(Boolean);
        break;
      case '--help':
      case '-h':
        out.help = true;
        break;
      case '--':
        break;
      default:
        throw new Error(`option inconnue : ${flag} (aucune option ne contourne les garde-fous ; --help pour l'aide)`);
    }
  }
  if (out.purge && (out.dryRun || out.adopt.length > 0)) throw new Error('--purge se lance seul');
  return out;
}
