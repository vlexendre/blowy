import type { AdminUserRow, PageOf } from '@blowy/api-contract';
import { Badge, Button, DataTable, Field, Input, PageHeader, Pagination, Select, StatusBadge } from '@blowy/ui-web';
import { apiGet } from '../../../lib/api';
import { qs, Show, when } from '../../../components/admin';

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; cursor?: string }> }) {
  const sp = await searchParams;
  const r = await apiGet<PageOf<AdminUserRow>>(`/v1/admin/users${qs({ q: sp.q, status: sp.status, cursor: sp.cursor })}`);
  return (
    <>
      <PageHeader title="Utilisateurs" eyebrow="18.2">Recherche par prénom, identifiant, slug public ou clé de connexion.</PageHeader>
      <form className="bw-form bw-form--inline" method="get" role="search">
        <Field label="Recherche" htmlFor="q"><Input id="q" name="q" defaultValue={sp.q} /></Field>
        <Field label="Statut" htmlFor="status">
          <Select id="status" name="status" defaultValue={sp.status ?? ''}>
            <option value="">Tous</option>
            {['ACTIVE', 'RESTRICTED', 'SUSPENDED', 'BANNED', 'DELETED'].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
        <Button type="submit" variant="secondary">Rechercher</Button>
      </form>
      <div style={{ marginTop: 20 }}>
        <Show result={r}>
          {(p) => (
            <div className="bw-stack">
              <DataTable
                caption="Utilisateurs"
                rows={p.items}
                rowKey={(u) => u.id}
                empty="Aucun utilisateur ne correspond"
                columns={[
                  { key: 'n', header: 'Prénom', render: (u) => <a href={`/users/${u.id}`}>{u.displayName ?? '(sans profil)'}</a> },
                  { key: 's', header: 'Statut', render: (u) => <StatusBadge value={u.status} /> },
                  { key: 'v', header: 'Vérifié', render: (u) => (u.verified ? <Badge tone="ok">oui</Badge> : <Badge>non</Badge>) },
                  { key: 'z', header: 'Zone', render: (u) => u.zone ?? '—' },
                  { key: 'r', header: 'Rôles staff', render: (u) => u.staffRoles.join(', ') || '—' },
                  { key: 'f', header: 'Fictif', render: (u) => (u.isFictional ? <Badge tone="warn">seed</Badge> : '') },
                  { key: 'c', header: 'Créé', render: (u) => when(u.createdAt) },
                ]}
              />
              <Pagination nextHref={p.nextCursor ? `/users${qs({ q: sp.q, status: sp.status, cursor: p.nextCursor })}` : null} prevHref={sp.cursor ? `/users${qs({ q: sp.q, status: sp.status })}` : null} />
            </div>
          )}
        </Show>
      </div>
    </>
  );
}
