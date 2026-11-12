import { useNavigation, useRouter } from 'expo-router';
import { useCallback } from 'react';

/**
 * Retour vers le lien depuis ses niveaux, son signalement ou ses options. Ouvert par un lien profond,
 * l'écran est seul dans la pile du lien : on remplace par le lien au lieu de revenir aux chats.
 */
export function useBackToLink(id: string): () => void {
  const router = useRouter();
  const navigation = useNavigation();
  return useCallback(() => {
    const alone = navigation.getState()?.routes[0]?.name !== 'index';
    if (alone || !router.canGoBack()) router.replace(`/link/${id}`);
    else router.back();
  }, [id, navigation, router]);
}
