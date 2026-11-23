import { createHash } from 'node:crypto';
import type { ImageProcessor, ImagesStatus } from './ports';

/** JPEG gris de 1 × 1 px : une vraie image, que l'app affiche en local, et qui ne doit rien à la photo d'origine. */
const GREY_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==',
  'base64',
);

/**
 * Adaptateur mémoire (tests, développement local) : rend toujours la même petite image grise suivie d'une empreinte
 * de l'entrée (pour distinguer deux vignettes), sans jamais recopier un octet de la photo. Un fichier vide ne se lit pas.
 */
export class MemoryImages implements ImageProcessor {
  /** Nombre de vignettes fabriquées (tests). */
  made = 0;
  private state: ImagesStatus = 'unchecked';

  async selfCheck(): Promise<ImagesStatus> {
    this.state = 'ok';
    return this.state;
  }

  status(): ImagesStatus {
    return this.state;
  }

  async blurredThumbnail(input: Buffer): Promise<Buffer | null> {
    if (input.length === 0) return null;
    this.made += 1;
    // Un commentaire JPEG (FFFE) ne change pas l'image : l'empreinte y tient sans la rendre illisible.
    const tag = Buffer.from(`blur:${createHash('sha256').update(input).digest('hex').slice(0, 12)}`);
    const comment = Buffer.concat([Buffer.from([0xff, 0xfe, 0, tag.length + 2]), tag]);
    return Buffer.concat([GREY_JPEG.subarray(0, 2), comment, GREY_JPEG.subarray(2)]);
  }
}
