/** Web : ni capture ni story (pas d'Instagram à ouvrir) ; l'écran partage le lien en texte. */
import type { ComponentRef, RefObject } from 'react';
import type { View } from 'react-native';

type ViewRef = RefObject<ComponentRef<typeof View> | null>;

export type StoryShareResult = 'story' | 'sheet' | 'none';

export async function captureStory(_view: ViewRef): Promise<string | null> {
  return null;
}

export async function shareStoryImage(_imageUri: string, _message: string, _target: 'story' | 'sheet' = 'story'): Promise<StoryShareResult> {
  return 'none';
}
