import type { StaffMe, StaffSessionView } from '@blowy/api-contract';
import { ActionForm, Card, DataTable, Field, Heading, Input, KeyValueList, PageHeader } from '@blowy/ui-web';
import { apiGet } from '../../../lib/api';
import { stepUpAction } from '../../../lib/actions';
import { Mutation, Show, when } from '../../../components/admin';

export default async function AccountPage() {
  const [me, sessions] = await Promise.all([apiGet<StaffMe>('/v1/admin/auth/me'), apiGet<StaffSessionView[]>('/v1/admin/auth/sessions')]);
  return (
    <div className="bw-stack">
      <PageHeader title="Mon compte staff" eyebrow="Sécurité">Rôles attribués uniquement par la commande d’administration (CLI) ; aucune auto-promotion.</PageHeader>
      <Show result={me}>
        {(m) => (
          <Card>
            <KeyValueList items={[['Rôles', m.roles.join(', ')], ['Session expire', when(m.sessionExpiresAt)], ['Step-up valide jusqu’à', when(m.stepUpValidUntil)], ['Permissions', m.permissions.join(', ')]]} />
          </Card>
        )}
      </Show>
      <Card>
        <Heading level={2}>Réauthentification (step-up)</Heading>
        <ActionForm action={stepUpAction} submitLabel="Valider le code">
          <Field label="Code MFA" htmlFor="code"><Input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" required /></Field>
        </ActionForm>
      </Card>
      <Heading level={2}>Sessions actives</Heading>
      <Show result={sessions}>
        {(rows) => (
          <DataTable caption="Sessions staff" rows={rows} rowKey={(s) => s.id} columns={[
            { key: 'c', header: 'Ouverte', render: (s) => when(s.createdAt) },
            { key: 'u', header: 'Dernier usage', render: (s) => when(s.lastUsedAt) },
            { key: 'e', header: 'Expire', render: (s) => when(s.expiresAt) },
            { key: 'a', header: '', render: (s) => (s.current ? 'session courante' : <Mutation endpoint={`/v1/admin/auth/sessions/${s.id}`} method="DELETE" label="Révoquer" ok="Session révoquée." revalidate="/account" variant="secondary" inline />) },
          ]} />
        )}
      </Show>
    </div>
  );
}
