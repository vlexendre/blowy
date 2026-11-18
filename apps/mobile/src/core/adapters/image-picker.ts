import * as ImagePicker from 'expo-image-picker';

import { MediaAccessError, type PickedImage } from '../ports';

const TYPES: Record<string, PickedImage['contentType']> = {
  'image/jpeg': 'image/jpeg',
  'image/jpg': 'image/jpeg',
  'image/png': 'image/png',
  'image/webp': 'image/webp',
  'image/heic': 'image/heic',
};

/**
 * Demande l'accès au moment utile (texte d'autorisation iOS : app.config.ts), puis ouvre l'appareil photo ou la
 * photothèque. Accès refusé : `MediaAccessError` (l'écran propose d'ouvrir les Réglages). À appeler une fois toute
 * feuille fermée (`SheetTemplate.onClosed`) : iOS ne présente rien par-dessus une fenêtre qui se ferme.
 */
export async function pickImage(source: 'camera' | 'library'): Promise<PickedImage | null> {
  const permission =
    source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new MediaAccessError(source, permission.canAskAgain);
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [4, 5] };
  const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) return null;
  return { uri: asset.uri, contentType: TYPES[asset.mimeType ?? ''] ?? 'image/jpeg' };
}
