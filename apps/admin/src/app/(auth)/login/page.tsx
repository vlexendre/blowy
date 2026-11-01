import { ActionForm, AuthLayout, Field, Heading, Input, Notice, Select, Text } from '@blowy/ui-web';
import { loginAction } from '../../../lib/actions';
import { BLOWY_ENV } from '../../../lib/config';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const local = BLOWY_ENV === 'local' || BLOWY_ENV === 'test';
  return (
    <AuthLayout>
      <Heading level={1}>Back-office Blowy</Heading>
      <Text muted>Accès réservé au personnel. Connexion en deux étapes : identité puis code MFA.</Text>
      {local ? <Notice tone="info">Environnement local : identité locale « staff.&lt;rôle&gt; » (ex. staff.admin). Interdit en production.</Notice> : null}
      <ActionForm action={loginAction} submitLabel="Continuer" variant="ink">
        <Field label="Fournisseur" htmlFor="provider">
          <Select id="provider" name="provider" defaultValue={local ? 'local' : 'firebase'}>
            {local ? <option value="local">Identité locale (dev)</option> : null}
            <option value="firebase">Firebase (jeton d’identité)</option>
          </Select>
        </Field>
        <Field label="Identifiant ou jeton d’identité" htmlFor="credential">
          <Input id="credential" name="credential" required autoComplete="username" />
        </Field>
      </ActionForm>
    </AuthLayout>
  );
}
