import { ActionForm, AuthLayout, Field, Heading, Input, Notice, Select, Text } from '@blowy/ui-web';
import { venueLoginAction } from '../../../lib/venue-actions';
import { BLOWY_ENV } from '../../../lib/config';

export const dynamic = 'force-dynamic';

/** Connexion de l'espace lieu : distincte du back-office (autre cookie, autre session, MFA). */
export default function VenueLoginPage() {
  const local = BLOWY_ENV === 'local' || BLOWY_ENV === 'test';
  return (
    <AuthLayout>
      <Heading level={1}>blowy. lieu</Heading>
      <Text muted>Espace des lieux partenaires : effectif de la veille, créneaux et contrat. Connexion en deux étapes.</Text>
      {local ? <Notice tone="info">Environnement local : identité locale du compte partenaire (ex. lieu.cafe-des-oiseaux). Interdit en production.</Notice> : null}
      <ActionForm action={venueLoginAction} submitLabel="Continuer" variant="ink">
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
