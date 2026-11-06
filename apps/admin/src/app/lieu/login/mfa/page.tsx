import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ActionForm, AuthLayout, Code, Field, Heading, Input, Notice, Text } from '@blowy/ui-web';
import { venueMfaAction } from '../../../../lib/venue-actions';
import { api } from '../../../../lib/api';
import { VENUE_COOKIE } from '../../../../lib/config';

export const dynamic = 'force-dynamic';

export default async function VenueMfaPage({ searchParams }: { searchParams: Promise<{ enroll?: string }> }) {
  const { enroll } = await searchParams;
  const pending = (await cookies()).get(VENUE_COOKIE.pending)?.value;
  if (!pending) redirect('/lieu/login');
  let enrollment: { secret: string; otpauthUri: string } | null = null;
  let enrollError: string | null = null;
  if (enroll) {
    const r = await api<{ secret: string; otpauthUri: string }>('POST', '/v1/venue/auth/mfa/enroll', { extraHeaders: { 'x-blowy-venue-pending': pending }, body: {}, realm: 'venue' });
    if (r.ok) enrollment = r.data;
    else enrollError = r.message;
  }
  return (
    <AuthLayout>
      <Heading level={1}>Code de connexion</Heading>
      {enrollment ? (
        <>
          <Notice tone="warn">Première connexion : ajoutez ce secret dans votre application d’authentification (affiché une seule fois).</Notice>
          <Text>
            Secret : <Code>{enrollment.secret}</Code>
          </Text>
          <Text small muted>
            URI : <Code>{enrollment.otpauthUri}</Code>
          </Text>
        </>
      ) : null}
      {enrollError ? <Notice tone="error">{enrollError}</Notice> : null}
      <ActionForm action={venueMfaAction} submitLabel="Valider" variant="ink">
        <Field label="Code à 6 chiffres" htmlFor="code">
          <Input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" required autoFocus />
        </Field>
      </ActionForm>
    </AuthLayout>
  );
}
