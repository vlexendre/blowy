/** `/chemin` (lien interne ou ancien) : l'accueil, ouvert sur la séance du jour. */
import { Redirect } from 'expo-router';

export default function CheminIndex() {
  return <Redirect href="/pet?chemin=1" />;
}
