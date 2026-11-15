/**
 * Écrans de développement (`/dev/gallery`, `/dev/motion`). Ils n'existent pas dans un build de production : un lien
 * profond `blowy://dev/…` y tombe sur la page inconnue, comme pour n'importe quelle route qui n'existe pas.
 */
import { Stack } from 'expo-router';

import NotFound from '../+not-found';

export default function DevLayout() {
  if (!__DEV__) return <NotFound />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
