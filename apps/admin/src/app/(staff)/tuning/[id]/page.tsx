import type { TuningDiffEntry } from '@blowy/api-contract';
import { Card, DiffTable, Heading, PageHeader, Text } from '@blowy/ui-web';
import { apiGet } from '../../../../lib/api';
import { Mutation, Show } from '../../../../components/admin';
import { ReasonField, TextField } from '../../../../components/fields';

export default async function TuningVersionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await apiGet<{ version: string; against: string; changes: TuningDiffEntry[] }>(`/v1/admin/tuning/versions/${id}/diff`);
  return (
    <Show result={r}>
      {(d) => (
        <div className="bw-stack">
          <PageHeader title={d.version} eyebrow="Version de tuning">Comparaison avec la version active {d.against}.</PageHeader>
          <DiffTable changes={d.changes} />
          <Card>
            <Heading level={2}>Publier</Heading>
            <Text small muted>Publication auditée, step-up MFA requis. L’historique est conservé.</Text>
            <Mutation endpoint={`/v1/admin/tuning/versions/${id}/publish`} label="Publier cette version" ok="Version publiée." revalidate="/tuning" confirm="Publier cette version de tuning ?">
              <ReasonField />
            </Mutation>
          </Card>
          <Card>
            <Heading level={2}>Simulation 60 jours</Heading>
            <Mutation endpoint={`/v1/admin/tuning/versions/${id}/simulate`} label="Lancer la simulation" ok="Simulation terminée." variant="secondary" />
          </Card>
          <Card>
            <Heading level={2}>Rollback vers cette version</Heading>
            <Text small muted>Crée une NOUVELLE version copiée de celle-ci, puis la publie.</Text>
            <Mutation endpoint="/v1/admin/tuning/rollback" label="Rollback" ok="Rollback publié." revalidate="/tuning" variant="danger" confirm="Republier cette version sous un nouveau numéro ?">
              <input type="hidden" name="f.targetVersionId" value={id} />
              <TextField id="nv" name="f.newVersion" label="Nouveau numéro" required pattern="tuning-\d{4}\.\d{2}\.\d+" />
              <ReasonField />
            </Mutation>
          </Card>
        </div>
      )}
    </Show>
  );
}
