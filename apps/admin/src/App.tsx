import { ApiError, type AdminClient } from '@blowy/api-client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { type Session, auth } from './auth';
import { ApiContext, makeClient, useApi as useContextApi } from './data';
import { Login } from './Login';
import { Skeleton } from './ui';
import { Audit } from './views/Audit';
import { Costs } from './views/Costs';
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
          Minimoa<small>Administration</small>
        </p>
        <nav className="nav" aria-label="Sections">
          {ROUTES.map(([k, label]) => (
            <a key={k} href={`#/${k}`} aria-current={route === k ? 'page' : undefined}>
              <span>{label}</span>
              {k === 'moderation' && counts && counts.open > 0 && (
                <span className="count" aria-label={`${counts.open} à traiter${counts.overdue ? `, dont ${counts.overdue} en retard` : ''}`}>
                  {counts.open}
                </span>
              )}
            </a>
          ))}
        </nav>
        <div className="side-foot">
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
        {route === 'quartiers' && <Quartiers />}
        {route === 'moderation' && <Moderation onCountsChange={refreshCounts} />}
        {route === 'audit' && <Audit />}
        {route === 'costs' && <Costs />}
      </main>
    </div>
  );
}

