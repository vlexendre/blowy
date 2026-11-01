import { Heading, PublicLayout, Text } from '@blowy/ui-web';
import { PetSprite, PublicFooter, Stores } from '../components/public';

export default function Home() {
  return (
    <PublicLayout footer={<PublicFooter />}>
      <PetSprite species="NINO" name="Nino" size={160} />
      <Heading level={1}>Élève ton pet. Rencontre de nouvelles personnes.</Heading>
      <Text>Les pets se rencontrent avant les humains : comptes vérifiés, photos seulement après accord mutuel, aucune conversation au hasard.</Text>
      <Stores />
    </PublicLayout>
  );
}
