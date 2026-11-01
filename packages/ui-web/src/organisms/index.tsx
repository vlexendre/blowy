/** Organismes serveur : composés d'atomes et de molécules. */
import type { ReactNode } from 'react';
import { Heading } from '../atoms/index';
import { EmptyState, StatTile, type MetricView } from '../molecules/index';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

export function DataTable<T>({ caption, columns, rows, rowKey, empty = 'Aucun élément' }: { caption: string; columns: Column<T>[]; rows: T[]; rowKey: (r: T) => string; empty?: string }) {
  if (rows.length === 0) return <EmptyState title={empty} />;
  return (
    <div className="bw-table-wrap">
      <table className="bw-table">
        <caption className="bw-sr">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)}>
              {columns.map((c) => (
                <td key={c.key}>{c.render(r)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MetricSection({ title, metrics }: { title: string; metrics: MetricView[] }) {
  const id = `metrics-${title.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <section aria-labelledby={id} className="bw-stack">
      <Heading level={2} id={id}>
        {title}
      </Heading>
      <div className="bw-grid">
        {metrics.map((m) => (
          <StatTile key={m.key} m={m} />
        ))}
      </div>
    </section>
  );
}

export interface NavItem {
  href: string;
  label: string;
}
export function AdminNav({ items, current }: { items: NavItem[]; current: string }) {
  return (
    <nav className="bw-nav" aria-label="Sections">
      {items.map((i) => (
        <a key={i.href} href={i.href} aria-current={current === i.href || (i.href !== '/' && current.startsWith(`${i.href}/`)) ? 'page' : undefined}>
          {i.label}
        </a>
      ))}
    </nav>
  );
}

export function Timeline({ items }: { items: { key: string; at: string; title: ReactNode; detail?: ReactNode }[] }) {
  if (items.length === 0) return <EmptyState title="Aucun événement" />;
  return (
    <ol className="bw-timeline">
      {items.map((i) => (
        <li key={i.key}>
          <time dateTime={i.at} className="bw-small bw-text-muted">
            {new Date(i.at).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}
          </time>
          <div>
            <strong>{i.title}</strong>
            {i.detail ? <div className="bw-small bw-text-muted">{i.detail}</div> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function DiffTable({ changes }: { changes: { path: string; before: unknown; after: unknown }[] }) {
  const show = (v: unknown) => (v === undefined ? '∅' : JSON.stringify(v));
  return (
    <DataTable
      caption="Différences avec la version active"
      empty="Aucune différence avec la version active"
      rows={changes}
      rowKey={(c) => c.path}
      columns={[
        { key: 'p', header: 'Paramètre', render: (c) => <code className="bw-code">{c.path}</code> },
        { key: 'b', header: 'Actif', render: (c) => show(c.before) },
        { key: 'a', header: 'Proposé', render: (c) => <strong>{show(c.after)}</strong> },
      ]}
    />
  );
}

export function LegalDocument({ title, updated, sections }: { title: string; updated: string; sections: { heading: string; body: ReactNode }[] }) {
  return (
    <article className="bw-legal">
      <Heading level={1}>{title}</Heading>
      <p className="bw-legal__draft" role="note">
        Document de préparation — à valider juridiquement avant lancement. Il ne constitue ni une certification de conformité ni un avis juridique.
      </p>
      <p className="bw-small bw-text-muted">Version de travail du {updated}</p>
      {sections.map((s) => (
        <section key={s.heading}>
          <Heading level={2}>{s.heading}</Heading>
          {s.body}
        </section>
      ))}
    </article>
  );
}
