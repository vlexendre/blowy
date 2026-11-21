import { ApiError, type AdminClient } from '@blowy/api-client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { type Session, auth } from './auth';
import { ApiContext, makeClient, useApi as useContextApi } from './data';
import { Login } from './Login';
import { Skeleton } from './ui';
import { Audit } from './views/Audit';
import { Costs } from './views/Costs';
import { Chemin } from './views/Chemin';
import { Creators } from './views/Creators';
import { Funnel } from './views/Funnel';
import { Growth } from './views/Growth';
import { Minimoas } from './views/Minimoas';
import { Moderation } from './views/Moderation';
import { Overview } from './views/Overview';
import { Quartiers } from './views/Quartiers';

const ROUTES = [
  ['overview', 'Vue d’ensemble'],
  ['minimoas', 'Minimoas'],
  ['funnel', 'Liens et rencontres'],
  ['growth', 'Croissance'],
  ['creators', 'Créateurs'],
  ['quartiers', 'Quartiers'],
  ['chemin', 'Ton chemin'],
  ['moderation', 'Modération'],
  ['audit', 'Journal'],
  ['costs', 'Coûts IA'],
] as const;
type Route = (typeof ROUTES)[number][0];

const routeOf = (hash: string): Route => {
  const r = hash.replace(/^#\/?/, '');
  return (ROUTES.find(([k]) => k === r)?.[0] ?? 'overview') as Route;
};

export function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [denied, setDenied] = useState<string | null>(null);

  useEffect(() => {
    auth.current().then(setSession);
    return auth.onChange(setSession);
  }, []);

  const api = useMemo<AdminClient | null>(() => (session ? makeClient(async () => (await auth.current())?.token ?? null) : null), [session]);

  useEffect(() => {
    if (!api) {
      setAllowed(null);
      return;
    }
    api
      .me()
      .then(() => setAllowed(true))
      .catch(async (err: unknown) => {
        setAllowed(false);
        setDenied(err instanceof ApiError && err.code === 'forbidden' ? 'Cette adresse n’a pas accès à l’administration.' : err instanceof ApiError ? err.message : 'API injoignable.');
        await auth.signOut();
      });
  }, [api]);

  if (session === undefined || (session && allowed === null)) {
    return (
      <div className="login" aria-busy="true">
        <Skeleton h={220} w={400} />
      </div>
    );
  }
  if (!session || !api || !allowed) return <Login onSignedIn={(s) => (setDenied(null), setSession(s))} denied={denied} />;
  return (
    <ApiContext.Provider value={api}>
      <Shell email={session.email} />
    </ApiContext.Provider>
  );
}

function Shell({ email }: { email: string }) {
  const [route, setRoute] = useState<Route>(routeOf(location.hash));
  const [counts, setCounts] = useState<{ open: number; overdue: number } | null>(null);
  const api = useContextApi();

  useEffect(() => {
    const on = () => setRoute(routeOf(location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  useEffect(() => {
    document.title = `${ROUTES.find(([k]) => k === route)?.[1]} · Minimoa administration`;
    document.querySelector<HTMLElement>('main h1')?.focus?.();
  }, [route]);

  const refreshCounts = useCallback(() => {
    api
      .reports({ status: 'open', limit: 1 })
      .then((r) => setCounts({ open: r.open, overdue: r.overdue }))
      .catch(() => setCounts(null));
  }, [api]);
  useEffect(refreshCounts, [refreshCounts]);

  return (
    <div className="shell">
      <aside className="side">
        <p className="brand">
          Minimoa <small>admin</small>
        </p>
        <nav className="nav" aria-label="Sections">
          {ROUTES.map(([k, label]) => (
            <a key={k} href={`#/${k}`} aria-current={route === k ? 'page' : undefined}>
              <NavIcon route={k} />
              <span className="nav-label">{label}</span>
              {k === 'moderation' && counts && counts.open > 0 && (
                <span className="count" aria-label={`${counts.open} à traiter${counts.overdue ? `, dont ${counts.overdue} en retard` : ''}`}>
                  {counts.open}
                </span>
              )}
            </a>
          ))}
        </nav>
        <div className="side-foot">
          <p className="side-note">Lecture seule, sauf la modération. Aucune conversation n’est lisible ici, sauf le message signalé et son contexte.</p>
          <span>{email}</span>
          <button type="button" className="btn" onClick={() => auth.signOut()}>
            Se déconnecter
          </button>
        </div>
      </aside>
      <main className="main" id="contenu">
        {route === 'overview' && <Overview />}
        {route === 'minimoas' && <Minimoas />}
        {route === 'funnel' && <Funnel />}
        {route === 'growth' && <Growth />}
        {route === 'creators' && <Creators />}
        {route === 'chemin' && <Chemin />}
        {route === 'quartiers' && <Quartiers />}
        {route === 'moderation' && <Moderation onCountsChange={refreshCounts} />}
        {route === 'audit' && <Audit />}
        {route === 'costs' && <Costs />}
      </main>
    </div>
  );
}

/** Icônes de la barre latérale (traits de 2,1, comme la maquette V6-GAdmin). */
const ICONS: Record<string, string> = {
  overview: 'M12 3.5l1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2L5 10.5l5.2-1.8z',
  minimoas: 'M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.6 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z',
  funnel: 'M6 9a3 3 0 1 0 6 0a3 3 0 1 0-6 0M14 10a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M3.5 19c.6-3 2.7-4.5 5.5-4.5s4.9 1.5 5.5 4.5M15 14.6c2.6-.3 4.8.9 5.5 4.4',
  growth: 'M4 19h16M6 15l4-4 3 3 5-6M14 8h4v4',
  creators: 'M12 4l2.3 4.7 5.2.8-3.8 3.6.9 5.1L12 15.8 7.4 18.2l.9-5.1-3.8-3.6 5.2-.8z',
  quartiers: 'M12 21s-6-5.4-6-10.5a6 6 0 0 1 12 0C18 15.6 12 21 12 21zM12 8.2a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6z',
  chemin: 'M3.5 18a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M15.5 6a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M8.5 18H14a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h5.5',
  moderation: 'M12 3l7 3v5.5c0 4.5-3 7.8-7 9.5-4-1.7-7-5-7-9.5V6z',
  audit: 'M7 4h10v16H7zM10 8h4M10 12h4M10 16h2',
  costs: 'M3.5 12a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0-17 0M12 7.5V12l3 2',
};

function NavIcon({ route }: { route: string }) {
  return (
    <svg className="nav-ico" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[route] ?? ICONS.overview} />
    </svg>
  );
}
