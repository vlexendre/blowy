import type { AdminSafetyAlertDetail } from '@blowy/api-contract';
import { Button, Card, Field, Input, KeyValueList, Notice, PageHeader, StatusBadge } from '@blowy/ui-web';
import { apiGet } from '../../../../lib/api';
import { Show, when } from '../../../../components/admin';

/** Lecture motivée (trust_lead) : la justification part dans l'audit avec la lecture ; jamais la position elle-même. */
export default async function SafetyAlertPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ justification?: string }> }) {
  const { id } = await params;
  const { justification } = await searchParams;
  const ok = !!justification && justification.trim().length >= 10;
  const r = ok ? await apiGet<AdminSafetyAlertDetail>(`/v1/admin/safety/alerts/${id}?justification=${encodeURIComponent(justification!)}`) : null;
  return (
    <div className="bw-stack">
      <PageHeader title="Alerte « besoin d’aide »" eyebrow="Lecture motivée et auditée">La position n’est montrée qu’après une justification écrite (10 caractères minimum).</PageHeader>
      {!r ? (
        <Card>
          <form method="get" className="bw-form">
            <Field label="Justification (auditée)" htmlFor="j" hint="Ex. « appel sans réponse, la personne a demandé de l’aide ».">
              <Input id="j" name="justification" required minLength={10} maxLength={500} />
            </Field>
            <div><Button type="submit" variant="danger">Afficher le détail</Button></div>
          </form>
        </Card>
      ) : (
        <Show result={r}>
          {(a) => (
            <Card>
              <KeyValueList items={[
                ['Statut', <StatusBadge key="s" value={a.status} />],
                ['Reçue', when(a.createdAt)],
                ['Échéance', when(a.slaDueAt)],
                ['Position', a.position ? `${a.position.lat.toFixed(5)}, ${a.position.lng.toFixed(5)} (± ${a.position.accuracyM} m)` : 'aucune (non jointe ou purgée)'],
                ['Purge de la position', when(a.positionPurgeAfter)],
              ]} />
              <Notice tone="warn">Cette lecture est tracée dans l’audit avec ta justification.</Notice>
            </Card>
          )}
        </Show>
      )}
    </div>
  );
}
