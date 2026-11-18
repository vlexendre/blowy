import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { type Plugin, defineConfig, loadEnv } from 'vite';

/**
 * `dist/_headers` à partir de `_headers.template` : la CSP n'autorise que l'API (VITE_API_URL) et le projet Supabase
 * (VITE_SUPABASE_URL) du build, si bien que la même source sert la production (admin.minimoa.app) et le dev
 * (admin-dev.minimoa.app) sans rien ouvrir de plus. Sur Cloudflare Pages (`CF_PAGES=1`), les deux adresses sont
 * obligatoires et en https : sinon le build échoue (une admin bloquée par sa propre CSP ne se voit qu'une fois en ligne).
 * En local sans Supabase (`VITE_AUTH=local`), la CSP ne nomme que l'API.
 */
function adminHeaders(env: Record<string, string>): Plugin {
  const origin = (name: string, raw: string | undefined, strict: boolean): string | null => {
    const value = raw?.trim();
    if (!value) {
      if (strict) throw new Error(`_headers : ${name} manquant (requis sur Cloudflare Pages, il nourrit la CSP).`);
      return null;
    }
    const url = new URL(value);
    if (strict && url.protocol !== 'https:') throw new Error(`_headers : ${name}=${value} doit être en https.`);
    return url.origin;
  };
  return {
    name: 'admin-headers',
    apply: 'build',
    generateBundle() {
      const strict = process.env.CF_PAGES === '1';
      const api = origin('VITE_API_URL', env.VITE_API_URL, strict) ?? 'http://localhost:3000';
      const supabase = origin('VITE_SUPABASE_URL', env.VITE_SUPABASE_URL, strict);
      const template = readFileSync(fileURLToPath(new URL('./_headers.template', import.meta.url)), 'utf8');
      // Les commentaires du modèle restent tels quels ; seules les lignes d'en-têtes sont remplies.
      const source = template
        .split('\n')
        .map((line) =>
          line.startsWith('#')
            ? line
            : line
                .replace(/ \{\{SUPABASE_ORIGIN\}\}/g, supabase ? ` ${supabase}` : '')
                .replace(/\{\{API_ORIGIN\}\}/g, api),
        )
        .join('\n');
      const body = source.split('\n').filter((l) => !l.startsWith('#')).join('\n');
      if (/\{\{|\}\}/.test(body)) throw new Error('_headers : un emplacement {{…}} n’a pas été rempli.');
      this.emitFile({ type: 'asset', fileName: '_headers', source });
    },
  };
}

/**
 * Appli statique servie à la racine de son propre domaine (https://admin.minimoa.app, projet Cloudflare Pages à part ;
 * dev : https://admin-dev.minimoa.app) : `pnpm build` produit `dist/` avec `public/` (_redirects, robots.txt, polices)
 * et `_headers` généré (ci-dessus). Base `/` : les fichiers se chargent aussi depuis une adresse profonde servie par la
 * règle SPA de `_redirects`.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    base: '/',
    oxc: { jsx: { runtime: 'automatic' } },
    build: { outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 900 },
    server: { host: 'localhost' },
    plugins: [adminHeaders(env)],
  };
});
