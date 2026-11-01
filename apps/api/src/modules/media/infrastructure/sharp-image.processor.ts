/**
 * Traitement d'image serveur (sharp/libvips) :
 *  - décodage borné (limitInputPixels, timeout) ; animations refusées (1re page seulement) ;
 *  - `rotate()` applique l'orientation EXIF puis TOUTES les métadonnées sont retirées
 *    (sharp n'écrit EXIF/GPS/XMP/ICC que si `withMetadata()` est demandé — jamais ici) ;
 *  - normalisé ≤ 1600 px JPEG, miniature 320 px ;
 *  - flous DISTINCTS à résolution dégradée : réduction à 24 px (fort) / 48 px (intermédiaire)
 *    puis agrandissement flou — l'original n'est jamais embarqué dans un dérivé flou.
 */
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { LIMITS } from '../domain/media-policy.js';
import type { ImageProcessor, ProcessedImage } from '../application/ports/media.ports.js';

export class SharpImageProcessor implements ImageProcessor {
  async process(input: Uint8Array): Promise<ProcessedImage> {
    const base = () => sharp(input, { limitInputPixels: LIMITS.image.maxPixels, failOn: 'error', animated: false, pages: 1 }).timeout({ seconds: LIMITS.image.decodeTimeoutSec });
    const meta = await base().metadata();
    if (!meta.width || !meta.height) throw new Error('IMAGE_UNDECODABLE');
    if (meta.width > LIMITS.image.maxSide || meta.height > LIMITS.image.maxSide) throw new Error('IMAGE_TOO_LARGE');
    const s = LIMITS.image.normalizedSide;
    const normalized = await base().rotate().resize({ width: s, height: s, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85, mozjpeg: true }).toBuffer({ resolveWithObject: true });
    const thumbnail = await sharp(normalized.data).resize({ width: LIMITS.image.thumbSide, height: LIMITS.image.thumbSide, fit: 'cover' }).jpeg({ quality: 78 }).toBuffer({ resolveWithObject: true });
    const blurAt = async (tiny: number) => {
      const small = await sharp(normalized.data).resize({ width: tiny, height: tiny, fit: 'cover' }).toBuffer();
      return sharp(small).resize({ width: 320, height: 320, kernel: 'cubic' }).blur(12).jpeg({ quality: 60 }).toBuffer({ resolveWithObject: true });
    };
    const blurred = await blurAt(24);
    const blurredMedium = await blurAt(48);
    const out = (r: { data: Buffer; info: { width: number; height: number } }) => ({ bytes: new Uint8Array(r.data), width: r.info.width, height: r.info.height });
    return {
      normalized: out(normalized),
      thumbnail: out(thumbnail),
      blurred: out(blurred),
      blurredMedium: out(blurredMedium),
      sha256: createHash('sha256').update(normalized.data).digest('hex'),
    };
  }
}
