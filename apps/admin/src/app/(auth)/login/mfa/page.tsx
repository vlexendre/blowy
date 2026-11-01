import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ActionForm, AuthLayout, Code, Field, Heading, Input, Notice, Text } from '@blowy/ui-web';
import { mfaAction } from '../../../../lib/actions';
import { api } from '../../../../lib/api';
import { COOKIE } from '../../../../lib/config';

export const dynamic = 'force-dynamic';

export default async function MfaPage({ searchParams }: { searchParams: Promise<{ enroll?: string }> }) {
  const { enroll } = await searchParams;
  const pending = (await cookies()).get(COOKIE.pending)?.value;
  if (!pending) redirect('/login');
  let enrollment: { secret: string; otpauthUri: string } | null = null;
  let enrollError: string | null = null;
  if (enroll) {
    const r = await api<{ secret: string; otpauthUri: string }>('POST', '/v1/admin/auth/mfa/enroll', { extraHeaders: { 'x-blowy-staff-pending': pending }, body: {} });
    if (r.ok) enrollment = r.data;
    else enrollError = r.message;
  }
  return (
    <AuthLayout>
      <Heading level={1}>Code MFA</Heading>
      {enrollment ? (
        <>
          <Notice tone="warn">Enrôlement obligatoire : ajoute ce secret dans ton application TOTP (affiché une seule fois).</Notice>
          <Text>
            Secret : <Code>{enrollment.secret}</Code>
          </Text>
          <Text small muted>
            URI : <Code>{enrollment.otpauthUri}</Code>
          </Text>
        </>
      ) : null}
      {enrollError ? <Notice tone="error">{enrollError}</Notice> : null}
      <ActionForm action={mfaAction} submitLabel="Valider" variant="ink">
        <Field label="Code à 6 chiffres" htmlFor="code">
          <Input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" required autoFocus />
        </Field>
      </ActionForm>
    </AuthLayout>
  );
}
