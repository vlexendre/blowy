import { randomUUID } from 'node:crypto';
import type { TuningOverview } from '@blowy/api-contract';
import { ActionForm, Card, DataTable, Field, Heading, Input, Notice, PageHeader, StatusBadge, Text } from '@blowy/ui-web';
import { apiGet } from '../../../lib/api';
import { tuningDraftAction } from '../../../lib/actions';
import { Show, when } from '../../../components/admin';

type Leaf = { path: string; value: number | boolean };
/** Feuilles numériques/booléennes du tuning (formulaire typé, sans clé libre). */
function leaves(obj: unknown, prefix = ''): Leaf[] {
  if (typeof obj === 'number' || typeof obj === 'boolean') return [{ path: prefix, value: obj }];
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
  return Object.entries(obj).flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k));
}
const SECTIONS = ['gauges', 'actions', 'link', 'refusal', 'coins', 'matching', 'reliability', 'petXp', 'time', 'notifications'];

function nextVersion(v: string): string {
  const m = /^(tuning-\d{4}\.\d{2}\.)(\d+)$/.exec(v);
  return m ? `${m[1]}${Number(m[2]) + 1}` : v;
}

export default async function TuningPage() {
  const r = await apiGet<TuningOverview & { activePayload: Record<string, unknown> }>('/v1/admin/tuning');
  return (
    <div className="bw-stack">
      <PageHeader title="Tuning" eyebrow="18.8">Versions immuables, comparaison à la version active, publication et rollback audités (step-up). Les flags ne désactivent jamais une autorisation serveur ni un consentement.</PageHeader>
      <Show result={r}>
        {(o) => {
          const all = leaves(o.activePayload);
          return (
            <>
              <Card>
                <Text>Version active : <strong>{o.active.version}</strong> ({o.active.source === 'PACKAGE_DEFAULT' ? 'version du package' : `publiée ${when(o.active.activatedAt)}`})</Text>
                {!o.runtimeConsumesPublished ? <Notice tone="warn">Le moteur en exécution lit encore la version embarquée du package : une publication est versionnée et auditée, son application au runtime est un branchement à faire côté moteur (voir handoff F).</Notice> : null}
                {!o.simulator.available ? <Notice tone="info">Simulateur 60 jours indisponible : {o.simulator.reason}</Notice> : null}
              </Card>
              <DataTable caption="Versions de tuning" rows={o.versions} rowKey={(v) => v.id} empty="Aucune version publiée (version du package active)" columns={[
                { key: 'v', header: 'Version', render: (v) => <a href={`/tuning/${v.id}`}>{v.version}</a> },
                { key: 's', header: 'Statut', render: (v) => <StatusBadge value={v.status} /> },
                { key: 'c', header: 'Créée', render: (v) => when(v.createdAt) },
                { key: 'a', header: 'Activée', render: (v) => when(v.activatedAt) },
              ]} />
              <Card>
                <Heading level={2}>Nouveau brouillon (formulaire typé)</Heading>
                <ActionForm action={tuningDraftAction} submitLabel="Créer le brouillon">
                  <input type="hidden" name="_base" value={JSON.stringify(o.activePayload)} />
                  <input type="hidden" name="_cid" value={randomUUID()} />
                  <Field label="Nouvelle version" htmlFor="version" hint="Format tuning-AAAA.MM.N">
                    <Input id="version" name="version" defaultValue={nextVersion(o.active.version)} pattern="tuning-\d{4}\.\d{2}\.\d+" required />
                  </Field>
                  <Field label="Note" htmlFor="note"><Input id="note" name="note" /></Field>
                  {SECTIONS.map((s) => {
                    const items = all.filter((l) => l.path.startsWith(`${s}.`));
                    if (!items.length) return null;
                    return (
                      <details key={s}>
                        <summary><strong>{s}</strong> ({items.length})</summary>
                        <div className="bw-grid" style={{ marginTop: 10 }}>
                          {items.map((l) => (
                            <Field key={l.path} label={l.path.slice(s.length + 1)} htmlFor={`t-${l.path}`}>
                              {typeof l.value === 'boolean' ? (
                                <select className="bw-select" id={`t-${l.path}`} name={`t.${l.path}:bool`} defaultValue={String(l.value)}><option value="true">oui</option><option value="false">non</option></select>
                              ) : (
                                <Input id={`t-${l.path}`} name={`t.${l.path}`} type="number" step="any" defaultValue={l.value} />
                              )}
                            </Field>
                          ))}
                        </div>
                      </details>
                    );
                  })}
                </ActionForm>
              </Card>
            </>
          );
        }}
      </Show>
    </div>
  );
}
