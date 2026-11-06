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
import type { ImageProcessor, ProcessedImage, Watermarker } from '../application/ports/media.ports.js';

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

const xml = (t: string) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);

/**
 * Filigrane du prénom du regardeur (V5.2 C.8), rendu serveur : motif diagonal semi-transparent couvrant
 * toute l'image (un recadrage ne l'enlève pas), image ré-encodée en JPEG sans métadonnée.
 * Le rendu du texte utilise les polices système (fontconfig) : l'image de production doit en
 * embarquer une (ex. DejaVu Sans) — sans police, librsvg ne dessine pas le texte.
 */
export class SharpWatermarker implements Watermarker {
  async apply(bytes: Uint8Array, text: string) {
    const img = sharp(bytes, { limitInputPixels: LIMITS.image.maxPixels });
    const { width = 320, height = 320 } = await img.metadata();
    const label = xml(`${text.trim().slice(0, 24) || 'blowy'} · blowy`);
    const size = Math.max(12, Math.round(Math.min(width, height) / 14));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><pattern id="w" width="${size * 9}" height="${size * 4}" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)"><text x="0" y="${size * 2}" font-family="DejaVu Sans, Inter, sans-serif" font-size="${size}" font-weight="700" fill="#ffffff" fill-opacity="0.42" stroke="#000000" stroke-opacity="0.22" stroke-width="1">${label}</text></pattern></defs><rect width="100%" height="100%" fill="url(#w)"/></svg>`;
    const out = await img.composite([{ input: Buffer.from(svg), blend: 'over' }]).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    return { bytes: new Uint8Array(out), contentType: 'image/jpeg' };
  }
}
