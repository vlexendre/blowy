import { ButtonLink, Heading, PublicLayout, Text } from '@blowy/ui-web';
import { PublicFooter } from '../components/public';

export default function NotFound() {
  return (
    <PublicLayout footer={<PublicFooter />}>
      <Heading level={1}>Page introuvable</Heading>
      <Text>Ce lien n’existe pas ou la page a été désactivée par son propriétaire.</Text>
      <ButtonLink variant="lime" href="/">Accueil</ButtonLink>
    </PublicLayout>
  );
}
