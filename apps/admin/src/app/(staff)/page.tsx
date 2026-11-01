import type { DashboardView } from '@blowy/api-contract';
import { Button, Field, Input, MetricSection, PageHeader } from '@blowy/ui-web';
import { apiGet } from '../../lib/api';
import { qs, Show, when } from '../../components/admin';

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; zone?: string }> }) {
  const sp = await searchParams;
  const iso = (d?: string) => (d ? new Date(`${d}T00:00:00Z`).toISOString() : undefined);
  const result = await apiGet<DashboardView>(`/v1/admin/dashboard${qs({ from: iso(sp.from), to: iso(sp.to), zone: sp.zone })}`);
  return (
    <>
      <PageHeader title="Tableau de bord" eyebrow="18.1">Valeurs calculées depuis la base ; chaque indicateur affiche son dénominateur et sa définition.</PageHeader>
      <form className="bw-form bw-form--inline" method="get" aria-label="Filtres">
        <Field label="Du" htmlFor="from"><Input id="from" name="from" type="date" defaultValue={sp.from} /></Field>
        <Field label="Au" htmlFor="to"><Input id="to" name="to" type="date" defaultValue={sp.to} /></Field>
        <Field label="Zone (code)" htmlFor="zone"><Input id="zone" name="zone" defaultValue={sp.zone} placeholder="PARIS_11" /></Field>
        <Button type="submit" variant="secondary">Filtrer</Button>
      </form>
      <Show result={result}>
        {(d) => (
          <div className="bw-stack" style={{ marginTop: 24 }}>
            <p className="bw-small bw-text-muted">Période {when(d.period.from)} → {when(d.period.to)} · zone {d.zone ?? 'toutes'} · généré {when(d.generatedAt)}</p>
            {d.sections.map((s) => <MetricSection key={s.key} title={s.title} metrics={s.metrics} />)}
          </div>
        )}
      </Show>
    </>
  );
}
