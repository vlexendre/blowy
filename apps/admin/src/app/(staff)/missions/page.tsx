import type { AdminMissionVersion, MissionBounds } from '@blowy/api-contract';
import { Card, DataTable, Heading, PageHeader, StatusBadge, Text } from '@blowy/ui-web';
import { apiGet } from '../../../lib/api';
import { Mutation, Show, when } from '../../../components/admin';
import { JsonField, ReasonField, TextField } from '../../../components/fields';

export default async function MissionsPage() {
  const r = await apiGet<{ items: AdminMissionVersion[]; bounds: MissionBounds }>('/v1/admin/missions');
  return (
    <div className="bw-stack">
      <PageHeader title="Missions" eyebrow="18.6">Définitions versionnées : une version publiée est immuable ; une modification crée une nouvelle version. Le réexamen d’une preuve ne double jamais les gains (clé de récompense unique).</PageHeader>
      <Show result={r}>
        {({ items, bounds }) => (
          <>
            <Text small muted>Bornes de récompense (tuning) : lien ≤ {bounds.maxLinkXpMilli} m-XP · pet ≤ {bounds.maxPetXpMilli} m-XP · pièces ≤ {bounds.maxCoins} — {bounds.source}</Text>
            <DataTable caption="Versions de missions" rows={items} rowKey={(m) => m.id} empty="Aucune mission" columns={[
              { key: 'k', header: 'Clé / version', render: (m) => <code className="bw-code">{m.key} v{m.version}</code> },
              { key: 't', header: 'Titre', render: (m) => m.title ?? m.titleKey },
              { key: 's', header: 'Statut', render: (m) => <StatusBadge value={m.status} /> },
              { key: 'r', header: 'Récompenses', render: (m) => `${m.linkXpMilli} / ${m.petXpMilli} m-XP · ${m.coins} p.` },
              { key: 'p', header: 'Programmée', render: (m) => m.scheduled.map((d) => `${d.zone} ${d.day}`).join(', ') || '—' },
              { key: 'a', header: 'Actions', render: (m) => (
                <div className="bw-stack" style={{ gap: 6 }}>
                  {m.status === 'DRAFT' ? (
                    <Mutation endpoint={`/v1/admin/missions/${m.id}/publish`} label="Publier" ok="Version publiée." revalidate="/missions" inline>
                      <ReasonField id={`p-${m.id}`} label="Motif" />
                    </Mutation>
                  ) : null}
                  {m.status !== 'ARCHIVED' ? (
                    <Mutation endpoint={`/v1/admin/missions/${m.id}/archive`} label="Archiver" ok="Version archivée." revalidate="/missions" variant="secondary" inline>
                      <ReasonField id={`a-${m.id}`} label="Motif" />
                    </Mutation>
                  ) : null}
                  {m.status === 'PUBLISHED' ? (
                    <Mutation endpoint="/v1/admin/missions/schedule" label="Programmer" ok="Mission programmée." revalidate="/missions" variant="secondary" inline>
                      <input type="hidden" name="f.definitionId" value={m.id} />
                      <TextField id={`z-${m.id}`} name="f.zoneCode" label="Zone" defaultValue="PARIS_11" required />
                      <TextField id={`d-${m.id}`} name="f.day" label="Jour" type="date" required />
                    </Mutation>
                  ) : null}
                  <Text small muted>créée {when(m.createdAt)}</Text>
                </div>
              ) },
            ]} />
            <Card>
              <Heading level={2}>Nouvelle définition ou nouvelle version</Heading>
              <Mutation endpoint="/v1/admin/missions" label="Créer le brouillon" ok="Brouillon créé." revalidate="/missions">
                <TextField id="key" name="f.key" label="Clé" hint="minuscules, ex. healthy_meal ; même clé = nouvelle version" required pattern="[a-z][a-z0-9_]{2,48}" />
                <TextField id="titleKey" name="f.titleKey" label="Clé de titre (référentiel)" defaultValue="mission.healthy_meal" required />
                <TextField id="alt" name="f.accessibleAlternative:nullable" label="Variante accessible (clé, facultatif)" defaultValue="mission.healthy_meal.alternative" />
                <JsonField id="criteria" name="f.criteria:json" label="Critères observables (JSON)" rows={4} defaultValue={JSON.stringify({ visible: ['assiette', 'légume'], photosExpected: 1, joint: false }, null, 2)} hint="visible : 1–6 éléments courts ; photosExpected : 1–3 ; joint : mission commune." />
                <TextField id="lx" name="f.linkXpMilli:int" label="XP lien (milli)" type="number" defaultValue={6000} required />
                <TextField id="px" name="f.petXpMilli:int" label="XP pet (milli)" type="number" defaultValue={20000} required />
                <TextField id="co" name="f.coins:int" label="Pièces" type="number" defaultValue={20} required />
              </Mutation>
            </Card>
          </>
        )}
      </Show>
    </div>
  );
}
