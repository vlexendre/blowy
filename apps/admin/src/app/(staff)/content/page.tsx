import type { AdminConfigVersionRow } from '@blowy/api-contract';
import { Card, DataTable, Heading, PageHeader, StatusBadge, Text } from '@blowy/ui-web';
import { apiGet } from '../../../lib/api';
import { Mutation, Show, when } from '../../../components/admin';
import { JsonField, ReasonField, TextField } from '../../../components/fields';

interface Overview { baseKeys: number; base: Record<string, string>; versions: AdminConfigVersionRow[]; activeVersionId: string | null; allowedVariables: string[] }
interface Preview { version: string; entries: { key: string; base: string | null; draft: string; rendered: string; variables: string[] }[]; issues: string[] }

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const { preview } = await searchParams;
  const [r, pv] = await Promise.all([apiGet<Overview>('/v1/admin/content'), preview ? apiGet<Preview>(`/v1/admin/content/versions/${preview}/preview`) : Promise.resolve(null)]);
  return (
    <div className="bw-stack">
      <PageHeader title="Contenus" eyebrow="18.7">Surcharges des textes du référentiel (espèces, répliques, écoles/dimanches/passions/limites, 12 mots, couvaison, départs, notifications). Brouillon → aperçu → publication → archivage. Variables allowlistées, aucun code.</PageHeader>
      <Show result={r}>
        {(o) => (
          <>
            <Text small muted>{o.baseKeys} clés de référence · variables autorisées : {o.allowedVariables.map((v) => `{${v}}`).join(' ')}</Text>
            <DataTable caption="Versions de contenu" rows={o.versions} rowKey={(v) => v.id} empty="Aucune version (le référentiel du package fait foi)" columns={[
              { key: 'v', header: 'Version', render: (v) => <a href={`/content?preview=${v.id}`}>{v.version}</a> },
              { key: 's', header: 'Statut', render: (v) => <StatusBadge value={v.status} /> },
              { key: 'm', header: 'App min.', render: (v) => v.minClientVersion ?? '—' },
              { key: 'c', header: 'Créée', render: (v) => when(v.createdAt) },
              { key: 'a', header: 'Actions', render: (v) => (v.status === 'DRAFT' ? (
                <Mutation endpoint={`/v1/admin/content/versions/${v.id}/publish`} label="Publier" ok="Contenu publié." revalidate="/content" inline>
                  <ReasonField id={`p-${v.id}`} label="Motif" />
                </Mutation>
              ) : v.status !== 'ACTIVE' && v.status !== 'ARCHIVED' ? (
                <Mutation endpoint={`/v1/admin/content/versions/${v.id}/archive`} label="Archiver" ok="Version archivée." revalidate="/content" variant="secondary" inline>
                  <ReasonField id={`a-${v.id}`} label="Motif" />
                </Mutation>
              ) : '—') },
            ]} />
            {pv ? (
              <Card>
                <Heading level={2}>Aperçu</Heading>
                <Show result={pv}>
                  {(p) => (
                    <>
                      {p.issues.length ? <Text>Problèmes : {p.issues.join(' · ')}</Text> : <Text muted small>Aucun problème détecté.</Text>}
                      <DataTable caption="Aperçu" rows={p.entries} rowKey={(e) => e.key} columns={[
                        { key: 'k', header: 'Clé', render: (e) => <code className="bw-code">{e.key}</code> },
                        { key: 'b', header: 'Référence', render: (e) => e.base ?? '∅' },
                        { key: 'r', header: 'Rendu', render: (e) => e.rendered },
                      ]} />
                    </>
                  )}
                </Show>
              </Card>
            ) : null}
            <Card>
              <Heading level={2}>Nouveau brouillon</Heading>
              <Mutation endpoint="/v1/admin/content/drafts" label="Créer le brouillon" ok="Brouillon créé." revalidate="/content">
                <JsonField id="entries" name="f.entries:json" label="Surcharges {clé: texte} (JSON)" rows={6} defaultValue={JSON.stringify({ 'notif.message': o.base['notif.message'] ?? '' }, null, 2)} />
                <TextField id="min" name="f.minClientVersion:nullable" label="Version d’app minimale (facultatif)" hint="Dépendance signalée aux apps (x.y.z)." />
                <TextField id="note" name="f.note" label="Note" />
              </Mutation>
            </Card>
          </>
        )}
      </Show>
    </div>
  );
}
