import { Redirect } from 'expo-router';
import { paths } from '../src/core/navigation/paths';

/** Lien inconnu : retour au Nid (jamais d'écran d'erreur technique). */
export default function NotFound() {
  return <Redirect href={paths.nest} />;
}
