import { TrendChart } from '../charts';
import { useLoad } from '../data';
import { fmtDec } from '../format';
import { ErrorBox, Freshness, NoStats, Skeleton, Tile, TileSkeletons } from '../ui';

export function Overview() {
  const { data, error, loading, reload } = useLoad((api) => api.overview(), 'overview');
  return (
    <>
      <div className="head">
        <h1>Vue d’ensemble</h1>
        {data && <Freshness asOf={data.asOf} computedAt={data.computedAt} />}
      </div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data && <OverviewSkeleton />}
      {data && !data.asOf && <NoStats />}
      {data?.asOf && (
        <>
          <section className="section" aria-labelledby="acc">
            <h2 id="acc">Comptes</h2>
            <div className="grid">
              <Tile label="Comptes au total" m={data.accounts.total} period="à la fin du jour" compare="sur 7 jours" accent />
              <Tile label="Nouveaux comptes" m={data.accounts.new.day} period="sur le jour" compare="vs la veille" />
              <Tile label="Nouveaux comptes" m={data.accounts.new.week} period="7 derniers jours" compare="vs 7 jours d’avant" />
              <Tile label="Nouveaux comptes" m={data.accounts.new.month} period="30 derniers jours" compare="vs 30 jours d’avant" />
            </div>
            <div className="grid" style={{ marginTop: 12 }}>
              <Tile label="Actifs" m={data.accounts.active.day} period="sur le jour" compare="vs la veille" />
              <Tile label="Actifs" m={data.accounts.active.week} period="7 derniers jours" compare="vs semaine d’avant" />
              <Tile label="Actifs" m={data.accounts.active.month} period="30 derniers jours" compare="vs mois d’avant" />
              <Tile label="Série moyenne" m={data.averageStreak} period="jours, comptes actifs" compare="sur 7 jours" kind="dec" note="Pas encore fournie par les rituels" />
            </div>
          </section>

          <section className="section" aria-labelledby="ret">
            <h2 id="ret">
              Rétention <span className="hint">part des nouveaux comptes revenus n jours après, moyenne sur 7 cohortes</span>
            </h2>
            <div className="grid">
              <Tile label="Revenus à J1" m={data.retention.d1} period="cohortes des 7 derniers jours" compare="vs 7 cohortes d’avant" kind="pct" />
              <Tile label="Revenus à J7" m={data.retention.d7} period="cohortes des 7 derniers jours" compare="vs 7 cohortes d’avant" kind="pct" />
              <Tile label="Revenus à J30" m={data.retention.d30} period="cohortes des 7 derniers jours" compare="vs 7 cohortes d’avant" kind="pct" />
            </div>
          </section>

          <section className="section" aria-labelledby="plus">
            <h2 id="plus">Blowy+</h2>
            <div className="grid">
              <Tile label="Abonnés payants" m={data.plus.subscribers} period="à la fin du jour (délai de grâce inclus)" compare="sur 7 jours" accent />
              <Tile label="Essais en cours" m={data.plus.trials} period="à la fin du jour" compare="sur 7 jours" />
              <Tile label="Essais commencés" m={data.plus.newTrials.week} period="7 derniers jours" compare="vs 7 jours d’avant" />
              <Tile label="Essais commencés" m={data.plus.newTrials.month} period="30 derniers jours" compare="vs 30 jours d’avant" />
            </div>
          </section>

          <section className="section" aria-labelledby="trends">
            <h2 id="trends">
              Tendances <span className="hint">30 derniers jours</span>
            </h2>
            <div className="grid-2">
              {data.series.map((s) => (
                <div className="card" key={s.key}>
                  <h3>{s.label}</h3>
                  <TrendChart series={s} title={s.label} format={s.key === 'averageStreak' ? fmtDec : undefined} />
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}

function OverviewSkeleton() {
  return (
    <>
      <div className="section">
        <Skeleton h={18} w={120} style={{ marginBottom: 12 }} />
        <TileSkeletons n={4} />
      </div>
      <div className="section">
        <Skeleton h={18} w={120} style={{ marginBottom: 12 }} />
        <TileSkeletons n={3} />
      </div>
      <div className="section grid-2">
        <div className="card">
          <Skeleton h={200} />
        </div>
        <div className="card">
          <Skeleton h={200} />
        </div>
      </div>
    </>
  );
}
