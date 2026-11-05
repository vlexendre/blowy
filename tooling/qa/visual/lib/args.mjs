// Analyse des options de la ligne de commande du banc.
/** Options « --clé=valeur », « --clé valeur » ou drapeau « --clé ». */
export function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--') || a === '--') continue;
    const eq = a.indexOf('=');
    if (eq > 0) out[a.slice(2, eq)] = a.slice(eq + 1);
    else if (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) out[a.slice(2)] = argv[++i];
    else out[a.slice(2)] = true;
  }
  return out;
}

/** Les groupes expo-router « (nom) » n'apparaissent pas dans l'URL web. */
export const toUrlPath = (route) => route.replace(/\/\([^/)]+\)(?=\/|$)/g, '') || '/';

/**
 * --route / --account : remplacent la route (et le compte) d'un seul écran sélectionné par
 * --only, pour mesurer une route de travail (ex. kitchen-sink) contre une maquette.
 */
export function applyOverrides(screens, args) {
  if (!args.route && !args.account) return screens;
  if (screens.length !== 1) throw new Error('--route/--account exigent --only <un seul écran>');
  const [s] = screens;
  const account = args.account === undefined ? s.account : args.account === 'none' ? null : String(args.account);
  return [{ ...s, target: s.target ?? 'mobile', route: args.route ? toUrlPath(String(args.route)) : s.route, account, note: `${s.note ? s.note + ' · ' : ''}route remplacée (--route ${args.route ?? s.route})` }];
}
