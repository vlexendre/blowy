// Après le build : adapte dist à l'environnement (PUBLIC_SITE_ENV, src/config/site.ts) puis le vérifie.
// - production (variable absente ou `production`) : rien n'est changé ; on vérifie qu'aucune page n'est marquée
//   « site de test » et que robots.txt annonce le plan du site ;
// - dev (https://dev.minimoa.app, branche `dev`) : robots.txt devient `Disallow: /` sans plan du site, sitemap.xml est
//   retiré, `_headers` reçoit `X-Robots-Tag: noindex, nofollow` sur `/*` ; chaque page doit porter
//   `<meta name="robots" content="noindex,nofollow">` et le bandeau « DEV ».
// Cloudflare Pages applique le `_headers` de chaque déploiement : l'en-tête du site de test ne touche pas la production.
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raw = (process.env.PUBLIC_SITE_ENV ?? '').trim().toLowerCase();
if (raw !== '' && raw !== 'production' && raw !== 'dev') {
  console.error(`site-env : PUBLIC_SITE_ENV=${raw} : « dev », « production » ou rien.`);
  process.exit(1);
}
const dev = raw === 'dev';
const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const DEV_META = '<meta name="robots" content="noindex,nofollow">';
const RIBBON = 'class="env-ribbon"';

if (dev) {
  writeFileSync(
    join(dist, 'robots.txt'),
    '# Site de test (dev.minimoa.app) : jamais indexé. Le site public est https://minimoa.app.\nUser-agent: *\nDisallow: /\n',
  );
  rmSync(join(dist, 'sitemap.xml'), { force: true });
  const headers = readFileSync(join(dist, '_headers'), 'utf8');
  writeFileSync(
    join(dist, '_headers'),
    `${headers.trimEnd()}\n\n# Site de test (PUBLIC_SITE_ENV=dev, scripts/site-env.mjs) : aucune adresse indexée, fichiers compris.\n/*\n  X-Robots-Tag: noindex, nofollow\n`,
  );
}

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.name.endsWith('.html')) yield p;
  }
}

const errors = [];
let pages = 0;
for (const file of walk(dist)) {
  const rel = file.slice(dist.length);
  const html = readFileSync(file, 'utf8');
  // Pages de redirection d'Astro (astro.config.mjs › redirects) : pas de gabarit ; l'en-tête X-Robots-Tag les couvre.
  if (/<meta http-equiv="refresh"/.test(html)) continue;
  pages++;
  const marked = html.includes(DEV_META);
  const ribbon = html.includes(RIBBON);
  if (dev && !marked) errors.push(`${rel} : méta robots « noindex,nofollow » absente`);
  if (dev && !ribbon) errors.push(`${rel} : bandeau « DEV » absent`);
  if (!dev && (marked || ribbon)) errors.push(`${rel} : marquée « site de test » dans un build de production`);
}

const robots = readFileSync(join(dist, 'robots.txt'), 'utf8');
const headers = readFileSync(join(dist, '_headers'), 'utf8');
if (dev) {
  if (!/^Disallow: \/$/m.test(robots) || /^Sitemap:/m.test(robots)) errors.push('robots.txt : « Disallow: / » sans plan du site attendu');
  if (existsSync(join(dist, 'sitemap.xml'))) errors.push('sitemap.xml encore présent');
  if (!/^\/\*\n {2}X-Robots-Tag: noindex, nofollow$/m.test(headers)) errors.push('_headers : X-Robots-Tag absent');
} else {
  if (/^Disallow: \/$/m.test(robots) || !/^Sitemap: https:\/\/minimoa\.app\/sitemap\.xml$/m.test(robots)) errors.push('robots.txt de production inattendu');
  if (!existsSync(join(dist, 'sitemap.xml'))) errors.push('sitemap.xml absent');
  if (/X-Robots-Tag: noindex, nofollow/.test(headers)) errors.push('_headers de production avec X-Robots-Tag: noindex, nofollow');
}

if (errors.length) {
  console.error(`site-env (${dev ? 'dev' : 'production'}) : ${errors.length} erreur(s)\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log(`site-env : ${dev ? 'site de test (dev), noindex partout' : 'production'} ; ${pages} pages vérifiées.`);
