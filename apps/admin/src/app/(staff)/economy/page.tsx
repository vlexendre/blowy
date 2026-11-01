import { Card, DataTable, Field, Heading, Input, Button, PageHeader, StatusBadge, Text } from '@blowy/ui-web';
import { apiGet } from '../../../lib/api';
import { Mutation, qs, Show, when } from '../../../components/admin';
import { ReasonField, TextField } from '../../../components/fields';

interface Ledger { balance: number; items: { id: string; amount: number; balanceAfter: number; reason: string; source: string; note: string | null; actorUserId: string | null; createdAt: string }[]; nextCursor: string | null }
interface Webhook { id: string; eventType: string; status: string; appUserId: string | null; eventTimestamp: string | Date; attempts: number; lastError: string | null }

export default async function EconomyPage({ searchParams }: { searchParams: Promise<{ user?: string }> }) {
  const { user } = await searchParams;
  const [ledger, hooks] = await Promise.all([
    user ? apiGet<Ledger>(`/v1/admin/economy/users/${encodeURIComponent(user)}/ledger`) : Promise.resolve(null),
    apiGet<{ items: Webhook[]; nextCursor: string | null }>('/v1/admin/economy/webhooks'),
  ]);
  return (
    <div className="bw-stack">
      <PageHeader title="Économie" eyebrow="18.10">Ledger, corrections motivées (écriture STAFF_CORRECTION, step-up), webhooks et rapprochement. Aucun « remboursement store » n’est simulé : seul le store rembourse.</PageHeader>
      <form method="get" className="bw-form bw-form--inline" role="search">
        <Field label="Utilisateur (id)" htmlFor="user"><Input id="user" name="user" defaultValue={user} pattern="[0-9a-fA-F-]{36}" /></Field>
        <Button type="submit" variant="secondary">Voir le ledger</Button>
      </form>
      {ledger && user ? (
        <Show result={ledger}>
          {(l) => (
            <Card>
              <Heading level={2}>Solde : {l.balance} pièces</Heading>
              <DataTable caption="Écritures" rows={l.items} rowKey={(e) => e.id} empty="Aucune écriture" columns={[
                { key: 'd', header: 'Date', render: (e) => when(e.createdAt) },
                { key: 'a', header: 'Montant', render: (e) => (e.amount > 0 ? `+${e.amount}` : e.amount) },
                { key: 'r', header: 'Raison', render: (e) => `${e.reason} · ${e.source}` },
                { key: 'b', header: 'Solde après', render: (e) => e.balanceAfter },
                { key: 'n', header: 'Motif', render: (e) => e.note ?? '' },
              ]} />
              <Heading level={3}>Correction</Heading>
              <Mutation endpoint={`/v1/admin/economy/users/${user}/corrections`} label="Enregistrer la correction" ok="Correction écrite au ledger." revalidate="/economy" confirm="Écrire cette correction au ledger ?">
                <TextField id="amount" name="f.amount:int" label="Montant (positif = crédit, négatif = débit)" type="number" required />
                <ReasonField />
              </Mutation>
              <Mutation endpoint={`/v1/admin/economy/users/${user}/reconcile`} label="Rapprocher avec le fournisseur" ok="Rapprochement effectué." variant="secondary" />
            </Card>
          )}
        </Show>
      ) : null}
      <Heading level={2}>Webhooks fournisseur</Heading>
      <Show result={hooks}>
        {(p) => (
          <DataTable caption="Webhooks" rows={p.items} rowKey={(w) => w.id} empty="Aucun webhook reçu" columns={[
            { key: 't', header: 'Type', render: (w) => w.eventType },
            { key: 's', header: 'Statut', render: (w) => <StatusBadge value={w.status} /> },
            { key: 'u', header: 'Utilisateur', render: (w) => (w.appUserId ? <a href={`/economy${qs({ user: w.appUserId })}`}>{w.appUserId.slice(0, 8)}</a> : '—') },
            { key: 'd', header: 'Événement', render: (w) => when(String(w.eventTimestamp)) },
            { key: 'e', header: 'Erreur', render: (w) => (w.lastError ? <Text small muted>{w.lastError}</Text> : '') },
            { key: 'a', header: '', render: (w) => (w.status === 'FAILED' ? (
              <Mutation endpoint={`/v1/admin/economy/webhooks/${w.id}/redrive`} label="Retraiter" ok="Retraité (état actuel revérifié)." revalidate="/economy" inline>
                <ReasonField id={`r-${w.id}`} label="Motif" />
              </Mutation>
            ) : null) },
          ]} />
        )}
      </Show>
    </div>
  );
}
