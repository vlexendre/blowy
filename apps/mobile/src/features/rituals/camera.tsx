/**
 * Appareil photo dans l'app (preuves et photo du défi) : jamais la galerie. `expo-camera` montre le viseur en direct ;
 * la photo est réduite sur le téléphone (1024 px de large, JPEG) avant de partir : l'API la réduit encore pour la
 * vérification, et la supprime sous 24 h sauf si la personne la garde.
 */
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Image } from 'expo-image';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Linking, StyleSheet } from 'react-native';

import type { Shot } from './index';

const WIDTH = 1024;

/** Réduit une photo prise (1024 px de large au plus, JPEG compressé). En cas d'échec, la photo telle quelle. */
async function shrink(uri: string, width: number): Promise<Shot> {
  if (width <= WIDTH) return { uri };
  try {
    const context = ImageManipulator.manipulate(uri);
    context.resize({ width: WIDTH, height: null });
    const image = await context.renderAsync();
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.72 });
    return { uri: saved.uri };
  } catch {
    return { uri };
  }
}

export interface CameraHandle {
  /** Prend la photo (son du déclencheur coupé), réduite ; null si l'appareil n'est pas prêt. */
  shoot: () => Promise<Shot | null>;
}

/** Le viseur en direct, qui remplit son cadre (`ProofStage.viewfinder`). */
export const ProofCamera = forwardRef<CameraHandle, { onReady?: () => void; onError?: () => void }>(function ProofCamera({ onReady, onError }, ref) {
  const cam = useRef<CameraView>(null);
  useImperativeHandle(ref, () => ({
    shoot: async () => {
      const pic = await cam.current?.takePictureAsync({ quality: 0.7, imageType: 'jpg', shutterSound: false });
      return pic ? shrink(pic.uri, pic.width) : null;
    },
  }));
  return <CameraView ref={cam} style={StyleSheet.absoluteFill} facing="back" mode="picture" onCameraReady={onReady} onMountError={onError} />;
});

/** La photo prise, à la place du viseur. */
export function ShotPreview({ shot }: { shot: Shot }) {
  return <Image source={{ uri: shot.uri }} contentFit="cover" style={StyleSheet.absoluteFill} />;
}

export { useCameraPermissions };

/** Réglages de l'app (accès refusé une fois pour toutes). */
export const openSettings = (): void => {
  void Linking.openSettings().catch(() => undefined);
};
