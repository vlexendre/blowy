/** Moi › Blowy+ : même contenu que le paywall de l'inscription. */
import { useMe } from '@/features/me';
import { PlusOffer } from '@/features/plus';
import { goBack } from '@/features/session';

export default function BlowyPlus() {
  const me = useMe();
  const pet = me.data?.pet ?? { name: 'nino', species: 'nino' as const };
  const back = () => goBack('/(tabs)/moi');
  return <PlusOffer pet={pet} member={me.data?.plus} onClose={back} onContinue={back} />;
}
