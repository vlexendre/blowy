// Comparaison pixel référence ↔ capture (pixelmatch) avec masques, et score « basse
// résolution » complémentaire (moins sensible aux décalages d'un pixel).
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

/**
 * Seuil par défaut de pixelmatch (distance YIQ normalisée 0..1 au-delà de laquelle un pixel
 * est « différent »). 0.1 = valeur par défaut de pixelmatch : ignore les variations de
 * teinte imperceptibles mais détecte un mauvais jeton de couleur. L'anticrénelage est exclu.
 */
export const DEFAULT_THRESHOLD = 0.1;
/** Facteur de réduction du score basse résolution (1/8 → cases de 8×8 px physiques). */
export const LOWRES_FACTOR = 8;

export const decodePng = (buf) => PNG.sync.read(buf);
export const encodePng = (png) => PNG.sync.write(png);

/** Copie `src` dans une image w×h (rognage ou complétion en magenta pour rendre l'écart visible). */
export function fitTo(src, width, height) {
  if (src.width === width && src.height === height) return src;
  const out = new PNG({ width, height });
  for (let i = 0; i < out.data.length; i += 4) out.data.set([255, 0, 255, 255], i);
  const w = Math.min(width, src.width);
  const h = Math.min(height, src.height);
  for (let y = 0; y < h; y++) src.data.copy(out.data, y * width * 4, y * src.width * 4, (y * src.width + w) * 4);
  return out;
}

/** Masque binaire (1 = ignoré) à partir de rectangles en px CSS × échelle. */
export function maskBitmap(width, height, rects = [], scale = 1) {
  const m = new Uint8Array(width * height);
  for (const [x, y, w, h] of rects) {
    const x0 = Math.max(0, Math.floor(x * scale));
    const y0 = Math.max(0, Math.floor(y * scale));
    const x1 = Math.min(width, Math.ceil((x + w) * scale));
    const y1 = Math.min(height, Math.ceil((y + h) * scale));
    for (let yy = y0; yy < y1; yy++) m.fill(1, yy * width + x0, yy * width + x1);
  }
  return m;
}

function lowresDelta(a, b, mask, width, height, f) {
  const cw = Math.ceil(width / f);
  const ch = Math.ceil(height / f);
  let sum = 0;
  let cells = 0;
  for (let cy = 0; cy < ch; cy++) {
    for (let cx = 0; cx < cw; cx++) {
      const acc = [0, 0, 0, 0, 0, 0];
      let n = 0;
      for (let y = cy * f; y < Math.min(height, (cy + 1) * f); y++) {
        for (let x = cx * f; x < Math.min(width, (cx + 1) * f); x++) {
          const p = y * width + x;
          if (mask[p]) continue;
          const i = p * 4;
          acc[0] += a[i]; acc[1] += a[i + 1]; acc[2] += a[i + 2];
          acc[3] += b[i]; acc[4] += b[i + 1]; acc[5] += b[i + 2];
          n++;
        }
      }
      if (!n) continue;
      sum += (Math.abs(acc[0] - acc[3]) + Math.abs(acc[1] - acc[4]) + Math.abs(acc[2] - acc[5])) / (3 * 255 * n);
      cells++;
    }
  }
  return cells ? sum / cells : 0;
}

/**
 * Compare deux PNG décodés. Les zones masquées sont rendues identiques avant pixelmatch
 * (et grisées dans l'image de diff). Retourne le % de pixels différents parmi les pixels
 * non masqués, et l'image de diff.
 */
export function compareImages(ref, app, { threshold = DEFAULT_THRESHOLD, masks = [], scale = 2 } = {}) {
  const { width, height } = ref;
  const sizeMismatch = app.width !== width || app.height !== height;
  const fitted = fitTo(app, width, height);
  const a = Buffer.from(ref.data);
  const b = Buffer.from(fitted.data);
  const mask = maskBitmap(width, height, masks, scale);
  let masked = 0;
  for (let p = 0; p < mask.length; p++) {
    if (!mask[p]) continue;
    masked++;
    const i = p * 4;
    b[i] = a[i]; b[i + 1] = a[i + 1]; b[i + 2] = a[i + 2]; b[i + 3] = a[i + 3];
  }
  const diff = new PNG({ width, height });
  const diffPixels = pixelmatch(a, b, diff.data, width, height, { threshold, includeAA: false, alpha: 0.15, diffColor: [255, 0, 60], aaColor: [255, 200, 0] });
  for (let p = 0; p < mask.length; p++) if (mask[p]) diff.data.set([120, 120, 200, 255], p * 4);
  const compared = width * height - masked;
  return {
    width,
    height,
    sizeMismatch,
    diffPixels,
    comparedPixels: compared,
    maskedPixels: masked,
    diffRatio: compared ? diffPixels / compared : 0,
    lowresDelta: lowresDelta(a, b, mask, width, height, LOWRES_FACTOR),
    diff,
  };
}
