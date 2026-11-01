import type { AdminPetView } from '@blowy/api-contract';
import { Card, Heading, KeyValueList, PageHeader, Pre, Timeline } from '@blowy/ui-web';
import { apiGet } from '../../../../lib/api';
import { Show } from '../../../../components/admin';

export default async function PetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await apiGet<AdminPetView>(`/v1/admin/pets/${id}`);
  return (
    <Show result={r}>
      {(p) => (
        <div className="bw-stack">
          <PageHeader title={p.name} eyebrow="Pet (18.3)">État, version moteur/tuning et journal des soins (lecture seule).</PageHeader>
          <Card>
            <KeyValueList items={[
              ['Espèce / stade', `${p.species} · ${p.stage} · ${p.kind}`],
              ['Moteur', p.engineVersion],
              ['Jauges', p.state ? `satiété ${Math.round(p.state.satiety)} · énergie ${Math.round(p.state.energy)} · humeur ${Math.round(p.state.mood)} · santé ${Math.round(p.state.health)}` : null],
              ['Intégré jusqu’à', p.state?.advancedTo ?? null],
              ['Tuning', p.state?.tuningVersion ?? null],
              ['Lieu', p.location ? `${p.location.kind}${p.location.contextId ? ` (${p.location.contextId})` : ''}` : null],
            ]} />
          </Card>
          <Heading level={2}>Timeline des soins</Heading>
          <Timeline items={p.careTimeline.map((e, i) => ({ key: `${e.at}-${i}`, at: e.at, title: e.action, detail: <Pre value={{ engine: e.engineVersion, tuning: e.tuningVersion, effects: e.effects }} /> }))} />
        </div>
      )}
    </Show>
  );
}
