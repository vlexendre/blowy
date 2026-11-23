import { Logger } from '@nestjs/common';
import type SharpModule from 'sharp';
import { BLURRED_SIDE, BLURRED_SOURCE_SIDE, type ImageProcessor, type ImagesStatus } from './ports';

/** Au-delà, l'image est refusée sans être décodée (protection mémoire : une photo de téléphone en fait ~12 M). */
const MAX_INPUT_PIXELS = 50_000_000;

type SharpFactory = typeof SharpModule;

/**
 * Vignette floue avec sharp (libvips), chargé à la première utilisation : les tests et le mode mémoire ne chargent
 * jamais le module natif.
 * 1. orientation EXIF appliquée, réduction à 12 × 12 px (recadrage au centre, comme le disque de l'app) ;
 * 2. flou gaussien à cette taille, puis agrandissement à 64 px et second flou : rien d'autre qu'un dégradé de couleurs.
 * Aucune métadonnée n'est recopiée (sharp n'en garde aucune par défaut).
 */
export class SharpImages implements ImageProcessor {
  private readonly logger = new Logger('SharpImages');
  private sharp: Promise<SharpFactory> | null = null;
  private state: ImagesStatus = 'unchecked';

  /**
   * Essai au démarrage (mode supabase) : une image de 16 × 16 px fabriquée en mémoire, puis sa vignette. Un module
   * natif absent ou cassé (binaire libvips manquant sur l'hébergeur) est journalisé en erreur et visible dans
   * `GET /health` ; l'API démarre quand même (visages cachés, le minimoa, tant que rien ne se fait).
   */
  async selfCheck(): Promise<ImagesStatus> {
    let detail = 'vignette vide';
    try {
      const sharp = await this.load();
      const sample = await sharp({ create: { width: 16, height: 16, channels: 3, background: { r: 120, g: 160, b: 200 } } }).jpeg().toBuffer();
      const out = await this.blurredThumbnail(sample);
      this.state = out && out.length > 0 ? 'ok' : 'failed';
    } catch (err) {
      detail = err instanceof Error ? err.message : 'erreur inconnue';
      this.state = 'failed';
    }
    if (this.state === 'ok') this.logger.log('sharp prêt (essai de vignette réussi)');
    else this.logger.error(`sharp ne marche pas, aucune vignette floue ne se fera : ${detail}`);
    return this.state;
  }

  status(): ImagesStatus {
    return this.state;
  }

  private load(): Promise<SharpFactory> {
    this.sharp ??= import('sharp').then((m) => ((m as { default?: SharpFactory }).default ?? (m as unknown as SharpFactory)));
    return this.sharp;
  }

  async blurredThumbnail(input: Buffer): Promise<Buffer | null> {
    try {
      const sharp = await this.load();
      const tiny = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'error' })
        .rotate()
        .resize(BLURRED_SOURCE_SIDE, BLURRED_SOURCE_SIDE, { fit: 'cover', position: 'centre' })
        .flatten({ background: '#808080' })
        .blur(1.2)
        .raw()
        .toBuffer({ resolveWithObject: true });
      return await sharp(tiny.data, { raw: { width: tiny.info.width, height: tiny.info.height, channels: tiny.info.channels } })
        .resize(BLURRED_SIDE, BLURRED_SIDE, { kernel: 'cubic' })
        .blur(6)
        .jpeg({ quality: 70, mozjpeg: true })
        .toBuffer();
    } catch (err) {
      this.logger.warn(`vignette floue impossible : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
      return null;
    }
  }
}
